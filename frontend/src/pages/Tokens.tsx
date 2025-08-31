// src/pages/Tokens.tsx
const Swatch = ({ name, varName }: { name: string; varName: string }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ width: 40, height: 40, borderRadius: 8, border: "1px solid var(--border)", background: `var(${varName})` }} />
      <code style={{ minWidth: 140 }}>{name}</code>
      <code>{varName}</code>
    </div>
  );
  
  export default function Tokens() {
    return (
      <section className="card" style={{ display: "grid", gap: 16 }}>
        <h2 style={{ margin: 0 }}>Design Tokens — 3rdDegree</h2>
  
        <div style={{ display: "grid", gap: 12 }}>
          <Swatch name="Background (cream)" varName="--bg" />
          <Swatch name="Contrast bg (dark brown)" varName="--bg-contrast" />
          <Swatch name="Text on light" varName="--fg" />
          <Swatch name="Text on dark" varName="--fg-on-dark" />
          <Swatch name="Primary (sage)" varName="--primary" />
          <Swatch name="Accent (briar wood)" varName="--accent-briar" />
          <Swatch name="White" varName="--accent-white" />
        </div>
  
        <div className="card">
        <p>Example card on themed background.</p>
        <button className="btn">Primary Action</button>
        </div>

        <div className="card">
        <p>Dark/Light auto via system theme.</p>
        <a className="btn" href="#">Button</a>
        </div>

      </section>
    );
  }
  