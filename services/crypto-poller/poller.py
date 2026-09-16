#!/usr/bin/env python3
"""
Griffty Crypto Poller — sophisticated market + wallet monitor.

- Pulls OHLCV from Binance public API (no key, high limits)
- Computes RSI, EMA, MACD, ATR, volume ratio, trend
- Monitors Phantom wallet SOL balance via Solana RPC
- Sends Twilio SMS only on meaningful signal changes or threshold breaches
- Default interval 10 minutes (configurable via POLL_INTERVAL_SEC)
- Designed to run as a separate Railway service; keeps Grok token usage near zero
"""

import os
import time
import json
import math
import requests
from datetime import datetime, timezone

# ---------- Config ----------
POLL_INTERVAL = int(os.getenv("POLL_INTERVAL_SEC", "600"))  # 10 min default
SYMBOLS = [s.strip() for s in os.getenv("SYMBOLS", "BTCUSDT,ETHUSDT,SOLUSDT").split(",") if s.strip()]
INTERVAL = os.getenv("KLINE_INTERVAL", "15m")  # candle size for analysis
LIMIT = int(os.getenv("KLINE_LIMIT", "200"))

SOLANA_RPC = os.getenv("SOLANA_RPC", "https://api.mainnet-beta.solana.com")
WALLET = os.getenv("WALLET_ADDRESS", "")

TWILIO_SID = os.getenv("TWILIO_ACCOUNT_SID", "")
TWILIO_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "")
TWILIO_FROM = os.getenv("TWILIO_FROM_NUMBER", "")
OPERATOR_PHONE = os.getenv("OPERATOR_PHONE", "")

BINANCE_BASE = "https://data-api.binance.vision"
STATE_FILE = "/tmp/griffty_poller_state.json"

# ---------- Helpers ----------
def log(msg):
    print(f"[{datetime.now(timezone.utc).isoformat()}] {msg}", flush=True)

def load_state():
    try:
        with open(STATE_FILE) as f:
            return json.load(f)
    except Exception:
        return {}

def save_state(state):
    try:
        with open(STATE_FILE, "w") as f:
            json.dump(state, f)
    except Exception as e:
        log(f"state save err: {e}")

def ema(values, period):
    if len(values) < period:
        return None
    k = 2 / (period + 1)
    e = sum(values[:period]) / period
    for v in values[period:]:
        e = v * k + e * (1 - k)
    return e

def rsi(closes, period=14):
    if len(closes) < period + 1:
        return None
    gains, losses = [], []
    for i in range(1, len(closes)):
        d = closes[i] - closes[i-1]
        gains.append(max(d, 0))
        losses.append(max(-d, 0))
    avg_gain = sum(gains[:period]) / period
    avg_loss = sum(losses[:period]) / period
    for i in range(period, len(gains)):
        avg_gain = (avg_gain * (period - 1) + gains[i]) / period
        avg_loss = (avg_loss * (period - 1) + losses[i]) / period
    if avg_loss == 0:
        return 100.0
    rs = avg_gain / avg_loss
    return 100 - (100 / (1 + rs))

def macd(closes, fast=12, slow=26, signal=9):
    if len(closes) < slow + signal:
        return None, None, None
    ef = ema(closes, fast)
    es = ema(closes, slow)
    # recompute series for histogram
    macd_line = []
    k_fast = 2 / (fast + 1)
    k_slow = 2 / (slow + 1)
    ef_v = sum(closes[:fast]) / fast
    es_v = sum(closes[:slow]) / slow
    for i in range(slow, len(closes)):
        ef_v = closes[i] * k_fast + ef_v * (1 - k_fast)
        es_v = closes[i] * k_slow + es_v * (1 - k_slow)
        macd_line.append(ef_v - es_v)
    if len(macd_line) < signal:
        return None, None, None
    sig = ema(macd_line, signal)
    hist = macd_line[-1] - sig
    return macd_line[-1], sig, hist

def atr(highs, lows, closes, period=14):
    if len(closes) < period + 1:
        return None
    trs = []
    for i in range(1, len(closes)):
        tr = max(highs[i] - lows[i], abs(highs[i] - closes[i-1]), abs(lows[i] - closes[i-1]))
        trs.append(tr)
    return sum(trs[-period:]) / period

def fetch_klines(symbol, interval, limit):
    url = f"{BINANCE_BASE}/api/v3/klines"
    params = {"symbol": symbol, "interval": interval, "limit": limit}
    r = requests.get(url, params=params, timeout=15)
    r.raise_for_status()
    data = r.json()
    closes = [float(d[4]) for d in data]
    highs = [float(d[2]) for d in data]
    lows = [float(d[3]) for d in data]
    vols = [float(d[5]) for d in data]
    return closes, highs, lows, vols

