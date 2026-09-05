import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { newId } from "@griffty/domain";
import { form1099Ready, phantomBrowseLink, runCycle, taxLotExport } from "@griffty/runtime";
import { googleStatus, loadDotEnv, openStore, upsertWatchWallet } from "@griffty/store";
import { pollGoogleAds } from "@griffty/connectors";
import type { WalletRole } from "@griffty/domain";
import { prepareMemoTransaction } from "./phantom.js";

loadDotEnv();
const store = openStore();
console.log(`Agent Griffty store: ${store.kind}`);
const TOKEN = process.env.OPERATOR_TOKEN ?? "dev-operator-token";

const app = new Hono();
app.use("*", cors());

app.use("/api/*", async (c, next) => {
  const header = c.req.header("authorization") ?? "";
  const query = c.req.query("token");
  if (header !== `Bearer ${TOKEN}` && query !== TOKEN) {
    return c.json({ error: "unauthorized" }, 401);
  }
  await next();
});

app.get("/api/health", (c) =>
  c.json({
    ok: true,
    service: "agent-griffty",
    grokBuildLoops: false,
    google: googleStatus(store.kind),
  }),
);

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
  return c.json({
    intents: world.signIntents ?? [],
    phantomBrowse: phantomBrowseLink(process.env.DASHBOARD_URL ?? "http://127.0.0.1:5173"),
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

app.post("/api/ip-vault/audit", async (c) => {
  const world = await store.load();
  if (!world.ipVault) {
    world.ipVault = { tracks: [], lastAuditAt: null };
  }
  world.ipVault.lastAuditAt = new Date().toISOString();
  await store.save(world);
  return c.json({ ok: true, ipVault: world.ipVault });
});

const port = Number(process.env.PORT ?? 8787);
console.log(`Agent Griffty API on http://127.0.0.1:${port}`);

serve({ fetch: app.fetch, port });
