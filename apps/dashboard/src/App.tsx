import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "./api";
import { PhantomPanel } from "./PhantomPanel";
import type { WorldState } from "./types";

function money(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function adsTotal(world: WorldState): number {
  return world.adsAccounts.reduce((s, a) => s + a.balanceUsd, 0);
}

export function App() {
  const [world, setWorld] = useState<WorldState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<"queue" | "rejected" | "events">("queue");

  const refresh = useCallback(async () => {
    try {
      setWorld(await api.state());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "API unreachable. Start the server on :8787.");
    }
  }, []);

  useEffect(() => {
    void refresh();
    const t = setInterval(() => void refresh(), 8000);
    return () => clearInterval(t);
  }, [refresh]);

  async function run(kind: "cycle" | "seed") {
    setBusy(true);
    try {
      if (kind === "seed") await api.seed();
      else await api.cycle();
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "request failed");
    } finally {
      setBusy(false);
    }
  }

  async function simulateBreach() {
    setBusy(true);
    try {
      await api.setAds(95);
      await api.cycle();
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  const harvest = world?.kpiDaily.at(-1)?.harvestUsd ?? 0;
  const stretch = world?.policy.stretchTargetUsd ?? 50;
  const variance = harvest - stretch;
  const floor = world?.policy.adsFloorUsd ?? 100;
  const combined = world ? adsTotal(world) : 0;
  const floorStatus = world?.adsAccounts[0]?.status ?? "ok";

  const queue = useMemo(
    () =>
      (world?.opportunities ?? []).filter((o) => o.decision === "queue" || o.decision === "execute"),
    [world],
  );
  const rejected = useMemo(
    () => (world?.opportunities ?? []).filter((o) => o.decision === "reject"),
    [world],
  );
  const watching = useMemo(
    () => (world?.opportunities ?? []).filter((o) => o.decision === "watch"),
    [world],
  );

  return (
    <div className="shell">
      <header className="top">
        <div>
          <p className="eyebrow">Doc Weather · closed-loop growth</p>
          <h1>Agent Griffty</h1>
          <p className="sub">
            Scout · Qualifier · Risk · Executor · Treasury · Ads Ops
          </p>
        </div>
        <div className="actions">
          <button disabled={busy} onClick={() => void run("cycle")}>
            Run cycle
          </button>
          <button disabled={busy} className="ghost" onClick={() => void run("seed")}>
            Seed demo
          </button>
          <button disabled={busy} className="ghost danger" onClick={() => void simulateBreach()}>
            Simulate $95 floor
          </button>
        </div>
      </header>

      {error && <div className="banner error">{error}</div>}
      {world?.killSwitch.active && (
        <div className="banner error">
          Kill switch: {world.killSwitch.reasons.join(", ")}
        </div>
      )}
      {world && variance < 0 && (
        <div className="banner warn">
          Stretch KPI variance {money(variance)} (harvest {money(harvest)} vs {money(stretch)}).
          Logged as variance — not an incident.
        </div>
      )}

      <section className="kpis">
        <Kpi label="Harvest today" value={money(harvest)} hint={`stretch ${money(stretch)}`} />
        <Kpi
          label="7 / 30-day"
          value={money(sumDays(world, 7))}
          hint={`30d ${money(sumDays(world, 30))}`}
        />
        <Kpi
          label="Ads prepaid"
          value={money(combined)}
          hint={`floor ${money(floor)} · ${floorStatus}`}
          tone={floorStatus === "ok" ? "ok" : floorStatus === "watch" ? "warn" : "bad"}
        />
        <Kpi label="Operating cash" value={money(world?.cashUsd ?? 0)} hint="fiat → ads first" />
        <Kpi
          label="Queue"
          value={String(queue.length)}
          hint={`${rejected.length} rejected · ${watching.length} watch`}
        />
      </section>

      <div className="grid">
        <section className="panel span-2">
          <div className="panel-h">
            <h2>Opportunity pipeline</h2>
            <div className="tabs">
              {(["queue", "rejected", "events"] as const).map((t) => (
                <button key={t} className={tab === t ? "on" : ""} onClick={() => setTab(t)}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          {tab === "queue" && <OppTable rows={[...queue, ...watching]} />}
          {tab === "rejected" && <OppTable rows={rejected} />}
          {tab === "events" && (
            <table>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Event</th>
                  <th>Props</th>
                </tr>
              </thead>
              <tbody>
                {(world?.events ?? [])
                  .slice()
                  .reverse()
                  .slice(0, 40)
                  .map((e) => (
                    <tr key={e.id}>
                      <td className="mono">{e.ts.slice(11, 19)}</td>
                      <td>{e.name}</td>
                      <td className="mono dim">{JSON.stringify(e.props)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="panel">
          <h2>Ads accounts</h2>
          <ul className="rows">
            {(world?.adsAccounts ?? []).map((a) => (
              <li key={a.platform}>
                <span>{a.platform}</span>
                <strong>{money(a.balanceUsd)}</strong>
              </li>
            ))}
          </ul>
          <h2 className="mt">Campaigns</h2>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Kind</th>
                <th>Status</th>
                <th>ROAS</th>
              </tr>
            </thead>
            <tbody>
              {(world?.campaigns ?? []).map((c) => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td>{c.kind}</td>
                  <td>
                    <span className={`pill ${c.status}`}>{c.status}</span>
                  </td>
                  <td className="mono">{c.kpis.roas ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <PhantomPanel />

        <section className="panel">
          <h2>Wallets (watch-only)</h2>
          <ul className="rows">
            {(world?.wallets ?? []).map((w) => (
              <li key={w.id}>
                <span>
                  {w.role}
                  <small className="dim"> {w.address}</small>
                </span>
                <strong>
                  {w.assets.map((a) => `${a.amount} ${a.symbol}`).join(", ") || "empty"}
                </strong>
              </li>
            ))}
          </ul>
          <p className="fine">
            No private keys in this console. Verified airdrops queue for a human signature on the
            burner wallet. Auto-claim is off.
          </p>
        </section>

        <section className="panel">
          <h2>Human gates / appointments</h2>
          <ul className="list">
            {(world?.tasks ?? [])
              .filter((t) => t.blockedOn.length)
              .map((t) => (
                <li key={t.id}>
                  <span className="pill blocked">blocked</span> {t.blockedOn.join(" · ")}
                </li>
              ))}
            {(world?.tasks ?? []).filter((t) => t.blockedOn.length).length === 0 && (
              <li className="dim">No pending KYC or signature gates.</li>
            )}
          </ul>
          <h2 className="mt">Alerts</h2>
          <ul className="list">
            {(world?.alerts ?? []).map((a) => (
              <li key={a.id}>
                <span className={`pill ${a.severity}`}>{a.code}</span> {a.message}
              </li>
            ))}
            {(world?.alerts ?? []).length === 0 && <li className="dim">No anomalies.</li>}
          </ul>
        </section>
      </div>

      <footer>
        <span>cycle {world?.cycleId ?? "—"}</span>
        <span>updated {world?.updatedAt ?? "—"}</span>
        <span>dark web disabled · seed phrases never stored</span>
      </footer>
    </div>
  );
}

function Kpi(props: { label: string; value: string; hint: string; tone?: "ok" | "warn" | "bad" }) {
  return (
    <article className={`kpi ${props.tone ?? ""}`}>
      <p>{props.label}</p>
      <strong>{props.value}</strong>
      <small>{props.hint}</small>
    </article>
  );
}

function OppTable({
  rows,
}: {
  rows: WorldState["opportunities"];
}) {
  return (
    <table>
      <thead>
        <tr>
          <th>Score</th>
          <th>Source</th>
          <th>Title</th>
          <th>EV</th>
          <th>Time</th>
          <th>Decision</th>
          <th>Codes</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((o) => (
          <tr key={o.id}>
            <td className="mono">{o.total ?? "—"}</td>
            <td>{o.source}</td>
            <td>
              {o.title}
              {o.humanGate ? <span className="pill blocked">gate</span> : null}
            </td>
            <td className="mono">{money(o.expectedNetUsd)}</td>
            <td className="mono">{o.timeEstimateMinutes ?? "—"}m</td>
            <td>
              <span className={`pill ${o.decision}`}>{o.decision}</span>
            </td>
            <td className="mono dim">{o.reasonCodes.slice(0, 3).join(", ")}</td>
          </tr>
        ))}
        {rows.length === 0 && (
          <tr>
            <td colSpan={7} className="dim">
              No rows. Run a cycle.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

function sumDays(world: WorldState | null, days: number): number {
  if (!world) return 0;
  const cut = Date.now() - days * 86400000;
  return world.kpiDaily
    .filter((k) => new Date(k.date).getTime() >= cut)
    .reduce((s, k) => s + k.harvestUsd, 0);
}
