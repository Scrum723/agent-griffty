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
  if (flags.userTesting) {
    out.push(...(await readOfficialStatus("usertesting", "https://usertesting.com")));
  }
  if (flags.dscout) {
    out.push(...(await readOfficialStatus("dscout", "https://dscout.com")));
  }
  if (flags.grassio) {
    out.push(...(await readOfficialStatus("grassio", "https://getgrass.io")));
  }
  if (flags.nodepay) {
    out.push(...(await readOfficialStatus("nodepay", "https://nodepay.ai")));
  }
  if (flags.amazonAssociates) {
    out.push(...(await readOfficialStatus("amazon_associates", "https://affiliate-program.amazon.com")));
  }
  if (flags.youtubeMonetize) {
    out.push(...(await readOfficialStatus("youtube_monetize", "https://studio.youtube.com")));
  }
  if (flags.tiktokLive) {
    out.push(...(await readOfficialStatus("tiktok_live", "https://tiktok.com")));
  }
  if (flags.spotifyPodcast) {
    out.push(...(await readOfficialStatus("spotify_podcast", "https://podcasters.spotify.com")));
  }
  if (flags.distrokid) {
    out.push(...(await readOfficialStatus("distrokid", "https://distrokid.com")));
  }
  if (flags.socialX) {
    out.push(...(await readOfficialStatus("social_x", "https://x.com")));
  }
  if (flags.socialTiktok) {
    out.push(...(await readOfficialStatus("social_tiktok", "https://tiktok.com")));
  }
  if (flags.socialMeta) {
    out.push(...(await readOfficialStatus("social_meta", "https://meta.com")));
  }
  if (flags.socialYoutube) {
    out.push(...(await readOfficialStatus("social_youtube", "https://youtube.com")));
  }
  if (flags.socialX || flags.socialTiktok || flags.socialMeta || flags.socialYoutube) {
    const { socialScout } = await import("./social.js");
    out.push(...(await socialScout()));
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
