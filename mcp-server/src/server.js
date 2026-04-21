#!/usr/bin/env node

/**
 * Architecture Governance — Web API Server
 *
 * REST API wrapping the pattern library, vendor registry, intake workflow,
 * and LangChain triage pipeline. Designed to run on Replit or any Node.js host.
 *
 * Endpoints:
 *   GET  /                           → API overview + health
 *   GET  /api/patterns               → Search patterns (?query=&domain=&status=)
 *   GET  /api/patterns/:id           → Get pattern detail
 *   GET  /api/vendors                → Search vendors (?query=&category=&criticality=)
 *   GET  /api/vendors/check/:name    → Check vendor approval status
 *   GET  /api/guardrails             → List guardrails (?patternId=&domain=&severity=)
 *   GET  /api/workflow/states        → All workflow states
 *   GET  /api/workflow/states/:state → State detail + transitions
 *   GET  /api/workflow/lanes         → Routing lanes
 *   POST /api/assess                 → Quick architecture assessment (no LLM)
 *   POST /api/triage                 → Full LangChain triage pipeline (requires ANTHROPIC_API_KEY)
 *   POST /api/triage/stage/:stage    → Run a single pipeline stage
 *   GET  /api/pipeline               → Pipeline stage info
 */

import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";

const app = express();
app.use(cors());
app.use(express.json());

// --- Resolve paths ---

const REPO_ROOT = path.resolve(new URL(".", import.meta.url).pathname, "../..");
const PATTERNS_DIR = path.join(REPO_ROOT, "patterns");
const VENDORS_FILE = path.join(REPO_ROOT, "vendors", "registry.json");
const INTAKE_DIR = path.join(REPO_ROOT, "intake-workflow");

// --- Data Loaders ---

function loadPatterns() {
  const files = fs.readdirSync(PATTERNS_DIR).filter((f) => f.endsWith(".json"));
  return files.map((f) => {
    const raw = fs.readFileSync(path.join(PATTERNS_DIR, f), "utf-8");
    return JSON.parse(raw);
  });
}

function loadVendors() {
  return JSON.parse(fs.readFileSync(VENDORS_FILE, "utf-8"));
}

function loadStateMachine() {
  return JSON.parse(
    fs.readFileSync(path.join(INTAKE_DIR, "workflows", "state-machine.json"), "utf-8")
  );
}

function loadTriageEngine() {
  return JSON.parse(
    fs.readFileSync(path.join(INTAKE_DIR, "ai-engine", "triage-engine.json"), "utf-8")
  );
}

// --- Search Helpers ---

function matchScore(text, query) {
  if (!text) return 0;
  const lower = text.toLowerCase();
  const terms = query.toLowerCase().split(/\s+/);
  let score = 0;
  for (const term of terms) {
    if (lower.includes(term)) score += 1;
  }
  return score / terms.length;
}

// --- Routes ---

// Health / Overview
app.get("/", (req, res) => {
  res.json({
    name: "Architecture Governance API",
    version: "1.0.0",
    status: "running",
    ai_pipeline: process.env.ANTHROPIC_API_KEY ? "enabled" : "disabled (set ANTHROPIC_API_KEY)",
    endpoints: {
      patterns: "GET /api/patterns",
      pattern_detail: "GET /api/patterns/:id",
      vendors: "GET /api/vendors",
      vendor_check: "GET /api/vendors/check/:name",
      guardrails: "GET /api/guardrails",
      workflow_states: "GET /api/workflow/states",
      workflow_lanes: "GET /api/workflow/lanes",
      assess: "POST /api/assess",
      triage: "POST /api/triage",
      pipeline_info: "GET /api/pipeline",
    },
  });
});

// --- Patterns ---

app.get("/api/patterns", (req, res) => {
  const { query, domain, status } = req.query;
  let patterns = loadPatterns();

  if (domain) {
    patterns = patterns.filter(
      (p) => p.domain && p.domain.toLowerCase().includes(domain.toLowerCase())
    );
  }
  if (status) {
    patterns = patterns.filter(
      (p) => p.status && p.status.toLowerCase() === status.toLowerCase()
    );
  }
  if (query) {
    patterns = patterns
      .map((p) => {
        const fields = [
          p.name, p.strategicIntent, p.problemStatement, p.domain,
          ...(p.components || []),
          ...(p.useCases || []).map((u) => `${u.use} ${u.dontUse}`),
        ].join(" ");
        return { pattern: p, score: matchScore(fields, query) };
      })
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((r) => r.pattern);
  }

  res.json({
    count: patterns.length,
    patterns: patterns.map((p) => ({
      patternId: p.patternId,
      name: p.name,
      domain: p.domain,
      status: p.status,
      tier: p.tier,
      version: p.version,
      strategicIntent: p.strategicIntent,
      problemStatement: p.problemStatement,
    })),
  });
});

