const bg = "#1a0a2e";
const surface = "#2a1045";
const surface2 = "#3a1a5e";
const surface3 = "#4a2478";
const accent = "#FFD400";
const muted = "#9b87c0";
const text = "#dde4f0";
const border = "#4a2478";

type Card = {
  id: string;
  title: string;
  submitter: string;
  risk: number;
  riskLevel: string;
  status: string;
  statusColor: string;
  tags: string[];
  days: number;
  selected?: boolean;
};

const swimlanes: { domain: string; color: string; cards: Card[] }[] = [
  {
    domain: "Finance & Risk",
    color: "#a78bfa",
    cards: [
      { id: "AI-2024-091", title: "LLM Document Extraction", submitter: "T. Ramirez", risk: 71, riskLevel: "High", status: "Under Review", statusColor: "#d4830a", tags: ["LLM", "Document"], days: 3, selected: true },
      { id: "AI-2024-090", title: "Fraud Detection Engine", submitter: "B. Kim", risk: 79, riskLevel: "High", status: "Under Review", statusColor: "#d4830a", tags: ["ML", "Fraud"], days: 5 },
      { id: "AI-2024-087", title: "Credit Risk Scorer", submitter: "P. Adams", risk: 88, riskLevel: "Low", status: "Endorsed", statusColor: accent, tags: ["ML", "Credit"], days: 0 },
    ],
  },
  {
    domain: "Operations & Supply Chain",
    color: "#2980b9",
    cards: [
      { id: "AI-2024-086", title: "Vision QC Inspector", submitter: "L. Petrov", risk: 44, riskLevel: "Critical", status: "Needs Action", statusColor: "#e74c3c", tags: ["CV", "Quality"], days: 14 },
      { id: "AI-2024-088", title: "Demand Forecasting", submitter: "M. Okonkwo", risk: 58, riskLevel: "Medium", status: "Needs Info", statusColor: "#2980b9", tags: ["Forecasting"], days: 9 },
      { id: "AI-2024-085", title: "Supplier Risk Scorer", submitter: "A. Williams", risk: 63, riskLevel: "Medium", status: "Draft", statusColor: muted, tags: ["Risk"], days: 0 },
    ],
  },
  {
    domain: "Marketing & CX",
    color: "#2ecc71",
    cards: [
      { id: "AI-2024-089", title: "Customer Sentiment NLP", submitter: "S. Chen", risk: 88, riskLevel: "Low", status: "Endorsed", statusColor: accent, tags: ["NLP"], days: 0 },
      { id: "AI-2024-082", title: "Chatbot Customer Care", submitter: "B. Kim", risk: 83, riskLevel: "Low", status: "Endorsed", statusColor: accent, tags: ["Chatbot"], days: 0 },
    ],
  },
];

const statusColor = (s: string) =>
  s === "Endorsed" ? accent :
  s === "Under Review" || s === "Needs Info" ? "#d4830a" :
  s === "Needs Action" ? "#e74c3c" :
  muted;

const riskColor = (level: string) =>
  level === "Low" ? "#2ecc71" : level === "Medium" ? "#f39c12" : level === "High" ? "#e67e22" : "#e74c3c";

const statusCols = ["Draft", "Needs Info", "Under Review", "Endorsed"];

