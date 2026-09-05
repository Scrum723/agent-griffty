import type { AdsOpsPlan, Campaign, FloorStatus, StandingOrders, WorldState } from "@griffty/domain";
import { applyFloorProtection, evaluateTreasury } from "./treasury.js";

export function planAdsOps(world: WorldState): AdsOpsPlan {
  const treasury = evaluateTreasury(world);
  const { campaigns, paused } = applyFloorProtection(
    world.campaigns,
    treasury.floor_status,
    world.policy.pauseProspectingOnFloorWatch,
  );

  const mutations: AdsOpsPlan["mutations"] = paused.map((p) => {
    const c = world.campaigns.find((x) => x.id === p.id);
    return {
      action: "pause_prospecting" as const,
      platform: c?.platform ?? "other",
      campaignId: p.id,
      reason: p.reason,
      requires_operator: false,
    };
  });

  if (treasury.floor_status === "ok") {
    for (const c of campaigns.filter((x) => x.status === "active")) {
      const roas = c.kpis.roas;
      if (roas != null && roas >= 2 && c.kind === "prospecting") {
        mutations.push({
          action: "raise_budget",
          platform: c.platform,
          campaignId: c.id,
          reason: `trailing ROAS ${roas} clears scaler; operator approval required`,
          requires_operator: true,
        });
      }
    }
  }

  return {
    floor_status: treasury.floor_status,
    campaigns,
    mutations,
    utm_plan: {
      source: "griffty",
      medium: "paid",
      campaign: `wx_${new Date().toISOString().slice(0, 10)}`,
      content: "hook_variant",
    },
  };
}

export function prospectingPausedBeforeRetargeting(
  original: Campaign[],
  next: Campaign[],
  status: FloorStatus,
): boolean {
  if (status === "ok") return true;
  const origP = original.filter((c) => c.kind === "prospecting" && c.status === "active");
  const nextP = next.filter((c) => c.kind === "prospecting" && c.status === "active");
  const origR = original.filter((c) => c.kind === "retargeting" && c.status === "active");
  const nextR = next.filter((c) => c.kind === "retargeting" && c.status === "active");
  if (origP.length === 0) return true;
  const prospectingPaused = nextP.length < origP.length || nextP.length === 0;
  const retargetingStillOn = origR.length === 0 || nextR.length === origR.length;
  return prospectingPaused && (status !== "breach" ? retargetingStillOn : true);
}

export function budgetIncreaseAllowed(
  policy: StandingOrders,
  floor: FloorStatus,
  deltaUsd: number,
): boolean {
  if (deltaUsd <= 0) return true;
  if (floor === "breach" || floor === "breach_forecast" || floor === "watch") return false;
  return true;
}
