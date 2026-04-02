/**
 * Architecture Intake Triage Pipeline — LangChain Implementation
 *
 * 7-stage sequential chain:
 *   Submit → Completeness → Classify → Pattern Match → Vendor Check → Risk Score → Route → Summarize
 *
 * Each stage is a ChatPromptTemplate → ChatAnthropic → StructuredOutputParser chain.
 * Stages are composed into a RunnableSequence where each stage's output
 * enriches a shared context object that flows through the entire pipeline.
 */

import { ChatAnthropic } from "@langchain/anthropic";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence, RunnableLambda } from "@langchain/core/runnables";
import { JsonOutputParser } from "@langchain/core/output_parsers";
import fs from "fs";
import path from "path";

// --- Config ---

const REPO_ROOT = path.resolve(new URL(".", import.meta.url).pathname, "../../..");
const PATTERNS_DIR = path.join(REPO_ROOT, "patterns");
const VENDORS_FILE = path.join(REPO_ROOT, "vendors", "registry.json");

// --- Data Loaders ---

function loadPatterns() {
  const files = fs.readdirSync(PATTERNS_DIR).filter((f) => f.endsWith(".json"));
  return files.map((f) => {
    const raw = fs.readFileSync(path.join(PATTERNS_DIR, f), "utf-8");
    const pattern = JSON.parse(raw);
    // Strip embedded SVGs for context window efficiency
    const { diagramSvg, ...rest } = pattern;
    return rest;
  });
}

function loadVendors() {
  const raw = fs.readFileSync(VENDORS_FILE, "utf-8");
  return JSON.parse(raw);
}

function getPatternSummaries() {
  return loadPatterns().map((p) => ({
    patternId: p.patternId,
    name: p.name,
    domain: p.domain,
    status: p.status,
    strategicIntent: p.strategicIntent,
    problemStatement: p.problemStatement,
    useCases: p.useCases,
    guardrails: p.guardrails,
    components: p.components?.slice(0, 10), // trim for context
    composition: p.composition,
  }));
}

function getVendorSummaries() {
  return loadVendors().map((v) => ({
    id: v.id,
    vendorCompany: v.vendorCompany,
    productService: v.productService,
    category: v.category,
    subCategory: v.subCategory,
    criticality: v.criticality,
    hostingModel: v.hostingModel,
    dataShared: v.dataShared,
    dataTypesShared: v.dataTypesShared,
  }));
}

// --- LLM Setup ---

function createModel(modelName = "claude-sonnet-4-6", temperature = 0) {
  return new ChatAnthropic({
    model: modelName,
    temperature,
    maxTokens: 4096,
  });
}

// --- Stage 1: Completeness Check ---

const completenessPrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You are an enterprise architecture intake analyst. Assess the completeness and quality of this intake request.

Evaluate:
1. Are all required fields present and non-empty?
2. Is the description clear and specific enough?
3. Is the business justification substantive?
4. Are technical details sufficient for triage?
5. Are compliance/regulatory requirements identified?
6. Is the timeline realistic?

Respond with ONLY valid JSON (no markdown, no code fences):
{{
  "completeness_score": <0.0-1.0>,
  "clarity_score": <0.0-1.0>,
  "missing_fields": [{{ "field": "<name>", "reason": "<why>", "severity": "required|recommended" }}],
  "quality_notes": "<brief assessment>",
  "proceed": <true if completeness_score >= 0.6>
}}`,
  ],
  ["human", "Evaluate this intake request:\n\n{intake_request}"],
]);

const completenessChain = RunnableSequence.from([
  completenessPrompt,
  createModel(),
  new JsonOutputParser(),
]);

// --- Stage 2: Classification ---

const classificationPrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You are an enterprise architecture classifier. Based on the intake request and completeness assessment, classify this request.

Available domains: Application & Integration, Containers & Kubernetes, Cloud & Platform, Data & Storage, Network & Connectivity, Security & Controls, OT & Automation, Identity & Access, Observability, Cross-Domain

Complexity tiers: simple (single system, no integrations), moderate (2-3 integrations, standard patterns), complex (4+ integrations, custom architecture), transformational (enterprise-wide, multiple domains)

Request archetypes: greenfield, modernization, migration, extension, replacement, consolidation, decommission

Respond with ONLY valid JSON:
{{
  "domain_classification": "<primary domain>",
  "secondary_domains": ["<additional domains if cross-cutting>"],
  "complexity_tier": "simple|moderate|complex|transformational",
  "request_archetype": "<archetype>",
  "classification_confidence": <0.0-1.0>,
  "classification_rationale": "<1-2 sentences>"
}}`,
  ],
  [
    "human",
    "Classify this request:\n\n## Intake Request\n{intake_request}\n\n## Completeness Assessment\n{completeness_result}",
  ],
]);

