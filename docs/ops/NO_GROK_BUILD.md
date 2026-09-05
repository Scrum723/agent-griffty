# Do not run Agent Griffty on Grok Build

Operator order 2026-09-05: **stop all Grok Build loops**. Weekly allowance was exhausted.

- `grokBuildLoops` in standing orders is frozen `false`.
- No `scheduler_create` for this agent.
- Cycles run locally (`npm run cycle`) or on **GCP** Cloud Scheduler after deploy.
- Phantom MCP, grant hunts, and daily profit markers are **opt-in CLI**, not Grok Build recurrences.
