import {
  DEFAULT_STANDING_ORDERS,
  isHardReject,
  type Decision,
  type DimensionScores,
  type Opportunity,
  type QualifierResult,
  type ReasonCode,
  type StandingOrders,
} from "@griffty/domain";
import { detectHardRejects } from "./detect.js";

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export function pPayoutOf(opp: Opportunity): number {
  if (typeof opp.pPayout === "number") return clamp(opp.pPayout, 0, 1);
  if (opp.unofficialAggregatorOnly) return 0.15;
  if (opp.establishedPayoutHistory) return 0.9;
  if (opp.enrolledPlatform) return 0.7;
  return 0.5;
}

export function expectedNetUsd(opp: Opportunity): number | null {
  if (opp.compensationAsset === "TOKEN" && opp.tokenMarkUsd === null) return null;
  if (opp.compensationEstimateUsd == null) return null;
  const p = pPayoutOf(opp);
  const fees = opp.feesUsd ?? 0;
  const ban = opp.banCostUsd ?? 0;
  return round1(p * opp.compensationEstimateUsd - fees - ban);
}

export function usdPerHour(expectedNet: number | null, hours: number): number | null {
  if (expectedNet == null) return null;
  const denom = Math.max(hours, 1 / 12);
  return round1(expectedNet / denom);
}

/** EV dimension. Unknown gross is capped at 8 (spec). */
export function evPoints(expectedNet: number | null, documentedRate: boolean): number {
  if (expectedNet == null) return 8;
  if (expectedNet <= 0) return 0;
  if (expectedNet >= 75) return 25;
  if (expectedNet >= 50) return round1(18 + (7 * (expectedNet - 50)) / 25);
  if (expectedNet >= 25) return 18;
  if (expectedNet >= 15) return round1(10 + (8 * (expectedNet - 15)) / 10);
  if (expectedNet >= 5) return 10;
  const linear = (10 * expectedNet) / 5;
  if (documentedRate && expectedNet >= 1) return Math.max(round1(linear), 8);
  return round1(linear);
}

/**
 * time_efficiency_pts = clamp(20 * usd_per_hour / 40, 0, 20)
 * Background idle yield is capped so it cannot masquerade as the $50 path.
 */
export function timePoints(
  usdHr: number | null,
  backgroundZeroIncremental: boolean,
): number {
  if (backgroundZeroIncremental) return 8;
  if (usdHr == null) return 0;
  return round1(clamp((20 * usdHr) / 40, 0, 20));
}

export function reliabilityPoints(opp: Opportunity, hard: boolean): number {
  if (hard) return 0;
  if (opp.compensationAsset === "TOKEN" && opp.tokenMarkUsd === null) return 6;
  if (opp.establishedPayoutHistory) return 15;
  if (opp.enrolledPlatform && (opp.compensationAsset === "USD" || opp.compensationAsset === "PAYPAL")) {
    return 12;
  }
  if (opp.sourceClass === "learn_earn" && opp.kycAlreadyComplete) return 15;
  if (opp.kycRequired) return 6;
  return 6;
}

export function riskInversePoints(opp: Opportunity, hard: boolean): number {
  if (hard) return 0;
  if (opp.sourceClass === "airdrop") return 8;
  if (opp.compensationAsset === "TOKEN" && opp.tokenMarkUsd === null) return 8;
  if (opp.requiresWallet && !opp.kycAlreadyComplete) return 8;
  if (opp.sourceClass === "learn_earn" && opp.kycAlreadyComplete && !opp.requiresWallet) {
    return 20;
  }
  if (
    opp.sourceClass === "gpt" ||
    opp.sourceClass === "research" ||
    opp.sourceClass === "usability" ||
    opp.sourceClass === "depin"
  ) {
    return 14;
  }
  const fiat = opp.compensationAsset === "USD" || opp.compensationAsset === "PAYPAL";
  if (fiat && !opp.requiresWallet && !opp.kycRequired) return 20;
  if (fiat && !opp.requiresWallet) return 14;
  return 14;
}

export function capitalPoints(opp: Opportunity, policy: StandingOrders): number {
  if (opp.requiresDeposit) return 0;
  if (opp.incrementalMinutes === 0 && opp.enrolledPlatform) return 10;
  if (opp.requiresWallet && policy.allowGasOnKnownChains) return 5;
  return 10;
}

export function fitPoints(opp: Opportunity): number {
  if (opp.sourceClass === "owned_media") return 10;
  if (opp.sourceClass === "weather_data") return 8;
  if (opp.sourceClass === "research") return 6;
  if (opp.sourceClass === "learn_earn") return 5;
  if (opp.sourceClass === "depin") return 5;
  if (opp.sourceClass === "gpt" || opp.sourceClass === "usability") return 5;
  if (opp.sourceClass === "airdrop") return 4;
  return 5;
}

