// src/pages/CreateParty.tsx
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";

export default function CreateParty() {
  const nav = useNavigate();

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    // for now, just log & redirect to dashboard
    console.log("New party:", Object.fromEntries(f.entries()));
    nav("/host");
  }

  return (
    <section className="section" style={{ maxWidth: 640, margin: "4rem auto" }}>
      <h2 style={{ marginTop: 0 }}>Create a New Party</h2>
      <form onSubmit={onSubmit} style={{ display: "grid", gap: "1rem" }}>
        <label>
          Title
          <input name="title" required
            style={{ width: "100%", padding: "0.5rem", borderRadius: 8, border: "1px solid var(--border)" }} />
        </label>
        <label>
          Location
          <input name="location" required
            style={{ width: "100%", padding: "0.5rem", borderRadius: 8, border: "1px solid var(--border)" }} />
        </label>
        <label>
          Date & Time
          <input type="datetime-local" name="starts_at" required
            style={{ width: "100%", padding: "0.5rem", borderRadius: 8, border: "1px solid var(--border)" }} />
        </label>
        <label>
          Description
          <textarea name="description" rows={3}
            style={{ width: "100%", padding: "0.5rem", borderRadius: 8, border: "1px solid var(--border)" }} />
        </label>

        <button type="submit" className="btn">Create Party</button>
      </form>
    </section>
  );
}
