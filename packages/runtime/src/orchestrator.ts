import {
  assertEventProps,
  containsRawSecret,
  cycleId as makeCycleId,
  newId,
  redactSecrets,
  todayStamp,
  type CycleResult,
  type GrifftyEvent,
  type Opportunity,
  type OrchestratorPlan,
  type QualifierResult,
  type RiskVerdict,
  type WorldState,
} from "@griffty/domain";
import { liveScout, mockScoutListings } from "@griffty/connectors";
import { scoreOpportunity } from "@griffty/scoring";
import { planAdsOps } from "./ads-ops.js";
import { buildTask } from "./executor.js";
import { evaluateKillSwitch } from "./kill-switch.js";
import { dedupe, toOpportunity } from "./normalize.js";
import { reviewOpportunity, detectDrainerBait } from "./risk.js";
import { draftCreatives } from "./creative.js";
import { queueSignIntent } from "./sign.js";
import { adsBalanceTotal, applyFloorProtection, evaluateTreasury } from "./treasury.js";
import { PROMPT_VERSION } from "@griffty/prompts";

function emit(
  world: WorldState,
  name: GrifftyEvent["name"],
  props: Record<string, unknown>,
  cycleId: string,
): void {
  const merged = { ...props };
  if (!("cycleId" in merged)) merged.cycleId = cycleId;
  assertEventProps(name, merged);
  const serialized = JSON.stringify(merged);
  if (containsRawSecret(serialized)) {
    throw new Error(`Refusing to persist event ${name}: raw secret material detected`);
  }
  world.events.push({
    id: newId("evt"),
    name,
    ts: new Date().toISOString(),
    uid: world.operator.uid,
    cycleId,
    props: JSON.parse(redactSecrets(serialized)) as Record<string, unknown>,
  });
}

