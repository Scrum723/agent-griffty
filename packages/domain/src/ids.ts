import { randomBytes } from "node:crypto";

export function newId(prefix = ""): string {
  const hex = randomBytes(8).toString("hex");
  return prefix ? `${prefix}_${hex}` : hex;
}

export function cycleId(at: Date = new Date()): string {
  const iso = at.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  return iso;
}

export function todayStamp(at: Date = new Date()): string {
  return at.toISOString().slice(0, 10);
}

export function canonicalKey(source: string, externalId: string): string {
  return `${source.trim().toLowerCase()}::${externalId.trim()}`;
}
