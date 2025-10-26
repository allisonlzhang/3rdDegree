// src/pages/HostDashboard.tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";

type PartyListItem = { id: string; title: string; starts_at?: string; location?: string };

export default function HostDashboard() {
  const [items, setItems] = useState<PartyListItem[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const memberId = localStorage.getItem("member_id");
        if (!memberId) {
          setErr("Not logged in");
          return;
        }
        const list = await api<PartyListItem[]>(`/host/parties?member_id=${encodeURIComponent(memberId)}`);
        setItems(list);
      } catch (e: any) {
        setErr(e.message || "Failed to load parties");
      }
    })();
  }, []);

  if (err) return <section className="section" style={{ maxWidth: 800, margin: "4rem auto" }}><p>{err}</p></section>;
  if (!items) return null;

  return (
    <section className="section" style={{ maxWidth: 800, margin: "4rem auto" }}>
      <h2 style={{ marginTop: 0 }}>Your Parties</h2>

      {items.length === 0 ? (
        <p>No parties yet.</p>
      ) : (
        <ul style={{ paddingLeft: "1.25rem" }}>
          {items.map(p => (
            <li key={p.id} style={{ marginBottom: 6 }}>
              <strong>{p.title}</strong>
              {p.starts_at ? ` — ${new Date(p.starts_at).toLocaleString()}` : "" }
              {p.location ? ` @ ${p.location}` : ""}
              {" — "}
              <Link to={`/party/${p.id}`}>View</Link>{" · "}
              <Link to={`/host/parties/${p.id}/edit`}>Edit</Link>{" · "}
              <Link to={`/host/parties/${p.id}/rsvps`}>RSVPs</Link>
            </li>
          ))}
        </ul>
      )}

      <div style={{ marginTop: "1.5rem" }}>
        <Link to="/host/parties/new" className="btn">Create Party</Link>
      </div>
    </section>
  );
}
