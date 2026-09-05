import { describe, expect, it } from "vitest";
import { containsRawSecret, DEFAULT_STANDING_ORDERS, REDACTED_SECRET, redactSecrets } from "@griffty/domain";
import { emptyWorld } from "@griffty/store";
import { parseStandingOrders } from "@griffty/domain";
import { scoreOpportunity } from "@griffty/scoring";
import { FIXTURE_PREPAID_AIRDROP, FIXTURE_SEED_PHRASE } from "@griffty/scoring";
import { prospectingPausedBeforeRetargeting } from "./ads-ops.js";
import { runCycle } from "./orchestrator.js";
import { applyFloorProtection, evaluateTreasury, floorStatusOf } from "./treasury.js";

describe("acceptance tests", () => {
  it("rejects prepaid claim airdrop with PREPAID_CLAIM", () => {
    const r = scoreOpportunity(FIXTURE_PREPAID_AIRDROP);
    expect(r.decision).toBe("reject");
    expect(r.reason_codes).toContain("PREPAID_CLAIM");
    expect(r.total).toBe(0);
  });

  it("rejects seed-phrase request and never logs raw secret", () => {
    const r = scoreOpportunity(FIXTURE_SEED_PHRASE);
    expect(r.reason_codes).toContain("SEED_PHRASE_REQUEST");
    const redacted = redactSecrets(FIXTURE_SEED_PHRASE.rawNotes);
    expect(redacted).toContain(REDACTED_SECRET);
    expect(containsRawSecret(redacted)).toBe(false);
    expect(r.notes).not.toMatch(/abandon ability able about/);
  });

  it("ads balance $95 is a floor breach and pauses prospecting before retargeting", () => {
    const world = emptyWorld();
    const total = 95;
    const per = total / world.adsAccounts.length;
    world.adsAccounts = world.adsAccounts.map((a) => ({ ...a, balanceUsd: per }));
    const snap = evaluateTreasury(world, new Date("2026-09-03T12:00:00Z"), 12);
    expect(snap.floor_status).toBe("breach");
    expect(floorStatusOf({ adsBalanceUsd: 95, projectedEodUsd: 80, policy: world.policy })).toBe(
      "breach",
    );
    const { campaigns } = applyFloorProtection(
      world.campaigns,
      "breach",
      world.policy.pauseProspectingOnFloorWatch,
    );
    expect(
      prospectingPausedBeforeRetargeting(world.campaigns, campaigns, "breach"),
    ).toBe(true);
    const prospecting = campaigns.filter((c) => c.kind === "prospecting");
    const retargeting = campaigns.filter((c) => c.kind === "retargeting");
    expect(prospecting.every((c) => c.status === "paused")).toBe(true);
    expect(retargeting.some((c) => c.status === "active")).toBe(true);
  });

  it("stretch KPI miss is VARIANCE, not a system failure", async () => {
    const world = emptyWorld();
    const result = await runCycle(world);
    const variance = result.world.events.find((e) => e.name === "kpi.stretch_variance");
    const hit = result.world.events.find((e) => e.name === "kpi.stretch_hit");
    expect(variance || hit).toBeTruthy();
    if (result.plan.kpi.harvest_today_usd < DEFAULT_STANDING_ORDERS.stretchTargetUsd) {
      expect(variance).toBeTruthy();
      expect(variance?.props.varianceUsd).toBeLessThan(0);
    }
    expect(result.world.killSwitch.reasons).not.toContain("stretch_miss");
    const kpi = result.world.kpiDaily[0];
    expect(kpi.status === "miss" || kpi.status === "hit").toBe(true);
  });

  it("darkWebEnabled cannot be turned on", () => {
    expect(() => parseStandingOrders({ darkWebEnabled: true })).toThrow(/darkWebEnabled/);
    expect(() => parseStandingOrders({ allowAirdropAutoClaim: true })).toThrow(
      /allowAirdropAutoClaim/,
    );
    const p = parseStandingOrders({
      allowWalletConnectSign: true,
      allowUnattendedSign: true,
      allowAgentWalletAutonomy: true,
    });
    expect(p.allowWalletConnectSign).toBe(true);
    expect(p.allowUnattendedSign).toBe(true);
    expect(p.allowAgentWalletAutonomy).toBe(true);
    expect(p.darkWebEnabled).toBe(false);
    expect(p.allowAirdropAutoClaim).toBe(false);
    expect(p.grokBuildLoops).toBe(false);
    expect(() => parseStandingOrders({ grokBuildLoops: true } as never)).toThrow(/grokBuildLoops/);
  });

  it("full mock cycle records rejects, verified airdrop gate, and floor events", async () => {
    const world = emptyWorld();
    const result = await runCycle(world);
    const prepaid = result.qualifierResults.find((q) =>
      q.reason_codes.includes("PREPAID_CLAIM"),
    );
    const seed = result.qualifierResults.find((q) =>
      q.reason_codes.includes("SEED_PHRASE_REQUEST"),
    );
    const verified = result.qualifierResults.find((q) =>
      q.reason_codes.includes("AIRDROP_AUTHENTICITY_VERIFIED"),
    );
    expect(prepaid?.decision).toBe("reject");
    expect(seed?.decision).toBe("reject");
    expect(verified?.decision).toBe("queue");
    expect(verified?.human_gate).toBe(true);
    expect(result.world.signIntents.some((s) => s.requiresOperatorTap && s.unattendedForbidden)).toBe(
      true,
    );
    expect(result.world.events.some((e) => e.name === "sign.requested")).toBe(true);
    expect(result.world.events.some((e) => e.name === "cycle.completed")).toBe(true);
    const dump = JSON.stringify(result.world);
    expect(dump).not.toMatch(/abandon ability able about above absent/);
  });
});
