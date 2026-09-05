import { describe, expect, it } from "vitest";
import { emptyWorld } from "@griffty/store";
import { applyFloorProtection, evaluateTreasury, floorStatusOf } from "./treasury.js";

describe("treasury floor controller", () => {
  it("watch when balance is below floor+buffer but above floor", () => {
    expect(
      floorStatusOf({
        adsBalanceUsd: 110,
        projectedEodUsd: 108,
        policy: emptyWorld().policy,
      }),
    ).toBe("watch");
  });

  it("breach_forecast when modelled EOD < 100 but current >= 100", () => {
    expect(
      floorStatusOf({
        adsBalanceUsd: 108.2,
        projectedEodUsd: 94.1,
        policy: emptyWorld().policy,
      }),
    ).toBe("breach_forecast");
  });

  it("ok at or above 125 combined", () => {
    expect(
      floorStatusOf({
        adsBalanceUsd: 125,
        projectedEodUsd: 125,
        policy: emptyWorld().policy,
      }),
    ).toBe("ok");
  });

  it("proposes ads top-up from fiat until buffer is met", () => {
    const world = emptyWorld();
    world.cashUsd = 80;
    world.adsAccounts = world.adsAccounts.map((a, i) => ({
      ...a,
      balanceUsd: i === 0 ? 90 : 0,
    }));
    const snap = evaluateTreasury(world, new Date("2026-09-03T00:00:00Z"), 0);
    expect(snap.floor_status).toBe("breach");
    expect(snap.actions.some((a) => a.type === "top_up_ads")).toBe(true);
  });

  it("floor watch pauses prospecting only", () => {
    const world = emptyWorld();
    const { campaigns, paused } = applyFloorProtection(world.campaigns, "watch", true);
    expect(paused.length).toBeGreaterThan(0);
    expect(campaigns.find((c) => c.kind === "prospecting")?.status).toBe("paused");
    expect(campaigns.find((c) => c.kind === "retargeting")?.status).toBe("active");
    expect(campaigns.find((c) => c.kind === "branded")?.status).toBe("active");
  });
});
