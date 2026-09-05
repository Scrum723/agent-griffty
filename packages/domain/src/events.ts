import type { EventName } from "./types.js";

export const EVENT_NAMES: EventName[] = [
  "cycle.started",
  "cycle.completed",
  "opportunity.discovered",
  "opportunity.scored",
  "opportunity.rejected",
  "opportunity.queued",
  "task.started",
  "task.blocked",
  "task.completed",
  "payout.recorded",
  "treasury.floor_ok",
  "treasury.floor_watch",
  "treasury.floor_breach_forecast",
  "treasury.floor_breach",
  "treasury.allocation_proposed",
  "ads.campaign_paused",
  "ads.budget_change_proposed",
  "ads.spend_recorded",
  "risk.denied",
  "risk.drainer_bait",
  "kpi.stretch_hit",
  "kpi.stretch_variance",
  "operator.approval_requested",
  "operator.approval_granted",
  "sign.requested",
  "sign.completed",
  "sign.rejected",
];

export const EVENT_REQUIRED_PROPS: Record<EventName, string[]> = {
  "cycle.started": ["cycleId"],
  "cycle.completed": ["cycleId", "dispatchCount"],
  "opportunity.discovered": ["opportunityId", "source", "sourceClass"],
  "opportunity.scored": ["opportunityId", "total", "decision", "expectedNetUsd"],
  "opportunity.rejected": ["opportunityId", "reasonCodes"],
  "opportunity.queued": ["opportunityId"],
  "task.started": ["taskId", "opportunityId"],
  "task.blocked": ["taskId", "blockedOn"],
  "task.completed": ["taskId", "result"],
  "payout.recorded": ["entryId", "amountUsd", "platform"],
  "treasury.floor_ok": ["adsBalanceUsd"],
  "treasury.floor_watch": ["adsBalanceUsd", "bufferUsd"],
  "treasury.floor_breach_forecast": ["adsBalanceUsd", "projectedEodUsd"],
  "treasury.floor_breach": ["adsBalanceUsd"],
  "treasury.allocation_proposed": ["type", "amountUsd", "destination"],
  "ads.campaign_paused": ["campaignId", "reason"],
  "ads.budget_change_proposed": ["campaignId", "deltaUsd"],
  "ads.spend_recorded": ["platform", "amountUsd", "roas"],
  "risk.denied": ["subjectId", "codes"],
  "risk.drainer_bait": ["walletId", "asset"],
  "kpi.stretch_hit": ["harvestUsd"],
  "kpi.stretch_variance": ["harvestUsd", "varianceUsd"],
  "operator.approval_requested": ["gateType", "subjectId"],
  "operator.approval_granted": ["gateType", "subjectId"],
  "sign.requested": ["intentId", "walletRole"],
  "sign.completed": ["intentId", "signature"],
  "sign.rejected": ["intentId"],
};

export function assertEventProps(name: EventName, props: Record<string, unknown>): void {
  const required = EVENT_REQUIRED_PROPS[name];
  for (const key of required) {
    if (props[key] === undefined) {
      throw new Error(`Event ${name} missing required prop ${key}`);
    }
  }
}
