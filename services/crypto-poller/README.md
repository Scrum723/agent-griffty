# Griffty Crypto Poller

Standalone Python service that watches crypto markets + your Phantom wallet and texts you only when something matters.

## What it does
- Fetches candles from Binance public API (no key needed)
- Computes RSI, EMA 9/21/50, MACD, ATR, volume ratio, trend
- Scores each symbol bullish / bearish / neutral
- Sends a Twilio SMS when the signal flips or a threshold is breached (RSI <25/>75, volume >2x)
- Also texts on any meaningful SOL balance change
- Default poll every 10 minutes — cheap and safe

## Railway setup
1. New service → connect this repo → root directory `services/crypto-poller`
2. Set env vars (see below)
3. Deploy. It runs forever.

## Env vars
```
POLL_INTERVAL_SEC=600
SYMBOLS=BTCUSDT,ETHUSDT,SOLUSDT
KLINE_INTERVAL=15m
KLINE_LIMIT=200
SOLANA_RPC=https://api.mainnet-beta.solana.com
WALLET_ADDRESS=your_phantom_address
TWILIO_ACCOUNT_SID=ACxxxx
TWILIO_AUTH_TOKEN=xxxx
TWILIO_FROM_NUMBER=+1xxxxxxxxxx
OPERATOR_PHONE=+1xxxxxxxxxx
```

## Efficiency note
10-minute polls = ~6 Binance calls/hour. 10-second polls = ~360/hour — 60x more, higher chance of rate limits and wasted compute. Stick to 5–10 min unless you're scalping.

## Talking to Grok / Relay
When you get the SMS, just say "hey Leo, tell Griffty to close the SOL position" and the agent can queue the sign intent for your Phantom approval.
