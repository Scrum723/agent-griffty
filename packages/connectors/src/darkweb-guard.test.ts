import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { mockScoutListings } from "./mock.js";

const FORBIDDEN_HOST_FRAGMENTS = [".onion", "onion.to", "darkweb", "hidden-service"];

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === "dist") continue;
    const p = path.join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) out.push(...walk(p));
    else if (/\.(ts|js|json|md)$/.test(name)) out.push(p);
  }
  return out;
}

describe("no dark-web or Tor dependencies", () => {
  it("mock listings use https public hosts", () => {
    for (const l of mockScoutListings()) {
      expect(l.url.startsWith("https://")).toBe(true);
      expect(l.url.includes(".onion")).toBe(false);
    }
  });

  it("connector package has no onion/tor strings or socks tor agents", () => {
    const files = walk(path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."));
    for (const f of files) {
      if (f.endsWith("darkweb-guard.test.ts")) continue;
      const text = readFileSync(f, "utf8").toLowerCase();
      for (const frag of FORBIDDEN_HOST_FRAGMENTS) {
        expect(text.includes(frag), `${f} contains ${frag}`).toBe(false);
      }
      expect(text.includes("socks5h://")).toBe(false);
      expect(text.includes("tor-proxy")).toBe(false);
    }
  });
});