const classificationChain = RunnableSequence.from([
  classificationPrompt,
  createModel(),
  new JsonOutputParser(),
]);

// --- Stage 3: Pattern Matching ---

const patternMatchingPrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You are an architecture pattern matching engine. Analyze the intake request against the pattern library and determine which endorsed patterns are relevant.

For each matched pattern, assess:
1. Relevance: How closely does this pattern apply? (0.0-1.0)
2. Recommendation: adopt (use as-is), review (needs evaluation), exception_needed (deviates from endorsed pattern)
3. Gaps: Where does the proposal not align with the pattern's guardrails?

Respond with ONLY valid JSON:
{{
  "matched_patterns": [
    {{
      "patternId": "<e.g. AP-001>",
      "patternName": "<name>",
      "relevanceScore": <0.0-1.0>,
      "recommendation": "adopt|review|exception_needed|not_applicable",
      "gaps": ["<gap description>"],
      "rationale": "<why this pattern matches>"
    }}
  ],
  "exception_flags": [
    {{
      "patternId": "<id>",
      "rule_violated": "<guardrail>",
      "severity": "Required|Recommended",
      "description": "<what's violated>"
    }}
  ],
  "unmatched_aspects": ["<aspects with no applicable pattern>"]
}}`,
  ],
  [
    "human",
    "Match patterns for this request:\n\n## Intake Request\n{intake_request}\n\n## Classification\n{classification_result}\n\n## Pattern Library\n{pattern_library}",
  ],
]);

const patternMatchingChain = RunnableSequence.from([
  patternMatchingPrompt,
  createModel(),
  new JsonOutputParser(),
]);

// --- Stage 4: Vendor Analysis ---

const vendorAnalysisPrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You are a vendor and technology analyst. Cross-reference the proposed technologies against the approved vendor registry.

For each technology mentioned in the request:
1. Check if the vendor/product is in the registry
2. Flag unapproved vendors
3. Check criticality and data sharing implications
4. Note any vendor review dates that are overdue

Respond with ONLY valid JSON:
{{
  "vendor_matches": [
    {{
      "technology": "<proposed tech>",
      "status": "approved|under_review|not_in_registry",
      "registry_entry": {{ "vendor": "<name>", "product": "<name>", "criticality": "<level>" }} | null,
      "data_sharing_flag": <true|false>,
      "notes": "<any concerns>"
    }}
  ],
  "unapproved_vendors": ["<list of technologies not in registry>"],
  "vendor_risk_flags": ["<any vendor-related risk flags>"]
}}`,
  ],
  [
    "human",
    "Analyze vendors for this request:\n\n## Intake Request\n{intake_request}\n\n## Vendor Registry\n{vendor_registry}",
  ],
]);

const vendorAnalysisChain = RunnableSequence.from([
  vendorAnalysisPrompt,
  createModel(),
  new JsonOutputParser(),
]);

// --- Stage 5: Risk Scoring ---

const riskScoringPrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You are a multi-dimensional risk scoring engine. Score the request across five dimensions (each 0-10):

## Security Risk (weight: 25%)
- Data classification (public=1, internal=3, confidential=7, restricted=10)
- PII involvement (+8 if true)
- External integrations, Zero Trust alignment, auth model

## Compliance Risk (weight: 20%)
- Regulatory scope count and severity
- Data residency, audit requirements

## Architectural Risk (weight: 25%)
- Pattern alignment (more gaps = higher)
- Integration complexity, scalability, tech maturity

## Operational Risk (weight: 15%)
- Availability SLA (99%=2, 99.9%=5, 99.95%=7, 99.99%=10)
- Team capability, operational overhead

## Vendor Risk (weight: 15%)
- Approval status (approved=0, under_review=5, not_in_registry=9)
- Criticality, lock-in risk, external data sharing

Calculate weighted total and map: low (0-3), medium (3-6), high (6-8), critical (8-10).

