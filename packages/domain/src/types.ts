import type { ReasonCode } from "./reason-codes.js";
import type { StandingOrders } from "./policy.js";

export type SourceClass =
  | "research"
  | "gpt"
  | "usability"
  | "depin"
  | "weather_data"
  | "learn_earn"
  | "airdrop"
  | "owned_media"
  | "owned_media_monetize"
  | "panel_research"
  | "depin_node"
  | "affiliate"
  | "music_rights"
  | "social_post"
  | "grant_funding"
  | "other";

export type CompensationAsset = "USD" | "PAYPAL" | "GIFT" | "TOKEN" | "POINTS" | "STRIPE" | "ACH" | "ROYALTY" | "OTHER";
export type Decision = "execute" | "queue" | "watch" | "reject";
export type OpportunityStatus =
  | "discovered"
  | "scored"
  | "queued"
  | "watching"
  | "executing"
  | "blocked"
  | "completed"
  | "rejected"
  | "abandoned";

export type FloorStatus = "ok" | "watch" | "breach_forecast" | "breach";
export type WalletRole = "treasury" | "burner" | "session";
export type AgentName =
  | "orchestrator"
  | "scout"
  | "qualifier"
  | "executor"
  | "treasury"
  | "ads_ops"
  | "risk"
  | "creative"
  | "social"
  | "grant";

export type AdsPlatform = "google" | "meta" | "tiktok" | "x" | "shopify" | "other";
export type CampaignKind = "prospecting" | "retargeting" | "branded";

