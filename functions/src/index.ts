/**
 * Cloud Functions entry. Deploy with the Firebase CLI to project `griffty`.
 * Local development uses apps/server; this module is the GCP 15-minute wrapper.
 *
 * Secrets (XAI_API_KEY, ads API tokens) live in Secret Manager — never Firestore.
 * Do NOT schedule this agent on Grok Build. grokBuildLoops is frozen false.
 */
import { runCycle } from "@griffty/runtime";
import { loadDotEnv, openStore } from "@griffty/store";

export async function scheduledCycle(): Promise<{ cycleId: string }> {
  loadDotEnv();
  const store = openStore();
  const world = await store.load();
  const result = await runCycle(world);
  await store.save(result.world);
  return { cycleId: result.plan.cycle_id };
}

/** Firebase onSchedule hook is registered when firebase-functions is installed. */
export const GRIFFTY_SCHEDULE = "every 15 minutes";
