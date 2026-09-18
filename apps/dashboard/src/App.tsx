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

type MainTab = "home" | "invest" | "profile" | "queue" | "pnl" | "ads" | "wallets" | "alerts" | "social" | "platforms" | "music" | "growth";

const MAIN_TABS: { id: MainTab; label: string }[] = [
  { id: "home", label: "Home" },
  { id: "invest", label: "Invest" },
  { id: "profile", label: "My profile" },
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

function isIosSafari(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const ios = /iPad|iPhone|iPod/.test(ua);
  const standalone = (window.navigator as { standalone?: boolean }).standalone === true;
  return ios && !standalone;
}

export function App() {
  const [world, setWorld] = useState<WorldState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<MainTab>("home");
  const [showIos, setShowIos] = useState(isIosSafari);
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
          <p className="eyebrow">Doc Weather · your growth desk</p>
          <h1>Griffty</h1>
          <p className="sub">See how campaigns and money are doing. Tap a button to act — we’ll ask you to confirm first.</p>
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
        {showIos && (
          <div className="banner warn">
            iPhone: tap Share → Add to Home Screen. Griffty opens like an app (no Safari chrome).
            <button className="ghost" type="button" onClick={() => setShowIos(false)} style={{ marginLeft: 8 }}>
              Dismiss
            </button>
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

      {tab === "home" && world && (
        <HomeDesk world={world} refresh={refresh} busy={busy} setBusy={setBusy} setError={setError} />
      )}
      {tab === "invest" && <InvestDesk setError={setError} />}
      {tab === "profile" && <ProfilePage setError={setError} />}

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
        <span>standalone app · not Grok · not Grok Build</span>
      </footer>
    </div>
  );
}

function InvestDesk(props: { setError: (v: string | null) => void }) {
  const [data, setData] = useState<Awaited<ReturnType<typeof api.investments>> | null>(null);
  const load = () => {
    void api
      .investments()
      .then(setData)
      .catch((e) => props.setError(e instanceof Error ? e.message : "investments failed"));
  };
  useEffect(() => {
    load();
  }, []);
  if (!data) return <p className="dim">Loading investment desk…</p>;
  return (
    <section className="panel span-2">
      <h2>Invest — $115 / day objective</h2>
      <p className="dim">
        Griffty scores projects on docs, identifiable team, liquidity, volume trend, and user/holder growth.
        Guaranteed-return pitches are rejected. Default stops: −{data.defaultStopPct}% / +{data.defaultTakePct}%. You can change them before any capital is used. On-chain still needs your wallet Approve.
      </p>
      <div className="kpis">
        <Kpi label="Today" value={money(data.harvestTodayUsd)} hint={`target ${money(data.dailyTargetUsd)}`} tone={data.harvestTodayUsd >= data.dailyTargetUsd ? "ok" : "warn"} />
        <Kpi label="Gap" value={money(data.gapUsd)} hint="still to go today" />
      </div>
      <ul className="rows">
        {data.investments.map((inv) => (
          <li key={inv.id} className="camp-row">
            <div>
              <strong>{inv.name}</strong> <span className={`pill ${inv.eligible ? "ok" : "watch"}`}>{inv.healthScore}/100</span>
              <div className="dim">
                {inv.kind} · ${inv.proposedUsd} · {inv.status}
                <br />
                {inv.stopNote} {inv.takeNote}
              </div>
            </div>
            <div className="camp-actions">
              <button
                className="ghost"
                onClick={() => {
                  const sl = Number(window.prompt("Stop loss %", String(inv.stopLossPct)));
                  const tp = Number(window.prompt("Take profit %", String(inv.takeProfitPct)));
                  if (!Number.isFinite(sl) || !Number.isFinite(tp)) return;
                  void api.setInvestmentStops(inv.id, sl, tp).then(load);
                }}
              >
                Adjust stops
              </button>
              {inv.eligible && inv.status === "proposed" && (
                <button
                  onClick={() => {
                    if (!window.confirm(`Accept ${inv.name} at −${inv.stopLossPct}% / +${inv.takeProfitPct}%? Wallet sign is still yours.`)) return;
                    void api.acceptInvestment(inv.id).then(load);
                  }}
                >
                  I like these
                </button>
              )}
              {inv.status === "proposed" && (
                <button className="ghost" onClick={() => void api.rejectInvestment(inv.id).then(load)}>
                  Pass
                </button>
              )}
            </div>
          </li>
        ))}
        {data.investments.length === 0 && (
          <li className="dim">No theses yet. Ask Grok in chat to score a project, or wait for Griffty to propose one that clears the health screen.</li>
        )}
      </ul>
    </section>
  );
}

function HomeDesk(props: {
  world: WorldState;
  refresh: () => Promise<void>;
  busy: boolean;
  setBusy: (v: boolean) => void;
  setError: (v: string | null) => void;
}) {
  const { world, refresh, busy, setBusy, setError } = props;
  const ads = adsTotal(world);
  const harvest = world.kpiDaily.at(-1)?.harvestUsd ?? 0;
  const maxH = Math.max(1, ...world.kpiDaily.map((k) => k.harvestUsd));

  async function act(label: string, fn: () => Promise<unknown>) {
    if (!window.confirm(`${label}? This changes live Griffty data.`)) return;
    setBusy(true);
    try {
      await fn();
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="span-2">
      <section className="kpis">
        <Kpi
          label="Today vs $115"
          value={money(harvest)}
          hint={`objective ${money(world.policy.stretchTargetUsd)} (target, not a promise)`}
          tone={harvest >= (world.policy.stretchTargetUsd || 115) ? "ok" : "warn"}
        />
        <Kpi label="Treasury cash" value={money(world.cashUsd)} hint="operating cash on hand" />
        <Kpi
          label="Ads prepaid"
          value={money(ads)}
          hint={`floor ${money(world.policy.adsFloorUsd)}`}
          tone={world.adsAccounts[0]?.status === "ok" ? "ok" : "warn"}
        />
        <Kpi label="Live campaigns" value={String(world.campaigns.filter((c) => c.status === "active").length)} hint={`${world.campaigns.length} total`} />
      </section>
      <section className="panel mt">
        <h2>Last 14 days</h2>
        <div className="bars" aria-hidden="true">
          {world.kpiDaily.slice(-14).map((k) => (
            <div key={k.date} className="bar-col">
              <div className="bar" style={{ height: `${Math.max(8, (k.harvestUsd / maxH) * 90)}px` }} />
              <span>{k.date.slice(5)}</span>
            </div>
          ))}
          {world.kpiDaily.length === 0 && <p className="dim">No harvest yet. Run a cycle to fill this chart.</p>}
        </div>
      </section>
      <section className="panel mt">
        <h2>Campaigns — tap to pause, resume, or change daily budget</h2>
        <ul className="rows">
          {world.campaigns.map((c) => (
            <li key={c.id} className="camp-row">
              <div>
                <strong>{c.name}</strong>
                <div className="dim">
                  {c.platform} · ${c.dailyBudgetUsd}/day · {c.status}
                </div>
              </div>
              <div className="camp-actions">
                {c.status === "active" ? (
                  <button disabled={busy} className="ghost" onClick={() => void act(`Pause ${c.name}`, () => api.pauseCampaign(c.id))}>
                    Pause
                  </button>
                ) : (
                  <button disabled={busy} onClick={() => void act(`Resume ${c.name}`, () => api.resumeCampaign(c.id))}>
                    Resume
                  </button>
                )}
                <button
                  disabled={busy}
                  className="ghost"
                  onClick={() => {
                    const raw = window.prompt(`New daily budget for ${c.name} (USD)`, String(c.dailyBudgetUsd));
                    if (raw == null) return;
                    const n = Number(raw);
                    if (!Number.isFinite(n) || n < 0) return;
                    void act(`Set ${c.name} budget to $${n}`, () => api.setBudget(c.id, n));
                  }}
                >
                  Budget
                </button>
              </div>
            </li>
          ))}
        </ul>
        <div className="camp-actions mt">
          <button disabled={busy} onClick={() => void act("Send a test push notification", () => api.pushNotify("Griffty", "Test ping from your dashboard"))}>
            Send test notification
          </button>
          <button disabled={busy} className="ghost" onClick={() => void act("Refresh analytics", () => api.analytics(7).then(() => undefined))}>
            Refresh analytics
          </button>
        </div>
      </section>
    </div>
  );
}

function ProfilePage(props: { setError: (v: string | null) => void }) {
  const [profile, setProfile] = useState<{ name: string; avatar: string; bio: string; notifications: { notifyEmail: boolean; notifyPush: boolean; notifySms: boolean } } | null>(null);
  const [saved, setSaved] = useState("");
  useEffect(() => {
    void api.me().then((r) => r.profile && setProfile(r.profile));
  }, []);
  if (!profile) return <p className="dim">Loading your profile…</p>;
  return (
    <section className="panel span-2">
      <h2>My profile</h2>
      <p className="dim">This is only yours. Other people on this device get their own desk after they enter a name.</p>
      <label className="field">
        Name
        <input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
      </label>
      <label className="field">
        Avatar URL (optional)
        <input value={profile.avatar} onChange={(e) => setProfile({ ...profile, avatar: e.target.value })} placeholder="https://…" />
      </label>
      {profile.avatar ? <img src={profile.avatar} alt="" className="avatar" /> : null}
      <label className="field">
        Bio
        <textarea value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} rows={3} />
      </label>
      <fieldset className="field">
        <legend>Notifications</legend>
        <label>
          <input type="checkbox" checked={profile.notifications.notifyEmail} onChange={(e) => setProfile({ ...profile, notifications: { ...profile.notifications, notifyEmail: e.target.checked } })} /> Email
        </label>
        <label>
          <input type="checkbox" checked={profile.notifications.notifyPush} onChange={(e) => setProfile({ ...profile, notifications: { ...profile.notifications, notifyPush: e.target.checked } })} /> Push
        </label>
        <label>
          <input type="checkbox" checked={profile.notifications.notifySms} onChange={(e) => setProfile({ ...profile, notifications: { ...profile.notifications, notifySms: e.target.checked } })} /> SMS
        </label>
      </fieldset>
      <button
        type="button"
        onClick={() => {
          void api
            .saveProfile(profile)
            .then((r) => {
              setProfile(r.profile);
              setSaved("Saved.");
            })
            .catch((e) => props.setError(e instanceof Error ? e.message : "Save failed"));
        }}
      >
        Save profile
      </button>
      {saved && <span className="dim"> {saved}</span>}
    </section>
  );
}

function OppTable({ rows }: { rows: WorldState["opportunities"] }) {
  return (
    <table>
      <thead>
        <tr>
          <th>Source</th>
          <th>Title & Portal</th>
          <th>EV</th>
          <th>Time</th>
          <th>Decision</th>
          <th>Codes</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((o) => (
          <tr key={o.id}>
            <td>
              <div style={{ fontWeight: 600 }}>{o.source}</div>
              <span className="pill watch" aria-label={`Source class: ${o.sourceClass}`}>{o.sourceClass}</span>
            </td>
            <td>
              {o.url ? (
                <a
                  href={o.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#38bdf8", textDecoration: "underline", fontWeight: 600, display: "inline-block", marginRight: 6 }}
                  aria-label={`Open ${o.title} at ${o.url}`}
                >
                  {o.title} ↗
                </a>
              ) : (
                <span>{o.title}</span>
              )}
              {o.humanGate ? <span className="pill blocked">GATE</span> : null}
            </td>
            <td className="mono">{money(o.expectedNetUsd)}</td>
            <td className="mono">{o.timeEstimateMinutes ?? "—"}m</td>
            <td>
              <span className={`pill ${o.decision}`}>{o.decision}</span>
            </td>
            <td className="mono dim" style={{ fontSize: "0.85em" }}>{o.reasonCodes.slice(0, 3).join(", ")}</td>
            <td>
              {o.url && (
                <a
                  href={o.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pill execute"
                  style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 8px", whiteSpace: "nowrap" }}
                  aria-label={`Open portal for ${o.title}`}
                >
                  Open ↗
                </a>
              )}
            </td>
          </tr>
        ))}
        {rows.length === 0 && (
          <tr>
            <td colSpan={7} className="dim">
              No rows.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
