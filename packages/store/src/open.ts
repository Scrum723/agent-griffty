import { JsonFileStore } from "./memory.js";
import { FirestoreStore, type GrifftyStore } from "./firestore.js";
import { loadDotEnv, useFirestore } from "./env.js";
import { stateDir } from "./paths.js";

export type { GrifftyStore };

export function openStore(): GrifftyStore {
  loadDotEnv();
  if (useFirestore()) return new FirestoreStore();
  return new JsonFileStore(stateDir());
}
