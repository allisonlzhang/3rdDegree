// src/pages/Home.tsx
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <section>
      <h1>3rdDegree Home</h1>
      <p>Welcome! Use the nav to explore.</p>

      <div style={{ marginTop: "2rem" }}>
        <h3>Demo</h3>
        <p>
          Try an RSVP form (demo party id <code>123</code>):{" "}
          <Link to="/party/123/rsvp?t=demo-token" className="btn">
            RSVP Demo
          </Link>
        </p>
        <p>
          Try an Invite landing page:{" "}
          <Link to="/invite/123?t=demo-token" className="btn">
            Invite Demo
          </Link>
        </p>
        <p>
          Manage an RSVP:&nbsp;
          <Link to="/rsvp/abc123?t=demo-token" className="btn">Update RSVP Demo</Link>
        </p>
      </div>
    </section>
  );
}
