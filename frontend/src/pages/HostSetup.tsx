// src/pages/HostSetup.tsx
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";

type SetupResponse = {
  ok?: boolean;
  message?: string;
  member?: { id?: string; name?: string };
};

export default function HostSetup() {
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    const f = new FormData(e.currentTarget);
    const name = String(f.get("name") || "").trim();

    if (!name) {
      setErr("Name is required");
      setLoading(false);
      return;
    }

    try {
      const memberId = localStorage.getItem("member_id");
      const partyId = localStorage.getItem("party_id");
      
      if (!memberId || !partyId) {
        setErr("Not logged in");
        return;
      }

      // Update the host's name in the database
      const res = await api<SetupResponse>(`/host/update-name`, {
        method: "POST",
        body: JSON.stringify({ 
          member_id: memberId,
          name: name 
        }),
      });

      if (!res || (res.ok === false)) {
        throw new Error(res?.message || "Update failed");
      }

      // Redirect to host dashboard
      nav("/host");
    } catch (e: any) {
      setErr(e.message || "Failed to update name");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="section" style={{ maxWidth: 480, margin: "4rem auto" }}>
      <h2 style={{ marginTop: 0 }}>Welcome! Let's get you set up</h2>
      <p style={{ marginBottom: "1.5rem", opacity: 0.8 }}>
        Please tell us your name so we can personalize your experience.
      </p>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: "1rem" }}>
        <label>
          <div style={{ marginBottom: 4 }}>Your name</div>
          <input
            name="name"
            required
            placeholder="Enter your full name"
            style={{ 
              width: "100%", 
              padding: "0.75rem", 
              borderRadius: 8, 
              border: "1px solid var(--border)",
              fontSize: "1rem"
            }}
          />
        </label>

        {err && <small style={{ color: "var(--accent-briar)" }}>{err}</small>}

        <button 
          className="btn" 
          disabled={loading} 
          type="submit"
          style={{ padding: "0.75rem 1.5rem", fontSize: "1rem" }}
        >
          {loading ? "Setting up..." : "Continue to Dashboard"}
        </button>
      </form>
    </section>
  );
}
