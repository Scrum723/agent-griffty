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

const TOKEN = "dev-operator-token";

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      authorization: `Bearer ${TOKEN}`,
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
  approveSocialPost: (id: string) => req(`/api/social/posts/${id}/approve`, { method: "POST" }),
  rejectSocialPost: (id: string) => req(`/api/social/posts/${id}/reject`, { method: "POST" }),
  auditIpVault: () => req(`/api/ip-vault/audit`, { method: "POST" }),
};
