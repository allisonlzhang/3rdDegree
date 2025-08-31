// src/pages/RsvpSuccess.tsx
import { useNavigate, useParams } from "react-router-dom";

export default function RsvpSuccess() {
  const nav = useNavigate();
  const { partyId } = useParams();

  return (
    <section className="section" style={{ maxWidth: 520, margin: "4rem auto", textAlign: "center" }}>
      <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>✅</div>
      <h2 style={{ marginTop: 0 }}>RSVP Confirmed!</h2>
      <p>Thanks for responding to the party invite.</p>
      <button
        className="btn"
        onClick={() => nav(`/party/${partyId}`)}
        style={{ marginTop: "1.5rem" }}
      >
        Back to Party Page
      </button>
    </section>
  );
}
