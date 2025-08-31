import { Link, Outlet } from "react-router-dom";

export default function Layout() {
  return (
    <div style={{ minHeight: "100dvh", display: "grid", gridTemplateRows: "auto 1fr auto" }}>
      <header
        style={{
          background: "var(--bg-contrast)",
          color: "var(--fg-on-dark)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="container" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <strong style={{ letterSpacing: "0.5px" }}>3rdDegree</strong>
          <nav style={{ display: "flex", gap: "1rem", marginLeft: "auto" }}>
            <Link to="/" style={{ color: "var(--accent-white)" }}>Home</Link>
            <Link to="/tokens" style={{ color: "var(--accent-white)" }}>Tokens</Link>
            <Link to="/login" style={{ color: "var(--accent-white)" }}>Login</Link> {/* new link */}
          </nav>
        </div>
      </header>

      <main className="container">
        <Outlet />
      </main>

      <footer
        style={{
          background: "var(--bg-contrast)",
          color: "var(--fg-on-dark)",
          borderTop: "1px solid var(--border)",
          marginTop: "var(--space-8)",
        }}
      >
        <div className="container">© {new Date().getFullYear()} 3rdDegree</div>
      </footer>
    </div>
  );
}
