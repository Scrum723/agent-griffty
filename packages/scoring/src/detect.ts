import {
  HARD_REJECT_CODES,
  type HardRejectCode,
  type Opportunity,
} from "@griffty/domain";

const PATTERNS: { code: HardRejectCode; re: RegExp }[] = [
  {
    code: "SEED_PHRASE_REQUEST",
    re: /\b(seed phrase|recovery phrase|secret phrase|mnemonic|12[ -]?words|24[ -]?words|write down your (seed|words))\b/i,
  },
  {
    code: "PRIVATE_KEY_REQUEST",
    re: /\b(private key|privkey|export keystore|wallet.dat)\b/i,
  },
  {
    code: "PREPAID_CLAIM",
    re: /\b(pay\s+\d+(\.\d+)?\s*(eth|btc|sol|bnb|matic|usdt|usd)|send\s+(gas|eth|bnb)|unlock.{0,24}(airdrop|payout)|prepaid gas|gas to this address|pay gas to)\b/i,
  },
  {
    code: "ACTIVATION_FEE",
    re: /\b(activation fee|unlock fee|processing fee to (claim|release)|pay.{0,12}to activate)\b/i,
  },
  {
    code: "REMOTE_ACCESS",
    re: /\b(anydesk|teamviewer|remote desktop|rustdesk|splashtop|allow remote (control|access))\b/i,
  },
  {
    code: "DARKWEB_SOURCE",
    re: /\b(\.onion\b|dark web|darknet|hidden service|tor browser listing)\b/i,
  },
  {
    code: "REVIEW_FRAUD",
    re: /\b(fake review|5[ -]?star review|write a (positive|5 star) review|review without (using|buying))\b/i,
  },
  {
    code: "FAKE_ENGAGEMENT",
    re: /\b(fake (likes|followers|views)|engagement farm|buy followers|bot (likes|comments))\b/i,
  },
  {
    code: "UNLIMITED_TOKEN_APPROVAL",
    re: /\b(unlimited (token )?approval|approve unlimited|setApprovalForAll|infinite allowance)\b/i,
  },
  {
    code: "SYBIL_FARM",
    re: /\b(sybil farm|multiple accounts? (to|for) (farm|claim)|create \d+ (wallets|accounts))\b/i,
  },
  {
    code: "GUARANTEED_RETURN",
    re: /\b(guaranteed\s+\d+\s*%|1000\s*%\+|sure thing|about to moon|guaranteed (moon|profit|return)|risk[ -]?free \d+% )\b/i,
  },
];

const SHORTENERS = new Set([
  "bit.ly",
  "tinyurl.com",
  "t.co",
  "goo.gl",
  "ow.ly",
  "is.gd",
  "cutt.ly",
]);

function haystack(opp: Pick<Opportunity, "title" | "url" | "compensationText" | "rawNotes" | "source">): string {
  return [opp.title, opp.url, opp.compensationText, opp.rawNotes, opp.source].join("\n");
}

export function detectHardRejects(
  opp: Pick<
    Opportunity,
    | "title"
    | "url"
    | "compensationText"
    | "rawNotes"
    | "source"
    | "sourceClass"
    | "officialUrlVerified"
    | "requiresDeposit"
    | "unsolicited"
    | "unofficialAggregatorOnly"
    | "campaignHostOfficial"
  >,
): HardRejectCode[] {
  const text = haystack(opp);
  const codes = new Set<HardRejectCode>();

  for (const { code, re } of PATTERNS) {
    if (re.test(text)) codes.add(code);
  }

  try {
    const u = new URL(opp.url);
    if (u.hostname.endsWith(".onion") || u.protocol === "onion:") {
      codes.add("DARKWEB_SOURCE");
    }
  } catch {
    /* invalid URL handled below */
  }

  if (opp.requiresDeposit && /\b(claim|airdrop|unlock)\b/i.test(text)) {
    codes.add("PREPAID_CLAIM");
  }

  if (opp.sourceClass === "airdrop") {
    const unofficial =
      !opp.officialUrlVerified ||
      opp.unsolicited ||
      opp.unofficialAggregatorOnly ||
      !opp.campaignHostOfficial;
    if (unofficial) codes.add("UNOFFICIAL_CLAIM_SITE");
    try {
      const host = new URL(opp.url).hostname.replace(/^www\./, "");
      if (SHORTENERS.has(host)) codes.add("UNOFFICIAL_CLAIM_SITE");
    } catch {
      codes.add("UNOFFICIAL_CLAIM_SITE");
    }
  }

  return HARD_REJECT_CODES.filter((c) => codes.has(c));
}

export function looksLikeOfficialHost(url: string, officialHosts: string[]): boolean {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
    return officialHosts.some((h) => host === h || host.endsWith(`.${h}`));
  } catch {
    return false;
  }
}
