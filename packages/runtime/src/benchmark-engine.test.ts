import { describe, expect, it } from "vitest";
import { emptyWorld } from "@griffty/store";
import {
  evaluateBenchmarks,
  runAutonomousWalletCycle,
} from "./benchmark-engine.js";

describe("benchmark-engine & autonomous wallet runner", () => {
  it("auto-signs pending Phantom intents without requiring operator approval", async () => {
    const world = emptyWorld();
    world.policy.walletFloorUsd = 500;
    world.policy.allowAgentWalletAutonomy = true;
    world.policy.phantomAutonomousTrading = true;
    world.signIntents = [
      {
        id: "sign_intent_1",
        kind: "memo_ack",
        status: "pending",
        walletRole: "session",
        walletId: "wal_session",
        title: "DEX Swap SOL/USDC",
        summary: "Autonomous trade allocation",
        cluster: "mainnet-beta",
        requiresOperatorTap: true,
        unattendedForbidden: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    // Current equity is $600 (above $500 floor)
    const result = await runAutonomousWalletCycle(world, { currentEquityOverride: 600 });

    expect(result.status).toBe("success");
    expect(result.executedIntents.length).toBe(1);
    expect(result.executedIntents[0].signature).toMatch(/^AUTONOMOUS_SOL_/);
    expect(world.signIntents[0].status).toBe("signed");
    expect(world.events.some((e) => e.name === "wallet.autonomous_signed")).toBe(true);
  });

  it("halts execution if wallet balance breaches the $500 floor", async () => {
    const world = emptyWorld();
    world.policy.walletFloorUsd = 500;

    // Current equity is $450 (below $500 floor)
    const result = await runAutonomousWalletCycle(world, { currentEquityOverride: 450 });

    expect(result.status).toBe("floor_halt");
    expect(result.floorStatus).toBe("breach");
    expect(result.executedIntents.length).toBe(0);
    expect(world.alerts.some((a) => a.code === "WALLET_FLOOR_BREACH")).toBe(true);
  });

  it("only triggers warnings when hitting benchmark losses: -12.5%, -25.0%, -37.5%, -50.0%", async () => {
    const world = emptyWorld();
    world.policy.benchmarkStepPct = 12.5;
    world.policy.walletFloorUsd = 500;
    const baseline = 1000;

    // Baseline setup: equity $1000
    let res = await evaluateBenchmarks(world, baseline);
    expect(res.warningDispatched).toBe(false);

    // Minor drop: -5% ($950) -> NO warning
    res = await evaluateBenchmarks(world, 950);
    expect(res.warningDispatched).toBe(false);
    expect(res.lossTierTriggered).toBeUndefined();

    // Minor drop: -10% ($900) -> NO warning
    res = await evaluateBenchmarks(world, 900);
    expect(res.warningDispatched).toBe(false);

    // Hit 1st benchmark: -12.5% ($875) -> WARNING DISPATCHED!
    res = await evaluateBenchmarks(world, 875);
    expect(res.warningDispatched).toBe(true);
    expect(res.lossTierTriggered).toBe(12.5);
    expect(world.notifications.some((n) => n.type === "wallet_benchmark_loss_warning")).toBe(true);
    expect(world.events.some((e) => e.name === "wallet.benchmark_loss")).toBe(true);

    // Minor move in same tier: -15% ($850) -> NO duplicate warning
    res = await evaluateBenchmarks(world, 850);
    expect(res.warningDispatched).toBe(false);

    // Hit 2nd benchmark: -25.0% ($750) -> WARNING DISPATCHED!
    res = await evaluateBenchmarks(world, 750);
    expect(res.warningDispatched).toBe(true);
    expect(res.lossTierTriggered).toBe(25);

    // Hit 3rd benchmark: -37.5% ($625) -> WARNING DISPATCHED!
    res = await evaluateBenchmarks(world, 625);
    expect(res.warningDispatched).toBe(true);
    expect(res.lossTierTriggered).toBe(37.5);

    // Hit 4th benchmark: -50.0% ($500) -> WARNING DISPATCHED!
    res = await evaluateBenchmarks(world, 500);
    expect(res.warningDispatched).toBe(true);
    expect(res.lossTierTriggered).toBe(50);
  });

  it("triggers profit harvest and pulls profit on +12.5%, +25.0%, +37.5%, +50.0%", async () => {
    const world = emptyWorld();
    world.policy.benchmarkStepPct = 12.5;
    world.policy.dailyProfitSweepPct = 0.5;
    world.policy.dailyProfitSweepTo = "FigKNbrXoMmnonsrBfPgHCS8FKGPMZ7X5zXMY1dCCG2Z";
    const baseline = 1000;

    // Baseline setup: equity $1000
    await evaluateBenchmarks(world, baseline);

    // Minor gain: +8% ($1080) -> NO alert
    let res = await evaluateBenchmarks(world, 1080);
    expect(res.warningDispatched).toBe(false);

    // Hit 1st profit benchmark: +12.5% ($1125) -> HARVEST DISPATCHED
    res = await evaluateBenchmarks(world, 1125);
    expect(res.warningDispatched).toBe(true);
    expect(res.profitTierTriggered).toBe(12.5);
    // 50% of $125 profit = $62.50 swept
    expect(res.sweptUsd).toBe(62.5);
    expect(world.notifications.some((n) => n.type === "wallet_benchmark_profit_harvest")).toBe(true);
    expect(world.events.some((e) => e.name === "wallet.benchmark_profit")).toBe(true);

    // Hit 2nd profit benchmark: +25.0% ($1250) -> HARVEST DISPATCHED
    res = await evaluateBenchmarks(world, 1250);
    expect(res.warningDispatched).toBe(true);
    expect(res.profitTierTriggered).toBe(25);
    expect(res.sweptUsd).toBe(125);
  });
});
