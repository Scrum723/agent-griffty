import {
  canonicalKey,
  newId,
  redactSecrets,
  type Opportunity,
  type ScoutOpportunityInput,
} from "@griffty/domain";

export function toOpportunity(
  input: ScoutOpportunityInput,
  cycleId: string,
  now = new Date(),
): Opportunity {
  const iso = now.toISOString();
  const rawNotes = redactSecrets(input.raw_notes ?? "");
  return {
    id: newId("opp"),
    externalId: input.external_id,
    source: input.source,
    sourceClass: input.source_class,
    title: input.title,
    url: input.url,
    officialUrlVerified: input.official_url_verified,
    compensationText: input.compensation_text,
    compensationEstimateUsd: input.compensation_estimate_usd,
    compensationAsset: input.compensation_asset,
    timeEstimateMinutes: input.time_estimate_minutes,
    incrementalMinutes: input.incremental_minutes ?? input.time_estimate_minutes,
    deadlineAt: input.deadline_at,
    kycRequired: input.kyc_required,
    kycAlreadyComplete: input.kyc_already_complete ?? false,
    geoEligibility: input.geo_eligibility,
    requiresWallet: input.requires_wallet,
    requiresDeposit: input.requires_deposit,
    rawNotes,
    confidence: input.confidence,
    pPayout: input.p_payout,
    feesUsd: input.fees_usd,
    banCostUsd: input.ban_cost_usd,
    tokenMarkUsd: input.token_mark_usd ?? null,
    enrolledPlatform: input.enrolled_platform ?? false,
    establishedPayoutHistory: input.established_payout_history ?? false,
    unofficialAggregatorOnly: input.unofficial_aggregator_only ?? false,
    documentedRate: input.documented_rate ?? false,
    unsolicited: input.unsolicited ?? false,
    campaignHostOfficial: input.campaign_host_official ?? input.official_url_verified,
    reasonCodes: [],
    status: "discovered",
    cycleId,
    createdAt: iso,
    updatedAt: iso,
  };
}

export function dedupe(
  existing: Opportunity[],
  incoming: Opportunity[],
): Opportunity[] {
  const seen = new Set(existing.map((o) => canonicalKey(o.source, o.externalId)));
  return incoming.filter((o) => {
    const k = canonicalKey(o.source, o.externalId);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}
