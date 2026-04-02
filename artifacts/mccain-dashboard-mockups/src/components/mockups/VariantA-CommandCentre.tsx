const bg = "#1a0a2e";
const surface = "#2a1045";
const surface2 = "#3a1a5e";
const surface3 = "#4a2478";
const accent = "#FFD400";
const muted = "#9b87c0";
const text = "#dde4f0";
const border = "#4a2478";

const kpis = [
  { label: "Total Requests", value: "247", delta: "+12 this week", color: accent },
  { label: "Endorsed", value: "89", delta: "36% of total", color: "#2ecc71" },
  { label: "Under Review", value: "43", delta: "8 pending >7d", color: "#d4830a" },
  { label: "Avg Risk Score", value: "62", delta: "↓4 vs last month", color: "#e67e22" },
  { label: "Vendors Active", value: "31", delta: "3 flagged", color: "#2980b9" },
  { label: "Decisions Today", value: "14", delta: "5 approved", color: "#a78bfa" },
];

const widgets = [
  {
    title: "Intake by Domain",
    span: 2,
    content: (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {[
          { label: "Enterprise AI Tooling", pct: 78, count: 47 },
          { label: "Data & Analytics", pct: 62, count: 38 },
          { label: "Cloud Infrastructure", pct: 55, count: 33 },
          { label: "Security & IAM", pct: 44, count: 27 },
          { label: "Integration & APIs", pct: 31, count: 19 },
        ].map((r) => (
          <div key={r.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 160, fontSize: 11, color: muted, flexShrink: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.label}</div>
            <div style={{ flex: 1, height: 8, background: surface3, borderRadius: 999 }}>
              <div style={{ width: `${r.pct}%`, height: "100%", background: accent, borderRadius: 999 }} />
            </div>
            <div style={{ width: 28, fontSize: 11, fontWeight: 700, color: text, textAlign: "right", flexShrink: 0 }}>{r.count}</div>
          </div>
        ))}
      </div>
    ),
  },
  {
    title: "Recent Activity",
    span: 1,
    content: (
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {[
          { label: "AI-2024-089 endorsed", time: "2m ago", color: "#2ecc71" },
          { label: "AI-2024-091 risk flagged", time: "18m ago", color: "#e67e22" },
          { label: "AI-2024-085 under review", time: "1h ago", color: "#d4830a" },
          { label: "Vendor Snowflake added", time: "3h ago", color: "#2980b9" },
          { label: "Policy v4.2 activated", time: "5h ago", color: accent },
        ].map((a) => (
          <div key={a.label} style={{ display: "flex", alignItems: "center", gap: 8, background: surface2, borderRadius: 6, padding: "6px 10px" }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: a.color, flexShrink: 0 }} />
            <div style={{ flex: 1, fontSize: 11.5, color: text }}>{a.label}</div>
            <div style={{ fontSize: 10, color: muted, flexShrink: 0 }}>{a.time}</div>
          </div>
        ))}
      </div>
    ),
  },
  {
    title: "Risk Distribution",
    span: 1,
    content: (
      <div>
        <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
          {[
            { label: "Critical", count: 4, color: "#e74c3c" },
            { label: "High", count: 12, color: "#e67e22" },
            { label: "Medium", count: 28, color: "#f39c12" },
            { label: "Low", count: 45, color: "#2ecc71" },
          ].map((r) => (
            <div key={r.label} style={{ background: surface2, border: `1px solid ${border}`, borderRadius: 8, padding: "8px 14px", textAlign: "center", flex: 1 }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: r.color }}>{r.count}</div>
              <div style={{ fontSize: 10, color: muted, marginTop: 2 }}>{r.label}</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 11, color: muted }}>89 requests assessed this quarter. Risk scores recalculated hourly.</div>
      </div>
    ),
  },
  {
    title: "Pattern Board (Top Patterns)",
    span: 1,
    content: (
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {[
          { id: "PAT-001", name: "RAG Pipeline", status: "Endorsed", uses: 23 },
          { id: "PAT-004", name: "Agentic Workflow", status: "In Review", uses: 11 },
          { id: "PAT-007", name: "Fine-tune + RLHF", status: "Endorsed", uses: 8 },
          { id: "PAT-012", name: "Vector Store", status: "Draft", uses: 5 },
        ].map((p) => (
          <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 8, background: surface2, borderRadius: 6, padding: "5px 10px" }}>
            <div style={{ fontFamily: "monospace", fontSize: 10, color: muted, width: 58, flexShrink: 0 }}>{p.id}</div>
            <div style={{ flex: 1, fontSize: 12, fontWeight: 600, color: text }}>{p.name}</div>
            <div style={{ fontSize: 10, padding: "2px 7px", borderRadius: 999, background: p.status === "Endorsed" ? "rgba(255,212,0,.15)" : p.status === "In Review" ? "rgba(212,131,10,.15)" : "rgba(74,85,104,.2)", color: p.status === "Endorsed" ? accent : p.status === "In Review" ? "#d4830a" : muted }}>{p.status}</div>
            <div style={{ fontSize: 10, color: muted, flexShrink: 0 }}>{p.uses} uses</div>
          </div>
        ))}
      </div>
    ),
  },
  {
    title: "AI Review Queue",
    span: 2,
    content: (
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11.5 }}>
        <thead>
          <tr>
            {["Request ID", "Solution", "Submitter", "AI Score", "Status", "Days Open"].map((h) => (
              <th key={h} style={{ textAlign: "left", padding: "4px 8px", background: surface3, color: muted, fontSize: 10, textTransform: "uppercase", letterSpacing: ".06em" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[
            { id: "AI-2024-091", sol: "LLM Document Extraction", sub: "T. Ramirez", score: 71, status: "Under Review", days: 3 },
            { id: "AI-2024-088", sol: "Predictive Demand Model", sub: "S. Chen", score: 58, status: "Needs Info", days: 9 },
            { id: "AI-2024-086", sol: "Chatbot Customer Care", sub: "M. Okonkwo", score: 83, status: "Approved", days: 1 },
            { id: "AI-2024-082", sol: "Vision QC Inspector", sub: "L. Petrov", score: 44, status: "At Risk", days: 14 },
          ].map((r) => (
            <tr key={r.id} style={{ borderBottom: `1px solid ${border}` }}>
              <td style={{ padding: "6px 8px", fontFamily: "monospace", color: muted }}>{r.id}</td>
              <td style={{ padding: "6px 8px", color: text, fontWeight: 600 }}>{r.sol}</td>
              <td style={{ padding: "6px 8px", color: muted }}>{r.sub}</td>
              <td style={{ padding: "6px 8px" }}>
                <span style={{ fontWeight: 700, color: r.score >= 70 ? "#2ecc71" : r.score >= 50 ? "#f39c12" : "#e74c3c" }}>{r.score}</span>
              </td>
              <td style={{ padding: "6px 8px" }}>
                <span style={{ padding: "2px 7px", borderRadius: 999, fontSize: 10, fontWeight: 700, background: r.status === "Approved" ? "rgba(46,204,113,.15)" : r.status === "At Risk" ? "rgba(231,76,60,.15)" : r.status === "Needs Info" ? "rgba(41,128,185,.15)" : "rgba(212,131,10,.15)", color: r.status === "Approved" ? "#2ecc71" : r.status === "At Risk" ? "#e74c3c" : r.status === "Needs Info" ? "#2980b9" : "#d4830a" }}>{r.status}</span>
              </td>
              <td style={{ padding: "6px 8px", color: r.days > 7 ? "#e74c3c" : muted }}>{r.days}d</td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
  },
];

const navItems = [
  { icon: "◈", label: "Dashboard", active: true },
  { icon: "⊕", label: "Submit Request" },
  { icon: "◉", label: "Pattern Library" },
  { icon: "⊗", label: "Risk Engine" },
  { icon: "▦", label: "Review Queue" },
  { icon: "⚖", label: "Policies" },
  { icon: "◎", label: "Vendors" },
  { icon: "⚙", label: "Settings" },
];

export default function VariantACommandCentre() {
  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", background: bg, color: text, minHeight: "100vh", display: "flex", flexDirection: "column", fontSize: 13 }}>
      {/* Top Nav */}
      <header style={{ background: surface, borderBottom: `1px solid rgba(255,255,255,.08)`, padding: "0 20px", display: "flex", alignItems: "center", gap: 0, height: 50, flexShrink: 0, position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginRight: 32 }}>
          <div style={{ width: 30, height: 30, background: accent, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 13, color: "#1a0a2e" }}>EA</div>
          <span style={{ fontWeight: 700, fontSize: 14 }}>McCain EA Platform</span>
        </div>
        <nav style={{ display: "flex", gap: 2 }}>
          {navItems.map((n) => (
            <button key={n.label} style={{ background: n.active ? "rgba(255,212,0,.1)" : "none", border: "none", color: n.active ? accent : muted, padding: "0 14px", height: 50, cursor: "pointer", fontSize: 12.5, fontWeight: n.active ? 700 : 500, borderBottom: n.active ? `2px solid ${accent}` : "2px solid transparent", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 13 }}>{n.icon}</span> {n.label}
            </button>
          ))}
        </nav>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
          <input placeholder="⌘ Search requests…" style={{ background: surface2, border: `1px solid ${border}`, borderRadius: 6, padding: "5px 12px", color: text, fontSize: 12, width: 200, outline: "none" }} />
          <div style={{ background: "rgba(255,212,0,.15)", color: accent, border: `1px solid rgba(255,212,0,.3)`, borderRadius: 5, padding: "3px 9px", fontSize: 11, fontWeight: 700 }}>AI PORTAL</div>
        </div>
      </header>

      {/* KPI Strip */}
      <div style={{ background: surface, borderBottom: `1px solid ${border}`, padding: "10px 24px", display: "flex", gap: 16, flexShrink: 0 }}>
        {kpis.map((k) => (
          <div key={k.label} style={{ display: "flex", flexDirection: "column", gap: 2, borderRight: `1px solid ${border}`, paddingRight: 20, flex: 1 }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: k.color, lineHeight: 1 }}>{k.value}</div>
            <div style={{ fontSize: 10, color: muted, textTransform: "uppercase", letterSpacing: ".05em" }}>{k.label}</div>
            <div style={{ fontSize: 10, color: muted }}>{k.delta}</div>
          </div>
        ))}
      </div>

      {/* Body: collapsible side panel + main bento grid */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Collapsible Side Panel (shown expanded) */}
        <div style={{ width: 220, background: surface, borderRight: `1px solid ${border}`, overflow: "auto", flexShrink: 0, display: "flex", flexDirection: "column" }}>
          {/* Panel header with collapse button affordance */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderBottom: `1px solid ${border}` }}>
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: accent }}>Quick Filters</span>
            <button title="Collapse panel" style={{ background: surface2, border: `1px solid ${border}`, borderRadius: 5, padding: "3px 7px", color: muted, fontSize: 11, cursor: "pointer", lineHeight: 1 }}>‹</button>
          </div>

          {/* Pinned views */}
          <div style={{ padding: "8px 10px", borderBottom: `1px solid ${border}` }}>
            <div style={{ fontSize: 9.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: muted, marginBottom: 6 }}>Pinned Views</div>
            {["My Requests", "Overdue Items", "ARB Queue", "Endorsed This Month"].map((v, i) => (
              <button key={v} style={{ display: "flex", width: "100%", alignItems: "center", gap: 7, background: i === 0 ? "rgba(255,212,0,.08)" : "none", border: i === 0 ? "1px solid rgba(255,212,0,.2)" : "1px solid transparent", borderRadius: 6, padding: "5px 8px", color: i === 0 ? accent : muted, fontSize: 11.5, cursor: "pointer", marginBottom: 3, textAlign: "left" }}>
                <span style={{ fontSize: 12 }}>{["★", "⏱", "▦", "✓"][i]}</span> {v}
                {i === 1 && <span style={{ marginLeft: "auto", background: "#e74c3c", color: "#fff", borderRadius: 99, padding: "1px 5px", fontSize: 9, fontWeight: 700 }}>4</span>}
              </button>
            ))}
          </div>

          {/* Domain filter */}
          <div style={{ padding: "8px 10px", borderBottom: `1px solid ${border}` }}>
            <div style={{ fontSize: 9.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: muted, marginBottom: 6 }}>Filter by Domain</div>
            {[
              { label: "All Domains", count: 247, active: true },
              { label: "Enterprise AI", count: 47 },
              { label: "Data & Analytics", count: 38 },
              { label: "Cloud Infra", count: 33 },
              { label: "Security & IAM", count: 27 },
              { label: "Integration", count: 19 },
            ].map((d) => (
              <div key={d.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 6px", borderRadius: 5, background: d.active ? "rgba(255,212,0,.08)" : "none", marginBottom: 2, cursor: "pointer" }}>
                <span style={{ fontSize: 11, color: d.active ? accent : muted }}>{d.label}</span>
                <span style={{ fontSize: 10, color: d.active ? accent : muted, opacity: .7 }}>{d.count}</span>
              </div>
            ))}
          </div>

          {/* Status filter */}
          <div style={{ padding: "8px 10px" }}>
            <div style={{ fontSize: 9.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: muted, marginBottom: 6 }}>Filter by Status</div>
            {[
              { label: "Endorsed", color: "#2ecc71", count: 89 },
              { label: "Under Review", color: "#d4830a", count: 43 },
              { label: "At Risk", color: "#e74c3c", count: 16 },
              { label: "Draft", color: muted, count: 34 },
            ].map((s) => (
              <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 7, padding: "4px 6px", borderRadius: 5, marginBottom: 2, cursor: "pointer" }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: muted, flex: 1 }}>{s.label}</span>
                <span style={{ fontSize: 10, color: muted, opacity: .7 }}>{s.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bento Grid */}
        <main style={{ flex: 1, padding: "18px 20px", overflow: "auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
            {widgets.map((w) => (
              <div key={w.title} style={{ gridColumn: `span ${w.span}`, background: surface, border: `1px solid ${border}`, borderRadius: 10, padding: "14px 16px" }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: accent, marginBottom: 12 }}>{w.title}</div>
                {w.content}
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
