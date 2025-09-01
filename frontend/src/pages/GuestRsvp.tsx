// src/pages/GuestRsvp.tsx
import { useEffect, useState, type FormEvent } from "react";
import { useParams, useSearchParams, Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";

type MeResp = { id: string; name: string; contact: string; answer: "yes"|"no"|"maybe"; note?: string };

export default function GuestRsvp() {
  const { partyId } = useParams();
  const [q] = useSearchParams();
  const nav = useNavigate();

  const memberId = q.get("member_id") || "";   // required by your backend
  const token = q.get("t") || "";              // if your API expects invite token, keep passing it

  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [answer, setAnswer] = useState<"yes"|"no"|"maybe">("yes");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string| null>(null);

  useEffect(() => {
    if (!partyId || !memberId) return;
    (async () => {
      try {
        const me = await api<MeResp>(`/parties/${partyId}/me?member_id=${encodeURIComponent(memberId)}${token ? `&t=${encodeURIComponent(token)}` : ""}`);
        setName(me.name);
        setContact(me.contact);
        setAnswer(me.answer);
        setNote(me.note ?? "");
      } catch (e:any) {
        setMsg(e.message || "Failed to load RSVP");
      }
    })();
  }, [partyId, memberId, token]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!partyId || !memberId) return;
    setSaving(true); setMsg(null);
    try {
      // adjust to your update endpoint; example:
      await api(`/parties/${partyId}/rsvps/${encodeURIComponent(memberId)}${token ? `?t=${encodeURIComponent(token)}` : ""}`, {
        method: "PATCH",
        body: JSON.stringify({ contact, answer, note }),
      });
      setMsg("Saved!");
      setTimeout(() => nav(-1), 600);
    } catch (e:any) {
      setMsg(e.message || "Failed to save");
    } finally { setSaving(false); }
  }

  return (
    <section className="section" style={{ maxWidth: 560, margin: "4rem auto" }}>
      <h2 style={{ marginTop: 0 }}>Your RSVP</h2>
      <p style={{ opacity:.8, marginTop:0 }}>Party: {partyId} · Member: {memberId}</p>

      <form onSubmit={onSubmit} style={{ display:"grid", gap:"0.75rem" }}>
        <label>
          <div style={{ marginBottom:4 }}>Name</div>
          <input value={name} disabled
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
          <button className="btn" type="submit" disabled={saving}>{saving?"Saving…":"Save changes"}</button>
          <Link to={-1 as any} className="btn" style={{ background:"transparent", color:"var(--primary)" }}>
            Cancel
          </Link>
        </div>
      </form>
    </section>
  );
}
