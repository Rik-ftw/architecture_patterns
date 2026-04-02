const bg = "#1a0a2e";
const surface = "#2a1045";
const surface2 = "#3a1a5e";
const surface3 = "#4a2478";
const accent = "#FFD400";
const muted = "#9b87c0";
const text = "#dde4f0";
const border = "#4a2478";

const steps = [
  { num: 1, label: "Basic Info", sublabel: "Name & ownership", done: true },
  { num: 2, label: "Technical", sublabel: "Architecture & data", done: true },
  { num: 3, label: "Risk Profile", sublabel: "Impact & controls", active: true },
  { num: 4, label: "AI Review", sublabel: "Automated analysis" },
  { num: 5, label: "Submit", sublabel: "Review & confirm" },
];

const aiSuggestions = [
  { priority: "MUST", text: "Add a Data Processing Agreement reference — this solution handles PII from customer records." },
  { priority: "SHOULD", text: "Document the fallback mechanism if the LLM API is unavailable during high-demand periods." },
  { priority: "SHOULD", text: "Clarify which data retention policy applies to extracted document embeddings." },
  { priority: "CONSIDER", text: "Consider adding a human-in-the-loop review step for low-confidence extractions (<70% score)." },
];

const riskDimensions = [
  { label: "Data Sensitivity", options: ["None", "Internal", "Confidential", "Restricted"], selected: 2 },
  { label: "Regulatory Scope", options: ["None", "PIPEDA", "GDPR", "Both"], selected: 1 },
  { label: "Processing Volume", options: ["<1K/day", "1K–10K/day", ">10K/day", "Batch only"], selected: 2 },
  { label: "Human Oversight", options: ["Full auto", "Spot review", "Human-in-loop", "Human approval"], selected: 1 },
];