export default function WorkflowBKanbanCommand() {
  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", background: bg, color: text, minHeight: "100vh", display: "flex", flexDirection: "column", fontSize: 13 }}>
      {/* Header */}
      <header style={{ background: surface, borderBottom: `1px solid rgba(255,255,255,.08)`, padding: "0 20px", display: "flex", alignItems: "center", gap: 12, height: 48, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 28, height: 28, background: accent, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 12, color: "#1a0a2e" }}>EA</div>
          <span style={{ fontWeight: 700, fontSize: 13 }}>Pattern Board — Domain Swimlanes</span>
        </div>
        <div style={{ height: 18, width: 1, background: border }} />
        <div style={{ display: "flex", gap: 4 }}>
          {["Swimlane: Domain", "Swimlane: Status", "Swimlane: Risk Level"].map((d, i) => (
            <button key={d} style={{ background: i === 0 ? "rgba(255,212,0,.1)" : "none", border: `1px solid ${i === 0 ? "rgba(255,212,0,.25)" : border}`, borderRadius: 6, padding: "3px 10px", fontSize: 11, color: i === 0 ? accent : muted, cursor: "pointer", fontWeight: i === 0 ? 700 : 400 }}>{d}</button>
          ))}
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
          <input placeholder="Search board…" style={{ background: surface2, border: `1px solid ${border}`, borderRadius: 6, padding: "4px 11px", color: text, fontSize: 11.5, width: 170, outline: "none" }} />
          <button style={{ background: accent, color: "#1a0a2e", border: "none", borderRadius: 6, padding: "5px 14px", fontWeight: 700, fontSize: 11.5, cursor: "pointer" }}>+ Submit</button>
        </div>
      </header>

      {/* Body */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Swimlane Board */}
        <div style={{ flex: 1, overflow: "auto", padding: "14px 16px" }}>
          {/* Column headers */}
          <div style={{ display: "grid", gridTemplateColumns: "160px repeat(4, 1fr)", gap: 10, marginBottom: 10 }}>
            <div style={{ background: surface2, border: `1px solid ${border}`, borderRadius: 7, padding: "6px 10px", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".07em", color: muted }}>Domain</div>
            {statusCols.map((col) => (
              <div key={col} style={{ background: surface2, border: `1px solid ${border}`, borderRadius: 7, padding: "6px 10px", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".07em", color: col === "Endorsed" ? accent : col === "Under Review" ? "#d4830a" : muted, textAlign: "center" }}>{col}</div>
            ))}
          </div>

          {/* Domain swimlane rows */}
          {swimlanes.map((lane) => (
            <div key={lane.domain} style={{ display: "grid", gridTemplateColumns: "160px repeat(4, 1fr)", gap: 10, marginBottom: 10 }}>
              {/* Domain label */}
              <div style={{ background: `${lane.color}18`, border: `1px solid ${lane.color}44`, borderRadius: 8, padding: "10px 12px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <div style={{ width: 24, height: 3, background: lane.color, borderRadius: 999, marginBottom: 7 }} />
                <div style={{ fontSize: 11.5, fontWeight: 700, color: lane.color, lineHeight: 1.35 }}>{lane.domain}</div>
                <div style={{ fontSize: 10, color: muted, marginTop: 3 }}>{lane.cards.length} requests</div>
              </div>

              {/* Cards by status column */}
              {statusCols.map((status) => {
                const exactCards = lane.cards.filter(c => {
                  if (status === "Draft") return c.status === "Draft";
                  if (status === "Needs Info") return c.status === "Needs Info" || c.status === "Needs Action";
                  if (status === "Under Review") return c.status === "Under Review";
                  if (status === "Endorsed") return c.status === "Endorsed";
                  return false;
                });
                return (
                  <div key={status} style={{ background: surface, border: `1px solid ${border}`, borderRadius: 8, padding: "8px", minHeight: 80, display: "flex", flexDirection: "column", gap: 6 }}>
                    {exactCards.map((card) => (
                      <div key={card.id} style={{ background: card.selected ? surface2 : surface2, border: `1px solid ${card.selected ? "rgba(255,212,0,.3)" : border}`, borderRadius: 7, padding: "8px 10px", cursor: "pointer", position: "relative" }}>
                        <div style={{ position: "absolute", top: 6, right: 7, color: muted, fontSize: 9, opacity: .5, cursor: "grab" }}>⠿</div>
                        <div style={{ fontFamily: "monospace", fontSize: 9, color: muted, marginBottom: 3 }}>{card.id}</div>
                        <div style={{ fontWeight: 600, fontSize: 11.5, color: text, lineHeight: 1.3, marginBottom: 4, paddingRight: 10 }}>{card.title}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: card.days > 0 ? 5 : 0 }}>
                          <div style={{ flex: 1, height: 4, background: surface3, borderRadius: 999 }}>
                            {card.risk > 0 && <div style={{ width: `${card.risk}%`, height: "100%", background: riskColor(card.riskLevel), borderRadius: 999 }} />}
                          </div>
                          {card.risk > 0 && <span style={{ fontSize: 9.5, fontWeight: 700, color: riskColor(card.riskLevel) }}>{card.risk}</span>}
                        </div>
                        {card.days > 0 && (
                          <div style={{ fontSize: 9.5, color: card.days > 7 ? "#e74c3c" : muted }}>{card.days}d{card.days > 7 ? " — overdue" : ""}</div>
                        )}
                      </div>
                    ))}
                    {exactCards.length === 0 && (
                      <div style={{ border: `1px dashed ${border}`, borderRadius: 7, padding: "8px", textAlign: "center", fontSize: 10, color: muted, opacity: .5, cursor: "pointer" }}>+ Drop here</div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Detail Drawer */}
        <div style={{ width: 300, borderLeft: `1px solid ${border}`, overflow: "auto", padding: "16px 16px", background: surface, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: accent }}>Detail Drawer</div>
            <button style={{ background: "none", border: "none", color: muted, cursor: "pointer", fontSize: 14 }}>✕</button>
          </div>

          <div style={{ fontFamily: "monospace", fontSize: 10, color: muted, marginBottom: 5 }}>AI-2024-091</div>
          <h3 style={{ fontSize: 14, fontWeight: 800, lineHeight: 1.35, marginBottom: 10 }}>LLM Document Extraction Pipeline</h3>

          <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 12 }}>
            <span style={{ background: "rgba(212,131,10,.15)", color: "#d4830a", border: "1px solid rgba(212,131,10,.25)", borderRadius: 999, padding: "2px 9px", fontSize: 10, fontWeight: 700 }}>Under Review</span>
            <span style={{ background: "rgba(167,139,250,.12)", color: "#a78bfa", border: "1px solid rgba(167,139,250,.25)", borderRadius: 999, padding: "2px 9px", fontSize: 10 }}>Finance & Risk</span>
            <span style={{ background: "rgba(230,126,34,.15)", color: "#e67e22", border: "1px solid rgba(230,126,34,.25)", borderRadius: 999, padding: "2px 9px", fontSize: 10 }}>Risk: High · 71</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 12 }}>
            {[
              { label: "Submitter", value: "T. Ramirez" },
              { label: "Domain", value: "Finance & Risk" },
              { label: "Submitted", value: "Apr 1, 2024" },
              { label: "Days in Stage", value: "3 days" },
              { label: "Reviewer", value: "Architecture Board" },
            ].map((kv) => (
              <div key={kv.label} style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 11, color: muted }}>{kv.label}</span>
                <span style={{ fontSize: 11, color: text, fontWeight: 600 }}>{kv.value}</span>
              </div>
            ))}
          </div>

          <div style={{ background: surface2, border: `1px solid ${border}`, borderRadius: 8, padding: "10px 12px", marginBottom: 10 }}>
            <div style={{ fontSize: 9.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".07em", color: accent, marginBottom: 7 }}>AI Risk Assessment</div>
            {[
              { label: "Privacy & Data", score: 78, color: "#2ecc71" },
              { label: "Reliability", score: 65, color: "#f39c12" },
              { label: "Regulatory", score: 82, color: "#2ecc71" },
              { label: "Operational", score: 71, color: "#f39c12" },
            ].map((r) => (
              <div key={r.label} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                <div style={{ width: 80, fontSize: 10, color: muted, flexShrink: 0 }}>{r.label}</div>
                <div style={{ flex: 1, height: 5, background: surface3, borderRadius: 999 }}>
                  <div style={{ width: `${r.score}%`, height: "100%", background: r.color, borderRadius: 999 }} />
                </div>
                <span style={{ width: 22, fontSize: 10, fontWeight: 700, color: r.color, textAlign: "right" }}>{r.score}</span>
              </div>
            ))}
          </div>

          <div style={{ background: surface2, border: `1px solid ${border}`, borderRadius: 8, padding: "10px 12px", marginBottom: 12 }}>
            <div style={{ fontSize: 9.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".07em", color: accent, marginBottom: 7 }}>Flags</div>
            {[
              "PII handling requires DPA reference",
              "Fallback mechanism not documented",
            ].map((f) => (
              <div key={f} style={{ display: "flex", gap: 6, padding: "5px 7px", background: surface3, borderLeft: "3px solid #e67e22", borderRadius: "0 5px 5px 0", marginBottom: 5, fontSize: 11, color: text }}>
                <span>⚠</span> {f}
              </div>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            <button style={{ background: accent, color: "#1a0a2e", border: "none", borderRadius: 7, padding: "9px", fontWeight: 700, fontSize: 12, cursor: "pointer", width: "100%" }}>Approve Endorsement</button>
            <button style={{ background: "rgba(212,131,10,.12)", color: "#d4830a", border: "1px solid rgba(212,131,10,.25)", borderRadius: 7, padding: "9px", fontWeight: 700, fontSize: 12, cursor: "pointer", width: "100%" }}>Request Changes</button>
            <div style={{ display: "flex", gap: 6 }}>
              <button style={{ flex: 1, background: surface2, color: muted, border: `1px solid ${border}`, borderRadius: 7, padding: "7px", fontSize: 11, cursor: "pointer" }}>Defer</button>
              <button style={{ flex: 1, background: surface2, color: muted, border: `1px solid ${border}`, borderRadius: 7, padding: "7px", fontSize: 11, cursor: "pointer" }}>Full View</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
