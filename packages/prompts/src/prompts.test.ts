import { describe, expect, it } from "vitest";
import { agentSystemPrompt, listRoles, loadPrompt, PROMPT_VERSION } from "./index.js";

describe("prompt pack", () => {
  it("loads every v1 role including shared policy", () => {
    expect(PROMPT_VERSION).toBe("v1");
    for (const role of listRoles()) {
      const text = loadPrompt(role);
      expect(text.length).toBeGreaterThan(80);
    }
    const orch = agentSystemPrompt("orchestrator");
    expect(orch).toMatch(/public web/i);
    expect(orch).toMatch(/GRIFFTY-ORCHESTRATOR/);
    expect(orch).not.toMatch(/\.onion/);
  });
});
