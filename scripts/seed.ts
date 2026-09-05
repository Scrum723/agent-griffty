import { runCycle } from "@griffty/runtime";
import { emptyWorld, loadDotEnv, openStore } from "@griffty/store";

loadDotEnv();
const store = openStore();
const world = emptyWorld();

world.adsAccounts = world.adsAccounts.map((a, i) => ({
  ...a,
  balanceUsd: i === 0 ? 40 : i === 1 ? 35 : i === 2 ? 15 : 10,
}));

const day = new Date().toISOString().slice(0, 10);
world.ledger.push({
  id: "seed_payout_demo",
  type: "payout",
  amountUsd: 18.5,
  asset: "USD",
  platform: "respondent",
  settled: true,
  settledAt: `${day}T16:00:00.000Z`,
  createdAt: `${day}T16:00:00.000Z`,
  taxLotId: "lot_2026_resp_1",
});

const result = await runCycle(world);
await store.save(result.world);

console.log("Seeded Agent Griffty state.");
console.log(`  cycle     ${result.plan.cycle_id}`);
console.log(`  ads       $${result.plan.kpi.ads_balance_usd} (${result.plan.kpi.floor_status})`);
console.log(`  harvest   $${result.plan.kpi.harvest_today_usd}`);
console.log(`  opps      ${result.world.opportunities.length}`);
console.log(`  rejected  ${result.world.opportunities.filter((o) => o.decision === "reject").length}`);
console.log("  $100 ads-floor scenario: combined prepaid is $100.00 at seed start (40+35+15+10).");
