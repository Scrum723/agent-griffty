import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { newId } from "@griffty/domain";
import { form1099Ready, phantomBrowseLink, runCycle, taxLotExport } from "@griffty/runtime";
import {
  createProfile,
  googleStatus,
  loadDotEnv,
  openStore,
  profileFromToken,
  updateProfile,
  upsertWatchWallet,
} from "@griffty/store";
import { pollGoogleAds } from "@griffty/connectors";
import type { WalletRole } from "@griffty/domain";
import { prepareMemoTransaction } from "./phantom.js";
import { handleMcpRequest } from "./mcp.js";
import { getCookie, setCookie } from "hono/cookie";

loadDotEnv();
const store = openStore();
console.log(`Agent Griffty store: ${store.kind}`);
const TOKEN = process.env.OPERATOR_TOKEN ?? "dev-operator-token";
const MCP_TOKEN = process.env.MCP_AUTH_TOKEN ?? "";
const SESSION_COOKIE = "griffty_sid";

const app = new Hono();
app.use("*", cors({ origin: (o) => o || "*", credentials: true }));

const healthBody = () => ({
  ok: true as const,
  service: "agent-griffty",
  grokBuildLoops: false,
  google: googleStatus(store.kind),
});

app.get("/health", (c) => c.json(healthBody()));
app.get("/healthz", (c) => c.json({ ok: true, service: "agent-griffty" }));
app.get("/api/health", (c) => c.json(healthBody()));

app.all("/mcp", async (c) => {
  if (!MCP_TOKEN) return c.json({ error: "MCP_AUTH_TOKEN is not configured" }, 503);
  const header = c.req.header("authorization") ?? "";
  if (header !== `Bearer ${MCP_TOKEN}`) return c.json({ error: "unauthorized" }, 401);
  return handleMcpRequest(store, c.req.raw);
});

