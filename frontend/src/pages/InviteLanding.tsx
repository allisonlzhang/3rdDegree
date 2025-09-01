// src/pages/InviteLanding.tsx
import { Link, useParams, useSearchParams } from "react-router-dom";

export default function InviteLanding() {
  const { partyId } = useParams();
  const [q] = useSearchParams();
  const t = q.get("t") || "";

  return (
    <section className="section" style={{ maxWidth: 640, margin: "4rem auto", textAlign: "center" }}>
      <h2 style={{ marginTop: 0 }}>You’re invited!</h2>
      <p>Party {partyId}</p>

      <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 12 }}>
        <Link className="btn" to={`/party/${partyId}/rsvp${t ? `?t=${t}` : ""}`}>RSVP</Link>
        <Link
          className="btn"
          style={{ background: "transparent", color: "var(--primary)" }}
          to={`/party/${partyId}/info`}
        >
          View details
        </Link>
      </div>

      <p style={{ marginTop: "1rem", opacity: 0.8 }}>No account needed.</p>
    </section>
  );
}
