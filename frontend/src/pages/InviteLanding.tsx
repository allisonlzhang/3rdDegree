// src/pages/InviteLanding.tsx
import { Link, useParams, useSearchParams } from "react-router-dom";

export default function InviteLanding() {
  const { partyId } = useParams();
  const [q] = useSearchParams();
  const t = q.get("t") || ""; // invite token from URL

  const rsvpHref = `/party/${partyId}/rsvp${t ? `?t=${encodeURIComponent(t)}` : ""}`;
  const infoHref = `/party/${partyId}/info${t ? `?t=${encodeURIComponent(t)}` : ""}`;

  return (
    <section className="section" style={{ maxWidth: 720, margin: "4rem auto" }}>
      <h2 style={{ marginTop: 0 }}>You’re invited!</h2>
      <p>We’d love to have you. Tap below to RSVP or see event details.</p>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
        <Link to={rsvpHref} className="btn">RSVP</Link>
        <Link to={infoHref} className="btn" style={{ background: "transparent", color: "var(--primary)" }}>
          View details
        </Link>
      </div>
    </section>
  );
}
