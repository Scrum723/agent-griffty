import type { ScoutOpportunityInput } from "@griffty/domain";
import { connectorFlags } from "./flags.js";

/**
 * Live read-only connectors. Default off.
 * Official HTTPS endpoints only. No scraping of authenticated ToS-gated actions.
 * Lowest-risk first wave: public marketing/status pages the operator already enrolled in.
 */
export async function liveScout(): Promise<ScoutOpportunityInput[]> {
  const flags = connectorFlags();
  const out: ScoutOpportunityInput[] = [];
  if (flags.honeygain) {
    out.push(...(await readOfficialStatus("honeygain", "https://dashboard.honeygain.com/")));
  }
  if (flags.weatherxm) {
    out.push(...(await readOfficialStatus("weatherxm", "https://weatherxm.com/rewards")));
  }
  return out;
}

async function readOfficialStatus(
  _source: string,
  _url: string,
): Promise<ScoutOpportunityInput[]> {
  // Intentionally empty until the operator supplies an official API token
  // via Secret Manager. Never scrape login walls.
  return [];
}
