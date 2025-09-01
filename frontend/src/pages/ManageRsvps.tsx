// src/pages/ManageRsvps.tsx
import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../lib/api";

type Rsvp = { id: string; name: string; contact: string; answer: "yes"|"no"|"maybe"; note?: string };

export default function ManageRsvps() {
  const { partyId } = useParams();
  const [all, setAll] = useState<Rsvp[] | null>(null);
  const [filter, setFilter] = useState<"all" | "yes" | "no" | "maybe">("all");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!partyId) return;
    (async () => {
      try {
        const rows = await api<Rsvp[]>(`/parties/${partyId}/rsvps`);
        setAll(rows);
      } catch (e: any) {
        setErr(e.message || "Failed to load RSVPs");
      }
    })();
  }, [partyId]);

  const list = useMemo(
    () => !all ? [] : (filter === "all" ? all : all.filter(r => r.answer === filter)),
    [all, filter]
  );

  function onFilter(e: ChangeEvent<HTMLSelectElement>) {
    setFilter(e.target.value as typeof filter);
  }

  function exportCsv() {
    const rows = [["name","contact","answer","note"], ...list.map(r => [r.name, r.contact, r.answer, r.note ?? ""])];
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `party-${partyId}-rsvps.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  if (err) return <section className="section" style={{ maxWidth: 900, margin: "4rem auto" }}><p>{err}</p></section>;
  if (!all) return null;

  return (
    <section className="section" style={{ maxWidth: 900, margin: "4rem auto" }}>
      <h2 style={{ marginTop: 0 }}>Manage RSVPs — Party {partyId}</h2>

      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
        <label>
          Filter:&nbsp;
          <select value={filter} onChange={onFilter} style={{ padding: "0.4rem", borderRadius: 8, border: "1px solid var(--border)" }}>
            <option value="all">All</option>
            <option value="yes">Yes</option>
            <option value="maybe">Maybe</option>
            <option value="no">No</option>
          </select>
        </label>
        <button className="btn" onClick={exportCsv}>Export CSV</button>
        <Link to={`/host/parties/${partyId}/edit`} className="btn" style={{ background: "transparent", color: "var(--primary)" }}>
          Edit Party
        </Link>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: "8px 4px" }}>Name</th>
              <th style={{ textAlign: "left", padding: "8px 4px" }}>Contact</th>
              <th style={{ textAlign: "left", padding: "8px 4px" }}>Answer</th>
              <th style={{ textAlign: "left", padding: "8px 4px" }}>Note</th>
            </tr>
          </thead>
          <tbody>
            {list.map((r) => (
              <tr key={r.id}>
                <td style={{ padding: "6px 4px" }}>{r.name}</td>
                <td style={{ padding: "6px 4px" }}>{r.contact}</td>
                <td style={{ padding: "6px 4px", textTransform: "capitalize" }}>{r.answer}</td>
                <td style={{ padding: "6px 4px" }}>{r.note || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
