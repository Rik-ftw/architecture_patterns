const bg = "#1a0a2e";
const surface = "#2a1045";
const surface2 = "#3a1a5e";
const surface3 = "#4a2478";
const accent = "#FFD400";
const muted = "#9b87c0";
const text = "#dde4f0";
const border = "#4a2478";

const sparkline = (vals: number[], color: string) => {
  const max = Math.max(...vals);
  const min = Math.min(...vals);
  const range = max - min || 1;
  const w = 70, h = 24;
  const pts = vals.map((v, i) => `${(i / (vals.length - 1)) * w},${h - ((v - min) / range) * h}`).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const tableRows = [
  { id: "AI-2024-091", name: "LLM Doc Extraction", domain: "Finance", submitter: "T. Ramirez", risk: 71, status: "Under Review", days: 3, ai: 71 },
  { id: "AI-2024-089", name: "Customer Sentiment NLP", domain: "Marketing", submitter: "S. Chen", risk: 88, status: "Endorsed", days: 0, ai: 88 },
  { id: "AI-2024-088", name: "Demand Forecasting ML", domain: "Supply Chain", submitter: "M. Okonkwo", risk: 58, status: "Needs Info", days: 9, ai: 58 },
  { id: "AI-2024-086", name: "Vision QC Inspector", domain: "Operations", submitter: "L. Petrov", risk: 44, status: "At Risk", days: 14, ai: 44 },
  { id: "AI-2024-085", name: "Supplier Risk Scorer", domain: "Procurement", submitter: "A. Williams", risk: 63, status: "Draft", days: 0, ai: 63 },
  { id: "AI-2024-082", name: "Chatbot Customer Care", domain: "CX", submitter: "B. Kim", risk: 83, status: "Approved", days: 1, ai: 83 },
  { id: "AI-2024-079", name: "Predictive Maintenance", domain: "Operations", submitter: "C. Nguyen", risk: 75, status: "Under Review", days: 5, ai: 75 },
];

const statusColor = (s: string) =>
  s === "Endorsed" || s === "Approved" ? "#2ecc71" :
  s === "Under Review" || s === "Needs Info" ? "#d4830a" :
  s === "At Risk" ? "#e74c3c" :
  s === "Draft" ? muted : muted;

export default function VariantCDataDense() {
  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", background: bg, color: text, minHeight: "100vh", display: "flex", flexDirection: "column", fontSize: 12.5 }}>
      {/* Full-width Header */}
      <header style={{ background: surface, borderBottom: `1px solid ${border}`, padding: "0 20px", display: "flex", alignItems: "center", gap: 16, height: 46, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 28, height: 28, background: accent, borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 11, color: "#1a0a2e" }}>EA</div>
          <span style={{ fontWeight: 700, fontSize: 13 }}>McCain EA Platform</span>
        </div>
        <div style={{ height: 18, width: 1, background: border }} />
        <nav style={{ display: "flex", gap: 1 }}>
          {["Dashboard", "Requests", "Patterns", "Risk", "Policies", "Vendors", "Reports"].map((n, i) => (
            <button key={n} style={{ background: i === 0 ? "rgba(255,212,0,.1)" : "none", border: "none", color: i === 0 ? accent : muted, padding: "0 12px", height: 46, fontSize: 12, fontWeight: i === 0 ? 700 : 400, borderBottom: i === 0 ? `2px solid ${accent}` : "2px solid transparent", cursor: "pointer" }}>{n}</button>
          ))}
        </nav>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
          <select style={{ background: surface2, border: `1px solid ${border}`, borderRadius: 5, padding: "4px 8px", color: text, fontSize: 11, cursor: "pointer", outline: "none" }}>
            <option>Q2 2024</option>
          </select>
          <input placeholder="Search…" style={{ background: surface2, border: `1px solid ${border}`, borderRadius: 5, padding: "4px 10px", color: text, fontSize: 11.5, width: 160, outline: "none" }} />
          <div style={{ background: "rgba(255,212,0,.12)", color: accent, borderRadius: 4, padding: "3px 8px", fontSize: 10, fontWeight: 700 }}>LIVE</div>
        </div>
      </header>

      {/* KPI Row */}
      <div style={{ background: surface, borderBottom: `1px solid ${border}`, padding: "8px 20px", display: "flex", gap: 0, flexShrink: 0 }}>
        {[
          { label: "Total Requests", value: 247, delta: "+12", color: accent, spark: [180, 195, 210, 220, 235, 247] },
          { label: "Endorsed", value: 89, delta: "+5", color: "#2ecc71", spark: [60, 68, 75, 79, 85, 89] },
          { label: "Under Review", value: 43, delta: "+3", color: "#d4830a", spark: [30, 35, 38, 40, 41, 43] },
          { label: "At Risk", value: 16, delta: "-2", color: "#e74c3c", spark: [22, 20, 19, 18, 17, 16] },
          { label: "Avg Risk Score", value: "62", delta: "↓4", color: "#e67e22", spark: [68, 66, 65, 64, 63, 62] },
          { label: "Active Vendors", value: 31, delta: "+1", color: "#2980b9", spark: [26, 27, 28, 29, 30, 31] },
          { label: "Decisions Today", value: 14, delta: "5 approved", color: "#a78bfa", spark: [8, 9, 11, 12, 13, 14] },
        ].map((k, i) => (
          <div key={k.label} style={{ flex: 1, padding: "4px 16px", borderRight: i < 6 ? `1px solid ${border}` : "none", display: "flex", flexDirection: "column", gap: 2 }}>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
              <div style={{ fontSize: 20, fontWeight: 900, color: k.color, lineHeight: 1 }}>{k.value}</div>
              {sparkline(k.spark, k.color)}
            </div>
            <div style={{ fontSize: 9.5, color: muted, textTransform: "uppercase", letterSpacing: ".05em" }}>{k.label}</div>
            <div style={{ fontSize: 9.5, color: k.delta.startsWith("+") ? "#2ecc71" : k.delta.startsWith("-") ? "#e74c3c" : muted }}>{k.delta}</div>
          </div>
        ))}
      </div>

      {/* Main Content: 2-column chart grid */}
      <main style={{ flex: 1, padding: "14px 20px", overflow: "auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          {/* Chart 1: Domain Breakdown */}
          <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: 8, padding: "12px 14px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".07em", color: accent }}>Intake by Domain</div>
              <div style={{ fontSize: 9.5, color: muted }}>Last 30 days</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                { label: "Enterprise AI Tooling", count: 47, pct: 78 },
                { label: "Data & Analytics", count: 38, pct: 62 },
                { label: "Cloud Infra", count: 33, pct: 55 },
                { label: "Security & IAM", count: 27, pct: 44 },
                { label: "Integration & APIs", count: 19, pct: 31 },
                { label: "ML Ops", count: 14, pct: 23 },
              ].map((r) => (
                <div key={r.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 140, fontSize: 10.5, color: muted, flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.label}</div>
                  <div style={{ flex: 1, height: 7, background: surface3, borderRadius: 999 }}>
                    <div style={{ width: `${r.pct}%`, height: "100%", background: accent, borderRadius: 999 }} />
                  </div>
                  <div style={{ width: 22, fontSize: 10.5, fontWeight: 700, color: text, textAlign: "right", flexShrink: 0 }}>{r.count}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Chart 2: Status Distribution */}
          <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: 8, padding: "12px 14px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".07em", color: accent }}>Status Distribution</div>
              <div style={{ fontSize: 9.5, color: muted }}>All time</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[
                { label: "Endorsed", count: 89, color: "#2ecc71", pct: "36%" },
                { label: "Under Review", count: 43, color: "#d4830a", pct: "17%" },
                { label: "Needs Info", count: 28, color: "#2980b9", pct: "11%" },
                { label: "At Risk", count: 16, color: "#e74c3c", pct: "6%" },
                { label: "Approved", count: 37, color: "#a78bfa", pct: "15%" },
                { label: "Draft / Other", count: 34, color: muted, pct: "14%" },
              ].map((s) => (
                <div key={s.label} style={{ background: surface2, borderRadius: 7, padding: "8px 10px", display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.count}</div>
                    <div style={{ fontSize: 9.5, color: muted, marginTop: 1 }}>{s.label}</div>
                  </div>
                  <div style={{ fontSize: 10, color: muted }}>{s.pct}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Full-width table */}
        <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: 8, overflow: "hidden", marginBottom: 10 }}>
          <div style={{ padding: "10px 14px", borderBottom: `1px solid ${border}`, display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".07em", color: accent }}>Request Registry</div>
            <div style={{ fontSize: 10, color: muted, marginLeft: "auto" }}>Showing 7 of 247 · sorted by Risk ↓</div>
            <select style={{ background: surface2, border: `1px solid ${border}`, borderRadius: 5, padding: "3px 7px", color: text, fontSize: 10, outline: "none", cursor: "pointer" }}>
              <option>All Statuses</option>
            </select>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11.5 }}>
            <thead>
              <tr>
                {["ID", "Solution Name", "Domain", "Submitter", "AI Score", "Status", "Days Open", "Action"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "5px 10px", background: surface2, color: muted, fontSize: 9.5, textTransform: "uppercase", letterSpacing: ".06em", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableRows.map((r, i) => (
                <tr key={r.id} style={{ borderBottom: `1px solid ${border}`, background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,.01)" }}>
                  <td style={{ padding: "6px 10px", fontFamily: "monospace", fontSize: 10.5, color: muted }}>{r.id}</td>
                  <td style={{ padding: "6px 10px", fontWeight: 600, color: text }}>{r.name}</td>
                  <td style={{ padding: "6px 10px", color: muted }}>{r.domain}</td>
                  <td style={{ padding: "6px 10px", color: muted }}>{r.submitter}</td>
                  <td style={{ padding: "6px 10px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 36, height: 5, background: surface3, borderRadius: 999 }}>
                        <div style={{ width: `${r.ai}%`, height: "100%", background: r.ai >= 70 ? "#2ecc71" : r.ai >= 50 ? "#f39c12" : "#e74c3c", borderRadius: 999 }} />
                      </div>
                      <span style={{ fontWeight: 700, fontSize: 11, color: r.ai >= 70 ? "#2ecc71" : r.ai >= 50 ? "#f39c12" : "#e74c3c" }}>{r.ai}</span>
                    </div>
                  </td>
                  <td style={{ padding: "6px 10px" }}>
                    <span style={{ padding: "2px 7px", borderRadius: 999, fontSize: 9.5, fontWeight: 700, background: `${statusColor(r.status)}22`, color: statusColor(r.status) }}>{r.status}</span>
                  </td>
                  <td style={{ padding: "6px 10px", color: r.days > 7 ? "#e74c3c" : muted, fontWeight: r.days > 7 ? 700 : 400 }}>{r.days > 0 ? `${r.days}d` : "—"}</td>
                  <td style={{ padding: "6px 10px" }}>
                    <button style={{ background: "rgba(255,212,0,.1)", color: accent, border: "1px solid rgba(255,212,0,.2)", borderRadius: 5, padding: "3px 9px", fontSize: 10, cursor: "pointer", fontWeight: 600 }}>Review</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Status Ribbon */}
        <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: 8, padding: "8px 14px", display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ fontSize: 9.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: accent, flexShrink: 0 }}>System Status</div>
          {[
            { label: "AI Review Engine", status: "OPERATIONAL", color: "#2ecc71" },
            { label: "Risk Scoring", status: "OPERATIONAL", color: "#2ecc71" },
            { label: "Vendor Registry", status: "OPERATIONAL", color: "#2ecc71" },
            { label: "Policy Engine", status: "DEGRADED", color: "#d4830a" },
            { label: "Notification Service", status: "OPERATIONAL", color: "#2ecc71" },
          ].map((s) => (
            <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: s.color }} />
              <span style={{ fontSize: 10, color: muted }}>{s.label}</span>
              <span style={{ fontSize: 9, fontWeight: 700, color: s.color }}>{s.status}</span>
            </div>
          ))}
          <div style={{ marginLeft: "auto", fontSize: 9.5, color: muted }}>Last updated: 14:32 UTC · Cache TTL: 60s</div>
        </div>
      </main>
    </div>
  );
}
