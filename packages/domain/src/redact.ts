const SEED_LIKE =
  /\b(?:[a-z]+(?:[ -])){11,23}[a-z]+\b/gi;
const HEX_KEY = /\b(?:0x)?[0-9a-f]{64}\b/gi;
const WIF_LIKE = /\b[5KL][1-9A-HJ-NP-Za-km-z]{50,51}\b/g;

export const REDACTED_SECRET = "[REDACTED_SECRET]";

/** Strip seed-like and key-like material so it never lands in logs or Firestore. */
export function redactSecrets(text: string): string {
  return text
    .replace(SEED_LIKE, REDACTED_SECRET)
    .replace(HEX_KEY, REDACTED_SECRET)
    .replace(WIF_LIKE, REDACTED_SECRET);
}

export function containsRawSecret(text: string): boolean {
  SEED_LIKE.lastIndex = 0;
  HEX_KEY.lastIndex = 0;
  WIF_LIKE.lastIndex = 0;
  return SEED_LIKE.test(text) || HEX_KEY.test(text) || WIF_LIKE.test(text);
}
