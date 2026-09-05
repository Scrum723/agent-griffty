import { describe, expect, it } from "vitest";
import { emptyWorld } from "@griffty/store";
import { planProfitSweep } from "./profit-sweep.js";

describe("daily 50% profit sweep", () => {
  it("does not send when crypto is underwater even if ledger harvest exists", () => {
    const world = emptyWorld();
    world.policy = { ...world.policy, dailyProfitSweepPct: 0.5, dailyProfitSweepTo: "FigKNbrXoMmnonsrBfPgHCS8FKGPMZ7X5zXMY1dCCG2Z", dailyProfitSweepMinUsd: 0.5 };
    const session = world.wallets.find((w) => w.id === "wal_session") ?? world.wallets[0];
    session.id = "wal_session";
    session.assets = [
      { symbol: "SOL", amount: 0.025, usdMark: 2.6 },
      { symbol: "JitoSOL", amount: 0.046, usdMark: 6.21 },
    ];
    const plan = planProfitSweep(world, 18.5);
    expect(plan.sweepPct).toBe(0.5);
    expect(plan.destination).toBe("FigKNbrXoMmnonsrBfPgHCS8FKGPMZ7X5zXMY1dCCG2Z");
    expect(plan.send).toBe(false);
    expect(plan.skipReason).toMatch(/not in the agent SOL wallet/i);
  });

  it("plans 50% of positive session PnL", () => {
    const world = emptyWorld();
    world.policy = { ...world.policy, dailyProfitSweepPct: 0.5, dailyProfitSweepTo: "FigKNbrXoMmnonsrBfPgHCS8FKGPMZ7X5zXMY1dCCG2Z", dailyProfitSweepMinUsd: 0.5 };
    (world as { sessionCostBasisUsd?: number }).sessionCostBasisUsd = 8.99;
    const session = world.wallets.find((w) => w.id === "wal_session");
    if (session) {
      session.id = "wal_session";
      session.assets = [{ symbol: "SOL", amount: 0.15, usdMark: 16 }];
    }
    const plan = planProfitSweep(world, 0);
    expect(plan.send).toBe(true);
    expect(plan.profitUsd).toBeCloseTo(7.01, 1);
    expect(plan.sweepUsd).toBeCloseTo(3.5, 1);
    expect(plan.moonSleeveUsd).toBeCloseTo(1.75, 1);
    expect(plan.moonSleeve).toBe("no_eligible_asset");
  });
});