export default function WorkflowAGuidedStepper() {
  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", background: bg, color: text, minHeight: "100vh", display: "flex", flexDirection: "column", fontSize: 13 }}>
      {/* Header */}
      <header style={{ background: surface, borderBottom: `1px solid rgba(255,255,255,.08)`, padding: "0 24px", display: "flex", alignItems: "center", gap: 12, height: 48, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 28, height: 28, background: accent, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 12, color: "#1a0a2e" }}>EA</div>
          <span style={{ fontWeight: 700, fontSize: 13 }}>Submit AI Solution Request</span>
        </div>
        <div style={{ marginLeft: "auto", fontSize: 11, color: muted }}>Draft auto-saved · 2 min ago</div>
        <button style={{ background: "none", border: `1px solid ${border}`, borderRadius: 6, padding: "4px 12px", color: muted, fontSize: 11, cursor: "pointer" }}>Save &amp; Exit</button>
      </header>

      {/* Progress Track */}
      <div style={{ background: surface, borderBottom: `1px solid ${border}`, padding: "0 24px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "stretch", gap: 0, position: "relative" }}>
          {steps.map((s, i) => (
            <div key={s.num} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "12px 8px 10px", position: "relative", borderBottom: s.active ? `2px solid ${accent}` : s.done ? "2px solid rgba(46,204,113,.5)" : "2px solid transparent" }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: s.active ? accent : s.done ? "rgba(46,204,113,.2)" : surface2, border: s.active ? "none" : s.done ? "1px solid rgba(46,204,113,.4)" : `1px solid ${border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900, color: s.active ? "#1a0a2e" : s.done ? "#2ecc71" : muted, marginBottom: 6, zIndex: 1 }}>
                {s.done ? "✓" : s.num}
              </div>
              <div style={{ fontSize: 11, fontWeight: s.active ? 700 : 500, color: s.active ? text : s.done ? "#9b87c0" : muted }}>{s.label}</div>
              <div style={{ fontSize: 10, color: muted }}>{s.sublabel}</div>
              {i < steps.length - 1 && (
                <div style={{ position: "absolute", top: 24, left: "calc(50% + 14px)", right: "calc(-50% + 14px)", height: 1, background: s.done ? "rgba(46,204,113,.3)" : border }} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Body: Form + AI Sidebar */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Form Area */}
        <div style={{ flex: 1, overflow: "auto", padding: "24px 28px" }}>
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: 17, fontWeight: 800, marginBottom: 4 }}>Step 3 — Risk Profile</h2>
            <p style={{ fontSize: 12, color: muted, lineHeight: 1.6 }}>Help us understand the risk dimensions of your AI solution so we can route it appropriately and surface relevant policy guardrails.</p>
          </div>

          {/* Risk dimensions */}
          <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: 10, padding: "16px 18px", marginBottom: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: accent, marginBottom: 14 }}>Risk Classification</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {riskDimensions.map((d) => (
                <div key={d.label}>
                  <label style={{ display: "block", fontSize: 10.5, fontWeight: 700, color: muted, textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 6 }}>{d.label}</label>
                  <div style={{ display: "flex", gap: 4 }}>
                    {d.options.map((o, i) => (
                      <button key={o} style={{ flex: 1, padding: "6px 4px", background: i === d.selected ? "rgba(255,212,0,.15)" : surface2, border: `1px solid ${i === d.selected ? "rgba(255,212,0,.35)" : border}`, borderRadius: 6, fontSize: 10, color: i === d.selected ? accent : muted, cursor: "pointer", fontWeight: i === d.selected ? 700 : 400, textAlign: "center" }}>{o}</button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Checkboxes */}
          <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: 10, padding: "16px 18px", marginBottom: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: accent, marginBottom: 12 }}>Applicable Controls</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
              {[
                { label: "Output filtering / content moderation", checked: true },
                { label: "Audit logging enabled", checked: true },
                { label: "PII masking before model input", checked: false },
                { label: "Model version pinned & tested", checked: true },
                { label: "Rate limiting on API endpoints", checked: false },
                { label: "Data residency confirmed (Canada)", checked: true },
              ].map((c) => (
                <div key={c.label} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: surface2, borderRadius: 6, border: `1px solid ${c.checked ? "rgba(255,212,0,.2)" : border}`, cursor: "pointer" }}>
                  <div style={{ width: 14, height: 14, borderRadius: 3, background: c.checked ? accent : surface3, border: `1px solid ${c.checked ? accent : border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 9, color: "#1a0a2e", fontWeight: 900 }}>{c.checked ? "✓" : ""}</div>
                  <span style={{ fontSize: 11, color: c.checked ? text : muted, lineHeight: 1.35 }}>{c.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Textarea */}
          <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: 10, padding: "16px 18px", marginBottom: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: accent, marginBottom: 10 }}>Additional Risk Notes</div>
            <div style={{ background: surface2, border: `1px solid ${border}`, borderRadius: 7, padding: "10px 12px", minHeight: 70, fontSize: 12, color: muted, lineHeight: 1.6 }}>
              This solution processes semi-structured contract documents only. No PII from end customers is included in the training corpus…
            </div>
          </div>

          {/* Nav */}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20 }}>
            <button style={{ background: surface2, color: text, border: `1px solid ${border}`, borderRadius: 7, padding: "8px 18px", fontSize: 12, cursor: "pointer" }}>← Previous</button>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={{ background: surface2, color: muted, border: `1px solid ${border}`, borderRadius: 7, padding: "8px 16px", fontSize: 12, cursor: "pointer" }}>Save Draft</button>
              <button style={{ background: accent, color: "#1a0a2e", border: "none", borderRadius: 7, padding: "8px 20px", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Continue → AI Review</button>
            </div>
          </div>
        </div>

        {/* AI Sidebar */}
        <div style={{ width: 300, borderLeft: `1px solid ${border}`, overflow: "auto", padding: "20px 18px", background: "rgba(124,92,191,.04)", flexShrink: 0 }}>
          <div style={{ position: "relative", background: surface, border: "1px solid rgba(124,92,191,.35)", borderRadius: 10, padding: "14px 16px", marginBottom: 12, overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, #7c5cbf, #a78bfa, #6366f1)" }} />
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "#a78bfa", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
              <span>✦</span> AI Risk Assistant
            </div>
            <div style={{ fontSize: 11, color: muted, lineHeight: 1.6, marginBottom: 10 }}>
              Based on your selections so far, I've identified 4 considerations to address before submission.
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ background: "rgba(255,212,0,.12)", border: "1px solid rgba(255,212,0,.25)", borderRadius: 7, padding: "6px 12px", textAlign: "center", flex: 1 }}>
                <div style={{ fontSize: 18, fontWeight: 900, color: accent }}>68</div>
                <div style={{ fontSize: 9.5, color: muted }}>Est. Risk Score</div>
              </div>
              <div style={{ background: "rgba(212,131,10,.1)", border: "1px solid rgba(212,131,10,.2)", borderRadius: 7, padding: "6px 12px", textAlign: "center", flex: 1 }}>
                <div style={{ fontSize: 18, fontWeight: 900, color: "#d4830a" }}>ARB</div>
                <div style={{ fontSize: 9.5, color: muted }}>Likely Route</div>
              </div>
            </div>
          </div>

          <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: muted, marginBottom: 8 }}>Suggestions</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {aiSuggestions.map((s) => (
              <div key={s.text} style={{ background: surface, border: `1px solid ${border}`, borderRadius: 7, padding: "9px 11px", display: "flex", gap: 8 }}>
                <span style={{ fontSize: 9, fontWeight: 900, padding: "2px 6px", borderRadius: 4, flexShrink: 0, marginTop: 1, background: s.priority === "MUST" ? "rgba(231,76,60,.2)" : s.priority === "SHOULD" ? "rgba(212,131,10,.2)" : "rgba(41,128,185,.2)", color: s.priority === "MUST" ? "#e74c3c" : s.priority === "SHOULD" ? "#f0a830" : "#5dade2" }}>{s.priority}</span>
                <span style={{ fontSize: 11, color: text, lineHeight: 1.5 }}>{s.text}</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 16, background: surface, border: `1px solid ${border}`, borderRadius: 8, padding: "10px 12px" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: accent, marginBottom: 6, textTransform: "uppercase", letterSpacing: ".07em" }}>Applicable Policies</div>
            {["AI Governance Policy v4.2", "Data Privacy Standard v3.0", "LLM Usage Guidelines v1.1"].map((p) => (
              <div key={p} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 0", borderBottom: `1px solid ${border}`, fontSize: 11, color: muted }}>
                <span style={{ color: accent, fontSize: 9 }}>→</span> {p}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
