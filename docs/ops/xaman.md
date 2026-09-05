# Xaman / XRPL — watch-only

**Public address (only identifier I will keep):** `rPjrQxdzgw1GoZ6zvzErxBykRVb7VbRaw4`

## Ledger status (checked 2026-09-04)

XRPL `account_info` on s1.ripple.com and xrplcluster.com: **`actNotFound`**.

That means the r-address exists in Xaman as a keypair, but it is **not a live ledger account** until someone sends it at least the **10 XRP reserve**. Until then: no DEX, no Magnetic, no trust lines, no inbound tokens.

## How I will use Xaman (no seed)

1. Watch the r-address only.
2. When you want a swap/offer/trust line, I build the unsigned tx and you **Approve in the Xaman app** (payload / QR). I never hold the secret.
3. Real Magnetic UI (if you use XRPL DEX): **https://xmagnetic.org** — not xmagnetic.us / vercel airdrop clones.

## What you do

1. Paper backup of secret numbers. Never screenshot them to chat again.
2. After paper backup, consider this seed **exposed** (it was in this session). If you later receive XRP, move to a **new** Xaman account created offline and abandon this r-address.
3. To activate: buy ~12 XRP (10 reserve + a little for fees) from an exchange **you** control, withdraw to `rPjrQxdzgw1GoZ6zvzErxBykRVb7VbRaw4`. Destination tag: none unless the exchange requires one on **their** side.
4. Tell me when the first inbound XRP confirms. I will re-query the ledger and only then talk Magnetic/DEX.

## XRP perps (separate from Xaman)

Hyperliquid/Phantom already lists **XRP perps** (max 20x). That does **not** need Xaman. Griffty BTC 2x is still using ~all HL margin, so XRP perps still need extra USDC or a BTC trim. Say which.
