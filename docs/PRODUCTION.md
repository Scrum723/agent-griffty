# Griffty production — 2026-09-16

## Custom interface (not Grok)

Use the browser desk. Grok is disconnected.

- **Cloud:** https://griffty.net (enter your name → Home)
- **Mac/local:** `npm run start:web` then http://127.0.0.1:8787
- Pause/resume ads, budgets, treasury, notifications, profile — all in the UI
- iPhone: Safari → Add to Home Screen

## Live

| | |
|---|---|
| Dashboard | https://griffty.net |
| Railway URL | https://agent-griffty-production.up.railway.app |
| Health | `GET /health` and `GET /api/health` (public, 200) |
| MCP | `https://griffty.net/mcp` (Bearer `MCP_AUTH_TOKEN`) |

## Railway settings (service `agent-griffty`)

- Builder: RAILPACK, Node 20 (`RAILPACK_NODE_VERSION=20`)
- Build command: `npm run build` (server `tsc --noEmit` + dashboard Vite)
- Start command: `npm run start:web` (`tsx apps/server/src/index.ts`)
- Healthcheck path: `/health`
- Binds `0.0.0.0` on `process.env.PORT`

## Environment variables

| Name | Where | Purpose |
|---|---|---|
| `PORT` | Railway (automatic) | HTTP port |
| `NODE_ENV` | Railway | `production` |
| `GRIFFTY_STORE` | Railway | `file` on Railway demo; `firestore` locally with ADC |
| `GCLOUD_PROJECT` / `GOOGLE_CLOUD_PROJECT` | Railway | `griffty` |
| `OPERATOR_TOKEN` | Railway (optional) | curl/operator API; default `dev-operator-token` — rotate before public share |
| `MCP_AUTH_TOKEN` | **Railway Variables** (service `agent-griffty`) | Bearer for `/mcp` only. Never in the browser. |
| `CONNECTOR_ADS_GOOGLE` | optional | Google Ads probe |

## Grok is disconnected (operator order 2026-09-18)

Griffty **does not run on Grok Build**. `grokBuildLoops` is frozen false. No scheduled Grok tasks.

The Grok TUI MCP connector to `https://griffty.net/mcp` was **removed**. Grok cannot call Griffty tools, so Griffty work does not spend Grok tokens.

Griffty itself runs on **Railway** (your project, your domain). Dashboard: https://griffty.net  
Do **not** add it back under grok.com/connectors unless you explicitly want Grok to drive it.

1. **Railway plugin** — already listed in Grok plugins. Complete OAuth at the Railway plugin if it still says unauthorized: Grok plugins → Railway → Connect.
2. **Griffty MCP** — https://grok.com/connectors → Custom connector → URL `https://griffty.net/mcp` → Auth: Bearer token from Railway variable `MCP_AUTH_TOKEN`.

## What remains

- Completing Grok.com OAuth in the browser (steps 4–5) cannot be finished from this agent session without your login.
- Rotate `OPERATOR_TOKEN` and `MCP_AUTH_TOKEN` if this chat is shared.
- Personal wallet seeds stay off Railway; Mac dmg + iPhone PWA for that.
