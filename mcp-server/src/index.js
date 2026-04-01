#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fs from "fs";
import path from "path";

// Resolve the repo root (one level up from mcp-server/)
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
  const raw = fs.readFileSync(VENDORS_FILE, "utf-8");
  return JSON.parse(raw);
}

function loadStateMachine() {
  const raw = fs.readFileSync(
    path.join(INTAKE_DIR, "workflows", "state-machine.json"),
    "utf-8"
  );
  return JSON.parse(raw);
}

function loadTriageEngine() {
  const raw = fs.readFileSync(
    path.join(INTAKE_DIR, "ai-engine", "triage-engine.json"),
    "utf-8"
  );
  return JSON.parse(raw);
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

function searchPatterns(patterns, query, domain, status) {
  let results = patterns;

  if (domain) {
    results = results.filter(
      (p) => p.domain && p.domain.toLowerCase().includes(domain.toLowerCase())
    );
  }
  if (status) {
    results = results.filter(
      (p) => p.status && p.status.toLowerCase() === status.toLowerCase()
    );
  }
  if (query) {
    results = results
      .map((p) => {
        const fields = [
          p.name,
          p.strategicIntent,
          p.problemStatement,
          p.domain,
          ...(p.components || []),
          ...(p.useCases || []).map((u) => `${u.use} ${u.dontUse}`),
        ].join(" ");
        return { pattern: p, score: matchScore(fields, query) };
      })
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((r) => r.pattern);
  }

  return results.map((p) => ({
    patternId: p.patternId,
    name: p.name,
    domain: p.domain,
    status: p.status,
    tier: p.tier,
    version: p.version,
    strategicIntent: p.strategicIntent,
    problemStatement: p.problemStatement,
  }));
}

function searchVendors(vendors, query, category, criticality) {
  let results = vendors;

  if (category) {
    results = results.filter(
      (v) =>
        (v.category && v.category.toLowerCase().includes(category.toLowerCase())) ||
        (v.subCategory && v.subCategory.toLowerCase().includes(category.toLowerCase()))
    );
  }
  if (criticality) {
    results = results.filter(
      (v) => v.criticality && v.criticality.toLowerCase() === criticality.toLowerCase()
    );
  }
  if (query) {
    results = results
      .map((v) => {
        const fields = [
          v.vendorCompany,
          v.productService,
          v.category,
          v.subCategory,
          v.notes,
        ].join(" ");
        return { vendor: v, score: matchScore(fields, query) };
      })
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((r) => r.vendor);
  }

  return results.map((v) => ({
    id: v.id,
    vendorCompany: v.vendorCompany,
    productService: v.productService,
    category: v.category,
    subCategory: v.subCategory,
    criticality: v.criticality,
    hostingModel: v.hostingModel,
    dataShared: v.dataShared,
    spendBand: v.spendBand,
  }));
}

// --- Build the MCP Server ---

const server = new McpServer({
  name: "Architecture Governance",
  version: "1.0.0",
});

// Tool 1: Search Patterns
server.tool(
  "search_patterns",
  "Search the architecture pattern library by keyword, domain, or status. Returns matching patterns with strategic intent and problem statement.",
  {
    query: z.string().optional().describe("Free-text search (e.g., 'API gateway', 'kubernetes', 'zero trust')"),
    domain: z.string().optional().describe("Filter by domain (e.g., 'Application', 'Network', 'Security', 'Cloud', 'Data', 'Containers')"),
    status: z.string().optional().describe("Filter by status: 'Endorsed', 'In Development', 'Under Review'"),
  },
  async ({ query, domain, status }) => {
    const patterns = loadPatterns();
    const results = searchPatterns(patterns, query, domain, status);
    return {
      content: [
        {
          type: "text",
          text: results.length
            ? JSON.stringify(results, null, 2)
            : "No patterns found matching your criteria.",
        },
      ],
    };
  }
);

// Tool 2: Get Pattern Detail
server.tool(
  "get_pattern",
  "Get full details for a specific architecture pattern by its ID (e.g., AP-001, CK-001, NW-001). Returns components, guardrails, use cases, security considerations, and composition.",
  {
    patternId: z.string().describe("Pattern ID (e.g., AP-001, CK-001, NW-001, SC-001)"),
  },
  async ({ patternId }) => {
    const patterns = loadPatterns();
    const pattern = patterns.find(
      (p) => p.patternId && p.patternId.toUpperCase() === patternId.toUpperCase()
    );
    if (!pattern) {
      return {
        content: [{ type: "text", text: `Pattern '${patternId}' not found. Use search_patterns to find available patterns.` }],
      };
    }
    // Return without the embedded SVG to keep response size reasonable
    const { diagramSvg, ...rest } = pattern;
    return {
      content: [{ type: "text", text: JSON.stringify(rest, null, 2) }],
    };
  }
);

// Tool 3: Search Vendors
server.tool(
  "search_vendors",
  "Search the approved vendor registry by keyword, category, or criticality. Check if a technology or vendor is approved for use.",
  {
    query: z.string().optional().describe("Free-text search (e.g., 'Cisco', 'Grafana', 'SCADA', 'backup')"),
    category: z.string().optional().describe("Filter by category (e.g., 'Cloud Platform', 'Security', 'Network', 'OT')"),
    criticality: z.string().optional().describe("Filter by criticality: 'Critical', 'High', 'Medium'"),
  },
  async ({ query, category, criticality }) => {
    const vendors = loadVendors();
    const results = searchVendors(vendors, query, category, criticality);
    return {
      content: [
        {
          type: "text",
          text: results.length
            ? JSON.stringify(results, null, 2)
            : "No vendors found matching your criteria.",
        },
      ],
    };
  }
);

// Tool 4: Check Vendor Status
server.tool(
  "check_vendor_status",
  "Check if a specific vendor or product is in the approved vendor registry. Returns approval status, criticality, data sharing flags, and hosting model.",
  {
    vendorOrProduct: z.string().describe("Vendor company name or product name to check (e.g., 'Snowflake', 'Cisco SD-WAN', 'SAP')"),
  },
  async ({ vendorOrProduct }) => {
    const vendors = loadVendors();
    const query = vendorOrProduct.toLowerCase();

    const matches = vendors.filter(
      (v) =>
        (v.vendorCompany && v.vendorCompany.toLowerCase().includes(query)) ||
        (v.productService && v.productService.toLowerCase().includes(query))
    );

    if (matches.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                status: "NOT_IN_REGISTRY",
                vendor: vendorOrProduct,
                message: `'${vendorOrProduct}' is NOT in the approved vendor registry. A vendor onboarding intake request would be required before adoption.`,
                action: "Submit an intake request with requestType: 'vendor_onboarding'",
              },
              null,
              2
            ),
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
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
                reviewDate: v.reviewDate,
              })),
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// Tool 5: Assess Architecture
server.tool(
  "assess_architecture",
  "Describe a proposed solution and get an AI-powered assessment: matched patterns, applicable guardrails, vendor status checks, risk indicators, and recommended intake routing lane.",
  {
    description: z.string().describe("Description of the proposed solution or architecture change"),
    technologies: z.array(z.string()).optional().describe("List of technologies/products being proposed"),
    domain: z.string().optional().describe("Primary domain: application_integration, containers_kubernetes, cloud_platform, data_storage, network_connectivity, security_controls"),
    dataClassification: z.string().optional().describe("Data classification: public, internal, confidential, restricted"),
    piiInvolved: z.boolean().optional().describe("Whether PII data is involved"),
    integrationCount: z.number().optional().describe("Number of systems this integrates with"),
  },
  async ({ description, technologies, domain, dataClassification, piiInvolved, integrationCount }) => {
    const patterns = loadPatterns();
    const vendors = loadVendors();

    // Pattern matching
    const searchText = [description, ...(technologies || [])].join(" ");
    const matchedPatterns = searchPatterns(patterns, searchText, domain)
      .slice(0, 5)
      .map((p) => {
        const full = patterns.find((fp) => fp.patternId === p.patternId);
        return {
          patternId: p.patternId,
          name: p.name,
          status: p.status,
          domain: p.domain,
          guardrailCount: full?.guardrails?.length || 0,
          recommendation:
            p.status === "Endorsed" ? "ADOPT — This is an endorsed pattern" : "REVIEW — Pattern is not yet endorsed",
        };
      });

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

    // Risk indicators
    const riskFactors = [];
    let riskLevel = "low";

    if (dataClassification === "confidential" || dataClassification === "restricted") {
      riskFactors.push({ factor: "High data classification", impact: "Requires security review" });
      riskLevel = "high";
    }
    if (piiInvolved) {
      riskFactors.push({ factor: "PII involved", impact: "GDPR/PIPEDA compliance required, security review mandatory" });
      riskLevel = "high";
    }
    if (integrationCount && integrationCount > 5) {
      riskFactors.push({ factor: `${integrationCount} integration points`, impact: "Complex integration — architecture review required" });
      if (riskLevel !== "high") riskLevel = "medium";
    }
    if (vendorChecks.some((v) => v.status === "NOT_IN_REGISTRY")) {
      riskFactors.push({ factor: "Unapproved vendor(s)", impact: "Vendor onboarding required before proceeding" });
      if (riskLevel === "low") riskLevel = "medium";
    }

    // Routing recommendation
    let routingLane, reviewsRequired;
    if (riskLevel === "low" && matchedPatterns.every((p) => p.status === "Endorsed")) {
      routingLane = "fast_track";
      reviewsRequired = [];
    } else if (riskLevel === "medium") {
      routingLane = "standard";
      reviewsRequired = ["architecture"];
    } else {
      routingLane = "complex";
      reviewsRequired = ["architecture", "security"];
      if (vendorChecks.some((v) => v.status === "NOT_IN_REGISTRY")) {
        reviewsRequired.push("vendor");
      }
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              assessment: {
                matchedPatterns,
                vendorChecks,
                riskIndicators: { level: riskLevel, factors: riskFactors },
                suggestedRoute: {
                  lane: routingLane,
                  reviewsRequired,
                  nextStep: "Submit an intake request via the intake portal or API",
                },
              },
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// Tool 6: List Guardrails
server.tool(
  "list_guardrails",
  "Get all guardrails (rules and constraints) for a specific pattern or domain. Shows severity (Required vs Recommended) and the area each guardrail covers.",
  {
    patternId: z.string().optional().describe("Pattern ID to get guardrails for (e.g., AP-001)"),
    domain: z.string().optional().describe("Domain to get all guardrails for"),
    severity: z.string().optional().describe("Filter by severity: 'Required' or 'Recommended'"),
  },
  async ({ patternId, domain, severity }) => {
    const patterns = loadPatterns();
    let targetPatterns = patterns;

    if (patternId) {
      targetPatterns = patterns.filter(
        (p) => p.patternId && p.patternId.toUpperCase() === patternId.toUpperCase()
      );
    }
    if (domain) {
      targetPatterns = targetPatterns.filter(
        (p) => p.domain && p.domain.toLowerCase().includes(domain.toLowerCase())
      );
    }

    const guardrails = targetPatterns.flatMap((p) =>
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

    return {
      content: [
        {
          type: "text",
          text: guardrails.length
            ? JSON.stringify(guardrails, null, 2)
            : "No guardrails found matching your criteria.",
        },
      ],
    };
  }
);

// Tool 7: Get Workflow Info
server.tool(
  "get_workflow_info",
  "Get information about the intake workflow: available states, routing lanes, SLA targets, and valid transitions from a given state.",
  {
    state: z.string().optional().describe("Get transitions and details for a specific state (e.g., 'pending_triage', 'architecture_review')"),
    section: z.string().optional().describe("Section to retrieve: 'states', 'routing_lanes', 'all'"),
  },
  async ({ state, section }) => {
    const sm = loadStateMachine();

    if (state) {
      const stateInfo = sm.states[state];
      if (!stateInfo) {
        return {
          content: [
            {
              type: "text",
              text: `State '${state}' not found. Available states: ${Object.keys(sm.states).join(", ")}`,
            },
          ],
        };
      }
      const events = stateInfo.on ? Object.keys(stateInfo.on) : [];
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                state,
                description: stateInfo.description,
                availableEvents: events,
                transitions: stateInfo.on,
                meta: stateInfo.meta,
              },
              null,
              2
            ),
          },
        ],
      };
    }

    if (section === "routing_lanes" || section === "lanes") {
      return {
        content: [{ type: "text", text: JSON.stringify(sm.routingLanes, null, 2) }],
      };
    }

    // Default: summary of all states
    const summary = Object.entries(sm.states).map(([name, s]) => ({
      state: name,
      description: s.description,
      slaHours: s.meta?.slaHours || null,
      role: s.meta?.role || null,
      isFinal: s.type === "final" || false,
      eventCount: s.on ? Object.keys(s.on).length : 0,
    }));

    return {
      content: [{ type: "text", text: JSON.stringify(summary, null, 2) }],
    };
  }
);

