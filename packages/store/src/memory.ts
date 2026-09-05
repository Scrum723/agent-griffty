import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { WorldState } from "@griffty/domain";
import { emptyWorld } from "./empty.js";

export class JsonFileStore {
  readonly kind = "file" as const;
  constructor(private readonly dir: string) {}

  private file(): string {
    return path.join(this.dir, "state.json");
  }

  async load(): Promise<WorldState> {
    try {
      const raw = await readFile(this.file(), "utf8");
      return JSON.parse(raw) as WorldState;
    } catch {
      return emptyWorld();
    }
  }

  async save(world: WorldState): Promise<void> {
    await mkdir(this.dir, { recursive: true });
    await writeFile(this.file(), JSON.stringify(world, null, 2), "utf8");
  }
}
