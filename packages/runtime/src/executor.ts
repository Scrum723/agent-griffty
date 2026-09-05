import type { Opportunity, TaskRecord } from "@griffty/domain";
import { newId } from "@griffty/domain";

const FORBIDDEN = [
  "wallet signature",
  "seed import",
  "kyc upload",
  "airdrop claim contract",
  "fake profile",
  "captcha farm",
];

export function buildTask(opp: Opportunity, now = new Date()): TaskRecord {
  const iso = now.toISOString();
  const plan: TaskRecord["plan"] = [];

  if (opp.humanGate) {
    plan.push({
      step: opp.requiresWallet
        ? "Operator signs on burner wallet (treasury wallet forbidden)"
        : "Operator completes KYC or calendar confirmation",
      owner: "operator",
      status: "blocked",
    });
  }

  if (opp.sourceClass === "airdrop") {
    plan.push({
      step: "Queue verified claim. Auto-claim disabled. Burner only.",
      owner: "operator",
      status: "blocked",
    });
  } else if (opp.sourceClass === "depin" || opp.sourceClass === "weather_data") {
    plan.push({
      step: "Confirm enrolled node health via official dashboard (read-only)",
      owner: "agent",
      status: "pending",
    });
  } else {
    plan.push({
      step: "Open official listing and present action card to operator",
      owner: "agent",
      status: "pending",
    });
  }

  const blockedOn = plan.filter((p) => p.status === "blocked").map((p) => p.step);

  return {
    id: newId("task"),
    opportunityId: opp.id,
    agent: "executor",
    plan,
    automationPerformed: [],
    blockedOn,
    evidence: [],
    result: blockedOn.length ? "blocked" : "pending",
    createdAt: iso,
    updatedAt: iso,
  };
}

export function forbiddenAutomation(): string[] {
  return [...FORBIDDEN];
}
