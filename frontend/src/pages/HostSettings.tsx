// src/pages/HostSettings.tsx
import { useState, type FormEvent } from "react";
import { api } from "../lib/api";

export default function HostSettings() {
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function handlePhone(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null); setErr(null);
    const f = new FormData(e.currentTarget);
    try {
      await api<{ ok: boolean; message?: string }>("/auth/change-phone", {
        method: "POST",
        body: JSON.stringify({ phone: f.get("phone") }),
      });
      setMsg("Phone updated");
      (e.currentTarget as HTMLFormElement).reset();
    } catch (e: any) {
      setErr(e.message || "Failed to update phone");
    }
  }

  async function handlePassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null); setErr(null);
    const f = new FormData(e.currentTarget);
    try {
      await api<{ ok: boolean; message?: string }>("/auth/change-password", {
        method: "POST",
        body: JSON.stringify({
          current_password: f.get("current_password"),
          new_password: f.get("new_password"),
        }),
      });
      setMsg("Password updated");
      (e.currentTarget as HTMLFormElement).reset();
    } catch (e: any) {
      setErr(e.message || "Failed to update password");
    }
  }

  return (
    <section className="section" style={{ maxWidth: 560, margin: "4rem auto" }}>
      <h2 style={{ marginTop: 0 }}>Host Settings</h2>

      <form onSubmit={handlePhone} style={{ display: "grid", gap: "0.75rem", marginBottom: "1.5rem" }}>
        <label>
          <div style={{ marginBottom: 4 }}>Phone</div>
          <input name="phone" type="tel" required
            placeholder="+1 555 123 4567"
            style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: 8, border: "1px solid var(--border)" }} />
        </label>
        <button className="btn" type="submit">Update phone</button>
      </form>

      <form onSubmit={handlePassword} style={{ display: "grid", gap: "0.75rem" }}>
        <label>
          <div style={{ marginBottom: 4 }}>Current password</div>
          <input name="current_password" type="password" required
            style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: 8, border: "1px solid var(--border)" }} />
        </label>
        <label>
          <div style={{ marginBottom: 4 }}>New password</div>
          <input name="new_password" type="password" required
            style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: 8, border: "1px solid var(--border)" }} />
        </label>
        <button className="btn" type="submit">Update password</button>
      </form>

      {msg && <p style={{ marginTop: "1rem", color: "var(--primary)" }}>{msg}</p>}
      {err && <p style={{ marginTop: "1rem", color: "var(--accent-briar)" }}>{err}</p>}
    </section>
  );
}
