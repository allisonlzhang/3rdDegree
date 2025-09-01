// src/pages/HostDashboard.tsx
import { Link } from "react-router-dom";

export default function HostDashboard() {
  return (
    <section className="section" style={{ maxWidth: 800, margin: "4rem auto" }}>
      <h2 style={{ marginTop: 0 }}>Your Parties</h2>

      {/* placeholder list */}
      <ul style={{ paddingLeft: "1.25rem" }}>
        <li>
          Spring Kickoff — <Link to="/party/101">View</Link> ·{" "}
          <Link to="/host/parties/101/edit">Edit</Link>
        </li>
        <li>
          BBQ Night — <Link to="/party/102">View</Link> ·{" "}
          <Link to="/host/parties/102/edit">Edit</Link>
        </li>
      </ul>

      <div style={{ marginTop: "1.5rem" }}>
        <Link to="/host/parties/new" className="btn">Create Party</Link>
        <Link to="/host/settings" className="btn" style={{ background:"transparent", color:"var(--primary)" }}>
          Settings
        </Link>
      </div>
    </section>
  );
}
