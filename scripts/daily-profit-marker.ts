/**
 * Daily profit marker. Stretch target is $50 — always reported, never faked.
 * Best path: highest-EV ToS-compliant opportunities (Tier A studies first),
 * not leverage on the $9 session stack.
 */
import { parseStandingOrders } from "@griffty/domain";
import { planProfitSweep, runCycle } from "@griffty/runtime";
import { loadDotEnv, openStore } from "@griffty/store";

loadDotEnv();
const store = openStore();
const world = await store.load();
world.policy = parseStandingOrders({
  ...world.policy,
  allowAgentWalletAutonomy: true,
  allowUnattendedSign: true,
  agentWalletSolana: "2f2RxyqM4YZHRChncDHxkWvSetZMx4CxYB9rW9BAsZuV",
  dailyProfitSweepPct: 0.5,
  dailyProfitSweepTo: "FigKNbrXoMmnonsrBfPgHCS8FKGPMZ7X5zXMY1dCCG2Z",
});
const result = await runCycle(world);
await store.save(result.world);

const target = world.policy.stretchTargetUsd;
const harvest = result.plan.kpi.harvest_today_usd;
const variance = result.plan.kpi.variance_usd;
const hit = harvest >= target;
const ranked = [...result.world.opportunities]
  .filter((o) => o.decision === "execute" || o.decision === "queue")
  .sort((a, b) => (b.total ?? 0) - (a.total ?? 0))
  .slice(0, 8)
  .map((o) => ({
    title: o.title,
    source: o.source,
    decision: o.decision,
    score: o.total,
    expectedNetUsd: o.expectedNetUsd,
    usdPerHour: o.expectedUsdPerHour,
    humanGate: o.humanGate,
  }));

const sweep = planProfitSweep(result.world, harvest);
const marker = {
  date: new Date().toISOString().slice(0, 10),
  stretchTargetUsd: target,
  harvestUsd: harvest,
  varianceUsd: variance,
  status: hit ? "HIT" : "MISS",
  concealment: false,
  adsFloorUsd: result.plan.kpi.ads_floor_usd,
  adsBalanceUsd: result.plan.kpi.ads_balance_usd,
  floorStatus: result.plan.kpi.floor_status,
  profitSweep: sweep,
  bestPath:
    "Tier A paid studies (Respondent / User Interviews / Prolific) when available; fill with enrolled panels; JitoSOL is yield-on-capital not the $50 engine; perps blocked until Phantom HL API is not 403.",
  ranked,
};

console.log(JSON.stringify(marker, null, 2));
if (!hit) {
  console.log(
    `MARKER MISS: harvest $${harvest} vs $${target} (variance ${variance}). Logged as stretch variance, not an incident.`,
  );
} else {
  console.log(`MARKER HIT: harvest $${harvest} >= $${target}.`);
}