export function decide(
  total: number,
  opp: Opportunity,
  codes: ReasonCode[],
  policy: StandingOrders,
  expectedNet: number | null,
): Decision {
  if (isHardReject(codes)) return "reject";
  if (opp.requiresDeposit && policy.zeroCapital) return "reject";

  const cashable =
    opp.compensationAsset === "USD" ||
    opp.compensationAsset === "PAYPAL" ||
    (opp.compensationAsset === "TOKEN" && opp.tokenMarkUsd != null);

  if (opp.sourceClass === "airdrop") {
    if (codes.includes("AIRDROP_AUTHENTICITY_VERIFIED")) return "queue";
    return "reject";
  }

  if (
    (opp.sourceClass === "weather_data" || opp.compensationAsset === "TOKEN") &&
    opp.tokenMarkUsd === null &&
    !cashable
  ) {
    return "watch";
  }

  if (
    (opp.sourceClass === "depin" || opp.sourceClass === "weather_data") &&
    (opp.incrementalMinutes === 0 || opp.timeEstimateMinutes === 0) &&
    cashable &&
    total >= 42 &&
    total <= 54
  ) {
    return "queue";
  }

  if (total >= policy.decisionExecuteMin) return "execute";
  if (total >= policy.decisionQueueMin) return "queue";
  if (total >= policy.decisionWatchMin) return "watch";
  if (expectedNet != null && expectedNet <= 0 && total <= 34) return "reject";
  return "reject";
}

export function scoreOpportunity(
  opp: Opportunity,
  policy: StandingOrders = DEFAULT_STANDING_ORDERS,
): QualifierResult {
  const detected = detectHardRejects(opp);
  const codes: ReasonCode[] = [...new Set([...opp.reasonCodes, ...detected])];

  if (opp.sourceClass === "airdrop" && !detected.includes("UNOFFICIAL_CLAIM_SITE")) {
    const authentic =
      policy.allowVerifiedAirdrops &&
      opp.officialUrlVerified &&
      opp.campaignHostOfficial &&
      !opp.unsolicited &&
      !opp.unofficialAggregatorOnly &&
      !opp.requiresDeposit &&
      detected.length === 0;
    if (authentic) {
      codes.push("AIRDROP_AUTHENTICITY_VERIFIED", "AIRDROP_HUMAN_GATE");
    } else if (!codes.includes("UNOFFICIAL_CLAIM_SITE")) {
      codes.push("UNOFFICIAL_CLAIM_SITE", "AIRDROP_UNVERIFIED");
    }
  }

  if (opp.requiresDeposit && policy.zeroCapital) {
    codes.push("ZERO_CAPITAL_VIOLATION", "DEPOSIT_REQUIRED");
  }

  if (opp.incrementalMinutes === 0 || (opp.sourceClass === "depin" && opp.timeEstimateMinutes === 0)) {
    codes.push("PASSIVE_BACKGROUND", "NOT_STRETCH_PATH");
  }

  if (opp.compensationAsset === "TOKEN" && opp.tokenMarkUsd === null) {
    codes.push("TOKEN_MARK_NULL");
  }

  const hard = isHardReject(codes);
  const expectedNet = hard ? 0 : expectedNetUsd(opp);
  const hours =
    (opp.incrementalMinutes ?? opp.timeEstimateMinutes ?? 60) / 60;
  const background = (opp.incrementalMinutes ?? opp.timeEstimateMinutes) === 0;
  const usdHr = hard ? 0 : usdPerHour(expectedNet, hours);

  const scores: DimensionScores = hard
    ? {
        expected_net_value: 0,
        time_efficiency: 0,
        payout_reliability: 0,
        risk_inverse: 0,
        capital_intensity: 0,
        strategic_fit: 0,
      }
    : {
        expected_net_value: evPoints(expectedNet, opp.documentedRate),
        time_efficiency: timePoints(usdHr, background),
        payout_reliability: reliabilityPoints(opp, hard),
        risk_inverse: riskInversePoints(opp, hard),
        capital_intensity: capitalPoints(opp, policy),
        strategic_fit: fitPoints(opp),
      };

  const total = hard
    ? 0
    : round1(
        scores.expected_net_value +
          scores.time_efficiency +
          scores.payout_reliability +
          scores.risk_inverse +
          scores.capital_intensity +
          scores.strategic_fit,
      );

  const decision = decide(total, opp, codes, policy, expectedNet);

  const humanGate =
    decision !== "reject" &&
    (opp.kycRequired && !opp.kycAlreadyComplete ||
      opp.requiresWallet ||
      (expectedNet != null && expectedNet >= policy.humanGateUsd) ||
      codes.includes("AIRDROP_AUTHENTICITY_VERIFIED") ||
      codes.includes("AIRDROP_HUMAN_GATE"));

  if (humanGate && opp.kycRequired && !opp.kycAlreadyComplete) codes.push("KYC_NEW_PLATFORM");
  if (humanGate && opp.requiresWallet) codes.push("WALLET_SIGNATURE_REQUIRED");
  if (humanGate && expectedNet != null && expectedNet >= policy.humanGateUsd) {
    codes.push("HUMAN_GATE_VALUE");
  }

  const notes = [
    `p_payout=${pPayoutOf(opp)}`,
    `gross=${opp.compensationEstimateUsd ?? "null"}`,
    `fees=${opp.feesUsd ?? 0}`,
    `expected_net_usd=${expectedNet}`,
    `usd_per_hour=${usdHr}`,
    `EV=${scores.expected_net_value}`,
    `Time=${scores.time_efficiency}`,
    `Reliability=${scores.payout_reliability}`,
    `Risk inv.=${scores.risk_inverse}`,
    `Capital=${scores.capital_intensity}`,
    `Fit=${scores.strategic_fit}`,
    `Total=${total}`,
    `decision=${decision}`,
  ].join("; ");

  return {
    opportunity_id: opp.id,
    scores,
    total,
    expected_net_usd: expectedNet,
    expected_usd_per_hour: usdHr,
    decision,
    reason_codes: [...new Set(codes)],
    human_gate: humanGate,
    notes,
  };
}
