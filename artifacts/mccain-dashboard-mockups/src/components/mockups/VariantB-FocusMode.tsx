const bg = "#1a0a2e";
const surface = "#2a1045";
const surface2 = "#3a1a5e";
const surface3 = "#4a2478";
const accent = "#FFD400";
const muted = "#9b87c0";
const text = "#dde4f0";
const border = "#4a2478";

const feedItems = [
  {
    id: "AI-2024-091",
    title: "LLM Document Extraction Pipeline",
    submitter: "T. Ramirez · Finance",
    time: "2 min ago",
    status: "Under Review",
    statusColor: "#d4830a",
    risk: 71,
    action: "Review Due",
    tags: ["AI/ML", "Document Processing"],
  },
  {
    id: "AI-2024-089",
    title: "Customer Sentiment Analysis (Retail)",
    submitter: "S. Chen · Marketing",
    time: "1h ago",
    status: "Endorsed",
    statusColor: accent,
    risk: 88,
    action: "Approved",
    tags: ["NLP", "Analytics"],
  },
  {
    id: "AI-2024-088",
    title: "Predictive Demand Forecasting Model",
    submitter: "M. Okonkwo · Supply Chain",
    time: "3h ago",
    status: "Needs Info",
    statusColor: "#2980b9",
    risk: 58,
    action: "Respond Required",
    tags: ["ML", "Time Series"],
  },
  {
    id: "AI-2024-086",
    title: "Vision-Based QC Inspector",
    submitter: "L. Petrov · Operations",
    time: "5h ago",
    status: "At Risk",
    statusColor: "#e74c3c",
    risk: 44,
    action: "Escalate",
    tags: ["Computer Vision", "Manufacturing"],
  },
  {
    id: "AI-2024-085",
    title: "Supplier Risk Scoring Engine",
    submitter: "A. Williams · Procurement",
    time: "8h ago",
    status: "Draft",
    statusColor: muted,
    risk: 63,
    action: "Awaiting Submission",
    tags: ["Risk", "Procurement"],
  },
];

const railItems = [
  { icon: "◈", label: "Home", active: true },
  { icon: "⊕", label: "New" },
  { icon: "▦", label: "Queue" },
  { icon: "◉", label: "Patterns" },
  { icon: "⊗", label: "Risk" },
  { icon: "⚖", label: "Policy" },
  { icon: "◎", label: "Vendors" },
];

