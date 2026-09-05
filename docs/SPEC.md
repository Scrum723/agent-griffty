# Agent Griffty — implemented subset of the build pack

This repository executes **Section 0** of the build-ready specification: domain types, scoring rubric, mock pipeline, treasury floor, dashboard, event taxonomy, and acceptance tests.

## Hard constraints

- Public web / official APIs only. No dark web, `.onion`, leak forums, credential markets.
- Reject seed phrases, private keys, remote-access software, activation fees, prepaid gas to third-party addresses.
- Never store seed phrases in application state, logs, or Firebase.
- $50/day is a **stretch KPI with variance events**, not a hard SLA.
- Ads prepaid floor is **$100**. Pause prospecting before branded/retargeting when the floor is threatened.
- Human-in-the-loop for KYC, wallet signatures, and ads budget increases.
- Airdrops: authenticity-verified listings may be **queued**. Auto-claim stays **false**. Burner wallet only.

## Scoring (100 pts)

| Dimension | Weight |
|---|---|
| Expected net value | 25 |
| Time efficiency | 20 |
| Payout reliability | 15 |
| Risk inverse | 20 |
| Capital intensity | 10 |
| Strategic fit | 10 |

Defaults: ≥75 execute, 55–74 queue, 35–54 watch, ≤34 reject. Any hard-reject code forces total 0.

`expected_net_usd = p_payout * gross_usd - fees_usd - ban_cost_usd`

Passive DePIN / weather-station yield is queued as background and **must not** be counted as the $50/day engine.

## Event names (exact)

`cycle.started`, `cycle.completed`, `opportunity.discovered`, `opportunity.scored`, `opportunity.rejected`, `opportunity.queued`, `task.started`, `task.blocked`, `task.completed`, `payout.recorded`, `treasury.floor_ok`, `treasury.floor_watch`, `treasury.floor_breach_forecast`, `treasury.floor_breach`, `treasury.allocation_proposed`, `ads.campaign_paused`, `ads.budget_change_proposed`, `ads.spend_recorded`, `risk.denied`, `risk.drainer_bait`, `kpi.stretch_hit`, `kpi.stretch_variance`, `operator.approval_requested`, `operator.approval_granted`.
