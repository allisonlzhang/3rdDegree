// src/pages/Login.tsx
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";

type LoginResp = {
  ok?: boolean;
  message?: string;
  member?: { id?: string; party_id?: string | null };
  _text?: string; // fallback if server replied text/plain
};

export default function Login() {
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null); setLoading(true);
    const f = new FormData(e.currentTarget);
    const payload = {
      phone: String(f.get("phone") || "").trim(),
      password: String(f.get("password") || ""),
    };

    try {
      const res = await api<LoginResp>("/host/login", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      // treat any 2xx as success; store what we can
      const memberId = res?.member?.id || "";
      const partyId = (res?.member?.party_id ?? "") as string;
      const hostName = res?.member?.name || "";
      const partyTitle = res?.party?.title || "";

      if (memberId) localStorage.setItem("member_id", memberId);
      else localStorage.removeItem("member_id");

      if (partyId) localStorage.setItem("party_id", partyId);
      else localStorage.removeItem("party_id");

      // Check if this is a first-time host (default party title indicates new host)
      const isFirstTime = partyTitle.includes("'s Party") && hostName === "Host";
      
      if (isFirstTime) {
        nav("/host/setup");
      } else {
        nav("/host");
      }
    } catch (e: any) {
      setErr(e.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="section" style={{ maxWidth: 420, margin: "4rem auto" }}>
      <h2 style={{ marginTop: 0 }}>Log in</h2>
      <form onSubmit={onSubmit} style={{ display: "grid", gap: "0.75rem" }}>
        <label>
          <div style={{ marginBottom: 4 }}>Phone</div>
          <input name="phone" type="tel" required placeholder="+1 555 123 4567"
            style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: 8, border: "1px solid var(--border)" }} />
        </label>
        <label>
          <div style={{ marginBottom: 4 }}>Password</div>
          <input name="password" type="password" required
            style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: 8, border: "1px solid var(--border)" }} />
        </label>
        {err && <small style={{ color: "var(--accent-briar)" }}>{err}</small>}
        <button className="btn" disabled={loading} type="submit">
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </section>
  );
}
