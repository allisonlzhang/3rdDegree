// src/pages/Login.tsx
import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";

type LoginResp = { ok: boolean; message?: string };

export default function Login() {
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null); setLoading(true);
    const form = new FormData(e.currentTarget);
    const payload = {
      phone: String(form.get("phone") || ""),
      password: String(form.get("password") || ""),
    };
    try {
      const res = await api<LoginResp>("/host/login", {  // <-- changed
        method: "POST",
        body: JSON.stringify(payload),
      });
      res.ok ? nav("/host") : setErr(res.message || "Login failed");
    } catch (e: any) {
      setErr(e.message || "Network error");
    } finally { setLoading(false); }
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
