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
  };
}

/** Live connectors stay off until the operator enrolls and flips a flag. */
export const LIVE_CONNECTORS_DEFAULT_OFF = true;
