import { runCycle } from "@griffty/runtime";
import { emptyWorld, loadDotEnv, openStore } from "@griffty/store";

loadDotEnv();
const store = openStore();
if (store.kind !== "firestore") {
  console.error("Expected Firestore store. Set GCLOUD_PROJECT=griffty and GRIFFTY_STORE=firestore");
  process.exit(1);
}

const world = emptyWorld();
world.adsAccounts = world.adsAccounts.map((a, i) => ({
  ...a,
  balanceUsd: i === 0 ? 40 : i === 1 ? 35 : i === 2 ? 15 : 10,
}));
const day = new Date().toISOString().slice(0, 10);
world.ledger.push({
  id: "sandbox_payout_1",
  type: "payout",
  amountUsd: 18.5,
  asset: "USD",
  platform: "respondent",
  settled: true,
  settledAt: `${day}T16:00:00.000Z`,
  createdAt: `${day}T16:00:00.000Z`,
  taxLotId: "lot_sandbox_resp_1",
});

const first = await runCycle(world);
await store.save(first.world);
const reloaded = await store.load();
const second = await runCycle(reloaded);
await store.save(second.world);

const dump = JSON.stringify(second.world);
const checks = {
  store: store.kind,
  project: process.env.GCLOUD_PROJECT,
  cycle1: first.plan.cycle_id,
  cycle2: second.plan.cycle_id,
  opportunities: second.world.opportunities.length,
  events: second.world.events.length,
  rejected: second.world.opportunities.filter((o) => o.decision === "reject").length,
  prepaidClaim: second.world.opportunities.some((o) => o.reasonCodes.includes("PREPAID_CLAIM")),
  seedPhrase: second.world.opportunities.some((o) => o.reasonCodes.includes("SEED_PHRASE_REQUEST")),
  verifiedAirdrop: second.world.opportunities.some((o) =>
    o.reasonCodes.includes("AIRDROP_AUTHENTICITY_VERIFIED"),
  ),
  secretLeaked: dump.includes("abandon ability able about"),
  floor: second.plan.kpi.floor_status,
  ads: second.plan.kpi.ads_balance_usd,
  harvest: second.plan.kpi.harvest_today_usd,
  variance: second.plan.kpi.variance_usd,
  prospectingPaused: second.world.campaigns.find((c) => c.kind === "prospecting")?.status,
  retargeting: second.world.campaigns.find((c) => c.kind === "retargeting")?.status,
  walletsWatchOnly: second.world.wallets.every((w) => w.watchOnly === true),
};

const failed: string[] = [];
if (checks.opportunities < 8) failed.push("opportunities");
if (!checks.prepaidClaim) failed.push("PREPAID_CLAIM");
if (!checks.seedPhrase) failed.push("SEED_PHRASE_REQUEST");
if (!checks.verifiedAirdrop) failed.push("verified airdrop");
if (checks.secretLeaked) failed.push("secret leaked");
if (checks.floor !== "breach_forecast" && checks.floor !== "watch" && checks.floor !== "breach") {
  failed.push("floor not protected");
}
if (checks.prospectingPaused !== "paused") failed.push("prospecting not paused");
if (checks.retargeting !== "active") failed.push("retargeting should remain active");
if (!checks.walletsWatchOnly) failed.push("wallet not watch-only");
if (checks.harvest < 50 && checks.variance >= 0) failed.push("stretch variance");

console.log(JSON.stringify(checks, null, 2));
if (failed.length) {
  console.error("SANDBOX FAILED:", failed.join(", "));
  process.exit(1);
}
console.log("SANDBOX PASSED: Firestore mock cycles succeeded. Ready for Phantom public address.");
