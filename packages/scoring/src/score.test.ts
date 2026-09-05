import { describe, expect, it } from "vitest";
import { isHardReject } from "@griffty/domain";
import { scoreOpportunity } from "./score.js";
import {
  FIXTURE_HONEYGAIN,
  FIXTURE_LEARN_EARN,
  FIXTURE_PREMIUM_INTERVIEW,
  FIXTURE_PREPAID_AIRDROP,
  FIXTURE_SEED_PHRASE,
  FIXTURE_SWAGBUCKS,
  FIXTURE_VERIFIED_AIRDROP,
  FIXTURE_WEATHER,
  FIXTURE_YOUTUBE_MONETIZE,
  FIXTURE_PROLIFIC_PANEL,
  FIXTURE_GRASS_NODE,
  FIXTURE_AMAZON_AFFILIATE,
  FIXTURE_MUSIC_SYNC_DEAL,
} from "./fixtures.js";

function expectTotal(total: number, min: number, max: number) {
  expect(total).toBeGreaterThanOrEqual(min);
  expect(total).toBeLessThanOrEqual(max);
}

describe("golden fixtures (±2 of documented bands)", () => {
  it("1. premium interview → 85–90 execute", () => {
    const r = scoreOpportunity(FIXTURE_PREMIUM_INTERVIEW);
    expectTotal(r.total, 85, 90);
    expect(r.decision).toBe("execute");
    expect(r.expected_net_usd).toBe(84);
    expect(r.scores.expected_net_value).toBe(25);
    expect(r.scores.time_efficiency).toBe(20);
  });

  it("2. Swagbucks $0.40 survey → 38–48 watch", () => {
    const r = scoreOpportunity(FIXTURE_SWAGBUCKS);
    expectTotal(r.total, 38, 48);
    expect(r.decision).toBe("watch");
  });

  it("3. Honeygain daily accrual → 42–52 queue as passive", () => {
    const r = scoreOpportunity(FIXTURE_HONEYGAIN);
    expectTotal(r.total, 42, 52);
    expect(r.decision).toBe("queue");
    expect(r.reason_codes).toContain("PASSIVE_BACKGROUND");
    expect(r.reason_codes).toContain("NOT_STRETCH_PATH");
  });

  it("4. prepaid airdrop → 0 reject PREPAID_CLAIM", () => {
    const r = scoreOpportunity(FIXTURE_PREPAID_AIRDROP);
    expect(r.total).toBe(0);
    expect(r.decision).toBe("reject");
    expect(r.reason_codes).toContain("PREPAID_CLAIM");
    expect(isHardReject(r.reason_codes)).toBe(true);
  });

  it("5. official learn-to-earn → 58–68 queue", () => {
    const r = scoreOpportunity(FIXTURE_LEARN_EARN);
    expectTotal(r.total, 58, 68);
    expect(r.decision).toBe("queue");
  });

  it("6. weather network token mark null → watch, capital 10, lower reliability", () => {
    const r = scoreOpportunity(FIXTURE_WEATHER);
    expect(r.decision).toBe("watch");
    expect(r.scores.capital_intensity).toBe(10);
    expect(r.scores.payout_reliability).toBeLessThanOrEqual(6);
    expect(r.reason_codes).toContain("TOKEN_MARK_NULL");
    expect(r.expected_net_usd).toBeNull();
  });
});

describe("hard rejects and airdrop authenticity", () => {
  it("seed-phrase request is rejected and does not keep raw secret in notes", () => {
    const r = scoreOpportunity(FIXTURE_SEED_PHRASE);
    expect(r.decision).toBe("reject");
    expect(r.reason_codes).toContain("SEED_PHRASE_REQUEST");
    expect(r.total).toBe(0);
    expect(r.notes.toLowerCase()).not.toMatch(/abandon ability able about/);
  });

  it("verified official airdrop queues with human gate and never auto-executes", () => {
    const r = scoreOpportunity(FIXTURE_VERIFIED_AIRDROP);
    expect(r.decision).toBe("queue");
    expect(r.human_gate).toBe(true);
    expect(r.reason_codes).toContain("AIRDROP_AUTHENTICITY_VERIFIED");
    expect(r.reason_codes).not.toContain("PREPAID_CLAIM");
    expect(r.decision).not.toBe("execute");
  });
});

describe("new verticals — golden fixtures", () => {
  it("YouTube Monetization", () => {
    const r = scoreOpportunity(FIXTURE_YOUTUBE_MONETIZE);
    expectTotal(r.total, 60, 80);
    expect(r.decision).toBe("queue");
    expect(r.reason_codes).toContain("OWNED_MEDIA_PASSIVE");
  });

  it("Prolific Panel", () => {
    const r = scoreOpportunity(FIXTURE_PROLIFIC_PANEL);
    expectTotal(r.total, 50, 75);
    expect(r.decision).toBe("queue");
    expect(r.reason_codes).toContain("PANEL_SCREENING_REQUIRED");
  });

  it("Grass Node", () => {
    const r = scoreOpportunity(FIXTURE_GRASS_NODE);
    expectTotal(r.total, 35, 60);
    expect(r.decision).toBe("queue");
    expect(r.reason_codes).toContain("PASSIVE_BACKGROUND");
  });

  it("Amazon Affiliate", () => {
    const r = scoreOpportunity(FIXTURE_AMAZON_AFFILIATE);
    expectTotal(r.total, 40, 70);
    expect(r.decision).toBe("queue");
    expect(r.reason_codes).toContain("AFFILIATE_PASSIVE");
  });

  it("DISCO.fm Sync Deal", () => {
    const r = scoreOpportunity(FIXTURE_MUSIC_SYNC_DEAL);
    expectTotal(r.total, 70, 95);
    expect(r.decision).toBe("queue");
    expect(r.reason_codes).toContain("MUSIC_SYNC_HUMAN_GATE");
  });
});
