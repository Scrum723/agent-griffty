# Griffty on your devices (local wallets)

Railway/`griffty.net` is the public demo. **Personal wallets stay on your Mac and iPhone.**

## Mac

Build (unsigned dmg, local use):

```bash
cd ~/agent-griffty
./scripts/build-mac-dmg.sh
```

Output: `apps/electron/dist/Griffty-1.0.0-arm64.dmg` (or x64).

First launch: if local API is not up, run `npm run start:web` in the repo once. The app prefers `http://127.0.0.1:8787` (file store under Electron userData). It does **not** send seeds to Railway.

Gatekeeper: right-click → Open the first time (unsigned).

## iPhone

1. Open Safari → https://griffty.net  
2. Share → **Add to Home Screen**  
3. Title: Griffty  

That is a PWA until a native iOS shell is worth it. Do not paste seeds into the phone browser.
