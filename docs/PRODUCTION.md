# Griffty production — 2026-09-16

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

## Grok connections

**This Grok TUI session:** `grok mcp doctor griffty` — healthy, handshake OK, 6 tools. Config: `~/.grok/config.toml` `[mcp_servers.griffty]` → `https://griffty.net/mcp` with `Authorization` header from Railway `MCP_AUTH_TOKEN`.

Railway plugin is enabled (`plugins.enabled` includes `railway`). `railway setup agent -y` reported MCP already configured and logged in.

**grok.com (browser):** if you use the website instead of this TUI, still add a custom connector at https://grok.com/connectors with URL `https://griffty.net/mcp` and Bearer from Railway → agent-griffty → `MCP_AUTH_TOKEN`.

Start a **new Grok chat** in this TUI so the Griffty tools load (this session started before the connector was added).

1. **Railway plugin** — already listed in Grok plugins. Complete OAuth at the Railway plugin if it still says unauthorized: Grok plugins → Railway → Connect.
2. **Griffty MCP** — https://grok.com/connectors → Custom connector → URL `https://griffty.net/mcp` → Auth: Bearer token from Railway variable `MCP_AUTH_TOKEN`.

## What remains

- Completing Grok.com OAuth in the browser (steps 4–5) cannot be finished from this agent session without your login.
- Rotate `OPERATOR_TOKEN` and `MCP_AUTH_TOKEN` if this chat is shared.
- Personal wallet seeds stay off Railway; Mac dmg + iPhone PWA for that.
