import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { z } from "zod";
import type { GrifftyStore } from "@griffty/store";
import { newId } from "@griffty/domain";

function text(obj: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(obj, null, 2) }] };
}

export function createMcpServer(store: GrifftyStore): McpServer {
  const mcp = new McpServer({ name: "griffty", version: "1.0.0" });

  mcp.registerTool(
    "check_campaign_status",
    {
      description: "List Griffty ad campaigns and their live status, budget, and KPIs.",
      inputSchema: { campaignId: z.string().optional() },
    },
    async ({ campaignId }) => {
      const world = await store.load();
      const rows = campaignId ? world.campaigns.filter((c) => c.id === campaignId) : world.campaigns;
      return text({ campaigns: rows, adsAccounts: world.adsAccounts });
    },
  );

  mcp.registerTool(
    "pause_ad",
    {
      description: "Pause an ad campaign by id.",
      inputSchema: { campaignId: z.string() },
    },
    async ({ campaignId }) => {
      const world = await store.load();
      const c = world.campaigns.find((x) => x.id === campaignId);
      if (!c) return text({ error: "campaign not found", campaignId });
      c.status = "paused";
      world.updatedAt = new Date().toISOString();
      await store.save(world);
      return text({ ok: true, campaign: c });
    },
  );

  mcp.registerTool(
    "resume_ad",
    {
      description: "Resume a paused ad campaign by id.",
      inputSchema: { campaignId: z.string() },
    },
    async ({ campaignId }) => {
      const world = await store.load();
      const c = world.campaigns.find((x) => x.id === campaignId);
      if (!c) return text({ error: "campaign not found", campaignId });
      c.status = "active";
      world.updatedAt = new Date().toISOString();
      await store.save(world);
      return text({ ok: true, campaign: c });
    },
  );

  mcp.registerTool("fetch_treasury_balance", { description: "Fetch cash, ads prepaid balances, and watch-only wallet marks." }, async () => {
    const world = await store.load();
    const ads = world.adsAccounts.reduce((s, a) => s + a.balanceUsd, 0);
    const wallets = world.wallets.map((w) => ({
      role: w.role,
      address: w.address,
      watchOnly: w.watchOnly,
      usd: w.assets.reduce((s, a) => s + (a.usdMark ?? 0), 0),
    }));
    return text({ cashUsd: world.cashUsd, adsPrepaidUsd: ads, wallets });
  });

  mcp.registerTool(
    "send_push_notification",
    {
      description: "Queue a push notification for the operator console.",
      inputSchema: { title: z.string(), body: z.string() },
    },
    async ({ title, body }) => {
      const world = await store.load();
      const note = { id: newId("ntf"), type: "push", title, body, read: false, createdAt: new Date().toISOString() };
      world.notifications.unshift(note);
      world.notifications = world.notifications.slice(0, 100);
      await store.save(world);
      return text({ ok: true, notification: note });
    },
  );

  mcp.registerTool(
    "query_analytics",
    {
      description: "Query harvest KPI, ads floor, and campaign performance.",
      inputSchema: { days: z.number().optional() },
    },
    async ({ days }) => {
      const world = await store.load();
      const n = typeof days === "number" && days > 0 ? days : 7;
      const cut = Date.now() - n * 86400000;
      const harvest = world.kpiDaily.filter((k) => new Date(k.date).getTime() >= cut).reduce((s, k) => s + k.harvestUsd, 0);
      return text({
        days: n,
        harvestUsd: harvest,
        stretchTargetUsd: world.policy.stretchTargetUsd,
        adsFloorUsd: world.policy.adsFloorUsd,
        campaigns: world.campaigns.map((c) => ({
          id: c.id,
          name: c.name,
          status: c.status,
          dailyBudgetUsd: c.dailyBudgetUsd,
          kpis: c.kpis,
        })),
      });
    },
  );

  return mcp;
}

export async function handleMcpRequest(store: GrifftyStore, request: Request): Promise<Response> {
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  const mcp = createMcpServer(store);
  await mcp.connect(transport);
  return transport.handleRequest(request);
}
