import type { KillSwitchState, WorldState } from "@griffty/domain";

export function evaluateKillSwitch(world: WorldState): KillSwitchState {
  const reasons: string[] = [];
  const recent = world.events.slice(-50);
  const denied = recent.filter((e) => e.name === "risk.denied").length;
  const drainers = recent.filter((e) => e.name === "risk.drainer_bait").length;
  const payoutFails = world.alerts.filter((a) => a.code === "PAYOUT_FAILURE" && !a.acked).length;

  if (denied >= 3) reasons.push("scam_score_spike");
  if (drainers >= 1) reasons.push("wallet_allowance_anomaly");
  if (payoutFails >= 3) reasons.push("payout_failure_cluster");
  if (world.adsAccounts.some((a) => a.status === "breach")) reasons.push("ads_floor_breach");

  const active = reasons.length > 0;
  return {
    active,
    reasons,
    pauseNewSignups: active,
    pauseColdAdSpend: active || world.adsAccounts.some((a) => a.status !== "ok"),
  };
}
