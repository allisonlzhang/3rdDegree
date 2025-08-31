// src/pages/Rsvp.tsx
import { useState } from "react";
import type { FormEvent } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { api } from "../lib/api";

type RsvpResp = { ok: boolean; message?: string };

export default function Rsvp() {
  const { partyId } = useParams();
  const [q] = useSearchParams();
  const nav = useNavigate();

  const inviteToken = q.get("t") || ""; // e.g. /party/123/rsvp?t=abc
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!partyId) return;
    setErr(null); setLoading(true);
    const f = new FormData(e.currentTarget);
    const payload = {
      name: String(f.get("name") || ""),
      contact: String(f.get("contact") || ""),  // phone or email
      answer: String(f.get("answer") || "yes"), // "yes" | "no" | "maybe"
      invite_token: inviteToken || undefined,
      note: String(f.get("note") || ""),
    };
    try {
      const res = await api<RsvpResp>(`/parties/${partyId}/rsvp`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (res.ok) setDone(true);
      else setErr(res.message || "Could not submit RSVP");
    } catch (e: any) {
      setErr(e.message || "Network error");
    } finally { setLoading(false); }
  }

  if (done) {
    return (
      <section className="card" style={{ maxWidth: 520, margin: "4rem auto", textAlign: "center" }}>
        <h2 style={{ marginTop: 0 }}>RSVP received 🎉</h2>
        <p>Thanks for responding.</p>
        <button className="btn" onClick={() => nav("/")}>Back to Home</button>
      </section>
    );
  }

  return (
    <section className="card" style={{ maxWidth: 520, margin: "4rem auto" }}>
      <h2 style={{ marginTop: 0 }}>RSVP</h2>
      <form onSubmit={onSubmit} style={{ display: "grid", gap: "0.75rem" }}>
        <label>
          <div style={{ marginBottom: 4 }}>Full name</div>
          <input name="name" required
            style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: 8, border: "1px solid var(--border)" }} />
        </label>

        <label>
          <div style={{ marginBottom: 4 }}>Contact (phone or email)</div>
          <input name="contact" required
            placeholder="+1 555 123 4567 or you@example.com"
            style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: 8, border: "1px solid var(--border)" }} />
        </label>

        <label>
          <div style={{ marginBottom: 4 }}>Response</div>
          <select name="answer" defaultValue="yes"
            style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: 8, border: "1px solid var(--border)" }}>
            <option value="yes">Yes</option>
            <option value="no">No</option>
            <option value="maybe">Maybe</option>
          </select>
        </label>

        <label>
          <div style={{ marginBottom: 4 }}>Note (optional)</div>
          <textarea name="note" rows={3}
            style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: 8, border: "1px solid var(--border)" }} />
        </label>

        {inviteToken && <small>Invite token detected.</small>}
        {err && <small style={{ color: "var(--accent-briar)" }}>{err}</small>}

        <button className="btn" disabled={loading} type="submit">
          {loading ? "Submitting…" : "Submit RSVP"}
        </button>
      </form>
    </section>
  );
}
