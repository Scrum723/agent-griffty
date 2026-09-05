import { cloudProjectId } from "./env.js";

export interface GoogleStatus {
  projectId: string | null;
  store: "file" | "firestore";
  adc: boolean;
  secretManager: boolean;
  adsFlag: boolean;
}

/**
 * Application Default Credentials via `gcloud auth application-default login`
 * or GOOGLE_APPLICATION_CREDENTIALS. Never embed a service-account JSON in git.
 */
export async function googleAccessToken(scopes: string[]): Promise<string | null> {
  try {
    const { GoogleAuth } = await import("google-auth-library");
    const auth = new GoogleAuth({
      scopes: scopes.length
        ? scopes
        : ["https://www.googleapis.com/auth/cloud-platform"],
      projectId: cloudProjectId(),
    });
    const client = await auth.getClient();
    const tok = await client.getAccessToken();
    return tok.token ?? null;
  } catch {
    return null;
  }
}

/** Load a secret from env first, then Google Secret Manager. */
export async function loadGoogleSecret(name: string): Promise<string | undefined> {
  const env = process.env[name];
  if (env) return env;
  const project = cloudProjectId();
  if (!project) return undefined;
  const token = await googleAccessToken(["https://www.googleapis.com/auth/cloud-platform"]);
  if (!token) return undefined;
  const url = `https://secretmanager.googleapis.com/v1/projects/${project}/secrets/${name}/versions/latest:access`;
  try {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return undefined;
    const body = (await res.json()) as { payload?: { data?: string } };
    if (!body.payload?.data) return undefined;
    return Buffer.from(body.payload.data, "base64").toString("utf8");
  } catch {
    return undefined;
  }
}

export function googleStatus(storeKind: "file" | "firestore"): GoogleStatus {
  return {
    projectId: cloudProjectId() ?? null,
    store: storeKind,
    adc: Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.CLOUDSDK_AUTH_CREDENTIAL_FILE_OVERRIDE),
    secretManager: Boolean(cloudProjectId()),
    adsFlag: process.env.CONNECTOR_ADS_GOOGLE === "true",
  };
}