def analyze(symbol):
    closes, highs, lows, vols = fetch_klines(symbol, INTERVAL, LIMIT)
    if len(closes) < 50:
        return None
    price = closes[-1]
    r = rsi(closes)
    e9 = ema(closes, 9)
    e21 = ema(closes, 21)
    e50 = ema(closes, 50)
    m, s, h = macd(closes)
    a = atr(highs, lows, closes)
    avg_vol = sum(vols[-20:]) / 20 if len(vols) >= 20 else vols[-1]
    vol_ratio = vols[-1] / avg_vol if avg_vol else 1.0
    trend = "up" if (e9 and e21 and e9 > e21 and e21 > e50) else ("down" if (e9 and e21 and e9 < e21 and e21 < e50) else "side")
    return {
        "symbol": symbol,
        "price": price,
        "rsi": round(r, 1) if r else None,
        "ema9": round(e9, 2) if e9 else None,
        "ema21": round(e21, 2) if e21 else None,
        "ema50": round(e50, 2) if e50 else None,
        "macd": round(m, 4) if m else None,
        "macd_signal": round(s, 4) if s else None,
        "macd_hist": round(h, 4) if h else None,
        "atr": round(a, 2) if a else None,
        "vol_ratio": round(vol_ratio, 2),
        "trend": trend,
        "ts": datetime.now(timezone.utc).isoformat(),
    }

def signal_score(ind):
    if not ind:
        return 0, "neutral"
    score = 0
    reasons = []
    if ind["rsi"] is not None:
        if ind["rsi"] < 30:
            score += 2; reasons.append("RSI oversold")
        elif ind["rsi"] > 70:
            score -= 2; reasons.append("RSI overbought")
    if ind["trend"] == "up":
        score += 1; reasons.append("EMA uptrend")
    elif ind["trend"] == "down":
        score -= 1; reasons.append("EMA downtrend")
    if ind["macd_hist"] is not None:
        if ind["macd_hist"] > 0:
            score += 1; reasons.append("MACD bullish")
        else:
            score -= 1; reasons.append("MACD bearish")
    if ind["vol_ratio"] > 1.5:
        score += 1 if score > 0 else -1; reasons.append(f"volume spike {ind['vol_ratio']}x")
    label = "bullish" if score >= 2 else ("bearish" if score <= -2 else "neutral")
    return score, label, reasons

def send_sms(body):
    if not (TWILIO_SID and TWILIO_TOKEN and TWILIO_FROM and OPERATOR_PHONE):
        log(f"SMS skipped (missing Twilio env): {body}")
        return False
    try:
        from twilio.rest import Client
        client = Client(TWILIO_SID, TWILIO_TOKEN)
        msg = client.messages.create(to=OPERATOR_PHONE, from_=TWILIO_FROM, body=body)
        log(f"SMS sent sid={msg.sid}")
        return True
    except Exception as e:
        log(f"Twilio error: {e}")
        return False

def get_sol_balance():
    if not WALLET:
        return None
    try:
        payload = {"jsonrpc": "2.0", "id": 1, "method": "getBalance", "params": [WALLET]}
        r = requests.post(SOLANA_RPC, json=payload, timeout=10)
        return r.json()["result"]["value"] / 1e9
    except Exception as e:
        log(f"balance err: {e}")
        return None

def main():
    log(f"Griffty crypto poller starting. interval={POLL_INTERVAL}s symbols={SYMBOLS} wallet={WALLET[:8] if WALLET else 'none'}...")
    state = load_state()
    last_signals = state.get("signals", {})
    last_balance = state.get("balance")
    while True:
        try:
            for sym in SYMBOLS:
                ind = analyze(sym)
                if not ind:
                    continue
                score, label, reasons = signal_score(ind)
                prev = last_signals.get(sym, {})
                prev_label = prev.get("label")
                prev_score = prev.get("score", 0)
                changed = (label != prev_label) or (abs(score - prev_score) >= 2)
                threshold_breach = (ind["rsi"] is not None and (ind["rsi"] < 25 or ind["rsi"] > 75)) or (ind["vol_ratio"] > 2.0)
                if changed or threshold_breach:
                    msg = (f"[GRIFFTY] {sym} {label.upper()} (score {score})\n"
                           f"Price ${ind['price']:,.2f} | RSI {ind['rsi']} | Trend {ind['trend']}\n"
                           f"MACD hist {ind['macd_hist']} | Vol {ind['vol_ratio']}x\n"
                           f"Reasons: {', '.join(reasons) if reasons else 'n/a'}\n"
                           f"Reply: approve / reject / close")
                    send_sms(msg)
                    last_signals[sym] = {"label": label, "score": score, "ts": ind["ts"]}
                else:
                    last_signals[sym] = {"label": label, "score": score, "ts": ind["ts"]}
                log(f"{sym}: {label} score={score} RSI={ind['rsi']} trend={ind['trend']} vol={ind['vol_ratio']}x")

            bal = get_sol_balance()
            if bal is not None and (last_balance is None or abs(bal - last_balance) > 0.001):
                send_sms(f"[GRIFFTY] Wallet balance changed: {bal:.4f} SOL (was {last_balance if last_balance else 'n/a'})")
                last_balance = bal

            state["signals"] = last_signals
            state["balance"] = last_balance
            save_state(state)
        except Exception as e:
            log(f"loop error: {e}")
        time.sleep(POLL_INTERVAL)

if __name__ == "__main__":
    main()