Respond with ONLY valid JSON:
{{
  "risk_scores": {{
    "security": <0-10>,
    "compliance": <0-10>,
    "architectural": <0-10>,
    "operational": <0-10>,
    "vendor": <0-10>,
    "weighted_total": <0-10>,
    "overall": "low|medium|high|critical"
  }},
  "risk_narrative": "<2-3 sentence summary>",
  "key_risk_factors": [{{ "factor": "<name>", "score_impact": <number>, "explanation": "<why>" }}],
  "mitigations": ["<suggested mitigation>"]
}}`,
  ],
  [
    "human",
    "Score risk for:\n\n## Intake Request\n{intake_request}\n\n## Pattern Matching\n{pattern_matching_result}\n\n## Vendor Analysis\n{vendor_analysis_result}\n\n## Classification\n{classification_result}",
  ],
]);

const riskScoringChain = RunnableSequence.from([
  riskScoringPrompt,
  createModel(),
  new JsonOutputParser(),
]);

// --- Stage 6: Routing Decision ---

const routingPrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You are a routing engine. Based on risk profile, pattern alignment, and vendor status, determine the routing lane:

## Lanes (evaluate top-down, most restrictive wins)
- **exception** (SLA: 21d): Critical risk, OR pattern exceptions, OR unapproved critical vendor → Reviews: architecture + security + ARB
- **complex** (SLA: 14d): High risk, OR security >= 7, OR 5+ integrations → Reviews: architecture + security + vendor
- **standard** (SLA: 7d): Low-medium risk, no exceptions → Reviews: architecture
- **fast_track** (SLA: 48h): Low risk, pattern-aligned, approved vendors → Reviews: none

Respond with ONLY valid JSON:
{{
  "routing_lane": "fast_track|standard|complex|exception",
  "required_reviews": ["architecture", "security", "vendor", "arb"],
  "parallel_reviews": ["<reviews that can run concurrently>"],
  "estimated_sla_hours": <number>,
  "routing_rationale": "<2-3 sentences explaining lane selection>",
  "suggested_assignee_role": "<primary role>",
  "escalation_triggers": ["<conditions for auto-escalation>"]
}}`,
  ],
  [
    "human",
    "Route this request:\n\n## Risk Scores\n{risk_scoring_result}\n\n## Pattern Matching\n{pattern_matching_result}\n\n## Vendor Analysis\n{vendor_analysis_result}\n\n## Classification\n{classification_result}",
  ],
]);

const routingChain = RunnableSequence.from([
  routingPrompt,
  createModel(),
  new JsonOutputParser(),
]);

// --- Stage 7: Executive Summary ---

const summaryPrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You are an executive briefing generator. Create a clear, concise decision package.

