// src/pages/Party.tsx
import { useParams, Link } from "react-router-dom";

export default function Party() {
  const { partyId } = useParams();

  return (
    <section className="section" style={{ maxWidth: 640, margin: "4rem auto" }}>
      <h2 style={{ marginTop: 0 }}>Party {partyId}</h2>
      <p>This is the party detail page. You can show title, location, host, etc. here.</p>

      <div style={{ marginTop: "1.5rem" }}>
        <Link to={`/party/${partyId}/rsvp`} className="btn">
          RSVP Now
        </Link>
      </div>
    </section>
  );
}
