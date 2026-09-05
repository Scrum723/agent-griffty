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

function sumDays(world: WorldState | null, days: number): number {
  if (!world) return 0;
  const cut = Date.now() - days * 86400000;
  return world.kpiDaily
    .filter((k) => new Date(k.date).getTime() >= cut)
    .reduce((s, k) => s + k.harvestUsd, 0);
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

type MainTab = "queue" | "pnl" | "ads" | "wallets" | "alerts" | "social" | "platforms" | "music" | "growth";

const MAIN_TABS: { id: MainTab; label: string }[] = [
  { id: "queue", label: "Queue" },
  { id: "pnl", label: "P&L" },
  { id: "ads", label: "Ads" },
  { id: "wallets", label: "Wallets" },
  { id: "alerts", label: "Alerts" },
  { id: "social", label: "Social" },
  { id: "platforms", label: "Platforms" },
  { id: "music", label: "Music" },
  { id: "growth", label: "Growth" },
];

export function App() {
  const [world, setWorld] = useState<WorldState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<MainTab>("queue");
  const [queueTab, setQueueTab] = useState<"queue" | "rejected" | "events">("queue");
  const [queueFilter, setQueueFilter] = useState("All");

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

  const queueMap: Record<string, string> = {
    "All": "all",
    "Owned Media": "owned_media",
    "Panel Research": "panel_research",
    "DePIN": "depin",
    "Affiliate": "affiliate",
    "Music": "music_rights",
    "Social": "social_post"
  };

  const queue = useMemo(() => {
    let q = (world?.opportunities ?? []).filter((o) => o.decision === "queue" || o.decision === "execute" || o.decision === "watch");
    if (queueFilter !== "All") {
       q = q.filter(o => o.sourceClass === queueMap[queueFilter]);
    }
    return q;
  }, [world, queueFilter]);

  const rejected = useMemo(() => (world?.opportunities ?? []).filter((o) => o.decision === "reject"), [world]);

  return (
    <div className="shell">
      <a href="#main-content" className="skip-link">Skip to content</a>
      <header className="top">
        <div>
          <p className="eyebrow">Doc Weather · closed-loop growth</p>
          <h1>Agent Griffty</h1>
          <p className="sub">Scout · Qualifier · Risk · Executor · Treasury · Ads Ops</p>
        </div>
        <div className="actions">
          <button disabled={busy} onClick={() => void run("cycle")} aria-label="Run cycle">Run cycle</button>
          <button disabled={busy} className="ghost" onClick={() => void run("seed")} aria-label="Seed demo">Seed demo</button>
          <button disabled={busy} className="ghost danger" onClick={() => void simulateBreach()} aria-label="Simulate $95 floor breach">Simulate $95 floor</button>
        </div>
      </header>

      <div aria-live="polite">
        {error && <div className="banner error">{error}</div>}
        {world?.killSwitch.active && (
          <div className="banner error">Kill switch: {world.killSwitch.reasons.join(", ")}</div>
        )}
        {world && variance < 0 && (
          <div className="banner warn">
            Stretch KPI variance {money(variance)} (harvest {money(harvest)} vs {money(stretch)}).
            Logged as variance — not an incident.
          </div>
        )}
      </div>

      <div className="tabs" role="tablist" aria-label="Main Navigation" style={{ marginBottom: 20 }}>
        {MAIN_TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            aria-controls={`panel-${t.id}`}
            id={`tab-${t.id}`}
            className={tab === t.id ? "on" : ""}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div id="main-content" role="tabpanel" aria-labelledby={`tab-${tab}`}>
        <div className="grid">
          {tab === "queue" && (
            <section className="panel span-2">
              <div className="panel-h">
                <h2>Opportunity pipeline</h2>
                <div className="tabs" role="tablist" aria-label="Pipeline Tabs">
                  {(["queue", "rejected", "events"] as const).map((t) => (
                    <button
                      key={t}
                      role="tab"
                      aria-selected={queueTab === t}
                      className={queueTab === t ? "on" : ""}
                      onClick={() => setQueueTab(t)}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              
              {queueTab === "queue" && (
                <div style={{ marginBottom: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {Object.keys(queueMap).map(f => (
                    <button 
                      key={f} 
                      className={`pill ${queueFilter === f ? 'execute' : 'ghost'}`}
                      onClick={() => setQueueFilter(f)}
                      aria-label={`Filter by ${f}`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              )}

              {queueTab === "queue" && <OppTable rows={queue} />}
              {queueTab === "rejected" && <OppTable rows={rejected} />}
              {queueTab === "events" && (
                <table>
                  <thead>
                    <tr><th>Time</th><th>Event</th><th>Props</th></tr>
                  </thead>
                  <tbody>
                    {(world?.events ?? []).slice().reverse().slice(0, 40).map((e) => (
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
          )}

          {tab === "pnl" && (
            <section className="kpis span-2">
              <Kpi label="Harvest today" value={money(harvest)} hint={`stretch ${money(stretch)}`} />
              <Kpi label="7 / 30-day" value={money(sumDays(world, 7))} hint={`30d ${money(sumDays(world, 30))}`} />
              <Kpi label="Ads prepaid" value={money(combined)} hint={`floor ${money(floor)} · ${floorStatus}`} tone={floorStatus === "ok" ? "ok" : floorStatus === "watch" ? "warn" : "bad"} />
              <Kpi label="Operating cash" value={money(world?.cashUsd ?? 0)} hint="fiat → ads first" />
              <Kpi label="Queue" value={String(queue.length)} hint={`${rejected.length} rejected`} />
            </section>
          )}

          {tab === "ads" && (
            <section className="panel span-2">
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
                  <tr><th>Name</th><th>Kind</th><th>Status</th><th>ROAS</th></tr>
                </thead>
                <tbody>
                  {(world?.campaigns ?? []).map((c) => (
                    <tr key={c.id}>
                      <td>{c.name}</td>
                      <td>{c.kind}</td>
                      <td><span className={`pill ${c.status}`}>{c.status}</span></td>
                      <td className="mono">{c.kpis.roas ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          {tab === "wallets" && <PhantomPanel />}

          {tab === "alerts" && (
            <section className="panel span-2">
              <h2>Human gates / appointments</h2>
              <ul className="list">
                {(world?.tasks ?? []).filter((t) => t.blockedOn.length).map((t) => (
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
          )}

          {tab === "social" && (
            <section className="panel span-2">
              <h2>Social Connection Status</h2>
              <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
                {['X', 'TikTok', 'YouTube', 'Facebook', 'Instagram'].map(plat => (
                  <div key={plat} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span 
                      style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--good)' }} 
                      aria-label="Connected"
                    ></span>
                    {plat}
                  </div>
                ))}
              </div>

              <h2>Pending Post Drafts</h2>
              <ul className="rows">
                {(world?.socialPosts ?? []).filter(p => p.status === 'draft').map(p => (
                  <li key={p.id} style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start' }}>
                    <div>
                      <strong>{p.platform}</strong>
                      <span className="dim" style={{ marginLeft: 8 }}>{p.scheduledAt ? new Date(p.scheduledAt).toLocaleString() : 'No date'}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: 14 }}>{p.content.substring(0, 100)}{p.content.length > 100 ? '...' : ''}</p>
                    <div style={{ fontSize: 12 }}>
                      <span>Alt-text: {p.altText ? '✓' : '✗'}</span> | <span>Captions: {p.captions ? '✓' : '✗'}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => void api.approveSocialPost(p.id)} style={{ background: 'var(--good)' }} aria-label={`Approve draft on ${p.platform}`}>Approve</button>
                      <button onClick={() => void api.rejectSocialPost(p.id)} className="danger" aria-label={`Reject draft on ${p.platform}`}>Reject</button>
                    </div>
                  </li>
                ))}
                {(world?.socialPosts ?? []).filter(p => p.status === 'draft').length === 0 && <li className="dim">No pending drafts.</li>}
              </ul>

              <h2 className="mt">Growth Tracker</h2>
              <table>
                <thead>
                  <tr><th>Platform</th><th>This Week</th><th>Target</th><th>Status</th></tr>
                </thead>
                <tbody>
                  <tr><td>X</td><td>+120</td><td>1,000</td><td>⚠️ lagging</td></tr>
                  <tr><td>TikTok</td><td>+1,500</td><td>1,000</td><td>✅ on track</td></tr>
                </tbody>
              </table>
            </section>
          )}

          {tab === "platforms" && (
            <section className="panel span-2">
              <h2>Platforms</h2>
              <table>
                <thead>
                  <tr><th>Platform Name</th><th>Tier</th><th>Enrolled</th><th>KYC Status</th><th>Last Payout</th><th>Residual Value</th><th>Connector Flag</th></tr>
                </thead>
                <tbody>
                  {(world?.platforms ?? []).map(p => (
                    <tr key={p.id}>
                      <td>{p.name}</td>
                      <td>{p.tier}</td>
                      <td>{p.enrolled ? 'Yes' : 'No'}</td>
                      <td>{p.kycStatus}</td>
                      <td>{p.lastPayoutAt ? new Date(p.lastPayoutAt).toLocaleDateString() : '—'}</td>
                      <td>{money(p.residualValueUsd)}</td>
                      <td><span className="pill queue">API</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <h2 className="mt">IP Vault</h2>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span className="dim">Last audit: {world?.ipVault?.lastAuditAt ? new Date(world.ipVault.lastAuditAt).toLocaleString() : 'Never'}</span>
                <button onClick={() => void api.auditIpVault()} aria-label="Run IP Audit">Run IP Audit</button>
              </div>
              <table>
                <thead>
                  <tr><th>Title</th><th>ISRC</th><th>PRO Registered</th><th>Content ID</th><th>Platforms</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {(world?.ipVault?.tracks ?? []).map(t => (
                    <tr key={t.id}>
                      <td>{t.title}</td>
                      <td className="mono">{t.isrc ?? '—'}</td>
                      <td>{t.proWorkNumber ? 'Yes' : 'No'}</td>
                      <td>{t.contentIdRegistered ? 'Yes' : 'No'}</td>
                      <td>{t.platforms.join(', ')}</td>
                      <td><button className="ghost" aria-label={`View ${t.title}`}>View</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          {tab === "music" && (
            <section className="panel span-2">
              <h2>Royalty Sweep History</h2>
              <table>
                <thead>
                  <tr><th>Date</th><th>Platform</th><th>Amount</th><th>Settled</th></tr>
                </thead>
                <tbody>
                  {(world?.ledger ?? []).filter(l => l.asset === 'ROYALTY').map(l => (
                    <tr key={l.id}>
                      <td>{new Date(l.createdAt).toLocaleDateString()}</td>
                      <td>{l.platform}</td>
                      <td>{money(l.amountUsd)}</td>
                      <td>{l.settled ? 'Yes' : 'No'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <h2 className="mt">Pending Sync Deals</h2>
              <ul className="rows">
                {(world?.opportunities ?? []).filter(o => o.sourceClass === 'music_rights' && o.reasonCodes.includes('MUSIC_SYNC_HUMAN_GATE' as any)).map(o => (
                  <li key={o.id}>
                    <div>
                      <strong>{o.title}</strong>
                      <span className="mono dim" style={{ marginLeft: 8 }}>{money(o.expectedNetUsd)}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button style={{ background: 'var(--good)' }} aria-label={`Approve ${o.title}`}>Approve</button>
                      <button className="danger" aria-label={`Reject ${o.title}`}>Reject</button>
                    </div>
                  </li>
                ))}
                {(world?.opportunities ?? []).filter(o => o.sourceClass === 'music_rights' && o.reasonCodes.includes('MUSIC_SYNC_HUMAN_GATE' as any)).length === 0 && (
                  <li className="dim">No pending sync deals.</li>
                )}
              </ul>

              <h2 className="mt">DistroKid Bank Balance</h2>
              <div className="banner warn">Connect DistroKid to see live balance</div>
            </section>
          )}

          {tab === "growth" && (
            <section className="panel span-2">
              <h2>Growth Summary</h2>
              <div className="kpis">
                <Kpi label="X" value="+120" hint="target 1,000" tone="warn" />
                <Kpi label="TikTok" value="+1,500" hint="target 1,000" tone="ok" />
                <Kpi label="YouTube" value="+40" hint="target 1,000" tone="bad" />
                <Kpi label="Instagram" value="+210" hint="target 1,000" tone="warn" />
              </div>

              <h2 className="mt">Content Calendar</h2>
              <ul className="rows">
                {(world?.socialPosts ?? []).filter(p => p.status === 'scheduled' || p.status === 'draft').sort((a,b) => (a.scheduledAt || '').localeCompare(b.scheduledAt || '')).map(p => (
                  <li key={p.id}>
                    <span className="dim">{p.scheduledAt ? new Date(p.scheduledAt).toLocaleDateString() : 'Unscheduled'}</span>
                    <span>{p.platform} — {p.status}</span>
                  </li>
                ))}
              </ul>

              <h2 className="mt">Top Performing Post Types</h2>
              <table>
                <thead>
                  <tr><th>Format</th><th>Engagement Rate</th><th>Conversion</th></tr>
                </thead>
                <tbody>
                  <tr><td>Short-form Video</td><td>8.5%</td><td>1.2%</td></tr>
                  <tr><td>Thread / Carousel</td><td>4.2%</td><td>0.8%</td></tr>
                  <tr><td>Static Image</td><td>1.5%</td><td>0.2%</td></tr>
                </tbody>
              </table>

              <h2 className="mt">Optimal Posting Times</h2>
              <table>
                <thead>
                  <tr><th>Platform</th><th>Best Days</th><th>Best Time</th></tr>
                </thead>
                <tbody>
                  <tr><td>X</td><td>Tue, Wed, Thu</td><td>9:00 AM</td></tr>
                  <tr><td>TikTok</td><td>Tue, Thu, Fri</td><td>10:00 AM</td></tr>
                  <tr><td>Instagram</td><td>Mon, Wed, Fri</td><td>11:00 AM</td></tr>
                </tbody>
              </table>
            </section>
          )}
        </div>
      </div>

      <footer>
        <span>cycle {world?.cycleId ?? "—"}</span>
        <span>updated {world?.updatedAt ?? "—"}</span>
        <span>dark web disabled · seed phrases never stored</span>
      </footer>
    </div>
  );
}

function OppTable({ rows }: { rows: WorldState["opportunities"] }) {
  return (
    <table>
      <thead>
        <tr>
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
            <td>
              {o.source}
              <span className="pill watch" aria-label={`Source class: ${o.sourceClass}`}>{o.sourceClass}</span>
            </td>
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
            <td colSpan={6} className="dim">
              No rows.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
