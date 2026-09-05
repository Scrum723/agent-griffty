import { connectorFlags } from "./flags.js";

export interface GoogleAdsSnapshot {
  ok: boolean;
  reason: string;
  customerId?: string;
  descriptiveName?: string;
  currencyCode?: string;
  accessibleCustomers?: string[];
}

/**
 * Official Google Ads API only. Flag-gated.
 * Does not place ads or raise budgets. Read-only customer probe + optional GAQL.
 * Tokens: GOOGLE_ADS_DEVELOPER_TOKEN, GOOGLE_ADS_CUSTOMER_ID, ADC.
 */
export async function pollGoogleAds(): Promise<GoogleAdsSnapshot> {
  if (!connectorFlags().adsGoogle) {
    return { ok: false, reason: "CONNECTOR_ADS_GOOGLE is false" };
  }
  const devToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
  const customerId = (process.env.GOOGLE_ADS_CUSTOMER_ID ?? "").replace(/-/g, "");
  if (!devToken) {
    return { ok: false, reason: "GOOGLE_ADS_DEVELOPER_TOKEN missing" };
  }

  let token: string | null = null;
  try {
    const { GoogleAuth } = await import("google-auth-library");
    const auth = new GoogleAuth({
      scopes: ["https://www.googleapis.com/auth/adwords"],
    });
    const client = await auth.getClient();
    const got = await client.getAccessToken();
    token = got.token ?? null;
  } catch (err) {
    return { ok: false, reason: `ADC failed: ${(err as Error).message}` };
  }
  if (!token) return { ok: false, reason: "no Google access token" };

  const headers = {
    Authorization: `Bearer ${token}`,
    "developer-token": devToken,
    "content-type": "application/json",
  };

  const listRes = await fetch("https://googleads.googleapis.com/v18/customers:listAccessibleCustomers", {
    method: "GET",
    headers,
  });
  if (!listRes.ok) {
    const text = await listRes.text();
    return { ok: false, reason: `listAccessibleCustomers ${listRes.status}: ${text.slice(0, 240)}` };
  }
  const listed = (await listRes.json()) as { resourceNames?: string[] };
  const accessibleCustomers = (listed.resourceNames ?? []).map((n) => n.replace("customers/", ""));

  if (!customerId) {
    return { ok: true, reason: "listed customers only", accessibleCustomers };
  }

  const gaql = "SELECT customer.id, customer.descriptive_name, customer.currency_code FROM customer LIMIT 1";
  const qRes = await fetch(`https://googleads.googleapis.com/v18/customers/${customerId}/googleAds:search`, {
    method: "POST",
    headers,
    body: JSON.stringify({ query: gaql }),
  });
  if (!qRes.ok) {
    const text = await qRes.text();
    return {
      ok: false,
      reason: `search ${qRes.status}: ${text.slice(0, 240)}`,
      customerId,
      accessibleCustomers,
    };
  }
  const q = (await qRes.json()) as {
    results?: Array<{ customer?: { id?: string; descriptiveName?: string; currencyCode?: string } }>;
  };
  const c = q.results?.[0]?.customer;
  return {
    ok: true,
    reason: "ok",
    customerId: c?.id ?? customerId,
    descriptiveName: c?.descriptiveName,
    currencyCode: c?.currencyCode,
    accessibleCustomers,
  };
}
