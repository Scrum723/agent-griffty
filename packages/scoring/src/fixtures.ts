import type { Opportunity } from "@griffty/domain";

function base(partial: Partial<Opportunity> & Pick<Opportunity, "id" | "title" | "sourceClass">): Opportunity {
  const now = "2026-09-03T12:00:00.000Z";
  return {
    externalId: partial.id,
    source: "mock",
    url: "https://example.com/listing",
    officialUrlVerified: true,
    compensationText: "",
    compensationEstimateUsd: null,
    compensationAsset: "USD",
    timeEstimateMinutes: 60,
    incrementalMinutes: 60,
    deadlineAt: null,
    kycRequired: false,
    kycAlreadyComplete: false,
    geoEligibility: ["US"],
    requiresWallet: false,
    requiresDeposit: false,
    rawNotes: "",
    confidence: 0.9,
    tokenMarkUsd: null,
    enrolledPlatform: true,
    establishedPayoutHistory: false,
    unofficialAggregatorOnly: false,
    documentedRate: true,
    unsolicited: false,
    campaignHostOfficial: true,
    reasonCodes: [],
    status: "discovered",
    cycleId: "test",
    createdAt: now,
    updatedAt: now,
    ...partial,
  };
}

/** 1. Premium Respondent interview — expect 85–90, execute */
export const FIXTURE_PREMIUM_INTERVIEW = base({
  id: "fix_interview",
  source: "respondent",
  sourceClass: "research",
  title: "60-minute UX interview on household energy use",
  url: "https://app.respondent.io/studies/abc",
  compensationText: "$120 via PayPal",
  compensationEstimateUsd: 120,
  compensationAsset: "PAYPAL",
  timeEstimateMinutes: 60,
  incrementalMinutes: 60,
  kycRequired: true,
  kycAlreadyComplete: true,
  pPayout: 0.7,
  feesUsd: 0,
  banCostUsd: 0,
  establishedPayoutHistory: false,
  enrolledPlatform: true,
  documentedRate: true,
});

/** 2. Swagbucks $0.40 survey — expect 38–48, watch */
export const FIXTURE_SWAGBUCKS = base({
  id: "fix_swagbucks",
  source: "swagbucks",
  sourceClass: "gpt",
  title: "12-minute branded survey",
  url: "https://www.swagbucks.com/surveys/x",
  compensationText: "$0.40 SB",
  compensationEstimateUsd: 0.4,
  compensationAsset: "USD",
  timeEstimateMinutes: 12,
  incrementalMinutes: 12,
  pPayout: 0.8,
  establishedPayoutHistory: false,
  enrolledPlatform: true,
  documentedRate: true,
});

/** 3. Honeygain daily accrual — expect 42–52, queue as passive */
export const FIXTURE_HONEYGAIN = base({
  id: "fix_honeygain",
  source: "honeygain",
  sourceClass: "depin",
  title: "Residential bandwidth node daily accrual",
  url: "https://dashboard.honeygain.com/",
  compensationText: "$0.18/day estimated",
  compensationEstimateUsd: 0.18,
  compensationAsset: "USD",
  timeEstimateMinutes: 0,
  incrementalMinutes: 0,
  pPayout: 0.9,
  establishedPayoutHistory: false,
  enrolledPlatform: true,
  documentedRate: false,
});

/** 4. Prepaid airdrop claim — 0, reject, PREPAID_CLAIM */
export const FIXTURE_PREPAID_AIRDROP = base({
  id: "fix_prepaid",
  source: "unknown-claim",
  sourceClass: "airdrop",
  title: "Claim 2,000 TOKEN — send 0.05 ETH to unlock",
  url: "https://claim-now.example/airdrop",
  officialUrlVerified: false,
  campaignHostOfficial: false,
  unofficialAggregatorOnly: true,
  unsolicited: true,
  compensationText: "claim 2,000 TOKEN, send 0.05 ETH",
  compensationEstimateUsd: 2000,
  compensationAsset: "TOKEN",
  requiresWallet: true,
  requiresDeposit: true,
  rawNotes: "Pay 0.05 ETH to unlock airdrop payout",
  documentedRate: false,
  enrolledPlatform: false,
});

/** 5. Official learn-to-earn — 58–68, queue */
export const FIXTURE_LEARN_EARN = base({
  id: "fix_learn",
  source: "coinbase",
  sourceClass: "learn_earn",
  title: "Coinbase Learn: intro to Ethereum",
  url: "https://www.coinbase.com/learn",
  compensationText: "$3 USD equivalent",
  compensationEstimateUsd: 3,
  compensationAsset: "USD",
  timeEstimateMinutes: 15,
  incrementalMinutes: 15,
  kycRequired: true,
  kycAlreadyComplete: true,
  pPayout: 0.9,
  establishedPayoutHistory: true,
  enrolledPlatform: true,
  documentedRate: true,
});

/** 6. Weather network, station online, token mark null — watch until cashable */
export const FIXTURE_WEATHER = base({
  id: "fix_weather",
  source: "weatherxm",
  sourceClass: "weather_data",
  title: "WeatherXM station reward (already online)",
  url: "https://weatherxm.com/rewards",
  compensationText: "WXM rewards, mark-to-market unavailable",
  compensationEstimateUsd: null,
  compensationAsset: "TOKEN",
  tokenMarkUsd: null,
  timeEstimateMinutes: 0,
  incrementalMinutes: 0,
  pPayout: 0.5,
  documentedRate: false,
  enrolledPlatform: true,
  requiresWallet: true,
});

/** Seed-phrase request — reject SEED_PHRASE_REQUEST, secrets redacted */
export const FIXTURE_SEED_PHRASE = base({
  id: "fix_seed",
  source: "phish",
  sourceClass: "airdrop",
  title: "Connect wallet — enter seed phrase to verify",
  url: "https://wallet-sync.invalid/claim",
  officialUrlVerified: false,
  campaignHostOfficial: false,
  compensationText: "free tokens",
  compensationAsset: "TOKEN",
  requiresWallet: true,
  rawNotes:
    "Please enter your seed phrase abandon ability able about above absent absorb abstract absurd abuse access accident to sync the wallet",
  unsolicited: true,
  unofficialAggregatorOnly: true,
  documentedRate: false,
  enrolledPlatform: false,
});

/** Verified official airdrop — queue + human gate, never auto-claim */
export const FIXTURE_VERIFIED_AIRDROP = base({
  id: "fix_verified_airdrop",
  source: "galxe",
  sourceClass: "airdrop",
  title: "Official testnet quest on Galxe linked from project domain",
  url: "https://app.galxe.com/quest/official-example",
  officialUrlVerified: true,
  campaignHostOfficial: true,
  unsolicited: false,
  unofficialAggregatorOnly: false,
  compensationText: "points campaign, no deposit",
  compensationEstimateUsd: 12,
  compensationAsset: "POINTS",
  timeEstimateMinutes: 25,
  incrementalMinutes: 25,
  requiresWallet: true,
  requiresDeposit: false,
  documentedRate: false,
  enrolledPlatform: false,
  pPayout: 0.4,
});

export const GOLDEN_FIXTURES = [
  FIXTURE_PREMIUM_INTERVIEW,
  FIXTURE_SWAGBUCKS,
  FIXTURE_HONEYGAIN,
  FIXTURE_PREPAID_AIRDROP,
  FIXTURE_LEARN_EARN,
  FIXTURE_WEATHER,
] as const;
