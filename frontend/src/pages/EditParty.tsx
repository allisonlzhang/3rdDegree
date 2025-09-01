// src/pages/EditParty.tsx
import type { FormEvent } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";

export default function EditParty() {
  const { partyId } = useParams();
  const nav = useNavigate();

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    console.log("Save party", partyId, Object.fromEntries(f.entries())); // placeholder
    nav(`/party/${partyId}`);
  }

  return (
    <section className="section" style={{ maxWidth: 640, margin: "4rem auto" }}>
      <h2 style={{ marginTop: 0 }}>Edit Party {partyId}</h2>
      <form onSubmit={onSubmit} style={{ display: "grid", gap: "1rem" }}>
        <label>
          Title
          <input name="title" defaultValue={`Party ${partyId}`}
            style={{ width: "100%", padding: "0.5rem", borderRadius: 8, border: "1px solid var(--border)" }} />
        </label>
        <label>
          Location
          <input name="location" defaultValue="TBD"
            style={{ width: "100%", padding: "0.5rem", borderRadius: 8, border: "1px solid var(--border)" }} />
        </label>
        <label>
          Date & Time
          <input type="datetime-local" name="starts_at"
            style={{ width: "100%", padding: "0.5rem", borderRadius: 8, border: "1px solid var(--border)" }} />
        </label>
        <label>
          Description
          <textarea name="description" rows={3}
            style={{ width: "100%", padding: "0.5rem", borderRadius: 8, border: "1px solid var(--border)" }} />
        </label>

        <div style={{ display: "flex", gap: 8 }}>
          <button type="submit" className="btn">Save</button>
          <Link to={`/party/${partyId}`} className="btn" style={{ background: "transparent", color: "var(--primary)" }}>
            Cancel
          </Link>
        </div>
      </form>

      <div style={{ marginTop: "1rem", fontSize: ".9rem" }}>
        <strong>Invite link:</strong>{" "}
        <code>{location.origin}/party/{partyId}/rsvp?t=YOUR_TOKEN</code>
      </div>
    </section>
  );
}
