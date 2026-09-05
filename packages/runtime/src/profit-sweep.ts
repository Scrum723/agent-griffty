import type { WorldState } from "@griffty/domain";

const PERSONAL = "FigKNbrXoMmnonsrBfPgHCS8FKGPMZ7X5zXMY1dCCG2Z";

export interface ProfitSweepPlan {
  date: string;
  harvestUsd: number;
  sessionMarkUsd: number;
  sessionCostBasisUsd: number;
  cryptoPnlUsd: number;
  profitUsd: number;
  sweepPct: number;
  sweepUsd: number;
  destination: string;
  send: boolean;
  skipReason?: string;
  moonSleevePct: number;
  moonSleeveUsd: number;
  moonSleeve: "hold" | "no_eligible_asset" | "skipped_no_profit";
  moonNote: string;
}

export function sessionMarkUsd(world: WorldState): number {
  const w = world.wallets.find((x) => x.id === "wal_session");
  if (!w) return 0;
  return w.assets.reduce((s, a) => s + (a.usdMark ?? 0), 0);
}

export function sessionCostBasisUsd(world: WorldState): number {
  const rec = world as WorldState & { sessionCostBasisUsd?: number };
  if (typeof rec.sessionCostBasisUsd === "number") return rec.sessionCostBasisUsd;
  return 8.99;
}

export function planProfitSweep(world: WorldState, harvestUsd: number, now = new Date()): ProfitSweepPlan {
  const pct = world.policy.dailyProfitSweepPct ?? 0.5;
  const dest = world.policy.dailyProfitSweepTo || PERSONAL;
  const minUsd = world.policy.dailyProfitSweepMinUsd ?? 0.5;
  const mark = sessionMarkUsd(world);
  const basis = sessionCostBasisUsd(world);
  const cryptoPnl = mark - basis;
  const profitUsd = Math.max(0, harvestUsd) + Math.max(0, cryptoPnl);
  const sweepUsd = Math.round(profitUsd * pct * 100) / 100;
  const moonPct = world.policy.moonSleevePct ?? 0.25;
  const moonSleeveUsd = Math.round(profitUsd * moonPct * 100) / 100;
  const moonNote =
    "No asset with a guaranteed 1000% return exists. Moon sleeve only buys liquid, official, non-prepaid names after scoring. 'Sure thing / about to moon' marketing is a reject.";
  const plan: ProfitSweepPlan = {
    date: now.toISOString().slice(0, 10),
    harvestUsd,
    sessionMarkUsd: mark,
    sessionCostBasisUsd: basis,
    cryptoPnlUsd: Math.round(cryptoPnl * 100) / 100,
    profitUsd: Math.round(profitUsd * 100) / 100,
    sweepPct: pct,
    sweepUsd,
    destination: dest,
    send: false,
    moonSleevePct: moonPct,
    moonSleeveUsd,
    moonSleeve: "skipped_no_profit",
    moonNote,
  };
  if (cryptoPnl <= 0 && harvestUsd <= 0) {
    plan.skipReason = "No profit today (crypto PnL <= 0 and harvest <= 0).";
    return plan;
  }
  if (cryptoPnl <= 0 && harvestUsd > 0) {
    plan.skipReason =
      `Harvest $${harvestUsd} is fiat/ledger, not in the agent SOL wallet. Cannot send SOL we do not hold. Sweep when session-stack profit is positive or harvest is on-chain.`;
    return plan;
  }
  if (sweepUsd < minUsd) {
    plan.skipReason = `Sweep $${sweepUsd} below minimum $${minUsd}.`;
    return plan;
  }
  plan.send = true;
  plan.moonSleeve = "no_eligible_asset";
  return plan;
}
