import type { WorldState } from "./types";

export interface SignIntent {
  id: string;
  kind: string;
  status: string;
  walletRole: string;
  title: string;
  summary: string;
  cluster: string;
}

export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  notifications: { notifyEmail: boolean; notifyPush: boolean; notifySms: boolean };
}

const API_BASE =
  (import.meta as { env?: { VITE_API_BASE?: string } }).env?.VITE_API_BASE ||
  (typeof window !== "undefined" && window.location.protocol === "file:"
    ? "http://127.0.0.1:8787"
    : "");

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) throw new Error(`${path} ${res.status}`);
  const ct = res.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) return res.json() as Promise<T>;
  return res.text() as Promise<T>;
}

export const api = {
  state: () => req<WorldState>("/api/state"),
  cycle: () => req<unknown>("/api/cycle", { method: "POST" }),
  seed: () => req<unknown>("/api/seed", { method: "POST" }),
  setAds: (totalUsd: number) =>
    req("/api/ads-balance", { method: "POST", body: JSON.stringify({ totalUsd }) }),
  saveWallet: (body: { role: "treasury" | "burner" | "session"; address: string; chain: string }) =>
    req<{ wallet: { address: string; role: string } }>("/api/wallets", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  intents: () => req<{ intents: SignIntent[]; phantomBrowse: string }>("/api/intents"),
  demoIntent: () => req<{ intent: SignIntent }>("/api/intents/demo", { method: "POST" }),
  prepareIntent: (id: string, address: string) =>
    req<{ transactionBase64: string; cluster: string; note: string }>(`/api/intents/${id}/prepare`, {
      method: "POST",
      body: JSON.stringify({ address }),
    }),
  confirmIntent: (id: string, signature: string) =>
    req(`/api/intents/${id}/confirm`, { method: "POST", body: JSON.stringify({ signature }) }),
  rejectIntent: (id: string) =>
    req(`/api/intents/${id}/confirm`, { method: "POST", body: JSON.stringify({ rejected: true }) }),
  approveSocialPost: (id: string) => req(`/api/social/posts/${id}/approve`, { method: "POST" }),
  rejectSocialPost: (id: string) => req(`/api/social/posts/${id}/reject`, { method: "POST" }),
  auditIpVault: () => req(`/api/ip-vault/audit`, { method: "POST" }),
  me: () => req<{ profile: UserProfile | null }>("/api/me"),
  startSession: (body: { name: string; avatar?: string; bio?: string }) =>
    req<{ profile: UserProfile }>("/api/session", { method: "POST", body: JSON.stringify(body) }),
  saveProfile: (body: Partial<UserProfile>) => req<{ profile: UserProfile }>("/api/me", { method: "PUT", body: JSON.stringify(body) }),
  pauseCampaign: (id: string) => req(`/api/campaigns/${id}/pause`, { method: "POST" }),
  resumeCampaign: (id: string) => req(`/api/campaigns/${id}/resume`, { method: "POST" }),
  setBudget: (id: string, dailyBudgetUsd: number) =>
    req(`/api/campaigns/${id}/budget`, { method: "POST", body: JSON.stringify({ dailyBudgetUsd }) }),
  pushNotify: (title: string, body: string) =>
    req(`/api/notify`, { method: "POST", body: JSON.stringify({ title, body }) }),
  investments: () =>
    req<{
      dailyTargetUsd: number;
      harvestTodayUsd: number;
      gapUsd: number;
      defaultStopPct: number;
      defaultTakePct: number;
      investments: Array<{
        id: string;
        name: string;
        kind: string;
        healthScore: number;
        eligible: boolean;
        proposedUsd: number;
        stopLossPct: number;
        takeProfitPct: number;
        stopNote: string;
        takeNote: string;
        status: string;
        reasons: string[];
      }>;
    }>("/api/investments"),
  setInvestmentStops: (id: string, stopLossPct: number, takeProfitPct: number) =>
    req(`/api/investments/${id}/stops`, { method: "POST", body: JSON.stringify({ stopLossPct, takeProfitPct }) }),
  acceptInvestment: (id: string) => req(`/api/investments/${id}/accept`, { method: "POST" }),
  rejectInvestment: (id: string) => req(`/api/investments/${id}/reject`, { method: "POST" }),
  analytics: (days = 7) =>
    req<{ harvestUsd: number; series: { date: string; harvestUsd: number }[]; campaigns: WorldState["campaigns"] }>(
      `/api/analytics?days=${days}`,
    ),
};
