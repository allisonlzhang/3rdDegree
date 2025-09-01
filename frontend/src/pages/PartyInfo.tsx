// src/pages/PartyInfo.tsx
import { Link, useParams } from "react-router-dom";

export default function PartyInfo() {
  const { partyId } = useParams();

  // static mock content for now
  const title = "3rdDegree Launch Night";
  const when = "Fri, Sep 12, 2025 • 7:00–10:00 PM";
  const where = "123 Maple St, NYC";
  const host = "Allison";
  const description =
    "Celebrate the launch of 3rdDegree with music, food, and friends. Casual attire, bring your best vibes!";
  const inviteUrl = `${location.origin}/invite/${partyId}?t=demo-token`;

  function copyInvite() {
    navigator.clipboard.writeText(inviteUrl);
    alert("Invite link copied!");
  }

  return (
    <section className="section" style={{ maxWidth: 720, margin: "4rem auto" }}>
      <h2 style={{ marginTop: 0 }}>{title}</h2>
      <p style={{ margin: "0.5rem 0 1rem 0", opacity: 0.85 }}>{description}</p>

      <ul style={{ listStyle: "none", padding: 0, margin: "0 0 1rem 0" }}>
        <li><strong>When:</strong> {when}</li>
        <li><strong>Where:</strong> {where}</li>
        <li><strong>Host:</strong> {host}</li>
      </ul>

      {/* optional map placeholder */}
      <div style={{ margin: "1rem 0" }}>
        <iframe
          title="map"
          src="https://maps.google.com/maps?q=123%20Maple%20St%20NYC&t=&z=15&ie=UTF8&iwloc=&output=embed"
          width="100%"
          height="250"
          style={{ border: 0, borderRadius: 12 }}
          loading="lazy"
        />
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
        <Link to={`/party/${partyId}/rsvp?t=demo-token`} className="btn">
          RSVP
        </Link>
        <button className="btn" onClick={copyInvite}>
          Copy Invite Link
        </button>
        <a
          className="btn"
          style={{ background: "transparent", color: "var(--primary)" }}
          href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
            title
          )}&dates=20250912T190000Z/20250912T220000Z&details=${encodeURIComponent(
            description
          )}&location=${encodeURIComponent(where)}`}
          target="_blank"
          rel="noreferrer"
        >
          Add to Google Calendar
        </a>
      </div>
    </section>
  );
}
