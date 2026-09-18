import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { newId } from "@griffty/domain";
import {
  applyStops,
  thesisFromInputs,
  type HealthInputs,
  type InvestmentThesis,
} from "@griffty/scoring";
import { stateDir } from "./paths.js";

function file(): string {
  return path.join(stateDir(), "investments.json");
}

async function loadAll(): Promise<InvestmentThesis[]> {
  try {
    return JSON.parse(await readFile(file(), "utf8")) as InvestmentThesis[];
  } catch {
    return [];
  }
}

async function saveAll(rows: InvestmentThesis[]): Promise<void> {
  await mkdir(stateDir(), { recursive: true });
  await writeFile(file(), JSON.stringify(rows, null, 2), "utf8");
}

export async function listInvestments(): Promise<InvestmentThesis[]> {
  return loadAll();
}

export async function proposeInvestment(input: HealthInputs, proposedUsd: number): Promise<InvestmentThesis> {
  const row = thesisFromInputs(newId("inv"), input, proposedUsd);
  const rows = await loadAll();
  rows.unshift(row);
  await saveAll(rows.slice(0, 100));
  return row;
}

export async function setInvestmentStops(id: string, stopLossPct: number, takeProfitPct: number): Promise<InvestmentThesis | null> {
  const rows = await loadAll();
  const i = rows.findIndex((r) => r.id === id);
  if (i < 0) return null;
  rows[i] = applyStops(rows[i], stopLossPct, takeProfitPct);
  await saveAll(rows);
  return rows[i];
}

export async function setInvestmentStatus(id: string, status: InvestmentThesis["status"]): Promise<InvestmentThesis | null> {
  const rows = await loadAll();
  const i = rows.findIndex((r) => r.id === id);
  if (i < 0) return null;
  rows[i] = { ...rows[i], status, updatedAt: new Date().toISOString() };
  await saveAll(rows);
  return rows[i];
}
