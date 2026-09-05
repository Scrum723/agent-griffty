import { readFileSync } from "node:fs";
import path from "node:path";
import { repoRoot } from "./paths.js";

/** Load ~/agent-griffty/.env into process.env without overriding existing keys. */
export function loadDotEnv(): void {
  const file = path.join(repoRoot(), ".env");
  try {
    const text = readFileSync(file, "utf8");
    for (const raw of text.split("\n")) {
      const line = raw.trim();
      if (!line || line.startsWith("#") || !line.includes("=")) continue;
      const eq = line.indexOf("=");
      const key = line.slice(0, eq).trim();
      let value = line.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = value;
    }
  } catch {
    /* no .env is fine */
  }
}

export function cloudProjectId(): string | undefined {
  return process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT || process.env.FIREBASE_PROJECT_ID;
}

export function useFirestore(): boolean {
  if (process.env.GRIFFTY_STORE === "file") return false;
  if (process.env.GRIFFTY_STORE === "firestore") return true;
  const project = cloudProjectId();
  return Boolean(project && project !== "agent-griffty-local");
}
