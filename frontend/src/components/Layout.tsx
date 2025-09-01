// src/components/Layout.tsx
import { Link, Outlet, useNavigate } from "react-router-dom";
import { logout } from "../lib/api";

export default function Layout() {
  const nav = useNavigate();

  async function handleLogout() {
    try {
      await logout();
    } finally {
      nav("/");
    }
  }

  return (
    <div style={{ minHeight: "100dvh", display: "grid", gridTemplateRows: "auto 1fr auto" }}>
      <header
        style={{
          background: "var(--bg-contrast)",
          color: "var(--fg-on-dark)",
          borderBottom: "1px solid transparent",
        }}
      >
        <div className="container" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <strong style={{ letterSpacing: "0.5px" }}>3rdDegree</strong>
          <nav style={{ display: "flex", gap: "1rem", marginLeft: "auto", alignItems: "center" }}>
            <Link to="/" style={{ color: "var(--accent-white)" }}>Home</Link>
            <Link to="/about" style={{ color: "var(--accent-white)" }}>About</Link>
            <Link to="/tokens" style={{ color: "var(--accent-white)" }}>Tokens</Link>
            <Link to="/login" style={{ color: "var(--accent-white)" }}>Login</Link>
            <button
              onClick={handleLogout}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--accent-white)",
                cursor: "pointer",
              }}
              aria-label="Log out"
            >
              Logout
            </button>
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
          borderTop: "1px solid transparent",
          marginTop: "var(--space-8)",
        }}
      >
        <div className="container">© {new Date().getFullYear()} 3rdDegree</div>
      </footer>
    </div>
  );
}
