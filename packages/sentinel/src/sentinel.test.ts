import { describe, expect, it } from "vitest";
import { classifyProbe, DEFAULT_SENTINEL, shouldTripLocalKill } from "./index.js";

describe("sentinel", () => {
  it("never allows counter-hack", () => {
    expect(DEFAULT_SENTINEL.allowCounterHack).toBe(false);
  });

  it("treats /admin as honeypot", () => {
    expect(classifyProbe("/admin")).toBe("honeypot");
    expect(classifyProbe("/state")).toBe("watch");
  });

  it("trips local kill after clustered honeypot hits", () => {
    const now = new Date().toISOString();
    const hits = Array.from({ length: 8 }, () => ({
      ts: now,
      layer: "honeypot" as const,
      note: "probe",
    }));
    expect(shouldTripLocalKill(hits)).toBe(true);
  });
});
