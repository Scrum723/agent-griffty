import { describe, expect, it } from "vitest";
import { pollGoogleAds } from "./google-ads.js";

describe("Google Ads connector", () => {
  it("stays off unless CONNECTOR_ADS_GOOGLE=true", async () => {
    const prev = process.env.CONNECTOR_ADS_GOOGLE;
    process.env.CONNECTOR_ADS_GOOGLE = "false";
    const snap = await pollGoogleAds();
    expect(snap.ok).toBe(false);
    expect(snap.reason).toMatch(/CONNECTOR_ADS_GOOGLE/);
    process.env.CONNECTOR_ADS_GOOGLE = prev;
  });
});