// Tool 8: Compare Options
server.tool(
  "compare_options",
  "Compare two architectural approaches or technologies against the endorsed pattern library and vendor registry. Helps with decision-making.",
  {
    optionA: z.string().describe("First option (e.g., 'Deploy on AKS with Istio service mesh')"),
    optionB: z.string().describe("Second option (e.g., 'Deploy on Azure App Service with API Management')"),
    evaluationCriteria: z.array(z.string()).optional().describe("Criteria to evaluate (e.g., ['pattern alignment', 'vendor risk', 'complexity'])"),
  },
  async ({ optionA, optionB, evaluationCriteria }) => {
    const patterns = loadPatterns();
    const vendors = loadVendors();

    function assessOption(description) {
      const matched = searchPatterns(patterns, description).slice(0, 3);
      const words = description.toLowerCase().split(/\s+/);
      const vendorMatches = vendors.filter((v) =>
        words.some(
          (w) =>
            (v.vendorCompany && v.vendorCompany.toLowerCase().includes(w)) ||
            (v.productService && v.productService.toLowerCase().includes(w))
        )
      );

      return {
        matchedPatterns: matched,
        endorsedPatternCount: matched.filter((p) => p.status === "Endorsed").length,
        vendorsInRegistry: vendorMatches.map((v) => ({
          vendor: v.vendorCompany,
          product: v.productService,
          criticality: v.criticality,
        })),
        patternAlignmentScore: matched.length > 0 ? (matched.filter((p) => p.status === "Endorsed").length / matched.length) : 0,
      };
    }

    const assessA = assessOption(optionA);
    const assessB = assessOption(optionB);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              comparison: {
                optionA: { description: optionA, assessment: assessA },
                optionB: { description: optionB, assessment: assessB },
                evaluationCriteria: evaluationCriteria || ["pattern alignment", "vendor approval", "risk"],
                recommendation:
                  assessA.endorsedPatternCount >= assessB.endorsedPatternCount
                    ? `Option A has stronger pattern alignment (${assessA.endorsedPatternCount} endorsed patterns vs ${assessB.endorsedPatternCount})`
                    : `Option B has stronger pattern alignment (${assessB.endorsedPatternCount} endorsed patterns vs ${assessA.endorsedPatternCount})`,
              },
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// Tool 9: Get Triage Pipeline Info
server.tool(
  "get_triage_pipeline",
  "Get details about the AI triage pipeline stages, risk scoring model, and routing rules used to assess intake requests.",
  {
    stage: z.string().optional().describe("Specific stage to get details for (e.g., 'risk_scoring', 'pattern_matching', 'routing_decision')"),
  },
  async ({ stage }) => {
    const engine = loadTriageEngine();

    if (stage) {
      const found = engine.pipeline.stages.find((s) => s.id === stage);
      if (!found) {
        return {
          content: [
            {
              type: "text",
              text: `Stage '${stage}' not found. Available stages: ${engine.pipeline.stages.map((s) => s.id).join(", ")}`,
            },
          ],
        };
      }
      return { content: [{ type: "text", text: JSON.stringify(found, null, 2) }] };
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              pipeline: engine.pipeline.stages.map((s) => ({
                id: s.id,
                name: s.name,
                description: s.description,
                inputs: s.inputs,
                outputs: s.outputs,
              })),
              feedbackLoop: engine.feedback_loop,
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// --- Resources ---

server.resource(
  "pattern-index",
  "patterns://index",
  async (uri) => {
    const patterns = loadPatterns();
    const index = patterns.map((p) => ({
      patternId: p.patternId,
      name: p.name,
      domain: p.domain,
      status: p.status,
      version: p.version,
    }));
    return {
      contents: [
        {
          uri: uri.href,
          mimeType: "application/json",
          text: JSON.stringify(index, null, 2),
        },
      ],
    };
  }
);

server.resource(
  "vendor-registry",
  "vendors://registry",
  async (uri) => {
    const vendors = loadVendors();
    const summary = vendors.map((v) => ({
      id: v.id,
      vendorCompany: v.vendorCompany,
      productService: v.productService,
      criticality: v.criticality,
      category: v.category,
    }));
    return {
      contents: [
        {
          uri: uri.href,
          mimeType: "application/json",
          text: JSON.stringify(summary, null, 2),
        },
      ],
    };
  }
);

server.resource(
  "workflow-overview",
  "workflow://state-machine",
  async (uri) => {
    const sm = loadStateMachine();
    return {
      contents: [
        {
          uri: uri.href,
          mimeType: "application/json",
          text: JSON.stringify(
            {
              stateCount: Object.keys(sm.states).length,
              states: Object.keys(sm.states),
              routingLanes: Object.keys(sm.routingLanes),
              initial: sm.initial,
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// --- Start ---

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Architecture Governance MCP server running on stdio");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