app.post("/api/session", async (c) => {
  const body = await c.req.json<{ name?: string; avatar?: string; bio?: string }>().catch(() => ({}));
  const { profile, token } = await createProfile({
    name: body.name || "Operator",
    avatar: body.avatar,
    bio: body.bio,
  });
  setCookie(c, SESSION_COOKIE, token, { httpOnly: true, sameSite: "Lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
  return c.json({ profile });
});

app.use("/api/*", async (c, next) => {
  if (c.req.path === "/api/health" || c.req.path === "/api/session" || c.req.path === "/api/me") return next();
  const header = c.req.header("authorization") ?? "";
  const query = c.req.query("token");
  const sid = getCookie(c, SESSION_COOKIE);
  const profile = await profileFromToken(sid);
  if (profile) {
    await next();
    return;
  }
  if (header === `Bearer ${TOKEN}` || query === TOKEN) {
    await next();
    return;
  }
  return c.json({ error: "unauthorized" }, 401);
});

app.get("/api/google/status", async (c) => {
  const ads = await pollGoogleAds();
  return c.json({
    grokBuildLoops: false,
    google: googleStatus(store.kind),
    ads,
  });
});

app.get("/api/state", async (c) => {
  const world = await store.load();
  return c.json(world);
});

app.post("/api/cycle", async (c) => {
  const world = await store.load();
  const result = await runCycle(world);
  await store.save(result.world);
  return c.json({
    plan: result.plan,
    treasury: result.treasury,
    ads: result.ads,
    qualifierResults: result.qualifierResults,
    riskVerdicts: result.riskVerdicts,
  });
});

app.post("/api/seed", async (c) => {
  const world = await store.load();
  const result = await runCycle(world);
  const day = new Date().toISOString().slice(0, 10);
  result.world.ledger.push({
    id: "seed_payout_demo",
    type: "payout",
    amountUsd: 18.5,
    asset: "USD",
    platform: "respondent",
    settled: true,
    settledAt: `${day}T16:00:00.000Z`,
    createdAt: `${day}T16:00:00.000Z`,
    taxLotId: "lot_2026_resp_1",
  });
  const again = await runCycle(result.world);
  await store.save(again.world);
  return c.json({ ok: true, cycleId: again.plan.cycle_id, opportunities: again.world.opportunities.length });
});

app.get("/api/export/tax-lots", async (c) => {
  const world = await store.load();
  return c.text(taxLotExport(world), 200, { "content-type": "text/csv" });
});

app.get("/api/export/1099", async (c) => {
  const world = await store.load();
  return c.text(form1099Ready(world), 200, { "content-type": "text/csv" });
});

app.post("/api/ads-balance", async (c) => {
  const body = await c.req.json<{ totalUsd?: number }>();
  const world = await store.load();
  if (typeof body.totalUsd === "number") {
    const n = world.adsAccounts.length || 1;
    const per = body.totalUsd / n;
    world.adsAccounts = world.adsAccounts.map((a) => ({ ...a, balanceUsd: per }));
  }
  await store.save(world);
  return c.json({ adsAccounts: world.adsAccounts });
});

app.post("/api/intents/demo", async (c) => {
  const { queueSignIntent } = await import("@griffty/runtime");
  const world = await store.load();
  const intent = queueSignIntent(world, {
    kind: "memo_ack",
    title: "Griffty tap-to-sign check",
    summary: "Memo-only. Tiny SOL fee. Approve in Phantom; Griffty cannot sign for you.",
    walletRole: "session",
  });
  world.events.push({
    id: newId("evt"),
    name: "sign.requested",
    ts: new Date().toISOString(),
    uid: world.operator.uid,
    cycleId: world.cycleId,
    props: { intentId: intent.id, walletRole: intent.walletRole },
  });
  await store.save(world);
  return c.json({ intent });
});

app.get("/api/intents", async (c) => {
  const world = await store.load();
  const host = c.req.header("x-forwarded-host") ?? c.req.header("host") ?? "127.0.0.1:5173";
  const proto = c.req.header("x-forwarded-proto") ?? (host.includes("localhost") || host.includes("127.0.0.1") || host.includes("192.168.") ? "http" : "https");
  const dashUrl = process.env.DASHBOARD_URL ?? `${proto}://${host}`;
  return c.json({
    intents: world.signIntents ?? [],
    phantomBrowse: phantomBrowseLink(dashUrl),
  });
});

app.post("/api/intents/:id/prepare", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json<{ address?: string }>();
  if (!body.address) return c.json({ error: "connected Phantom public address required" }, 400);
  const world = await store.load();
  const intent = (world.signIntents ?? []).find((s) => s.id === id);
  if (!intent) return c.json({ error: "intent not found" }, 404);
  if (intent.status === "signed") return c.json({ error: "already signed" }, 400);
  const prepared = await prepareMemoTransaction({
    payer: body.address,
    message: `GRIFFTY ${intent.id} ${intent.kind} tap-to-sign`,
    cluster: intent.cluster,
  });
  intent.status = "prepared";
  intent.preparedAt = new Date().toISOString();
  intent.updatedAt = intent.preparedAt;
  await store.save(world);
  return c.json({
    intent,
    ...prepared,
    note: "Memo-only transaction. No funds move except a tiny SOL fee. Phantom must still Approve.",
  });
});

app.post("/api/intents/:id/confirm", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json<{ signature?: string; rejected?: boolean }>();
  const world = await store.load();
  const intent = (world.signIntents ?? []).find((s) => s.id === id);
  if (!intent) return c.json({ error: "intent not found" }, 404);
  const iso = new Date().toISOString();
  if (body.rejected) {
    intent.status = "rejected";
    intent.updatedAt = iso;
    world.events.push({
      id: newId("evt"),
      name: "sign.rejected",
      ts: iso,
      uid: world.operator.uid,
      cycleId: world.cycleId,
      props: { intentId: intent.id },
    });
  } else {
    if (!body.signature) return c.json({ error: "signature required" }, 400);
    intent.status = "signed";
    intent.signature = body.signature;
    intent.signedAt = iso;
    intent.updatedAt = iso;
    world.events.push({
      id: newId("evt"),
      name: "sign.completed",
      ts: iso,
      uid: world.operator.uid,
      cycleId: world.cycleId,
      props: { intentId: intent.id, signature: body.signature },
    });
    world.events.push({
      id: newId("evt"),
      name: "operator.approval_granted",
      ts: iso,
      uid: world.operator.uid,
      cycleId: world.cycleId,
      props: { gateType: "wallet_signature", subjectId: intent.opportunityId ?? intent.id },
    });
  }
  await store.save(world);
  return c.json({ intent });
});

app.post("/api/wallets", async (c) => {
  const body = await c.req.json<{ role?: WalletRole; address?: string; chain?: string; id?: string }>();
  if (!body.address || !body.role) return c.json({ error: "role and address required" }, 400);
  try {
    const world = await store.load();
    const wallet = upsertWatchWallet(world, {
      id: body.id,
      role: body.role,
      address: body.address,
      chain: body.chain ?? "solana",
    });
    await store.save(world);
    return c.json({ wallet });
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : "invalid wallet" }, 400);
  }
});

app.post("/api/social/posts/:id/approve", async (c) => {
  const id = c.req.param("id");
  const world = await store.load();
  const post = world.socialPosts?.find((p) => p.id === id);
  if (!post) return c.json({ error: "post not found" }, 404);
  post.status = "published";
  post.publishedAt = new Date().toISOString();
  world.events.push({
    id: newId("evt"),
    name: "operator.approval_granted",
    ts: post.publishedAt,
    uid: world.operator.uid,
    cycleId: world.cycleId,
    props: { gateType: "social_media_post", subjectId: post.id, platform: post.platform },
  });
  await store.save(world);
  return c.json({ ok: true, post });
});

