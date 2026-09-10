import { describe, it, expect } from "vitest";
import { createGrifftyStrandsAgent, runStrandsAutonomousCycle } from "./strands-agent.js";
import { emptyWorld } from "@griffty/store";

describe("AWS Strands Agents SDK Integration", () => {
  it("initializes Griffty as a Strands Agent with 6 tools", () => {
    const world = emptyWorld();
    const agent = createGrifftyStrandsAgent(world);

    expect(agent).toBeDefined();
    // Agent name / systemPrompt check
    expect(agent.systemPrompt).toContain("Agent Griffty");
    expect(agent.systemPrompt).toContain("Strands Agents SDK");
  });

  it("executes an autonomous cycle via Strands runner", async () => {
    const world = emptyWorld();
    world.adsAccounts[0].balanceUsd = 40;
    const result = await runStrandsAutonomousCycle(world);

    expect(result.plan).toBeDefined();
    expect(result.plan.cycle_id).toBeTruthy();
    expect(result.world).toBeDefined();
  });
});