export interface Opportunity {
  id: string;
  externalId: string;
  source: string;
  sourceClass: SourceClass;
  title: string;
  url: string;
  officialUrlVerified: boolean;
  compensationText: string;
  compensationEstimateUsd: number | null;
  compensationAsset: CompensationAsset;
  timeEstimateMinutes: number | null;
  incrementalMinutes: number | null;
  deadlineAt: string | null;
  kycRequired: boolean;
  kycAlreadyComplete: boolean;
  geoEligibility: string[];
  requiresWallet: boolean;
  requiresDeposit: boolean;
  rawNotes: string;
  confidence: number;
  pPayout?: number;
  feesUsd?: number;
  banCostUsd?: number;
  tokenMarkUsd: number | null;
  enrolledPlatform: boolean;
  establishedPayoutHistory: boolean;
  unofficialAggregatorOnly: boolean;
  documentedRate: boolean;
  unsolicited: boolean;
  campaignHostOfficial: boolean;
  scores?: DimensionScores;
  total?: number;
  decision?: Decision;
  reasonCodes: ReasonCode[];
  expectedNetUsd?: number | null;
  expectedUsdPerHour?: number | null;
  humanGate?: boolean;
  status: OpportunityStatus;
  cycleId: string;
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

export interface DimensionScores {
  expected_net_value: number;
  time_efficiency: number;
  payout_reliability: number;
  risk_inverse: number;
  capital_intensity: number;
  strategic_fit: number;
}

export interface QualifierResult {
  opportunity_id: string;
  scores: DimensionScores;
  total: number;
  expected_net_usd: number | null;
  expected_usd_per_hour: number | null;
  decision: Decision;
  reason_codes: ReasonCode[];
  human_gate: boolean;
  notes: string;
}

export interface ScoutOpportunityInput {
  external_id: string;
  source: string;
  source_class: SourceClass;
  title: string;
  url: string;
  official_url_verified: boolean;
  compensation_text: string;
  compensation_estimate_usd: number | null;
  compensation_asset: CompensationAsset;
  time_estimate_minutes: number | null;
  incremental_minutes?: number | null;
  deadline_at: string | null;
  kyc_required: boolean;
  geo_eligibility: string[];
  requires_wallet: boolean;
  requires_deposit: boolean;
  raw_notes: string;
  confidence: number;
  kyc_already_complete?: boolean;
  p_payout?: number;
  fees_usd?: number;
  ban_cost_usd?: number;
  token_mark_usd?: number | null;
  enrolled_platform?: boolean;
  established_payout_history?: boolean;
  unofficial_aggregator_only?: boolean;
  documented_rate?: boolean;
  unsolicited?: boolean;
  campaign_host_official?: boolean;
}

export interface TaskPlanStep {
  step: string;
  owner: "agent" | "operator";
  status: "pending" | "blocked" | "done";
}

export interface TaskRecord {
  id: string;
  opportunityId: string;
  agent: AgentName;
  plan: TaskPlanStep[];
  automationPerformed: string[];
  blockedOn: string[];
  evidence: { type: "confirmation_id" | "url" | "note"; value: string }[];
  result: "completed" | "partial" | "blocked" | "abandoned" | "pending";
  createdAt: string;
  updatedAt: string;
}

export interface LedgerEntry {
  id: string;
  type:
    | "harvest"
    | "payout"
    | "ads_topup"
    | "ads_spend"
    | "fee"
    | "adjustment"
    | "crypto_in"
    | "crypto_out";
  amountUsd: number;
  asset: string;
  platform: string;
  opportunityId?: string;
  adsPlatform?: AdsPlatform;
  settled: boolean;
  settledAt: string | null;
  createdAt: string;
  taxLotId?: string;
}

export interface AdsAccount {
  platform: AdsPlatform;
  balanceUsd: number;
  floorUsd: number;
  bufferUsd: number;
  status: FloorStatus;
  lastPolledAt: string;
}

export interface WalletAsset {
  symbol: string;
  amount: number;
  usdMark: number | null;
}

export interface Wallet {
  id: string;
  role: WalletRole;
  address: string;
  chain: string;
  watchOnly: boolean;
  assets: WalletAsset[];
  lastPolledAt: string;
}

export type SignIntentKind = "memo_ack" | "claim" | "convert" | "stake" | "transfer";
export type SignIntentStatus = "pending" | "prepared" | "signed" | "rejected" | "expired";

/** Unsigned action Griffty wants the operator to approve in Phantom. Never includes keys. */
export interface SignIntent {
  id: string;
  kind: SignIntentKind;
  status: SignIntentStatus;
  walletRole: WalletRole;
  walletId: string;
  title: string;
  summary: string;
  opportunityId?: string;
  taskId?: string;
  cluster: "mainnet-beta" | "devnet";
  requiresOperatorTap: boolean;
  unattendedForbidden: boolean;
  signature?: string;
  preparedAt?: string;
  signedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Campaign {
  id: string;
  platform: AdsPlatform;
  name: string;
  objective: "awareness" | "traffic" | "engagement" | "leads" | "sales";
  kind: CampaignKind;
  dailyBudgetUsd: number;
  status: "active" | "paused" | "proposed";
  utm: { source: string; medium: string; campaign: string; content: string };
  kpis: { roas: number | null; cpa_usd: number | null; cpm: number | null; ctr: number | null };
  creativeIds: string[];
}

export interface Creative {
  id: string;
  platform: AdsPlatform | "youtube";
  format: "9:16" | "1:1" | "4:5" | "16:9";
  hook: string;
  body: string;
  cta: string;
  hypothesis: string;
  status: "draft" | "testing" | "winner" | "killed";
  metrics: Record<string, number>;
}

export interface Alert {
  id: string;
  severity: "info" | "warning" | "critical";
  code: string;
  message: string;
  subjectId: string;
  acked: boolean;
  createdAt: string;
}

export interface GrifftyEvent {
  id: string;
  name: EventName;
  ts: string;
  uid: string;
  cycleId: string;
  props: Record<string, unknown>;
}

export type EventName =
  | "cycle.started"
  | "cycle.completed"
  | "opportunity.discovered"
  | "opportunity.scored"
  | "opportunity.rejected"
  | "opportunity.queued"
  | "task.started"
  | "task.blocked"
  | "task.completed"
  | "payout.recorded"
  | "treasury.floor_ok"
  | "treasury.floor_watch"
  | "treasury.floor_breach_forecast"
  | "treasury.floor_breach"
  | "treasury.allocation_proposed"
  | "ads.campaign_paused"
  | "ads.budget_change_proposed"
  | "ads.spend_recorded"
  | "risk.denied"
  | "risk.drainer_bait"
  | "kpi.stretch_hit"
  | "kpi.stretch_variance"
  | "operator.approval_requested"
  | "operator.approval_granted"
  | "sign.requested"
  | "sign.completed"
  | "sign.rejected"
  | "social.follow_accepted"
  | "social.bio_updated"
  | "social.fundraiser_drafted"
  | "wallet.benchmark_loss"
  | "wallet.benchmark_profit"
  | "wallet.autonomous_signed";

export interface BenchmarkState {
  baselineUsd: number;
  lastReportedLossPct: number;
  lastReportedProfitPct: number;
  history: {
    ts: string;
    type: "loss_warning" | "profit_harvest";
    percentage: number;
    equityUsd: number;
    deltaUsd: number;
    message: string;
  }[];
}

export interface KpiDaily {
  date: string;
  harvestUsd: number;
  stretchTargetUsd: number;
  varianceUsd: number;
  adsBalanceUsd: number;
  floorStatus: FloorStatus;
  opportunitiesSeen: number;
  rejected: number;
  executed: number;
  status: "hit" | "miss";
}

export interface PlatformRecord {
  id: string;
  name: string;
  tier: "A" | "B" | "C" | "D" | "E" | "F" | "G";
  enrolled: boolean;
  officialBaseUrl: string;
  kycStatus: "none" | "pending" | "complete";
  lastPayoutAt: string | null;
  residualValueUsd: number;
}

export interface OperatorProfile {
  uid: string;
  displayName: string;
  tz: string;
  geo: string;
  availableMinutesToday: number;
  riskTolerance: "low" | "medium" | "high";
  phone?: string;
  email?: string;
  createdAt: string;
}

export interface SocialPostRecord {
  id: string;
  platform: string;
  status: "draft" | "scheduled" | "published" | "rejected";
  content: string;
  mediaUrls: string[];
  altText: string;
  captions: string;
  scheduledAt?: string;
  publishedAt?: string;
}

export interface NotificationRecord {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

export interface TrackRecord {
  id: string;
  title: string;
  isrc: string | null;
  distributor: 'distrokid';
  releaseDate: string | null;
  proWorkNumber: string | null;
  proName: 'BMI' | 'ASCAP' | 'SESAC' | null;
  platforms: string[];
  contentIdRegistered: boolean;
  claimHistory: { date: string; platform: string; claimant: string; status: 'disputed' | 'won' | 'lost' | 'pending' }[];
  createdAt: string;
  updatedAt: string;
}

export interface IpVault {
  tracks: TrackRecord[];
  lastAuditAt: string | null;
}

export interface WorldState {
  operator: OperatorProfile;
  policy: StandingOrders;
  cashUsd: number;
  adsAccounts: AdsAccount[];
  wallets: Wallet[];
  opportunities: Opportunity[];
  tasks: TaskRecord[];
  ledger: LedgerEntry[];
  campaigns: Campaign[];
  creatives: Creative[];
  alerts: Alert[];
  events: GrifftyEvent[];
  platforms: PlatformRecord[];
  kpiDaily: KpiDaily[];
  signIntents: SignIntent[];
  socialPosts: SocialPostRecord[];
  notifications: NotificationRecord[];
  killSwitch: KillSwitchState;
  ipVault: IpVault;
  benchmarkState?: BenchmarkState;
  cycleId: string;
  updatedAt: string;
}

export interface KillSwitchState {
  active: boolean;
  reasons: string[];
  pauseNewSignups: boolean;
  pauseColdAdSpend: boolean;
}

export interface RiskVerdict {
  subject_id: string;
  risk_level: "low" | "medium" | "high" | "critical";
  findings: { code: string; detail: string; severity: "low" | "medium" | "high" | "critical" }[];
  verdict: "allow" | "allow_with_gate" | "deny";
  operator_message: string;
}

export interface TreasurySnapshot {
  cash_usd: number;
  ads: { platform: AdsPlatform; balance_usd: number }[];
  ads_floor_usd: number;
  floor_status: FloorStatus;
  crypto: {
    asset: string;
    amount: number;
    wallet_role: WalletRole;
    usd_mark: number | null;
  }[];
  actions: {
    type:
      | "top_up_ads"
      | "hold"
      | "sweep_fiat"
      | "propose_stake"
      | "propose_convert"
      | "alert_operator";
    amount_usd: number;
    destination: string;
    requires_operator: boolean;
  }[];
  daily: {
    harvest_usd: number;
    stretch_target_usd: number;
    variance_usd: number;
  };
  projected_eod_ads_usd: number;
}

export interface AdsOpsPlan {
  floor_status: FloorStatus;
  campaigns: Campaign[];
  mutations: {
    action: "pause_prospecting" | "raise_budget" | "lower_budget" | "rotate_creative" | "launch_test";
    platform: string;
    campaignId?: string;
    reason: string;
    requires_operator: boolean;
  }[];
  utm_plan: { source: string; medium: "paid"; campaign: string; content: string };
}

export interface OrchestratorPlan {
  cycle_id: string;
  summary: string;
  dispatch: {
    agent: Exclude<AgentName, "orchestrator">;
    priority: number;
    objective: string;
    payload: Record<string, unknown>;
  }[];
  holds: string[];
  operator_asks: string[];
  kpi: {
    stretch_target_usd: number;
    harvest_today_usd: number;
    variance_usd: number;
    ads_floor_usd: number;
    ads_balance_usd: number;
    floor_status: FloorStatus;
  };
}

export interface CycleResult {
  plan: OrchestratorPlan;
  world: WorldState;
  qualifierResults: QualifierResult[];
  riskVerdicts: RiskVerdict[];
  treasury: TreasurySnapshot;
  ads: AdsOpsPlan;
}
