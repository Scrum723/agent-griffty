import { newId, type SignIntent, type WorldState } from "@griffty/domain";

export function queueSignIntent(
  world: WorldState,
  args: {
    kind: SignIntent["kind"];
    title: string;
    summary: string;
    walletRole: SignIntent["walletRole"];
    opportunityId?: string;
    taskId?: string;
  },
): SignIntent {
  world.signIntents ??= [];
  const iso = new Date().toISOString();
  const wallet =
    world.wallets.find((w) => w.role === args.walletRole) ??
    world.wallets.find((w) => w.role === "session") ??
    world.wallets.find((w) => w.role === "burner");
  const intent: SignIntent = {
    id: newId("sign"),
    kind: args.kind,
    status: "pending",
    walletRole: args.walletRole,
    walletId: wallet?.id ?? "wal_session",
    title: args.title,
    summary: args.summary,
    opportunityId: args.opportunityId,
    taskId: args.taskId,
    cluster: "mainnet-beta",
    requiresOperatorTap: true,
    unattendedForbidden: true,
    createdAt: iso,
    updatedAt: iso,
  };
  world.signIntents.push(intent);
  return intent;
}

export function phantomBrowseLink(dashboardUrl: string): string {
  return `https://phantom.app/ul/browse/${encodeURIComponent(dashboardUrl)}?ref=https://griffty.local`;
}