app.post("/api/social/posts/:id/reject", async (c) => {
  const id = c.req.param("id");
  const world = await store.load();
  const post = world.socialPosts?.find((p) => p.id === id);
  if (!post) return c.json({ error: "post not found" }, 404);
  post.status = "rejected";
  world.events.push({
    id: newId("evt"),
    name: "operator.approval_granted",
    ts: new Date().toISOString(),
    uid: world.operator.uid,
    cycleId: world.cycleId,
    props: { gateType: "social_media_post_rejected", subjectId: post.id, platform: post.platform },
  });
  await store.save(world);
  return c.json({ ok: true, post });
});

app.get("/api/me", async (c) => {
  const sid = getCookie(c, SESSION_COOKIE);
  const profile = await profileFromToken(sid);
  return c.json({ profile });
});

app.put("/api/me", async (c) => {
  const sid = getCookie(c, SESSION_COOKIE);
  const current = await profileFromToken(sid);
  if (!current) return c.json({ error: "sign in first" }, 401);
  const body = await c.req.json<{
    name?: string;
    avatar?: string;
    bio?: string;
    notifications?: { notifyEmail: boolean; notifyPush: boolean; notifySms: boolean };
  }>();
  const profile = await updateProfile(current.id, body);
  return c.json({ profile });
});

app.post("/api/campaigns/:id/pause", async (c) => {
  const world = await store.load();
  const camp = world.campaigns.find((x) => x.id === c.req.param("id"));
  if (!camp) return c.json({ error: "campaign not found" }, 404);
  camp.status = "paused";
  world.updatedAt = new Date().toISOString();
  await store.save(world);
  return c.json({ campaign: camp });
});

app.post("/api/campaigns/:id/resume", async (c) => {
  const world = await store.load();
  const camp = world.campaigns.find((x) => x.id === c.req.param("id"));
  if (!camp) return c.json({ error: "campaign not found" }, 404);
  camp.status = "active";
  world.updatedAt = new Date().toISOString();
  await store.save(world);
  return c.json({ campaign: camp });
});

app.post("/api/campaigns/:id/budget", async (c) => {
  const body = await c.req.json<{ dailyBudgetUsd?: number }>();
  const world = await store.load();
  const camp = world.campaigns.find((x) => x.id === c.req.param("id"));
  if (!camp) return c.json({ error: "campaign not found" }, 404);
  if (typeof body.dailyBudgetUsd !== "number" || body.dailyBudgetUsd < 0) {
    return c.json({ error: "dailyBudgetUsd must be a number" }, 400);
  }
  camp.dailyBudgetUsd = body.dailyBudgetUsd;
  world.updatedAt = new Date().toISOString();
  await store.save(world);
  return c.json({ campaign: camp });
});

app.post("/api/notify", async (c) => {
  const body = await c.req.json<{ title?: string; body?: string }>();
  const world = await store.load();
  const note = {
    id: newId("ntf"),
    type: "push",
    title: body.title || "Griffty",
    body: body.body || "",
    read: false,
    createdAt: new Date().toISOString(),
  };
  world.notifications.unshift(note);
  world.notifications = world.notifications.slice(0, 100);
  await store.save(world);
  return c.json({ notification: note });
});

app.get("/api/analytics", async (c) => {
  const days = Number(c.req.query("days") || 7);
  const world = await store.load();
  const n = Number.isFinite(days) && days > 0 ? days : 7;
  const cut = Date.now() - n * 86400000;
  const series = world.kpiDaily.filter((k) => new Date(k.date).getTime() >= cut);
  const harvest = series.reduce((s, k) => s + k.harvestUsd, 0);
  return c.json({
    days: n,
    harvestUsd: harvest,
    stretchTargetUsd: world.policy.stretchTargetUsd,
    adsFloorUsd: world.policy.adsFloorUsd,
    series,
    campaigns: world.campaigns,
  });
});

app.post("/api/ip-vault/audit", async (c) => {
  const world = await store.load();
  if (!world.ipVault) {
    world.ipVault = { tracks: [], lastAuditAt: null };
  }
  world.ipVault.lastAuditAt = new Date().toISOString();
  await store.save(world);
  return c.json({ ok: true, ipVault: world.ipVault });
});

import { serveStatic } from "@hono/node-server/serve-static";
import { existsSync } from "node:fs";

if (existsSync("./apps/dashboard/dist")) {
  app.use("/*", serveStatic({ root: "./apps/dashboard/dist" }));
  app.get("*", serveStatic({ path: "./apps/dashboard/dist/index.html" }));
}

const port = Number(process.env.PORT ?? 8787);
console.log(`Agent Griffty API on http://0.0.0.0:${port}`);

serve({ fetch: app.fetch, port, hostname: "0.0.0.0" });
