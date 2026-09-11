import { runAutonomousWalletCycle, calculateTotalWalletEquity } from "@griffty/runtime";
import { loadDotEnv, openStore } from "@griffty/store";

loadDotEnv();

export async function runAutonomousWallets(options?: {
  loop?: boolean;
  intervalMs?: number;
  simulateEquity?: number;
}) {
  const store = openStore();
  const loop = options?.loop || process.argv.includes("--loop");
  const intervalMs = options?.intervalMs || 15000;

  console.log("===============================================================");
  console.log("⚡ Agent Griffty — Autonomous Wallet Runner (Phantom & Xaman) ⚡");
  console.log("===============================================================");
  console.log("• Mode:              INDEPENDENT DECISIONS (Requires Operator Final Authority to execute)");
  console.log("• Solana Agent:      2f2RxyqM4YZHRChncDHxkWvSetZMx4CxYB9rW9BAsZuV");
  console.log("• Xaman XRPL:        rPjrQxdzgw1GoZ6zvzErxBykRVb7VbRaw4");
  console.log("• Floor Protection:  $500.00 Minimum Wallet Equity");
  console.log("• Reserve Floor:     12.00 XRP Protocol Reserve Limit");
  console.log("• Benchmarks:        Multiples of 12.5% (Warnings: -12.5%, -25%, -37.5%, -50%...)");
  console.log("                     (Profits Harvested: +12.5%, +25%, +37.5%, +50%...)");
  console.log("===============================================================\n");

  let running = true;
  process.on("SIGINT", () => {
    console.log("\nStopping autonomous wallet loop...");
    running = false;
    process.exit(0);
  });

  do {
    const world = await store.load();
    const equity = options?.simulateEquity ?? calculateTotalWalletEquity(world);
    const result = await runAutonomousWalletCycle(world, { currentEquityOverride: equity });

    await store.save(world);

    const time = new Date().toLocaleTimeString();
    console.log(`[${time}] 💰 Total Equity: $${result.totalEquityUsd.toFixed(2)} | Floor: $${result.walletFloorUsd.toFixed(2)} (${result.floorStatus.toUpperCase()})`);
    
    if (result.executedIntents.length > 0) {
      console.log(`  ✓ Processed ${result.executedIntents.length} decision intent(s):`);
      for (const i of result.executedIntents) {
        if (i.status === "prepared_awaiting_operator_authority") {
          console.log(`    • [${i.id}] ${i.title} → Prepared autonomously. Awaiting your final authority in dashboard.`);
        } else {
          console.log(`    • [${i.id}] ${i.title} → ${i.signature}`);
        }
      }
    } else {
      console.log(`  • Phantom intents queue: 0 pending (independent guard active)`);
    }

    if (result.xamanExecuted) {
      console.log(`  ✓ Xaman XRPL: ${result.xamanAction}`);
    }

    const bm = result.benchmarks;
    console.log(`  • Benchmark PnL: ${bm.deltaPct >= 0 ? "+" : ""}${bm.deltaPct.toFixed(1)}% ($${bm.deltaUsd.toFixed(2)}) from baseline $${bm.baselineUsd.toFixed(2)}`);

    if (bm.lossTierTriggered) {
      console.log(`  ⚠️ ALERT: -${bm.lossTierTriggered.toFixed(1)}% LOSS BENCHMARK HIT! Warning dispatched to operator.`);
      console.log(`    ${bm.message}`);
    } else if (bm.profitTierTriggered) {
      console.log(`  🚀 PROFIT HARVEST: +${bm.profitTierTriggered.toFixed(1)}% milestone reached! $${bm.sweptUsd?.toFixed(2)} swept to FigKN.`);
      console.log(`    ${bm.message}`);
    } else {
      console.log(`  • Status: Within normal operating bands (no benchmark crossing, operator unbothered)`);
    }

    console.log(`---------------------------------------------------------------`);

    if (loop && running) {
      await new Promise((r) => setTimeout(r, intervalMs));
    }
  } while (loop && running);
}

if (process.argv[1]?.includes("run-autonomous-wallets")) {
  const isLoop = process.argv.includes("--loop");
  const simArgIdx = process.argv.indexOf("--simulate-equity");
  const simEquity = simArgIdx !== -1 ? parseFloat(process.argv[simArgIdx + 1]) : undefined;
  runAutonomousWallets({ loop: isLoop, simulateEquity: simEquity }).catch(console.error);
}