export default function VariantBFocusMode() {
  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", background: bg, color: text, minHeight: "100vh", display: "flex", fontSize: 13 }}>
      {/* Icon Rail */}
      <aside style={{ width: 56, background: surface, borderRight: `1px solid ${border}`, display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 12, gap: 4, flexShrink: 0 }}>
        <div style={{ width: 34, height: 34, background: accent, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 13, color: "#1a0a2e", marginBottom: 16 }}>EA</div>
        {railItems.map((r) => (
          <button key={r.label} title={r.label} style={{ width: 40, height: 40, background: r.active ? "rgba(255,212,0,.12)" : "none", border: r.active ? `1px solid rgba(255,212,0,.25)` : "1px solid transparent", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: r.active ? accent : muted, cursor: "pointer" }}>
            {r.icon}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <div style={{ width: 32, height: 32, background: surface2, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: muted, marginBottom: 12 }}>JD</div>
      </aside>

      {/* Main: Today's Work Feed */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Top Bar */}
        <div style={{ background: surface, borderBottom: `1px solid ${border}`, padding: "10px 20px", display: "flex", alignItems: "center", gap: 12 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Today's Work</div>
            <div style={{ fontSize: 11, color: muted }}>Wednesday, April 2 · 14 items need attention</div>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
            <input placeholder="Search requests…" style={{ background: surface2, border: `1px solid ${border}`, borderRadius: 6, padding: "5px 12px", color: text, fontSize: 12, width: 200, outline: "none" }} />
            <button style={{ background: accent, color: "#1a0a2e", border: "none", borderRadius: 7, padding: "6px 14px", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>+ Submit</button>
          </div>
        </div>

        {/* Feed + Detail split */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          {/* Feed List */}
          <div style={{ width: 420, borderRight: `1px solid ${border}`, overflow: "auto", padding: "12px" }}>
            <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
              {["All", "Mine", "Overdue", "Pending"].map((t, i) => (
                <button key={t} style={{ background: i === 0 ? "rgba(255,212,0,.1)" : surface2, border: `1px solid ${i === 0 ? "rgba(255,212,0,.3)" : border}`, borderRadius: 6, padding: "4px 11px", fontSize: 11, color: i === 0 ? accent : muted, cursor: "pointer", fontWeight: i === 0 ? 700 : 400 }}>{t}</button>
              ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {feedItems.map((item, idx) => (
                <div key={item.id} style={{ background: idx === 0 ? surface2 : surface, border: `1px solid ${idx === 0 ? "rgba(255,212,0,.2)" : border}`, borderRadius: 10, padding: "12px 14px", cursor: "pointer" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span style={{ fontFamily: "monospace", fontSize: 10, color: muted }}>{item.id}</span>
                    <span style={{ marginLeft: "auto", fontSize: 10, padding: "2px 7px", borderRadius: 999, background: `${item.statusColor}22`, color: item.statusColor, fontWeight: 700 }}>{item.status}</span>
                  </div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: text, marginBottom: 4, lineHeight: 1.35 }}>{item.title}</div>
                  <div style={{ fontSize: 11, color: muted, marginBottom: 8 }}>{item.submitter}</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {item.tags.map((t) => (
                      <span key={t} style={{ background: surface3, border: `1px solid ${border}`, borderRadius: 4, padding: "2px 7px", fontSize: 10, color: muted }}>{t}</span>
                    ))}
                    <span style={{ marginLeft: "auto", fontSize: 10, color: muted }}>{item.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Detail Panel */}
          <div style={{ flex: 1, overflow: "auto", padding: "20px 22px" }}>
            <div style={{ marginBottom: 6, fontSize: 10, color: muted, fontFamily: "monospace" }}>AI-2024-091</div>
            <h2 style={{ fontSize: 18, fontWeight: 800, lineHeight: 1.3, marginBottom: 8 }}>LLM Document Extraction Pipeline</h2>
            <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
              <span style={{ background: "rgba(212,131,10,.15)", color: "#d4830a", border: "1px solid rgba(212,131,10,.25)", borderRadius: 999, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>Under Review</span>
              <span style={{ background: "rgba(230,126,34,.15)", color: "#e67e22", border: "1px solid rgba(230,126,34,.25)", borderRadius: 999, padding: "3px 10px", fontSize: 11 }}>Risk: 71/100</span>
              <span style={{ background: surface2, border: `1px solid ${border}`, borderRadius: 999, padding: "3px 10px", fontSize: 11, color: muted }}>Finance · T. Ramirez</span>
            </div>

            <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: 10, padding: "14px 16px", marginBottom: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: accent, marginBottom: 8 }}>AI Risk Assessment</div>
              {[
                { label: "Privacy & Data Governance", score: 78 },
                { label: "Model Reliability", score: 65 },
                { label: "Regulatory Alignment", score: 82 },
                { label: "Operational Risk", score: 71 },
              ].map((r) => (
                <div key={r.label} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <div style={{ width: 150, fontSize: 11, color: muted, flexShrink: 0 }}>{r.label}</div>
                  <div style={{ flex: 1, height: 6, background: surface2, borderRadius: 999 }}>
                    <div style={{ width: `${r.score}%`, height: "100%", background: "linear-gradient(90deg, #7c5cbf, #a78bfa)", borderRadius: 999 }} />
                  </div>
                  <div style={{ width: 28, fontSize: 11, fontWeight: 700, color: "#a78bfa", textAlign: "right" }}>{r.score}</div>
                </div>
              ))}
            </div>

            <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: 10, padding: "14px 16px", marginBottom: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: accent, marginBottom: 8 }}>Review History</div>
              {[
                { text: "Submitted for initial review", time: "Apr 1 · 09:14", color: "#2980b9" },
                { text: "AI assessment completed — score 71/100", time: "Apr 1 · 09:16", color: "#a78bfa" },
                { text: "Assigned to Architecture Review Board", time: "Apr 1 · 11:30", color: muted },
                { text: "Reviewer requested additional data flow diagram", time: "Apr 2 · 08:45", color: "#d4830a" },
              ].map((h) => (
                <div key={h.text} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 8 }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: h.color, flexShrink: 0, marginTop: 4 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: text }}>{h.text}</div>
                    <div style={{ fontSize: 10, color: muted }}>{h.time}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button style={{ background: accent, color: "#1a0a2e", border: "none", borderRadius: 7, padding: "8px 18px", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Approve</button>
              <button style={{ background: "rgba(212,131,10,.15)", color: "#d4830a", border: "1px solid rgba(212,131,10,.25)", borderRadius: 7, padding: "8px 18px", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Request Changes</button>
              <button style={{ background: surface2, color: text, border: `1px solid ${border}`, borderRadius: 7, padding: "8px 18px", fontSize: 12, cursor: "pointer" }}>Defer</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
