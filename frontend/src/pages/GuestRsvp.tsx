// src/pages/GuestRsvp.tsx
import { useState, type FormEvent } from "react";
import { useParams, useSearchParams, Link, useNavigate } from "react-router-dom";
// import { api } from "../lib/api"; // wire later

export default function GuestRsvp() {
  const { rsvpId } = useParams();
  const [q] = useSearchParams();
  const nav = useNavigate();
  const token = q.get("t") || "";

  const [name, setName] = useState("Guest Name");
  const [contact, setContact] = useState("+1 555 000 0000");
  const [answer, setAnswer] = useState<"yes"|"no"|"maybe">("yes");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string| null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true); setMsg(null);
    try {
      console.log("PATCH RSVP", { rsvpId, contact, answer, note, token });
      setMsg("Saved!");
      setTimeout(() => nav(-1), 600);
    } catch (e:any) {
      setMsg(e.message || "Failed to save");
    } finally { setSaving(false); }
  }

  return (
    <section className="section" style={{ maxWidth: 560, margin: "4rem auto" }}>
      <h2 style={{ marginTop: 0 }}>Your RSVP</h2>
      <p style={{ opacity:.8, marginTop:0 }}>RSVP ID: {rsvpId}</p>

      <form onSubmit={onSubmit} style={{ display:"grid", gap:"0.75rem" }}>
        <label>
          <div style={{ marginBottom:4 }}>Name</div>
          <input value={name} onChange={e=>setName((e.target as HTMLInputElement).value)} disabled
            style={{ width:"100%", padding:"0.5rem 0.75rem", borderRadius:8, border:"1px solid var(--border)" }}/>
        </label>
        <label>
          <div style={{ marginBottom:4 }}>Contact</div>
          <input value={contact} onChange={e=>setContact((e.target as HTMLInputElement).value)} required
            style={{ width:"100%", padding:"0.5rem 0.75rem", borderRadius:8, border:"1px solid var(--border)" }}/>
        </label>
        <label>
          <div style={{ marginBottom:4 }}>Response</div>
          <select value={answer} onChange={e=>setAnswer(e.target.value as any)}
            style={{ width:"100%", padding:"0.5rem 0.75rem", borderRadius:8, border:"1px solid var(--border)" }}>
            <option value="yes">Yes</option>
            <option value="maybe">Maybe</option>
            <option value="no">No</option>
          </select>
        </label>
        <label>
          <div style={{ marginBottom:4 }}>Note (optional)</div>
          <textarea rows={3} value={note} onChange={e=>setNote((e.target as HTMLTextAreaElement).value)}
            style={{ width:"100%", padding:"0.5rem 0.75rem", borderRadius:8, border:"1px solid var(--border)" }}/>
        </label>

        {msg && <small style={{ color:"var(--accent-briar)" }}>{msg}</small>}

        <div style={{ display:"flex", gap:8 }}>
          <button className="btn" type="submit" disabled={saving}>
            {saving?"Saving…":"Save changes"}
          </button>
          <Link to={-1 as any} className="btn" style={{ background:"transparent", color:"var(--primary)" }}>
            Cancel
          </Link>
        </div>
      </form>
    </section>
  );
}
