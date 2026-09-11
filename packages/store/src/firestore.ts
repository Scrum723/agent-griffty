import { applicationDefault, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, type Firestore, type WriteBatch } from "firebase-admin/firestore";
import type { WorldState } from "@griffty/domain";
import { emptyWorld } from "./empty.js";
import { cloudProjectId } from "./env.js";

export interface GrifftyStore {
  kind: "file" | "firestore";
  load(): Promise<WorldState>;
  save(world: WorldState): Promise<void>;
}

function db(): Firestore {
  const projectId = cloudProjectId();
  if (!projectId) throw new Error("GCLOUD_PROJECT is not set");
  if (!getApps().length) {
    initializeApp({
      credential: applicationDefault(),
      projectId,
    });
  }
  return getFirestore();
}

function stripUndefined<T>(value: T): T {
  if (value === undefined) return value;
  if (Array.isArray(value)) return value.map((v) => stripUndefined(v)) as T;
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v === undefined) continue;
      out[k] = stripUndefined(v);
    }
    return out as T;
  }
  return value;
}

async function commitInChunks(firestore: Firestore, mutators: ((batch: WriteBatch) => void)[]): Promise<void> {
  const CHUNK = 400;
  for (let i = 0; i < mutators.length; i += CHUNK) {
    const batch = firestore.batch();
    for (const m of mutators.slice(i, i + CHUNK)) m(batch);
    await batch.commit();
  }
}

export class FirestoreStore implements GrifftyStore {
  kind = "firestore" as const;

  async load(): Promise<WorldState> {
    const firestore = db();
    const metaSnap = await firestore.doc("world/current").get();
    const base = emptyWorld();
    if (!metaSnap.exists) {
      const stateFile = process.env.GRIFFTY_SEED_FILE ?? ".griffty/state.json";
      try {
        const { existsSync, readFileSync } = await import("node:fs");
        if (existsSync(stateFile)) {
          const raw = JSON.parse(readFileSync(stateFile, "utf-8")) as WorldState;
          await this.save(raw);
          return raw;
        }
      } catch {
        // fallback to base empty world
      }
      return base;
    }
    const meta = metaSnap.data() as Partial<WorldState>;

    const pull = async <T,>(name: string): Promise<T[]> => {
      const snap = await firestore.collection(name).get();
      return snap.docs.map((d) => d.data() as T);
    };

    const [
      platforms,
      opportunities,
      tasks,
      ledger,
      adsAccounts,
      wallets,
      campaigns,
      creatives,
      alerts,
      events,
      kpiDaily,
      signIntents,
      socialPosts,
      notifications,
    ] = await Promise.all([
      pull("platforms"),
      pull("opportunities"),
      pull("tasks"),
      pull("ledger"),
      pull("adsAccounts"),
      pull("wallets"),
      pull("campaigns"),
      pull("creatives"),
      pull("alerts"),
      pull("events"),
      pull("kpiDaily"),
      pull("signIntents"),
      pull("socialPosts"),
      pull("notifications"),
    ]);

    return {
      ...base,
      ...meta,
      operator: (meta.operator as WorldState["operator"]) ?? base.operator,
      policy: (meta.policy as WorldState["policy"]) ?? base.policy,
      platforms: platforms.length ? (platforms as WorldState["platforms"]) : base.platforms,
      opportunities: opportunities as WorldState["opportunities"],
      tasks: tasks as WorldState["tasks"],
      ledger: ledger as WorldState["ledger"],
      adsAccounts: adsAccounts.length ? (adsAccounts as WorldState["adsAccounts"]) : base.adsAccounts,
      wallets: wallets.length ? (wallets as WorldState["wallets"]) : base.wallets,
      campaigns: campaigns.length ? (campaigns as WorldState["campaigns"]) : base.campaigns,
      creatives: creatives as WorldState["creatives"],
      alerts: alerts as WorldState["alerts"],
      events: (events as WorldState["events"]).sort((a, b) => a.ts.localeCompare(b.ts)),
      kpiDaily: kpiDaily as WorldState["kpiDaily"],
      signIntents: (signIntents as WorldState["signIntents"]) ?? [],
      socialPosts: (socialPosts as WorldState["socialPosts"]) ?? [],
      notifications: (notifications as WorldState["notifications"]) ?? [],
      ipVault: (meta.ipVault as WorldState["ipVault"]) ?? base.ipVault ?? { tracks: [], lastAuditAt: null },
    };
  }

  async save(world: WorldState): Promise<void> {
    const firestore = db();
    const mutators: ((batch: WriteBatch) => void)[] = [];

    const put = (col: string, id: string, data: unknown) => {
      mutators.push((batch) => {
        batch.set(firestore.collection(col).doc(id), stripUndefined(data) as object);
      });
    };

    put("operators", world.operator.uid, world.operator);
    for (const p of world.platforms) put("platforms", p.id, p);
    for (const o of world.opportunities) put("opportunities", o.id, o);
    for (const t of world.tasks) put("tasks", t.id, t);
    for (const e of world.ledger) put("ledger", e.id, e);
    for (const a of world.adsAccounts) put("adsAccounts", a.platform, a);
    for (const w of world.wallets) {
      const rec = w as unknown as Record<string, unknown>;
      for (const banned of ["privateKey", "seed", "mnemonic", "secret", "recoveryPhrase"]) {
        if (rec[banned]) throw new Error("Wallet document contains forbidden private material");
      }
      put("wallets", w.id, w);
    }
    for (const c of world.campaigns) put("campaigns", c.id, c);
    for (const c of world.creatives) put("creatives", c.id, c);
    for (const a of world.alerts) put("alerts", a.id, a);
    for (const e of world.events) put("events", e.id, { ...e, name: e.name, ts: e.ts, uid: e.uid, cycleId: e.cycleId, props: e.props });
    for (const k of world.kpiDaily) put("kpiDaily", k.date, k);
    for (const s of world.signIntents ?? []) put("signIntents", s.id, s);
    for (const sp of world.socialPosts ?? []) put("socialPosts", sp.id, sp);
    for (const n of world.notifications ?? []) put("notifications", n.id, n);

    mutators.push((batch) => {
      batch.set(
        firestore.doc("world/current"),
        stripUndefined({
          operator: world.operator,
          policy: world.policy,
          cashUsd: world.cashUsd,
          killSwitch: world.killSwitch,
          cycleId: world.cycleId,
          updatedAt: world.updatedAt,
          ipVault: world.ipVault ?? { tracks: [], lastAuditAt: null },
          store: "firestore",
          projectId: cloudProjectId(),
        }),
      );
    });

    await commitInChunks(firestore, mutators);
  }
}
