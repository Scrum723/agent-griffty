import path from "node:path";
import { fileURLToPath } from "node:url";

/** Monorepo root (agent-griffty/), independent of process.cwd(). */
export function repoRoot(): string {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
}

export function stateDir(): string {
  const override = process.env.GRIFFTY_STATE_DIR;
  if (override && path.isAbsolute(override)) return override;
  return path.resolve(repoRoot(), override ?? ".griffty");
}