Respond with ONLY valid JSON:
{{
  "executive_summary": "<3-5 sentence summary for business and technical stakeholders>",
  "pattern_alignment_summary": "<which patterns apply, where gaps exist>",
  "vendor_summary": "<approved vs unapproved, key flags>",
  "risk_dashboard": {{
    "overall": "<low|medium|high|critical>",
    "scores": {{ "security": <n>, "compliance": <n>, "architectural": <n>, "operational": <n>, "vendor": <n> }},
    "top_concerns": ["<concern>"]
  }},
  "recommendations": [
    {{
      "type": "action|warning|suggestion|blocker",
      "message": "<what to do>",
      "related_pattern": "<patternId or null>"
    }}
  ],
  "next_steps": [
    {{ "action": "<what>", "owner": "<role>", "deadline": "<relative time>" }}
  ],
  "routing": {{
    "lane": "<lane>",
    "reviews_required": ["<reviews>"],
    "estimated_decision_date": "<relative>"
  }}
}}`,
  ],
  [
    "human",
    "Generate decision package:\n\n## Intake Request\n{intake_request}\n\n## Completeness\n{completeness_result}\n\n## Classification\n{classification_result}\n\n## Pattern Matching\n{pattern_matching_result}\n\n## Vendor Analysis\n{vendor_analysis_result}\n\n## Risk Scores\n{risk_scoring_result}\n\n## Routing\n{routing_result}",
  ],
]);

const summaryChain = RunnableSequence.from([
  summaryPrompt,
  createModel(),
  new JsonOutputParser(),
]);

// --- Pipeline Orchestrator ---

/**
 * Runs the full 7-stage triage pipeline.
 *
 * @param {object} intakeRequest - The intake request object
 * @param {object} options - Pipeline options
 * @param {function} options.onStageStart - Callback(stageName) fired before each stage
 * @param {function} options.onStageComplete - Callback(stageName, result) fired after each stage
 * @param {boolean} options.haltOnIncomplete - Stop pipeline if completeness < 0.6
 * @returns {object} Full triage result with all stage outputs
 */
export async function runTriagePipeline(intakeRequest, options = {}) {
  const { onStageStart, onStageComplete, haltOnIncomplete = true } = options;

  const patternLibrary = JSON.stringify(getPatternSummaries(), null, 2);
  const vendorRegistry = JSON.stringify(getVendorSummaries(), null, 2);
  const intakeStr = JSON.stringify(intakeRequest, null, 2);

  const context = {
    intake_request: intakeStr,
    pattern_library: patternLibrary,
    vendor_registry: vendorRegistry,
  };

  const stages = [
    { id: "completeness", name: "Completeness Check", chain: completenessChain, key: "completeness_result" },
    { id: "classification", name: "Classification", chain: classificationChain, key: "classification_result" },
    { id: "pattern_matching", name: "Pattern Matching", chain: patternMatchingChain, key: "pattern_matching_result" },
    { id: "vendor_analysis", name: "Vendor Analysis", chain: vendorAnalysisChain, key: "vendor_analysis_result" },
    { id: "risk_scoring", name: "Risk Scoring", chain: riskScoringChain, key: "risk_scoring_result" },
    { id: "routing", name: "Routing Decision", chain: routingChain, key: "routing_result" },
    { id: "summary", name: "Executive Summary", chain: summaryChain, key: "summary_result" },
  ];

  const results = {};
  const timings = {};

  for (const stage of stages) {
    onStageStart?.(stage.name);
    const start = Date.now();

    try {
      // Build input for this stage — context + all prior results
      const input = { ...context };
      for (const [key, val] of Object.entries(results)) {
        input[key] = JSON.stringify(val, null, 2);
      }

      const result = await stage.chain.invoke(input);
      results[stage.key] = result;
      timings[stage.id] = Date.now() - start;

      onStageComplete?.(stage.name, result);

      // Early halt if completeness is too low
      if (
        stage.id === "completeness" &&
        haltOnIncomplete &&
        result.completeness_score < 0.6
      ) {
        return {
          status: "needs_info",
          haltedAt: "completeness",
          reason: "Completeness score below threshold (0.6)",
          completeness_result: result,
          missing_fields: result.missing_fields,
          timings,
        };
      }
    } catch (err) {
      timings[stage.id] = Date.now() - start;
      results[stage.key] = { error: err.message };
      onStageComplete?.(stage.name, { error: err.message });
    }
  }

  return {
    status: "triage_complete",
    timestamp: new Date().toISOString(),
    ...results,
    timings,
    confidenceScore: calculateConfidence(results),
  };
}

/**
 * Calculate overall confidence based on individual stage quality.
 */
function calculateConfidence(results) {
  const factors = [];

  if (results.completeness_result?.completeness_score) {
    factors.push(results.completeness_result.completeness_score);
  }
  if (results.completeness_result?.clarity_score) {
    factors.push(results.completeness_result.clarity_score);
  }
  if (results.classification_result?.classification_confidence) {
    factors.push(results.classification_result.classification_confidence);
  }
  if (results.pattern_matching_result?.matched_patterns?.length > 0) {
    const avgRelevance =
      results.pattern_matching_result.matched_patterns.reduce(
        (sum, p) => sum + (p.relevanceScore || 0),
        0
      ) / results.pattern_matching_result.matched_patterns.length;
    factors.push(avgRelevance);
  }

  return factors.length > 0
    ? Math.round((factors.reduce((a, b) => a + b, 0) / factors.length) * 100) / 100
    : 0;
}

// --- Convenience: Run a single stage ---

export async function runStage(stageId, input) {
  const stageMap = {
    completeness: completenessChain,
    classification: classificationChain,
    pattern_matching: patternMatchingChain,
    vendor_analysis: vendorAnalysisChain,
    risk_scoring: riskScoringChain,
    routing: routingChain,
    summary: summaryChain,
  };

  const chain = stageMap[stageId];
  if (!chain) throw new Error(`Unknown stage: ${stageId}. Available: ${Object.keys(stageMap).join(", ")}`);

  return chain.invoke(input);
}

// --- Export stage chains for testing/composition ---

export const stages = {
  completeness: completenessChain,
  classification: classificationChain,
  patternMatching: patternMatchingChain,
  vendorAnalysis: vendorAnalysisChain,
  riskScoring: riskScoringChain,
  routing: routingChain,
  summary: summaryChain,
};
