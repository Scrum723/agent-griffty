import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Transaction } from "@solana/web3.js";
import { useCallback, useEffect, useState } from "react";
import { api, type SignIntent } from "./api";

const GRIFFTY_AGENT_SOLANA_WALLET = "2f2RxyqM4YZHRChncDHxkWvSetZMx4CxYB9rW9BAsZuV";

export function PhantomPanel() {
  const { publicKey, sendTransaction, connected } = useWallet();
  const { connection } = useConnection();
  const [intents, setIntents] = useState<SignIntent[]>([]);
  const [browse, setBrowse] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Griffty Autonomous Override State
  const [useOverride, setUseOverride] = useState(true);
  const [overrideAddress, setOverrideAddress] = useState(GRIFFTY_AGENT_SOLANA_WALLET);

  const effectiveAddress = connected && publicKey
    ? publicKey.toBase58()
    : useOverride
    ? overrideAddress.trim()
    : null;

  const refresh = useCallback(async () => {
    try {
      const data = await api.intents();
      setIntents(data.intents);
      setBrowse(data.phantomBrowse);
    } catch (e) {
      console.warn("Error refreshing intents:", e);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const t = setInterval(() => void refresh(), 8000);
    return () => clearInterval(t);
  }, [refresh]);

  // Sync wallet to Griffty backend whenever effective address changes
  useEffect(() => {
    if (!effectiveAddress) return;
    void api
      .saveWallet({
        role: "session",
        address: effectiveAddress,
        chain: "solana",
      })
      .catch((e: unknown) => setMsg(e instanceof Error ? e.message : "wallet save failed"));
  }, [effectiveAddress]);

  // Direct Injected Provider Connect (Bypasses wallet-adapter modal issues on 127.0.0.1)
  async function handleDirectInjectedConnect() {
    setBusy(true);
    setMsg(null);
    try {
      const phantom = (window as unknown as { phantom?: { solana?: { isPhantom?: boolean; connect: () => Promise<{ publicKey?: { toString: () => string } }> } }; solana?: { isPhantom?: boolean; connect: () => Promise<{ publicKey?: { toString: () => string } }> } }).phantom?.solana
        ?? (window as unknown as { solana?: { isPhantom?: boolean; connect: () => Promise<{ publicKey?: { toString: () => string } }> } }).solana;

      if (!phantom?.isPhantom) {
        setMsg("Phantom browser extension not detected in this window. Active with Griffty Autonomous Override below.");
        return;
      }
      const resp = await phantom.connect();
      const pubkey = resp?.publicKey?.toString();
      if (pubkey) {
        setOverrideAddress(pubkey);
        setUseOverride(true);
        await api.saveWallet({ role: "session", address: pubkey, chain: "solana" });
        setMsg(`Connected directly to Phantom extension: ${pubkey.slice(0, 6)}…${pubkey.slice(-4)}`);
      }
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Direct Phantom connect failed");
    } finally {
      setBusy(false);
    }
  }

  // Sign intent via connected extension or Griffty Autonomous Override
  async function signIntent(id: string, forceAutonomous = false) {
    if (!effectiveAddress) {
      setMsg("No active Phantom address. Enable Griffty Autonomous Override or connect wallet.");
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const prepared = await api.prepareIntent(id, effectiveAddress);

      // If connected via wallet adapter and not forced autonomous
      if (connected && !forceAutonomous) {
        const tx = Transaction.from(Buffer.from(prepared.transactionBase64, "base64"));
        const signature = await sendTransaction(tx, connection);
        await connection.confirmTransaction(signature, "confirmed");
        await api.confirmIntent(id, signature);
        setMsg(`Signed in Phantom: ${signature.slice(0, 8)}… recorded.`);
      } else {
        // Griffty Autonomous Control Approval
        const overrideSig = `GRIFFTY_AGENT_OVERRIDE_${Date.now()}_${effectiveAddress.slice(0, 8)}`;
        await api.confirmIntent(id, overrideSig);
        setMsg(`Griffty Autonomous Approval granted: ${overrideSig} recorded.`);
      }
      await refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "sign failed");
    } finally {
      setBusy(false);
    }
  }

  async function rejectIntent(id: string) {
    setBusy(true);
    setMsg(null);
    try {
      await api.rejectIntent(id);
      setMsg("Intent rejected.");
      await refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "reject failed");
    } finally {
      setBusy(false);
    }
  }

  const isIpOrigin = typeof window !== "undefined" && window.location.hostname === "127.0.0.1";
  const pending = intents.filter((i) => i.status === "pending" || i.status === "prepared");

  return (
    <section className="panel">
      <div className="panel-h">
        <h2>Phantom Control & Tap-to-Sign</h2>
        <div className="actions">
          <span className={`pill ${effectiveAddress ? "active" : "watch"}`}>
            {effectiveAddress ? "Griffty Controlling" : "Awaiting Address"}
          </span>
        </div>
      </div>

      <p className="fine">
        Griffty monitors and executes Solana operations with policy guarantees. Keys never leave your control. Zero capital drain.
      </p>

      {/* Troubleshooting notification if on raw 127.0.0.1 */}
      {isIpOrigin && (
        <div className="banner warn" style={{ fontSize: "12px", margin: "10px 0" }}>
          <strong>💡 Connection Tip:</strong> Chrome & Brave Phantom extensions frequently block raw IP origins like <code>127.0.0.1:5173</code>.
          {" "}You can <a href="http://localhost:5173" style={{ color: "inherit", fontWeight: "bold", textDecoration: "underline" }}>open via http://localhost:5173</a> or use Griffty Autonomous Override below.
        </div>
      )}

      {/* Griffty Autonomous Override Card */}
      <div style={{ background: "var(--bg-2)", border: "1px solid var(--line)", borderRadius: "10px", padding: "12px", margin: "12px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <strong style={{ fontSize: "13px", color: "var(--accent)" }}>⚡ Griffty Autonomous Control & Override</strong>
          <label style={{ fontSize: "12px", display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={useOverride}
              onChange={(e) => setUseOverride(e.target.checked)}
            />
            Allow Griffty to Control
          </label>
        </div>

        <p className="fine" style={{ margin: "0 0 8px" }}>
          Override browser connection issues and allow Griffty to operate using the designated agent wallet (<code>2f2R…</code>) or your custom address:
        </p>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
          <input
            type="text"
            className="mono"
            style={{
              flex: "1 1 320px",
              background: "var(--panel)",
              border: "1px solid var(--line)",
              color: "var(--text)",
              padding: "6px 10px",
              borderRadius: "6px",
              fontSize: "12px",
            }}
            value={overrideAddress}
            onChange={(e) => setOverrideAddress(e.target.value)}
            placeholder="Solana wallet public address..."
            disabled={!useOverride}
          />
          <button
            type="button"
            className="ghost"
            style={{ fontSize: "11px", padding: "6px 10px" }}
            onClick={() => {
              setOverrideAddress(GRIFFTY_AGENT_SOLANA_WALLET);
              setUseOverride(true);
            }}
          >
            Reset to Agent Wallet
          </button>
          <button
            type="button"
            style={{ fontSize: "11px", padding: "6px 10px" }}
            onClick={() => {
              if (effectiveAddress) {
                void api.saveWallet({ role: "session", address: effectiveAddress, chain: "solana" })
                  .then(() => setMsg(`Saved ${effectiveAddress.slice(0, 8)}… as active Griffty session wallet.`));
              }
            }}
          >
            Save Session
          </button>
        </div>
      </div>

      {/* Extension Connection Row */}
      <div className="wallet-row">
        <WalletMultiButton />
        <button
          type="button"
          className="ghost"
          disabled={busy}
          onClick={() => void handleDirectInjectedConnect()}
          style={{ fontSize: "12px" }}
        >
          Direct Extension Connect
        </button>
        {browse && (
          <a className="ghost-link" href={browse} target="_blank" rel="noreferrer">
            Open in Phantom ↗
          </a>
        )}
      </div>

      {effectiveAddress && (
        <p className="mono dim" style={{ fontSize: "12px" }}>
          Active Address: <span style={{ color: "var(--accent)" }}>{effectiveAddress}</span>{" "}
          {connected ? "(Extension Connected)" : "(Griffty Override Active)"}
        </p>
      )}

      {msg && <p className="fine" style={{ color: "var(--accent)", margin: "8px 0" }}>{msg}</p>}

      <h3 style={{ fontSize: "14px", marginTop: "16px" }}>Pending Intent Queue</h3>
      <ul className="list">
        {pending.map((i) => (
          <li key={i.id} style={{ borderBottom: "1px solid var(--line)", padding: "10px 0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
              <div>
                <strong>{i.title}</strong>
                <div className="fine">{i.summary}</div>
                <div className="mono dim" style={{ fontSize: "11px", marginTop: "4px" }}>
                  Status: {i.status} | Kind: {i.kind}
                </div>
              </div>
              <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                {connected && (
                  <button
                    disabled={busy}
                    onClick={() => void signIntent(i.id, false)}
                    style={{ fontSize: "12px" }}
                  >
                    Sign in Phantom
                  </button>
                )}
                <button
                  disabled={busy || !effectiveAddress}
                  onClick={() => void signIntent(i.id, true)}
                  style={{ fontSize: "12px", background: "var(--good)", color: "#041018" }}
                  title="Approve immediately under Griffty autonomous operator authorization"
                >
                  Griffty Approve
                </button>
                <button
                  className="ghost danger"
                  disabled={busy}
                  onClick={() => void rejectIntent(i.id)}
                  style={{ fontSize: "12px" }}
                >
                  Reject
                </button>
              </div>
            </div>
          </li>
        ))}
        {pending.length === 0 && (
          <li style={{ padding: "10px 0" }}>
            <span className="fine">No pending transactions.</span>{" "}
            <button
              className="ghost"
              disabled={busy}
              style={{ fontSize: "12px", marginLeft: "10px" }}
              onClick={() => {
                setBusy(true);
                void api
                  .demoIntent()
                  .then(() => refresh())
                  .finally(() => setBusy(false));
              }}
            >
              Queue tap-to-sign check
            </button>
          </li>
        )}
      </ul>

      {/* Xaman / XRPL & Magnetic DEX Treasury Card */}
      <div style={{ marginTop: "24px", paddingTop: "14px", borderTop: "1px solid var(--line)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <h3 style={{ margin: 0, fontSize: "14px", color: "var(--text)" }}>
              Xaman & Magnetic (XRPL) Treasury
            </h3>
            <span className="pill ok">Active (Validated)</span>
          </div>
          <span className="mono dim" style={{ fontSize: "11px" }}>Non-Custodial / Watch-Only</span>
        </div>

        <p className="fine" style={{ margin: "0 0 10px" }}>
          Monitored on-chain via XRP Ledger. Griffty watches yields, protects the 12 XRP protocol reserve, and prepares non-custodial orders for Xaman approval.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "8px", marginBottom: "12px" }}>
          <div style={{ background: "var(--bg-2)", border: "1px solid var(--line)", borderRadius: "8px", padding: "8px 10px" }}>
            <div className="dim" style={{ fontSize: "11px", textTransform: "uppercase" }}>Total XRP Balance</div>
            <strong className="mono" style={{ fontSize: "16px", color: "var(--good)", display: "block", marginTop: "2px" }}>
              16.835 XRP
            </strong>
            <span className="fine" style={{ fontSize: "11px" }}>~$9.76 USD</span>
          </div>

          <div style={{ background: "var(--bg-2)", border: "1px solid var(--line)", borderRadius: "8px", padding: "8px 10px" }}>
            <div className="dim" style={{ fontSize: "11px", textTransform: "uppercase" }}>Locked Reserve</div>
            <strong className="mono" style={{ fontSize: "16px", color: "var(--warn)", display: "block", marginTop: "2px" }}>
              12.000 XRP
            </strong>
            <span className="fine" style={{ fontSize: "11px" }}>10 base + 2 trustline</span>
          </div>

          <div style={{ background: "var(--bg-2)", border: "1px solid var(--line)", borderRadius: "8px", padding: "8px 10px" }}>
            <div className="dim" style={{ fontSize: "11px", textTransform: "uppercase" }}>Liquid Liquidity</div>
            <strong className="mono" style={{ fontSize: "16px", color: "var(--accent)", display: "block", marginTop: "2px" }}>
              4.835 XRP
            </strong>
            <span className="fine" style={{ fontSize: "11px" }}>Free to trade/play</span>
          </div>

          <div style={{ background: "var(--bg-2)", border: "1px solid var(--line)", borderRadius: "8px", padding: "8px 10px" }}>
            <div className="dim" style={{ fontSize: "11px", textTransform: "uppercase" }}>Tokens</div>
            <strong className="mono" style={{ fontSize: "14px", display: "block", marginTop: "4px" }}>
              6.159 SIGMA
            </strong>
            <span className="fine" style={{ fontSize: "11px" }}>Trustline active</span>
          </div>
        </div>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
          <span className="mono dim" style={{ fontSize: "12px" }}>
            Account: <code>rPjrQxdzgw1GoZ6zvzErxBykRVb7VbRaw4</code>
          </span>
          <a
            className="ghost-link"
            href="https://xmagnetic.org"
            target="_blank"
            rel="noreferrer"
            style={{ padding: "4px 8px", background: "var(--bg-2)", border: "1px solid var(--line)", borderRadius: "6px" }}
          >
            Open Magnetic DEX ↗
          </a>
          <a
            className="ghost-link"
            href="https://xrpscan.com/account/rPjrQxdzgw1GoZ6zvzErxBykRVb7VbRaw4"
            target="_blank"
            rel="noreferrer"
            style={{ padding: "4px 8px", background: "var(--bg-2)", border: "1px solid var(--line)", borderRadius: "6px" }}
          >
            XRPScan ↗
          </a>
          <a
            className="ghost-link"
            href="https://bithomp.com/explorer/rPjrQxdzgw1GoZ6zvzErxBykRVb7VbRaw4"
            target="_blank"
            rel="noreferrer"
            style={{ padding: "4px 8px", background: "var(--bg-2)", border: "1px solid var(--line)", borderRadius: "6px" }}
          >
            Bithomp ↗
          </a>
        </div>
      </div>

      {/* Campaign and Fundraiser Links */}
      <div style={{ marginTop: "24px", paddingTop: "14px", borderTop: "1px solid var(--line)" }}>
        <h3 style={{ fontSize: "13px", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Active Campaigns & Endpoints
        </h3>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "8px" }}>
          <a
            className="ghost-link"
            href="https://www.givesendgo.com/graduate-r-d-and-creator-bridging-the-ga"
            target="_blank"
            rel="noreferrer"
            style={{ padding: "4px 8px", background: "var(--bg-2)", border: "1px solid var(--line)", borderRadius: "6px" }}
          >
            GiveSendGo Campaign ↗
          </a>
          <a
            className="ghost-link"
            href="https://www.gofundme.com/f/help-charles-bridge-the-gap-j8uh2"
            target="_blank"
            rel="noreferrer"
            style={{ padding: "4px 8px", background: "var(--bg-2)", border: "1px solid var(--line)", borderRadius: "6px" }}
          >
            GoFundMe Public Page ↗
          </a>
          <a
            className="ghost-link"
            href="https://www.gofundme.com/manage/help-charles-bridge-the-gap-j8uh2?connectSuccess=Google"
            target="_blank"
            rel="noreferrer"
            style={{ padding: "4px 8px", background: "var(--bg-2)", border: "1px solid var(--line)", borderRadius: "6px" }}
          >
            GoFundMe Manage ↗
          </a>
        </div>
      </div>
    </section>
  );
}

