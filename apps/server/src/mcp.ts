import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { z } from "zod";
import {
  listInvestments,
  proposeInvestment,
  setInvestmentStops,
  type GrifftyStore,
} from "@griffty/store";
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

  mcp.registerTool("daily_progress", { description: "Progress toward the $115/day harvest target (target, not a guarantee)." }, async () => {
    const world = await store.load();
    const today = world.kpiDaily.at(-1)?.harvestUsd ?? 0;
    const target = world.policy.stretchTargetUsd || 115;
    return text({
      dailyTargetUsd: target,
      harvestTodayUsd: today,
      gapUsd: Math.max(0, target - today),
      note: "$115/day is an objective. Griffty will not invent guaranteed returns.",
    });
  });

  mcp.registerTool("list_investments", { description: "List scored startup/protocol theses with stop-loss and take-profit." }, async () => {
    const investments = await listInvestments();
    return text({
      defaultStopPct: 10,
      defaultTakePct: 25,
      investments: investments.map((i) => ({
        id: i.id,
        name: i.name,
        healthScore: i.healthScore,
        eligible: i.eligible,
        proposedUsd: i.proposedUsd,
        stopLossPct: i.stopLossPct,
        takeProfitPct: i.takeProfitPct,
        stopNote: i.stopNote,
        takeNote: i.takeNote,
        status: i.status,
        reasons: i.reasons,
      })),
    });
  });

  mcp.registerTool(
    "propose_investment",
    {
      description: "Score a project on health/growth parameters and attach default -10% stop / +25% take. Does not spend funds.",
      inputSchema: {
        name: z.string(),
        kind: z.enum(["startup", "protocol", "token"]).optional(),
        url: z.string().optional(),
        liquidityUsd: z.number().optional(),
        volume7dUsd: z.number().optional(),
        volume30dUsd: z.number().optional(),
        holderOrUserGrowthPct: z.number().optional(),
        publicDocs: z.boolean().optional(),
        teamIdentifiable: z.boolean().optional(),
        githubOrProductAlive: z.boolean().optional(),
        claimsGuaranteedReturn: z.boolean().optional(),
        anonymousMintOrStealthLaunch: z.boolean().optional(),
        proposedUsd: z.number().optional(),
      },
    },
    async (args) => {
      const row = await proposeInvestment(
        {
          name: args.name,
          kind: args.kind ?? "startup",
          url: args.url,
          liquidityUsd: args.liquidityUsd ?? 0,
          volume7dUsd: args.volume7dUsd ?? 0,
          volume30dUsd: args.volume30dUsd ?? 0,
          holderOrUserGrowthPct: args.holderOrUserGrowthPct ?? 0,
          publicDocs: Boolean(args.publicDocs),
          teamIdentifiable: Boolean(args.teamIdentifiable),
          githubOrProductAlive: Boolean(args.githubOrProductAlive),
          claimsGuaranteedReturn: Boolean(args.claimsGuaranteedReturn),
          anonymousMintOrStealthLaunch: Boolean(args.anonymousMintOrStealthLaunch),
        },
        args.proposedUsd ?? 25,
      );
      return text({
        investment: row,
        message: `${row.name}: health ${row.healthScore}/100. ${row.stopNote} ${row.takeNote} Tell me if you want those percentages changed before any capital is used.`,
      });
    },
  );

  mcp.registerTool(
    "set_trade_params",
    {
      description: "Operator-adjusted stop-loss and take-profit percentages on a thesis.",
      inputSchema: { id: z.string(), stopLossPct: z.number(), takeProfitPct: z.number() },
    },
    async ({ id, stopLossPct, takeProfitPct }) => {
      const row = await setInvestmentStops(id, stopLossPct, takeProfitPct);
      if (!row) return text({ error: "not found", id });
      return text({ investment: row, message: `Updated ${row.name}: ${row.stopNote} ${row.takeNote}` });
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
