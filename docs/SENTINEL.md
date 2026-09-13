# Sentinel — security through layers (defensive)

Charles asked whether Griffty should leave Railway for wallets, and whether a standby “swarm army” should counter-hack.

## Recommendation for hackathons

**Both, split by data class.**

| Data | Where |
|---|---|
| Public demo (queue, ads floor UI, scoring) | Railway / `griffty.net` is fine |
| Personal wallets, seeds, session keys | **Mac app + iPhone only.** Watch-only addresses. Never seeds on Railway |
| Operator token | Rotate off `dev-operator-token` before sharing URLs |

Beefing Griffty security **and** extracting a shared `@griffty/sentinel` package is the right move. One stack, many agents — not a separate untested army.

## What we will build

1. **Watch** — log IP, user-agent, path on our hosts.
2. **Honeypot** — fake admin/env routes that never hold secrets.
3. **Contain** — freeze autonomy, pause connectors, require operator.
4. **Kill ours** — stop *this* process / disconnect *our* wallets.

Mac: `apps/electron` (Griffty Desktop). iPhone: dashboard PWA (`apps/dashboard/public/manifest.json`) until a native shell is worth it.

## What we will not build

- Hitting attacker machines
- “Frying” their hardware
- Stealing their files or wallets
- Overload / DDoS

That is illegal even if they hit first. Attribution (IP, headers, timestamps) is for **your** logs and, if needed, a report. A “giant AI dance party” after a breach is a local celebration, not a remote wipe.

Idle Halo training (DJ) and Sentinel stay on **our** side of the wire.
