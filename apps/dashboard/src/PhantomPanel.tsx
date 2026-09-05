import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Transaction } from "@solana/web3.js";
import { useCallback, useEffect, useState } from "react";
import { api, type SignIntent } from "./api";

export function PhantomPanel() {
  const { publicKey, sendTransaction, connected } = useWallet();
  const { connection } = useConnection();
  const [intents, setIntents] = useState<SignIntent[]>([]);
  const [browse, setBrowse] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    const data = await api.intents();
    setIntents(data.intents);
    setBrowse(data.phantomBrowse);
  }, []);

  useEffect(() => {
    void refresh();
    const t = setInterval(() => void refresh(), 8000);
    return () => clearInterval(t);
  }, [refresh]);

  useEffect(() => {
    if (!connected || !publicKey) return;
    void api
      .saveWallet({
        role: "session",
        address: publicKey.toBase58(),
        chain: "solana",
      })
      .catch((e: unknown) => setMsg(e instanceof Error ? e.message : "wallet save failed"));
  }, [connected, publicKey]);

  async function signIntent(id: string) {
    if (!publicKey) {
      setMsg("Connect Phantom first.");
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const prepared = await api.prepareIntent(id, publicKey.toBase58());
      const tx = Transaction.from(Buffer.from(prepared.transactionBase64, "base64"));
      const signature = await sendTransaction(tx, connection);
      await connection.confirmTransaction(signature, "confirmed");
      await api.confirmIntent(id, signature);
      setMsg(`Signed ${signature.slice(0, 8)}… recorded.`);
      await refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "sign failed");
    } finally {
      setBusy(false);
    }
  }

  const pending = intents.filter((i) => i.status === "pending" || i.status === "prepared");

  return (
    <section className="panel">
      <h2>Phantom tap-to-sign</h2>
      <p className="fine">
        Griffty prepares a memo transaction. You tap Approve in Phantom. Keys never leave the
        wallet. No overnight unsigned trading.
      </p>
      <div className="wallet-row">
        <WalletMultiButton />
        {browse && (
          <a className="ghost-link" href={browse} target="_blank" rel="noreferrer">
            Open in Phantom
          </a>
        )}
      </div>
      {publicKey && (
        <p className="mono dim">session {publicKey.toBase58()}</p>
      )}
      {msg && <p className="fine">{msg}</p>}
      <ul className="list">
        {pending.map((i) => (
          <li key={i.id}>
            <strong>{i.title}</strong>
            <div className="fine">{i.summary}</div>
            <button disabled={busy || !connected} onClick={() => void signIntent(i.id)}>
              Sign in Phantom
            </button>
          </li>
        ))}
        {pending.length === 0 && (
          <li>
            <button
              className="ghost"
              disabled={busy}
              onClick={() => {
                setBusy(true);
                void api
                  .demoIntent()
                  .then(() => refresh())
                  .finally(() => setBusy(false));
              }}
            >
              Queue a tap-to-sign check
            </button>
          </li>
        )}
      </ul>
    </section>
  );
}
