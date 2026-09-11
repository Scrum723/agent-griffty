/**
 * Standing orders.
 * Agent Phantom wallet (MCP / 2f2R…) may operate autonomously.
 * Personal FigKN / treasury wallets stay watch-only — no seeds.
 * darkWebEnabled and prepaid auto-claim stay frozen false.
 */
export interface StandingOrders {
  adsFloorUsd: number;
  adsBufferUsd: number;
  stretchTargetUsd: number;
  humanGateUsd: number;
  zeroCapital: boolean;
  allowGasOnKnownChains: boolean;
  allowAirdropAutoClaim: boolean;
  allowVerifiedAirdrops: boolean;
  allowWalletConnectSign: boolean;
  allowUnattendedSign: boolean;
  allowAgentWalletAutonomy: boolean;
  agentWalletSolana: string;
  pauseProspectingOnFloorWatch: boolean;
  dailyProfitSweepPct: number;
  dailyProfitSweepTo: string;
  dailyProfitSweepMinUsd: number;
  moonSleevePct: number;
  grokBuildLoops: false;
  darkWebEnabled: false;
  decisionExecuteMin: number;
  decisionQueueMin: number;
  decisionWatchMin: number;
  walletFloorUsd: number;
  xamanWalletXrpl?: string;
  xamanReserveFloorXrp?: number;
  xamanWatchOnly?: boolean;
  phantomAutonomousTrading: boolean;
  xamanAutonomousTrading: boolean;
  autonomousExecution: boolean;
  benchmarkStepPct: number;
  notifyOnlyOnBenchmarks: boolean;
}

export const DEFAULT_STANDING_ORDERS: StandingOrders = Object.freeze({
  adsFloorUsd: 100,
  adsBufferUsd: 25,
  stretchTargetUsd: 50,
  humanGateUsd: 75,
  zeroCapital: true,
  allowGasOnKnownChains: true,
  allowAirdropAutoClaim: false,
  allowVerifiedAirdrops: true,
  allowWalletConnectSign: true,
  allowUnattendedSign: true,
  allowAgentWalletAutonomy: true,
  agentWalletSolana: "2f2RxyqM4YZHRChncDHxkWvSetZMx4CxYB9rW9BAsZuV",
  pauseProspectingOnFloorWatch: true,
  dailyProfitSweepPct: 0.5,
  dailyProfitSweepTo: "FigKNbrXoMmnonsrBfPgHCS8FKGPMZ7X5zXMY1dCCG2Z",
  dailyProfitSweepMinUsd: 0.5,
  moonSleevePct: 0.25,
  grokBuildLoops: false,
  darkWebEnabled: false,
  decisionExecuteMin: 75,
  decisionQueueMin: 55,
  decisionWatchMin: 35,
  walletFloorUsd: 500,
  xamanWalletXrpl: "rPjrQxdzgw1GoZ6zvzErxBykRVb7VbRaw4",
  xamanReserveFloorXrp: 12,
  xamanWatchOnly: true,
  phantomAutonomousTrading: true,
  xamanAutonomousTrading: true,
  autonomousExecution: true,
  benchmarkStepPct: 12.5,
  notifyOnlyOnBenchmarks: true,
}) as StandingOrders;

export function parseStandingOrders(
  raw: Partial<StandingOrders> | Record<string, unknown> | undefined,
): StandingOrders {
  const merged: StandingOrders = {
    ...DEFAULT_STANDING_ORDERS,
    ...(raw as Partial<StandingOrders> | undefined),
    darkWebEnabled: false,
    grokBuildLoops: false,
    allowAirdropAutoClaim: false,
  };
  if (raw && "grokBuildLoops" in raw && raw.grokBuildLoops === true) {
    throw new Error("grokBuildLoops must remain false. Do not schedule Agent Griffty on Grok Build.");
  }
  if (raw && "darkWebEnabled" in raw && raw.darkWebEnabled === true) {
    throw new Error("darkWebEnabled must remain false. No hidden override exists. TOR hidden services are not ingested.");
  }
  if (raw && raw.allowAirdropAutoClaim === true) {
    throw new Error(
      "allowAirdropAutoClaim must remain false. Scam claim sites stay rejected. Agent-wallet Phantom autonomy does not include prepaid drainers.",
    );
  }
  return Object.freeze(merged);
}

export function adsWatchThreshold(policy: StandingOrders): number {
  return policy.adsFloorUsd + policy.adsBufferUsd;
}
