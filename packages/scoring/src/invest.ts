/**
 * Health screen for investable projects (startups / protocols / tokens).
 * $115/day is a target, not a promise. Never scores "guaranteed 1000%".
 */
export interface HealthInputs {
  name: string;
  kind: "startup" | "protocol" | "token";
  url?: string;
  liquidityUsd: number;
  volume7dUsd: number;
  volume30dUsd: number;
  holderOrUserGrowthPct: number;
  publicDocs: boolean;
  teamIdentifiable: boolean;
  githubOrProductAlive: boolean;
  claimsGuaranteedReturn: boolean;
  anonymousMintOrStealthLaunch: boolean;
  tractionNote?: string;
}

export interface InvestmentThesis {
  id: string;
  name: string;
  kind: HealthInputs["kind"];
  url?: string;
  healthScore: number;
  eligible: boolean;
  reasons: string[];
  parameters: HealthInputs;
  proposedUsd: number;
  stopLossPct: number;
  takeProfitPct: number;
  stopNote: string;
  takeNote: string;
  status: "proposed" | "watching" | "accepted" | "rejected" | "open" | "stopped" | "taken";
  createdAt: string;
  updatedAt: string;
}

export const DEFAULT_STOP_PCT = 10;
export const DEFAULT_TAKE_PCT = 25;
export const DAILY_TARGET_USD = 115;

export function scoreProject(input: HealthInputs): { score: number; eligible: boolean; reasons: string[] } {
  const reasons: string[] = [];
  if (input.claimsGuaranteedReturn) {
    return { score: 0, eligible: false, reasons: ["rejects guaranteed-return language"] };
  }
  if (input.anonymousMintOrStealthLaunch) {
    return { score: 8, eligible: false, reasons: ["anonymous mint / stealth launch"] };
  }
  let score = 20;
  if (input.publicDocs) {
    score += 12;
    reasons.push("public docs");
  } else reasons.push("missing docs");
  if (input.teamIdentifiable) {
    score += 12;
    reasons.push("identifiable team");
  } else reasons.push("team not identifiable");
  if (input.githubOrProductAlive) {
    score += 10;
    reasons.push("live product/github");
  }
  if (input.liquidityUsd >= 250_000) {
    score += 15;
    reasons.push("liquidity ≥ $250k");
  } else if (input.liquidityUsd >= 50_000) {
    score += 8;
    reasons.push("liquidity ≥ $50k");
  } else reasons.push("thin liquidity");
  const trend = input.volume30dUsd > 0 ? input.volume7dUsd / (input.volume30dUsd / 4.3) : 0;
  if (trend >= 1.2) {
    score += 12;
    reasons.push("volume accelerating");
  } else if (trend >= 0.9) {
    score += 6;
    reasons.push("volume stable");
  } else reasons.push("volume fading");
  if (input.holderOrUserGrowthPct >= 8) {
    score += 12;
    reasons.push("users/holders growing");
  } else if (input.holderOrUserGrowthPct >= 0) {
    score += 4;
    reasons.push("users/holders flat");
  } else reasons.push("users/holders shrinking");
  score = Math.max(0, Math.min(100, score));
  const eligible = score >= 70 && input.publicDocs && input.teamIdentifiable && input.liquidityUsd >= 50_000;
  if (eligible) reasons.unshift("eligible: healthy-growth screen passed");
  else reasons.unshift("not eligible until docs, team, and liquidity clear");
  return { score, eligible, reasons };
}

export function thesisFromInputs(id: string, input: HealthInputs, proposedUsd: number, now = new Date()): InvestmentThesis {
  const { score, eligible, reasons } = scoreProject(input);
  const stop = DEFAULT_STOP_PCT;
  const take = DEFAULT_TAKE_PCT;
  return {
    id,
    name: input.name,
    kind: input.kind,
    url: input.url,
    healthScore: score,
    eligible,
    reasons,
    parameters: input,
    proposedUsd,
    stopLossPct: stop,
    takeProfitPct: take,
    stopNote: `Stop if down ${stop}% from entry (capital preservation).`,
    takeNote: `Take profit at +${take}% from entry (lock growth, do not ride to zero).`,
    status: eligible ? "proposed" : "watching",
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
}

export function applyStops(t: InvestmentThesis, stopLossPct: number, takeProfitPct: number): InvestmentThesis {
  const stop = Math.min(80, Math.max(1, stopLossPct));
  const take = Math.min(500, Math.max(2, takeProfitPct));
  return {
    ...t,
    stopLossPct: stop,
    takeProfitPct: take,
    stopNote: `Stop if down ${stop}% from entry (your setting).`,
    takeNote: `Take profit at +${take}% from entry (your setting).`,
    updatedAt: new Date().toISOString(),
  };
}