export async function runCycle(world: WorldState): Promise<CycleResult> {
  const cycleId = makeCycleId();
  world.signIntents ??= [];
  world.cycleId = cycleId;
  world.updatedAt = new Date().toISOString();
  emit(world, "cycle.started", { cycleId }, cycleId);

  const scoutInputs = [...mockScoutListings(), ...(await liveScout())];
  const incoming = scoutInputs.map((s) => toOpportunity(s, cycleId));
  const fresh = dedupe(world.opportunities, incoming);

  for (const opp of fresh) {
    emit(
      world,
      "opportunity.discovered",
      { opportunityId: opp.id, source: opp.source, sourceClass: opp.sourceClass },
      cycleId,
    );
  }

  const qualifierResults: QualifierResult[] = [];
  const riskVerdicts: RiskVerdict[] = [];

  for (const opp of fresh) {
    const scored = scoreOpportunity(opp, world.policy);
    qualifierResults.push(scored);
    Object.assign(opp, {
      scores: scored.scores,
      total: scored.total,
      decision: scored.decision,
      reasonCodes: scored.reason_codes,
      expectedNetUsd: scored.expected_net_usd,
      expectedUsdPerHour: scored.expected_usd_per_hour,
      humanGate: scored.human_gate,
      notes: scored.notes,
      status:
        scored.decision === "reject"
          ? "rejected"
          : scored.decision === "execute"
            ? "queued"
            : scored.decision === "queue"
              ? "queued"
              : "watching",
      updatedAt: new Date().toISOString(),
    } satisfies Partial<Opportunity>);

    emit(
      world,
      "opportunity.scored",
      {
        opportunityId: opp.id,
        total: scored.total,
        decision: scored.decision,
        expectedNetUsd: scored.expected_net_usd,
      },
      cycleId,
    );

    if (scored.decision === "reject") {
      emit(
        world,
        "opportunity.rejected",
        { opportunityId: opp.id, reasonCodes: scored.reason_codes },
        cycleId,
      );
    }
    if (scored.decision === "queue" || scored.decision === "execute") {
      emit(world, "opportunity.queued", { opportunityId: opp.id }, cycleId);
    }

    const verdict = reviewOpportunity(opp, world.policy);
    riskVerdicts.push(verdict);
    if (verdict.verdict === "deny") {
      emit(
        world,
        "risk.denied",
        { subjectId: opp.id, codes: scored.reason_codes },
        cycleId,
      );
      opp.status = "rejected";
      opp.decision = "reject";
    }

    if (
      verdict.verdict !== "deny" &&
      (scored.decision === "execute" || scored.decision === "queue") &&
      !world.killSwitch.pauseNewSignups
    ) {
      const task = buildTask(opp);
      world.tasks.push(task);
      emit(
        world,
        "task.started",
        { taskId: task.id, opportunityId: opp.id },
        cycleId,
      );
      if (task.blockedOn.length) {
        emit(
          world,
          "task.blocked",
          { taskId: task.id, blockedOn: task.blockedOn },
          cycleId,
        );
        emit(
          world,
          "operator.approval_requested",
          {
            gateType: opp.requiresWallet ? "wallet_signature" : "kyc_or_value",
            subjectId: opp.id,
          },
          cycleId,
        );
        if (opp.requiresWallet && world.policy.allowWalletConnectSign) {
          const intent = queueSignIntent(world, {
            kind: opp.sourceClass === "airdrop" ? "claim" : "memo_ack",
            title: opp.title,
            summary:
              "Prefilled Phantom transaction. You must tap Approve. Griffty cannot sign while you sleep.",
            walletRole: "session",
            opportunityId: opp.id,
            taskId: task.id,
          });
          emit(
            world,
            "sign.requested",
            { intentId: intent.id, walletRole: intent.walletRole },
            cycleId,
          );
        }
        opp.status = "blocked";
      }
    }

    world.opportunities.push(opp);
  }

  for (const bait of detectDrainerBait(world.wallets, new Set(["ETH", "USDC", "USDT"]))) {
    emit(world, "risk.drainer_bait", { walletId: bait.walletId, asset: bait.asset }, cycleId);
    world.alerts.push({
      id: newId("alrt"),
      severity: "critical",
      code: "DRAINER_BAIT",
      message: `Unsolicited token ${bait.asset} on ${bait.walletId}`,
      subjectId: bait.walletId,
      acked: false,
      createdAt: new Date().toISOString(),
    });
  }

  const treasury = evaluateTreasury(world);
  const adsBalanceUsd = adsBalanceTotal(world.adsAccounts);
  for (const a of world.adsAccounts) {
    a.status = treasury.floor_status;
    a.lastPolledAt = new Date().toISOString();
  }

  if (treasury.floor_status === "ok") {
    emit(world, "treasury.floor_ok", { adsBalanceUsd }, cycleId);
  } else if (treasury.floor_status === "watch") {
    emit(
      world,
      "treasury.floor_watch",
      { adsBalanceUsd, bufferUsd: world.policy.adsBufferUsd },
      cycleId,
    );
  } else if (treasury.floor_status === "breach_forecast") {
    emit(
      world,
      "treasury.floor_breach_forecast",
      { adsBalanceUsd, projectedEodUsd: treasury.projected_eod_ads_usd },
      cycleId,
    );
  } else {
    emit(world, "treasury.floor_breach", { adsBalanceUsd }, cycleId);
  }

  for (const action of treasury.actions) {
    if (action.type === "top_up_ads" || action.type === "propose_stake" || action.type === "propose_convert") {
      emit(
        world,
        "treasury.allocation_proposed",
        { type: action.type, amountUsd: action.amount_usd, destination: action.destination },
        cycleId,
      );
    }
  }

  const ads = planAdsOps(world);
  const protectedCampaigns = applyFloorProtection(
    world.campaigns,
    treasury.floor_status,
    world.policy.pauseProspectingOnFloorWatch,
  );
  world.campaigns = protectedCampaigns.campaigns;
  ads.campaigns = world.campaigns;
  for (const p of protectedCampaigns.paused) {
    emit(world, "ads.campaign_paused", { campaignId: p.id, reason: p.reason }, cycleId);
  }
  for (const m of ads.mutations.filter((x) => x.action === "raise_budget")) {
    emit(
      world,
      "ads.budget_change_proposed",
      { campaignId: m.campaignId ?? "unknown", deltaUsd: 1 },
      cycleId,
    );
  }

  const harvest = treasury.daily.harvest_usd;
  const variance = treasury.daily.variance_usd;
  if (harvest >= world.policy.stretchTargetUsd) {
    emit(world, "kpi.stretch_hit", { harvestUsd: harvest }, cycleId);
  } else {
    emit(world, "kpi.stretch_variance", { harvestUsd: harvest, varianceUsd: variance }, cycleId);
  }

  const today = todayStamp();
  const existingKpi = world.kpiDaily.find((k) => k.date === today);
  const kpiRow = {
    date: today,
    harvestUsd: harvest,
    stretchTargetUsd: world.policy.stretchTargetUsd,
    varianceUsd: variance,
    adsBalanceUsd,
    floorStatus: treasury.floor_status,
    opportunitiesSeen: world.opportunities.length,
    rejected: world.opportunities.filter((o) => o.decision === "reject").length,
    executed: world.opportunities.filter((o) => o.decision === "execute").length,
    status: harvest >= world.policy.stretchTargetUsd ? ("hit" as const) : ("miss" as const),
  };
  if (existingKpi) Object.assign(existingKpi, kpiRow);
  else world.kpiDaily.push(kpiRow);

  world.creatives = draftCreatives(world);
  world.killSwitch = evaluateKillSwitch(world);

  const dispatch: OrchestratorPlan["dispatch"] = [
    { agent: "scout", priority: 80, objective: "Ingest allow-listed sources", payload: { count: fresh.length } },
    { agent: "qualifier", priority: 90, objective: "Score new opportunities", payload: { count: qualifierResults.length } },
    { agent: "risk", priority: 95, objective: "Hard-reject filter", payload: { denied: riskVerdicts.filter((v) => v.verdict === "deny").length } },
    { agent: "executor", priority: 70, objective: "Queue safe work", payload: {} },
    { agent: "treasury", priority: 100, objective: "Enforce ads floor", payload: { floor_status: treasury.floor_status } },
    { agent: "ads_ops", priority: 85, objective: "Pause prospecting if floor threatened", payload: {} },
  ];

  const plan: OrchestratorPlan = {
    cycle_id: cycleId,
    summary: `Scouted ${fresh.length}; floor ${treasury.floor_status}; harvest ${harvest} vs stretch ${world.policy.stretchTargetUsd} (prompts ${PROMPT_VERSION})`,
    dispatch,
    holds: world.killSwitch.reasons,
    operator_asks: world.tasks.filter((t) => t.blockedOn.length).map((t) => t.blockedOn[0] ?? t.id),
    kpi: {
      stretch_target_usd: world.policy.stretchTargetUsd,
      harvest_today_usd: harvest,
      variance_usd: variance,
      ads_floor_usd: world.policy.adsFloorUsd,
      ads_balance_usd: adsBalanceUsd,
      floor_status: treasury.floor_status,
    },
  };

  emit(world, "cycle.completed", { cycleId, dispatchCount: dispatch.length }, cycleId);

  return { plan, world, qualifierResults, riskVerdicts, treasury, ads };
}

export function taxLotExport(world: WorldState): string {
  const header = "lot_id,date,type,platform,asset,amount_usd,settled";
  const rows = world.ledger.map((e) =>
    [e.taxLotId ?? e.id, (e.settledAt ?? e.createdAt).slice(0, 10), e.type, e.platform, e.asset, e.amountUsd, e.settled].join(","),
  );
  return [header, ...rows].join("\n");
}

export function form1099Ready(world: WorldState): string {
  const byPlatform = new Map<string, number>();
  for (const e of world.ledger.filter((x) => x.settled && (x.type === "harvest" || x.type === "payout"))) {
    byPlatform.set(e.platform, (byPlatform.get(e.platform) ?? 0) + e.amountUsd);
  }
  const header = "payer,amount_usd,form_hint";
  const rows = [...byPlatform.entries()].map(([payer, amount]) =>
    `${payer},${amount.toFixed(2)},${amount >= 600 ? "1099-NEC_likely" : "below_1099_threshold"}`,
  );
  return [header, ...rows].join("\n");
}
