import {
  adsWatchThreshold,
  type AdsAccount,
  type Campaign,
  type FloorStatus,
  type LedgerEntry,
  type StandingOrders,
  type TreasurySnapshot,
  type Wallet,
  type WorldState,
} from "@griffty/domain";

export function adsBalanceTotal(accounts: AdsAccount[]): number {
  return round2(accounts.reduce((s, a) => s + a.balanceUsd, 0));
}

export function harvestTodayUsd(ledger: LedgerEntry[], dayIso: string): number {
  return round2(
    ledger
      .filter(
        (e) =>
          e.settled &&
          (e.type === "harvest" || e.type === "payout") &&
          (e.settledAt ?? e.createdAt).slice(0, 10) === dayIso,
      )
      .reduce((s, e) => s + e.amountUsd, 0),
  );
}

export function projectedEodAdsUsd(
  accounts: AdsAccount[],
  campaigns: Campaign[],
  remainingHours = Math.max(1, 24 - new Date().getUTCHours()),
): number {
  const hours = Math.max(0, remainingHours);
  const activeSpendPerHour = campaigns
    .filter((c) => c.status === "active")
    .reduce((s, c) => s + c.dailyBudgetUsd / 24, 0);
  return round2(adsBalanceTotal(accounts) - activeSpendPerHour * hours);
}

export function floorStatusOf(args: {
  adsBalanceUsd: number;
  projectedEodUsd: number;
  policy: StandingOrders;
}): FloorStatus {
  const { adsBalanceUsd, projectedEodUsd, policy } = args;
  if (adsBalanceUsd < policy.adsFloorUsd) return "breach";
  if (projectedEodUsd < policy.adsFloorUsd) return "breach_forecast";
  if (adsBalanceUsd < adsWatchThreshold(policy)) return "watch";
  return "ok";
}

export function evaluateTreasury(
  world: WorldState,
  now = new Date(),
  remainingHours?: number,
): TreasurySnapshot {
  const policy = world.policy;
  const adsBalanceUsd = adsBalanceTotal(world.adsAccounts);
  const projected = projectedEodAdsUsd(
    world.adsAccounts,
    world.campaigns,
    remainingHours ?? Math.max(1, 24 - now.getUTCHours()),
  );
  const floor_status = floorStatusOf({
    adsBalanceUsd,
    projectedEodUsd: projected,
    policy,
  });
  const day = now.toISOString().slice(0, 10);
  const harvest = harvestTodayUsd(world.ledger, day);
  const variance = round2(harvest - policy.stretchTargetUsd);

  const actions: TreasurySnapshot["actions"] = [];
  const gapToBuffer = round2(adsWatchThreshold(policy) - adsBalanceUsd);

  if (gapToBuffer > 0 && world.cashUsd > 0) {
    const amount = round2(Math.min(world.cashUsd, Math.max(gapToBuffer, 0)));
    actions.push({
      type: "top_up_ads",
      amount_usd: amount,
      destination: "ads_prepaid",
      requires_operator: amount >= policy.humanGateUsd,
    });
  } else if (floor_status === "ok" && world.cashUsd > 0) {
    actions.push({
      type: "hold",
      amount_usd: world.cashUsd,
      destination: "operating_cash",
      requires_operator: false,
    });
  }

  if (floor_status === "breach" || floor_status === "breach_forecast") {
    actions.push({
      type: "alert_operator",
      amount_usd: adsBalanceUsd,
      destination: "ads_floor",
      requires_operator: true,
    });
  }

  const crypto: TreasurySnapshot["crypto"] = [];
  for (const w of world.wallets) {
    for (const a of w.assets) {
      crypto.push({
        asset: a.symbol,
        amount: a.amount,
        wallet_role: w.role,
        usd_mark: a.usdMark,
      });
    }
  }

  return {
    cash_usd: world.cashUsd,
    ads: world.adsAccounts.map((a) => ({ platform: a.platform, balance_usd: a.balanceUsd })),
    ads_floor_usd: policy.adsFloorUsd,
    floor_status,
    crypto,
    actions,
    daily: {
      harvest_usd: harvest,
      stretch_target_usd: policy.stretchTargetUsd,
      variance_usd: variance,
    },
    projected_eod_ads_usd: projected,
  };
}

export function pauseOrder(campaigns: Campaign[]): Campaign[] {
  const prospecting = campaigns.filter((c) => c.kind === "prospecting" && c.status === "active");
  const branded = campaigns.filter((c) => c.kind === "branded" && c.status === "active");
  const retargeting = campaigns.filter((c) => c.kind === "retargeting" && c.status === "active");
  return [...prospecting, ...branded, ...retargeting];
}

export function applyFloorProtection(
  campaigns: Campaign[],
  status: FloorStatus,
  pauseProspectingOnWatch: boolean,
): { campaigns: Campaign[]; paused: { id: string; reason: string }[] } {
  const paused: { id: string; reason: string }[] = [];
  const shouldPauseProspecting =
    status === "breach" ||
    status === "breach_forecast" ||
    (status === "watch" && pauseProspectingOnWatch);
  const shouldPauseBranded = status === "breach";
  const next = campaigns.map((c) => {
    if (c.status !== "active") return c;
    if (shouldPauseProspecting && c.kind === "prospecting") {
      paused.push({ id: c.id, reason: `floor_${status}_pause_prospecting` });
      return { ...c, status: "paused" as const };
    }
    if (shouldPauseBranded && c.kind === "branded") {
      paused.push({ id: c.id, reason: `floor_${status}_pause_branded` });
      return { ...c, status: "paused" as const };
    }
    return c;
  });
  return { campaigns: next, paused };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function assertWatchOnlyWallets(wallets: Wallet[]): void {
  for (const w of wallets) {
    const rec = w as unknown as Record<string, unknown>;
    for (const banned of ["privateKey", "seed", "mnemonic", "secret"]) {
      if (rec[banned]) throw new Error("Wallet record contains forbidden private material.");
    }
  }
}