app.get("/api/patterns/:id", (req, res) => {
  const patterns = loadPatterns();
  const pattern = patterns.find(
    (p) => p.patternId && p.patternId.toUpperCase() === req.params.id.toUpperCase()
  );
  if (!pattern) return res.status(404).json({ error: `Pattern '${req.params.id}' not found` });

  const { diagramSvg, ...rest } = pattern;
  res.json(rest);
});

// --- Vendors ---

app.get("/api/vendors", (req, res) => {
  const { query, category, criticality } = req.query;
  let vendors = loadVendors();

  if (category) {
    vendors = vendors.filter(
      (v) =>
        (v.category && v.category.toLowerCase().includes(category.toLowerCase())) ||
        (v.subCategory && v.subCategory.toLowerCase().includes(category.toLowerCase()))
    );
  }
  if (criticality) {
    vendors = vendors.filter(
      (v) => v.criticality && v.criticality.toLowerCase() === criticality.toLowerCase()
    );
  }
  if (query) {
    vendors = vendors
      .map((v) => {
        const fields = [v.vendorCompany, v.productService, v.category, v.subCategory, v.notes].join(" ");
        return { vendor: v, score: matchScore(fields, query) };
      })
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((r) => r.vendor);
  }

  res.json({
    count: vendors.length,
    vendors: vendors.map((v) => ({
      id: v.id,
      vendorCompany: v.vendorCompany,
      productService: v.productService,
      category: v.category,
      subCategory: v.subCategory,
      criticality: v.criticality,
      hostingModel: v.hostingModel,
      dataShared: v.dataShared,
      spendBand: v.spendBand,
    })),
  });
});

app.get("/api/vendors/check/:name", (req, res) => {
  const vendors = loadVendors();
  const query = req.params.name.toLowerCase();

  const matches = vendors.filter(
    (v) =>
      (v.vendorCompany && v.vendorCompany.toLowerCase().includes(query)) ||
      (v.productService && v.productService.toLowerCase().includes(query))
  );

  if (matches.length === 0) {
    return res.json({
      status: "NOT_IN_REGISTRY",
      vendor: req.params.name,
      message: `'${req.params.name}' is NOT in the approved vendor registry.`,
      action: "Submit a vendor onboarding intake request before adoption.",
    });
  }

  res.json({
    status: "IN_REGISTRY",
    matches: matches.map((v) => ({
      vendorCompany: v.vendorCompany,
      productService: v.productService,
      criticality: v.criticality,
      category: v.category,
      hostingModel: v.hostingModel,
      dataShared: v.dataShared,
      dataTypesShared: v.dataTypesShared,
      spendBand: v.spendBand,
    })),
  });
});

// --- Guardrails ---

app.get("/api/guardrails", (req, res) => {
  const { patternId, domain, severity } = req.query;
  let patterns = loadPatterns();

  if (patternId) {
    patterns = patterns.filter(
      (p) => p.patternId && p.patternId.toUpperCase() === patternId.toUpperCase()
    );
  }
  if (domain) {
    patterns = patterns.filter(
      (p) => p.domain && p.domain.toLowerCase().includes(domain.toLowerCase())
    );
  }

  const guardrails = patterns.flatMap((p) =>
    (p.guardrails || [])
      .filter((g) => !severity || (g.severity && g.severity.toLowerCase() === severity.toLowerCase()))
      .map((g) => ({
        patternId: p.patternId,
        patternName: p.name,
        area: g.area,
        rule: g.rule,
        severity: g.severity,
      }))
  );

  res.json({ count: guardrails.length, guardrails });
});

// --- Workflow ---

app.get("/api/workflow/states", (req, res) => {
  const sm = loadStateMachine();
  const summary = Object.entries(sm.states).map(([name, s]) => ({
    state: name,
    description: s.description,
    slaHours: s.meta?.slaHours || null,
    role: s.meta?.role || null,
    isFinal: s.type === "final" || false,
    events: s.on ? Object.keys(s.on) : [],
    aiFeatures: s.meta?.aiFeatures || [],
  }));
  res.json({ count: summary.length, states: summary });
});

app.get("/api/workflow/states/:state", (req, res) => {
  const sm = loadStateMachine();
  const stateInfo = sm.states[req.params.state];
  if (!stateInfo) {
    return res.status(404).json({
      error: `State '${req.params.state}' not found`,
      available: Object.keys(sm.states),
    });
  }
  res.json({
    state: req.params.state,
    description: stateInfo.description,
    events: stateInfo.on ? Object.keys(stateInfo.on) : [],
    transitions: stateInfo.on,
    meta: stateInfo.meta,
  });
});

app.get("/api/workflow/lanes", (req, res) => {
  const sm = loadStateMachine();
  res.json(sm.routingLanes);
});

// --- Quick Assessment (no LLM) ---

