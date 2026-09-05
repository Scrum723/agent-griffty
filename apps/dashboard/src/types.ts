export type FloorStatus = "ok" | "watch" | "breach_forecast" | "breach";
export type Decision = "execute" | "queue" | "watch" | "reject";

export interface WorldState {
  operator: { uid: string; displayName: string; geo: string; availableMinutesToday: number };
  policy: {
    adsFloorUsd: number;
    adsBufferUsd: number;
    stretchTargetUsd: number;
    allowVerifiedAirdrops: boolean;
    allowAirdropAutoClaim: boolean;
    allowWalletConnectSign?: boolean;
    allowUnattendedSign?: boolean;
    darkWebEnabled: boolean;
  };
  cashUsd: number;
  adsAccounts: { platform: string; balanceUsd: number; status: FloorStatus }[];
  wallets: {
    id: string;
    role: string;
    address: string;
    watchOnly: boolean;
    assets: { symbol: string; amount: number; usdMark: number | null }[];
  }[];
  opportunities: {
    id: string;
    title: string;
    source: string;
    sourceClass: string;
    total?: number;
    decision?: Decision;
    expectedNetUsd?: number | null;
    timeEstimateMinutes: number | null;
    status: string;
    reasonCodes: string[];
    humanGate?: boolean;
  }[];
  tasks: {
    id: string;
    opportunityId: string;
    result: string;
    blockedOn: string[];
  }[];
  ledger: {
    id: string;
    type: string;
    amountUsd: number;
    platform: string;
    asset?: string;
    settled: boolean;
    createdAt: string;
  }[];
  campaigns: {
    id: string;
    platform: string;
    name: string;
    kind: string;
    dailyBudgetUsd: number;
    status: string;
    kpis: { roas: number | null; cpa_usd: number | null };
  }[];
  alerts: { id: string; severity: string; code: string; message: string; acked: boolean }[];
  events: { id: string; name: string; ts: string; props: Record<string, unknown> }[];
  platforms: {
    id: string;
    name: string;
    tier: string;
    enrolled: boolean;
    kycStatus: string;
    lastPayoutAt: string | null;
    residualValueUsd: number;
  }[];
  kpiDaily: {
    date: string;
    harvestUsd: number;
    stretchTargetUsd: number;
    varianceUsd: number;
    adsBalanceUsd: number;
    floorStatus: FloorStatus;
    status: "hit" | "miss";
    opportunitiesSeen: number;
    rejected: number;
  }[];
  signIntents?: {
    id: string;
    title: string;
    status: string;
    walletRole: string;
    summary: string;
  }[];
  socialPosts?: {
    id: string;
    platform: string;
    status: "draft" | "scheduled" | "published" | "rejected";
    content: string;
    altText: string;
    captions: string;
    scheduledAt?: string;
  }[];
  ipVault?: {
    lastAuditAt: string | null;
    tracks: {
      id: string;
      title: string;
      isrc: string | null;
      proWorkNumber: string | null;
      contentIdRegistered: boolean;
      platforms: string[];
    }[];
  };
  killSwitch: { active: boolean; reasons: string[] };
  cycleId: string;
  updatedAt: string;
}
