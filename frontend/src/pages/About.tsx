// src/pages/About.tsx
import { Link } from "react-router-dom";

export default function About() {
    return (
      <section className="section" style={{ maxWidth: 640, margin: "4rem auto" }}>
        <h2 style={{ marginTop: 0 }}>About 3rdDegree</h2>
        <p>3rdDegree helps hosts organize parties and guests RSVP with minimal friction.</p>
        <p style={{ opacity: 0.8 }}>Built with a lightweight React + Vite stack.</p>

        <footer style={{ marginTop: "2rem", fontSize: "0.9rem" }}>
        <Link to="/privacy">Privacy Policy</Link>
        </footer>
      </section>
    );
  }
  