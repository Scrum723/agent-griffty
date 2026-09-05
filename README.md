# Agent Griffty

Autonomous **opportunity discovery → qualification → execution queue → treasury → paid distribution** for Doc Weather owned media.

Harvest low-capital cash and verified tokens → capitalize ads accounts → amplify owned properties → recycle surplus. It is a closed loop, not a gig farm.

## Standing policy

| Control | Value |
|---|---|
| Ads prepaid floor | **$100** combined (buffer $25 → watch under $125) |
| Stretch harvest | **$50/day** — variance is reported, never treated as a crash |
| Zero incremental cash | except ordinary gas on chains already in use |
| Human gates | KYC, wallet signatures, ads budget increases |
| Dark web | **disabled**, no override |
| Airdrops | allowed **only after authenticity verification**; **never auto-claimed**; burner wallet + operator signature |

Reject automatically: seed phrases, private keys, prepaid “unlock” claims, remote-access tools, unofficial claim sites, review/engagement fraud, sybil farms.

## Quick start

```bash
cd agent-griffty
npm install
npm test                 # golden fixtures + acceptance tests must pass first
npm run seed             # sample opportunities, events, $100 ads-floor scenario
npm run dev:server       # API http://127.0.0.1:8787
npm run dev:dashboard    # console http://127.0.0.1:5173
```

Local operator token (default): `dev-operator-token`.

SpaceXAI / xAI is the LLM provider (`XAI_API_KEY`, model `grok-4.6`). The pipeline runs without a key using the deterministic rubric + mock Scout.

## What `npm test` proves

- Premium interview scores **85–90** → execute
- Swagbucks $0.40 survey **38–48** → watch
- Honeygain idle yield **42–52** → queue as passive (not the $50 path)
- Prepaid airdrop → **0 / reject / PREPAID_CLAIM**
- Official learn-to-earn **58–68** → queue
- Weather-network token with null mark → watch, capital 10
- Seed-phrase request → **SEED_PHRASE_REQUEST**, secret redacted from logs
- Ads **$95** → floor **breach**, prospecting paused **before** retargeting
- Stretch miss → `kpi.stretch_variance`, not a kill-switch incident
- No connector contains `.onion` / Tor
- Verified official airdrop → **queue + human gate**, never execute/auto-claim

## Repository

```
apps/dashboard          Operator console (queue, P&L, ads, wallets, alerts)
apps/server             Local API (Hono) over the JSON file store
packages/domain         Types, reason codes, standing orders, event taxonomy
packages/scoring        Rubric + golden fixtures
packages/prompts        Versioned system prompts (v1)
packages/connectors     Mock Scout + feature-flagged live stubs
packages/runtime        Orchestrator, treasury, ads ops, risk, executor
packages/store          File store + empty world
functions               15-minute cycle wrapper
infra                   firebase.json, Firestore rules
docs                    Architecture + standing orders
```

## Implementation order (remaining live work)

1. Domain, rubric, fixtures — **done, gated by `npm test`**
2. Mock Scout → Qualifier → Risk → Executor — **done**
3. Treasury floor controller — **done**
4. Dashboard — **done**
5. One live read-only connector after you enroll and set `CONNECTOR_*=true`
6. Ads balance poller for a single platform behind `CONNECTOR_ADS_*`
7. Remaining connectors still flagged off

## Do not run on Grok Build

`grokBuildLoops` is frozen **false**. Cycles are `npm run cycle` or **GCP Cloud Scheduler** after deploy. See `docs/ops/NO_GROK_BUILD.md`.

## Google Cloud

Project **`griffty`**. ADC: `gcloud auth application-default login`. Details: `docs/GOOGLE.md`.

```bash
gcloud config set project griffty
GRIFFTY_STORE=firestore npm run sandbox
curl -s http://127.0.0.1:8787/api/health
curl -s http://127.0.0.1:8787/api/google/status
```

Secrets live in Secret Manager or `.env` (gitignored). Google Ads is read-only behind `CONNECTOR_ADS_GOOGLE`.

## Firebase

```bash
npm i -g firebase-tools
firebase use griffty
firebase emulators:start --config infra/firebase.json
```

Until then the operator console can use `.griffty/state.json` (`GRIFFTY_STORE=file`). Client writes are denied in `firestore.rules`. Wallet documents are watch-only public addresses — no private material fields exist.

## Airdrop authenticity

`allowVerifiedAirdrops: true` and `allowAirdropAutoClaim: false`.

A listing may be queued when **all** of these hold:

- HTTPS URL on an official project domain or verified campaign host (Galxe/Layer3-class linked from that domain)
- `officialUrlVerified` and `campaignHostOfficial`
- not unsolicited, not a short-link, no deposit, no seed/key request

The Executor then blocks on an **operator signature using the burner wallet**. The treasury wallet is never used for experimental claims.

## 1099 / tax lots

```
GET /api/export/tax-lots
GET /api/export/1099
```
