import {
  isHardReject,
  type Opportunity,
  type RiskVerdict,
  type StandingOrders,
  type Wallet,
} from "@griffty/domain";
import { detectHardRejects, scoreOpportunity } from "@griffty/scoring";

export function reviewOpportunity(opp: Opportunity, policy: StandingOrders): RiskVerdict {
  const scored = scoreOpportunity(opp, policy);
  const findings: RiskVerdict["findings"] = [];

  for (const code of scored.reason_codes) {
    const severity = isHardReject([code])
      ? "critical"
      : code === "AIRDROP_AUTHENTICITY_VERIFIED"
        ? "medium"
        : "low";
    findings.push({
      code,
      detail: code.replaceAll("_", " ").toLowerCase(),
      severity,
    });
  }

  if (policy.darkWebEnabled) {
    findings.push({
      code: "DARKWEB_SOURCE",
      detail: "darkWebEnabled attempted",
      severity: "critical",
    });
  }

  const hard = isHardReject(scored.reason_codes);
  if (hard) {
    return {
      subject_id: opp.id,
      risk_level: "critical",
      findings,
      verdict: "deny",
      operator_message: `Denied: ${scored.reason_codes.filter((c) => isHardReject([c])).join(", ")}`,
    };
  }

  if (scored.reason_codes.includes("AIRDROP_AUTHENTICITY_VERIFIED")) {
    return {
      subject_id: opp.id,
      risk_level: "medium",
      findings,
      verdict: "allow_with_gate",
      operator_message:
        "Airdrop authenticity verified against official domain / verified campaign host. Claim is burner-wallet only, human-signed, never auto-claimed, never on the treasury wallet.",
    };
  }

  if (scored.human_gate) {
    return {
      subject_id: opp.id,
      risk_level: "medium",
      findings,
      verdict: "allow_with_gate",
      operator_message: "Human gate required (KYC, signature, or value threshold).",
    };
  }

  return {
    subject_id: opp.id,
    risk_level: findings.length ? "low" : "low",
    findings,
    verdict: "allow",
    operator_message: "Clear of hard-reject codes.",
  };
}

export function detectDrainerBait(
  wallets: Wallet[],
  requestedAssets: Set<string>,
): { walletId: string; asset: string }[] {
  const bait: { walletId: string; asset: string }[] = [];
  for (const w of wallets) {
    for (const a of w.assets) {
      if (!requestedAssets.has(a.symbol) && a.usdMark === null) {
        bait.push({ walletId: w.id, asset: a.symbol });
      }
    }
  }
  return bait;
}

export function preflightText(opp: Opportunity): string[] {
  return detectHardRejects(opp);
}