app.post("/api/assess", (req, res) => {
  const { description, technologies, domain, dataClassification, piiInvolved, integrationCount } = req.body;

  if (!description) {
    return res.status(400).json({ error: "description is required" });
  }

  const patterns = loadPatterns();
  const vendors = loadVendors();

  // Pattern matching
  const searchText = [description, ...(technologies || [])].join(" ");
  let matchedPatterns = patterns;
  if (domain) {
    matchedPatterns = matchedPatterns.filter(
      (p) => p.domain && p.domain.toLowerCase().includes(domain.toLowerCase())
    );
  }
  matchedPatterns = matchedPatterns
    .map((p) => {
      const fields = [
        p.name, p.strategicIntent, p.problemStatement, p.domain,
        ...(p.components || []),
      ].join(" ");
      return { pattern: p, score: matchScore(fields, searchText) };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((r) => ({
      patternId: r.pattern.patternId,
      name: r.pattern.name,
      status: r.pattern.status,
      domain: r.pattern.domain,
      guardrailCount: r.pattern.guardrails?.length || 0,
      recommendation: r.pattern.status === "Endorsed" ? "ADOPT" : "REVIEW",
    }));

  // Vendor checks
  const vendorChecks = (technologies || []).map((tech) => {
    const match = vendors.find(
      (v) =>
        (v.vendorCompany && v.vendorCompany.toLowerCase().includes(tech.toLowerCase())) ||
        (v.productService && v.productService.toLowerCase().includes(tech.toLowerCase()))
    );
    return {
      technology: tech,
      status: match ? "APPROVED" : "NOT_IN_REGISTRY",
      details: match
        ? { vendor: match.vendorCompany, product: match.productService, criticality: match.criticality }
        : { action: "Vendor onboarding required" },
    };
  });

  // Risk
  const riskFactors = [];
  let riskLevel = "low";
  if (dataClassification === "confidential" || dataClassification === "restricted") {
    riskFactors.push({ factor: "High data classification", impact: "Security review required" });
    riskLevel = "high";
  }
  if (piiInvolved) {
    riskFactors.push({ factor: "PII involved", impact: "Compliance review mandatory" });
    riskLevel = "high";
  }
  if (integrationCount && integrationCount > 5) {
    riskFactors.push({ factor: `${integrationCount} integrations`, impact: "Architecture review required" });
    if (riskLevel !== "high") riskLevel = "medium";
  }
  if (vendorChecks.some((v) => v.status === "NOT_IN_REGISTRY")) {
    riskFactors.push({ factor: "Unapproved vendor(s)", impact: "Vendor onboarding required" });
    if (riskLevel === "low") riskLevel = "medium";
  }

  // Route
  let lane, reviews;
  if (riskLevel === "low" && matchedPatterns.every((p) => p.status === "Endorsed")) {
    lane = "fast_track"; reviews = [];
  } else if (riskLevel === "medium") {
    lane = "standard"; reviews = ["architecture"];
  } else {
    lane = "complex"; reviews = ["architecture", "security"];
    if (vendorChecks.some((v) => v.status === "NOT_IN_REGISTRY")) reviews.push("vendor");
  }

  res.json({
    matchedPatterns,
    vendorChecks,
    riskIndicators: { level: riskLevel, factors: riskFactors },
    suggestedRoute: { lane, reviewsRequired: reviews },
  });
});

// --- Full Triage Pipeline (LangChain + Claude) ---

app.post("/api/triage", async (req, res) => {
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(503).json({
      error: "AI pipeline unavailable",
      message: "Set ANTHROPIC_API_KEY environment variable (Replit Secrets) to enable the LangChain triage pipeline.",
      fallback: "Use POST /api/assess for a rule-based assessment without AI.",
    });
  }

  try {
    const { runTriagePipeline } = await import("./pipeline/triage-pipeline.js");

    const stages = [];
    const result = await runTriagePipeline(req.body, {
      onStageStart: (name) => stages.push({ name, status: "running" }),
      onStageComplete: (name, stageResult) => {
        const s = stages.find((s) => s.name === name);
        if (s) s.status = stageResult?.error ? "error" : "complete";
      },
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Pipeline failed", message: err.message });
  }
});

// --- Pipeline Info ---

app.get("/api/pipeline", (req, res) => {
  const engine = loadTriageEngine();
  res.json({
    stages: engine.pipeline.stages.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      model: s.model,
      inputs: s.inputs,
      outputs: s.outputs,
    })),
    feedbackLoop: engine.feedback_loop,
  });
});

// --- Start ---

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`\n🏛️  Architecture Governance API`);
  console.log(`   Running on http://0.0.0.0:${PORT}`);
  console.log(`   AI Pipeline: ${process.env.ANTHROPIC_API_KEY ? "✅ enabled" : "❌ disabled (set ANTHROPIC_API_KEY)"}`);
  console.log(`   Patterns: ${fs.readdirSync(PATTERNS_DIR).filter((f) => f.endsWith(".json")).length}`);
  console.log(`   Vendors: ${loadVendors().length}\n`);
});
