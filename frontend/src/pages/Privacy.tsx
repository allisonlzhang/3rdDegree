// src/pages/Privacy.tsx
export default function Privacy() {
    return (
      <section className="section" style={{ maxWidth: 640, margin: "4rem auto" }}>
        <h2 style={{ marginTop: 0 }}>Privacy</h2>
        <p>We only collect what’s needed to run parties and RSVPs (e.g., host phone, party details, guest responses).</p>
        <ul>
          <li>No selling of data.</li>
          <li>Cookies only for session/auth.</li>
          <li>Delete data on request (host-controlled).</li>
        </ul>
        <p>Questions? Email the host or the 3rdDegree team.</p>
      </section>
    );
  }
  