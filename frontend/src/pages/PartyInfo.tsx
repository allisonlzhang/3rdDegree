// src/pages/PartyInfo.tsx
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../lib/api";

type Party = {
  id: string;
  title: string;
  description?: string;
  location?: string;
  host_name?: string;
  when_text?: string;
  starts_at?: string; // ISO
  ends_at?: string;   // ISO
};

export default function PartyInfo() {
  const { partyId } = useParams();
  const [party, setParty] = useState<Party | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!partyId) return;
    (async () => {
      try {
        const data = await api<Party>(`/parties/${partyId}`);
        setParty(data);
      } catch (e: any) {
        setErr(e.message || "Failed to load party");
      } finally {
        setLoading(false);
      }
    })();
  }, [partyId]);

  if (loading) return null;
  if (err) {
    return (
      <section className="section" style={{ maxWidth: 720, margin: "4rem auto" }}>
        <p style={{ color: "var(--accent-briar)" }}>{err}</p>
      </section>
    );
  }
  if (!party) return null;

  const when =
    party.when_text ||
    [party.starts_at, party.ends_at].filter(Boolean).join(" – ");

  const mapSrc = party.location
    ? `https://maps.google.com/maps?q=${encodeURIComponent(party.location)}&t=&z=15&ie=UTF8&iwloc=&output=embed`
    : "";

  return (
    <section className="section" style={{ maxWidth: 720, margin: "4rem auto" }}>
      <h2 style={{ marginTop: 0 }}>{party.title}</h2>
      {party.description && (
        <p style={{ margin: "0.5rem 0 1rem 0", opacity: 0.9 }}>{party.description}</p>
      )}

      <ul style={{ listStyle: "none", padding: 0, margin: "0 0 1rem 0" }}>
        {when && (
          <li>
            <strong>When:</strong> {when}
          </li>
        )}
        {party.location && (
          <li>
            <strong>Where:</strong> {party.location}
          </li>
        )}
        {party.host_name && (
          <li>
            <strong>Host:</strong> {party.host_name}
          </li>
        )}
      </ul>

      {mapSrc && (
        <div style={{ margin: "1rem 0" }}>
          <iframe
            title="map"
            src={mapSrc}
            width="100%"
            height="250"
            style={{ border: 0, borderRadius: 12 }}
            loading="lazy"
          />
        </div>
      )}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
        <Link to={`/party/${party.id}/rsvp`} className="btn">
          RSVP
        </Link>
        <Link
          className="btn"
          style={{ background: "transparent", color: "var(--primary)" }}
          to={`/party/${party.id}`}
        >
          Back
        </Link>
      </div>
    </section>
  );
}
