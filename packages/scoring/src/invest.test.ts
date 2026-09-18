import { describe, expect, it } from "vitest";
import { scoreProject, thesisFromInputs } from "./invest.js";

describe("investment health screen", () => {
  it("rejects guaranteed-return pitches", () => {
    const s = scoreProject({
      name: "Moon",
      kind: "token",
      liquidityUsd: 1_000_000,
      volume7dUsd: 100_000,
      volume30dUsd: 100_000,
      holderOrUserGrowthPct: 20,
      publicDocs: true,
      teamIdentifiable: true,
      githubOrProductAlive: true,
      claimsGuaranteedReturn: true,
      anonymousMintOrStealthLaunch: false,
    });
    expect(s.eligible).toBe(false);
    expect(s.score).toBe(0);
  });

  it("passes a documented growing project and attaches default 10/25 stops", () => {
    const t = thesisFromInputs("inv_1", {
      name: "Example Labs",
      kind: "startup",
      liquidityUsd: 300_000,
      volume7dUsd: 80_000,
      volume30dUsd: 200_000,
      holderOrUserGrowthPct: 12,
      publicDocs: true,
      teamIdentifiable: true,
      githubOrProductAlive: true,
      claimsGuaranteedReturn: false,
      anonymousMintOrStealthLaunch: false,
    }, 25);
    expect(t.eligible).toBe(true);
    expect(t.healthScore).toBeGreaterThanOrEqual(70);
    expect(t.stopLossPct).toBe(10);
    expect(t.takeProfitPct).toBe(25);
  });
});
