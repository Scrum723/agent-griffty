/** Hard-reject codes force total=0 and decision=reject. */
export const HARD_REJECT_CODES = [
  "SEED_PHRASE_REQUEST",
  "PRIVATE_KEY_REQUEST",
  "PREPAID_CLAIM",
  "ACTIVATION_FEE",
  "REMOTE_ACCESS",
  "UNOFFICIAL_CLAIM_SITE",
  "DARKWEB_SOURCE",
  "REVIEW_FRAUD",
  "FAKE_ENGAGEMENT",
  "UNLIMITED_TOKEN_APPROVAL",
  "SYBIL_FARM",
  "GUARANTEED_RETURN",
] as const;

export type HardRejectCode = (typeof HARD_REJECT_CODES)[number];

export const SOFT_REASON_CODES = [
  "AIRDROP_AUTHENTICITY_VERIFIED",
  "AIRDROP_UNVERIFIED",
  "AIRDROP_HUMAN_GATE",
  "ZERO_CAPITAL_VIOLATION",
  "KYC_NEW_PLATFORM",
  "WALLET_SIGNATURE_REQUIRED",
  "TOKEN_MARK_NULL",
  "PASSIVE_BACKGROUND",
  "NOT_STRETCH_PATH",
  "HUMAN_GATE_VALUE",
  "UNSOLICITED_LISTING",
  "SHORT_LINK_ONLY",
  "POINTS_UNCASHABLE",
  "DEPOSIT_REQUIRED",
  "GAS_ON_KNOWN_CHAIN",
] as const;

export type SoftReasonCode = (typeof SOFT_REASON_CODES)[number];
export type ReasonCode = HardRejectCode | SoftReasonCode | string;

export const HARD_REJECT_SET = new Set<string>(HARD_REJECT_CODES);

export function isHardReject(codes: readonly string[]): boolean {
  return codes.some((c) => HARD_REJECT_SET.has(c));
}

export function hasHardReject(code: string): code is HardRejectCode {
  return HARD_REJECT_SET.has(code);
}
