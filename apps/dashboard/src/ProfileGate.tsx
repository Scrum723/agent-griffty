import { useEffect, useState } from "react";
import { api, type UserProfile } from "./api";

export function ProfileGate({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null | undefined>(undefined);
  const [name, setName] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    api
      .me()
      .then((r) => setProfile(r.profile))
      .catch(() => setProfile(null));
  }, []);

  if (profile === undefined) {
    return (
      <div className="shell">
        <p className="dim">Opening Griffty…</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="shell welcome">
        <p className="eyebrow">Doc Weather · standalone app</p>
        <h1>Griffty</h1>
        <p className="sub">
          This is Griffty’s own interface — campaigns, treasury, and alerts. It is <strong>not Grok</strong> and does not use Grok tokens or Grok Build.
        </p>
        <form
          className="welcome-card"
          onSubmit={(e) => {
            e.preventDefault();
            setErr("");
            void api
              .startSession({ name })
              .then((r) => setProfile(r.profile))
              .catch((ex) => setErr(ex instanceof Error ? ex.message : "Could not start"));
          }}
        >
          <label>
            What should we call you?
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" required minLength={2} />
          </label>
          {err && <p className="banner error">{err}</p>}
          <button type="submit">Enter my dashboard</button>
        </form>
      </div>
    );
  }

  return <>{children}</>;
}
