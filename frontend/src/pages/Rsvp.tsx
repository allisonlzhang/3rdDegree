// src/pages/Rsvp.tsx
import { useState } from "react";
import type { FormEvent } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { api } from "../lib/api";

type JoinResp = { ok?: boolean; id?: string; member_id?: string };
type UpdateResp = { ok?: boolean; message?: string };

export default function Rsvp() {
  const { partyId } = useParams();
  const [q] = useSearchParams();
  const nav = useNavigate();

  const inviteToken = q.get("t") || "";         // invite token path
  const memberIdQS = q.get("member_id") || "";  // existing member id (if editing)

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!partyId) return;

    setErr(null);
    setLoading(true);

    const f = new FormData(e.currentTarget);
    const name = String(f.get("name") || "");
    const contact = String(f.get("contact") || "");
    const answer = String(f.get("answer") || "yes") as "yes" | "no" | "maybe";
    const note = String(f.get("note") || "");

    try {
      // CASE A: First-time RSVP via invite token → create/join
      if (inviteToken && !memberIdQS) {
        // backend expects name + phone on join
        const body = { name, phone: contact };
        const res = await api<JoinResp>(`/join/${encodeURIComponent(partyId)}/${encodeURIComponent(inviteToken)}`, {
          method: "POST",
          body: JSON.stringify(body),
        });
        if (!res || (res.ok === false)) throw new Error("Join failed");
        nav(`/party/${partyId}/rsvp/success`);
        return;
      }

      // CASE B: Editing an existing RSVP → update status/contact
      if (memberIdQS) {
        const body = {
          status: answer,   // backend expects 'status'
          contact,
          note,
        };
        const res = await api<UpdateResp>(
          `/parties/${encodeURIComponent(partyId)}/rsvps/${encodeURIComponent(memberIdQS)}`,
          { method: "PATCH", body: JSON.stringify(body) }
        );
        if (!res || (res.ok === false)) throw new Error(res?.message || "Update failed");
        nav(`/party/${partyId}/rsvp/success`);
        return;
      }

      // CASE C: Fallback (if your backend supports direct create without token)
      const body = {
        member_id: memberIdQS, // empty by default; include if you later have it
        status: answer,
        contact,
        note,
      };
      const res = await api<UpdateResp>(`/parties/${encodeURIComponent(partyId)}/rsvp`, {
        method: "POST",
        body: JSON.stringify(body),
      });
      if (!res || (res.ok === false)) throw new Error(res?.message || "RSVP failed");
      nav(`/party/${partyId}/rsvp/success`);
    } catch (e: any) {
      setErr(e.message || "Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="section" style={{ maxWidth: 520, margin: "4rem auto" }}>
      <h2 style={{ marginTop: 0 }}>RSVP</h2>
      <form onSubmit={onSubmit} style={{ display: "grid", gap: "0.75rem" }}>
        <label>
          <div style={{ marginBottom: 4 }}>Full name</div>
          <input
            name="name"
            required
            style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: 8, border: "1px solid var(--border)" }}
          />
        </label>

        <label>
          <div style={{ marginBottom: 4 }}>Contact (phone)</div>
          <input
            name="contact"
            required
            placeholder="+1 555 123 4567"
            style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: 8, border: "1px solid var(--border)" }}
          />
        </label>

        <label>
          <div style={{ marginBottom: 4 }}>Response</div>
          <select
            name="answer"
            defaultValue="yes"
            style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: 8, border: "1px solid var(--border)" }}
          >
            <option value="yes">Yes</option>
            <option value="maybe">Maybe</option>
            <option value="no">No</option>
          </select>
        </label>

        <label>
          <div style={{ marginBottom: 4 }}>Note (optional)</div>
          <textarea
            name="note"
            rows={3}
            style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: 8, border: "1px solid var(--border)" }}
          />
        </label>

        {inviteToken && !memberIdQS && <small>Invite token detected.</small>}
        {memberIdQS && <small>Editing RSVP for member: {memberIdQS}</small>}
        {err && <small style={{ color: "var(--accent-briar)" }}>{err}</small>}

        <button className="btn" disabled={loading} type="submit">
          {loading ? "Submitting…" : "Submit RSVP"}
        </button>
      </form>
    </section>
  );
}
