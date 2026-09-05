export interface ConnectorFlags {
  prolific: boolean;
  respondent: boolean;
  userInterviews: boolean;
  freecash: boolean;
  honeygain: boolean;
  weatherxm: boolean;
  galxe: boolean;
  adsGoogle: boolean;
  adsMeta: boolean;
  adsTiktok: boolean;
  adsX: boolean;
  shopify: boolean;
  userTesting: boolean;
  dscout: boolean;
  grassio: boolean;
  nodepay: boolean;
  amazonAssociates: boolean;
  youtubeMonetize: boolean;
  tiktokLive: boolean;
  spotifyPodcast: boolean;
  distrokid: boolean;
  socialX: boolean;
  socialTiktok: boolean;
  socialMeta: boolean;
  socialYoutube: boolean;
}

function bool(name: string): boolean {
  return process.env[name] === "true";
}

export function connectorFlags(): ConnectorFlags {
  return {
    prolific: bool("CONNECTOR_PROLIFIC"),
    respondent: bool("CONNECTOR_RESPONDENT"),
    userInterviews: bool("CONNECTOR_USER_INTERVIEWS"),
    freecash: bool("CONNECTOR_FREE_CASH"),
    honeygain: bool("CONNECTOR_HONEYGAIN"),
    weatherxm: bool("CONNECTOR_WEATHERXM"),
    galxe: bool("CONNECTOR_GALXE"),
    adsGoogle: bool("CONNECTOR_ADS_GOOGLE"),
    adsMeta: bool("CONNECTOR_ADS_META"),
    adsTiktok: bool("CONNECTOR_ADS_TIKTOK"),
    adsX: bool("CONNECTOR_ADS_X"),
    shopify: bool("CONNECTOR_SHOPIFY"),
    userTesting: bool("CONNECTOR_USER_TESTING"),
    dscout: bool("CONNECTOR_DSCOUT"),
    grassio: bool("CONNECTOR_GRASSIO"),
    nodepay: bool("CONNECTOR_NODEPAY"),
    amazonAssociates: bool("CONNECTOR_AMAZON_ASSOCIATES"),
    youtubeMonetize: bool("CONNECTOR_YOUTUBE_MONETIZE"),
    tiktokLive: bool("CONNECTOR_TIKTOK_LIVE"),
    spotifyPodcast: bool("CONNECTOR_SPOTIFY_PODCAST"),
    distrokid: bool("CONNECTOR_DISTROKID"),
    socialX: bool("CONNECTOR_SOCIAL_X"),
    socialTiktok: bool("CONNECTOR_SOCIAL_TIKTOK"),
    socialMeta: bool("CONNECTOR_SOCIAL_META"),
    socialYoutube: bool("CONNECTOR_SOCIAL_YOUTUBE"),
  };
}

/** Live connectors stay off until the operator enrolls and flips a flag. */
export const LIVE_CONNECTORS_DEFAULT_OFF = true;
