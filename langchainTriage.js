const { ChatAnthropic } = require('@langchain/anthropic');
const { ChatPromptTemplate } = require('@langchain/core/prompts');
const { JsonOutputParser } = require('@langchain/core/output_parsers');
const fs = require('fs');
const path = require('path');

function loadPatterns() {
  const dir = path.join(__dirname, 'patterns');
  return fs.readdirSync(dir).filter(f => f.endsWith('.json')).map(f => {
    try { return JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); } catch { return null; }
  }).filter(Boolean);
}

function loadVendors() {
  try {
    return JSON.parse(fs.readFileSync(path.join(__dirname, 'vendors', 'registry.json'), 'utf8'));
  } catch { return []; }
}

function buildIntakeSummary(intake) {
  const parseJ = (v, fb) => {
    if (!v) return fb;
    if (typeof v === 'object') return v;
    try { return JSON.parse(v); } catch { return fb; }
  };

  const components = parseJ(intake.components, []);
  const dataTypes = parseJ(intake.data_types, []);
  const authMethods = parseJ(intake.auth_methods, []);
  const compliance = parseJ(intake.compliance_requirements, []);
  const newVendors = parseJ(intake.new_vendors, []);
  const vendorIds = parseJ(intake.vendor_ids, []);
  const relatedPatternIds = parseJ(intake.related_pattern_ids, []);

  const allVendors = loadVendors();
  const selectedVendors = allVendors.filter(v => vendorIds.map(Number).includes(v.id));

  return {
    reference: intake.reference_id,
    title: intake.title,
    description: intake.description || 'Not provided',
    strategicObjective: intake.strategic_objective || 'Not provided',
    architectureType: intake.architecture_type || 'Not specified',
    hostingModel: intake.hosting_model || 'Not specified',
    deploymentTarget: intake.deployment_target || 'Not specified',
    programmeDomain: intake.programme_domain || 'Not specified',
    businessUnit: intake.business_unit || 'Not specified',
    projectTimeline: intake.project_timeline || 'Not specified',
    requestorName: intake.requestor_name || 'Not specified',
    requestorRole: intake.requestor_role || 'Not specified',
    integrationPoints: intake.integration_points || 0,
    isPublicFacing: intake.is_public_facing ? 'Yes' : 'No',
    dataClassification: intake.data_classification || 'Internal',
    dataTypes,
    authMethods,
    compliance,
    encryptionAtRest: intake.encryption_at_rest ? 'Yes' : 'No',
    encryptionInTransit: intake.encryption_in_transit ? 'Yes' : 'No',
    hasMfa: intake.has_mfa ? 'Yes' : 'No',
    hasWaf: intake.has_waf ? 'Yes' : 'No',
    hasMonitoring: intake.has_monitoring ? 'Yes' : 'No',
    isZeroTrustAligned: intake.is_zero_trust_aligned ? 'Yes' : 'No',
    hasLegacyDependencies: intake.has_legacy_dependencies ? 'Yes' : 'No',
    legacySystems: intake.legacy_systems || 'None',
    components,
    newVendors,
    selectedVendors: selectedVendors.map(v => `${v.vendorCompany} (${v.productService})`),
    relatedPatternIds,
    riskScore: intake.risk_score || 'Not calculated',
    riskTier: intake.risk_tier || 'Not assessed',
  };
}

const STAGES = [
  'completeness',
  'classification',
  'pattern_matching',
  'vendor_analysis',
  'risk_scoring',
  'routing',
  'executive_summary'
];

async function runStage(stageName, systemPrompt, userPrompt, model, context) {
  const prompt = ChatPromptTemplate.fromMessages([
    ['system', systemPrompt],
    ['human', userPrompt]
  ]);
  const parser = new JsonOutputParser();
  const chain = prompt.pipe(model).pipe(parser);
  return await chain.invoke(context);
}

async function runTriagePipeline(intake, onStageUpdate) {
  const model = new ChatAnthropic({
    model: 'claude-haiku-4-5',
    maxTokens: 4096,
    temperature: 0,
  });

  const patterns = loadPatterns();
  const endorsedPatterns = patterns.filter(p => p.status === 'Endorsed');
  const intakeSummary = buildIntakeSummary(intake);
  const intakeJson = JSON.stringify(intakeSummary, null, 2);

  const results = {};
  let ctx = { intake: intakeJson };

  const emit = (stage, event, data) => {
    if (onStageUpdate) onStageUpdate(stage, event, data);
  };

  // ─── Stage 1: Completeness ────────────────────────────────────────────────
  emit('completeness', 'start', {});
  const completenessResult = await runStage(
    'completeness',
    `You are an enterprise architecture intake validator. Assess whether an intake submission has sufficient information to proceed with triage. Return ONLY valid JSON, no markdown.`,
    `Evaluate this intake request for completeness. Check if these required fields are present and meaningful: title, description, architectureType, hostingModel, dataClassification, requestorName.

Intake:
{intake}

Return JSON:
{{
  "completenessScore": <0.0-1.0>,
  "isComplete": <true if score >= 0.6>,
  "missingFields": ["<field name>"],
  "unclearFields": ["<field that needs clarification>"],
  "summary": "<one sentence assessment>"
}}`,
    model,
    ctx
  );
  results.completeness = completenessResult;
  emit('completeness', 'complete', completenessResult);

  if (!completenessResult.isComplete) {
    return {
      stages: results,
      halted: true,
      haltReason: 'completeness',
      completenessScore: completenessResult.completenessScore,
      missingFields: completenessResult.missingFields || [],
      unclearFields: completenessResult.unclearFields || [],
    };
  }

  // ─── Stage 2: Classification ──────────────────────────────────────────────
  emit('classification', 'start', {});
  ctx.completeness = JSON.stringify(completenessResult);
  const classificationResult = await runStage(
    'classification',
    `You are an enterprise architecture classifier at McCain Foods. Classify the architecture request into structured categories. Return ONLY valid JSON.`,
    `Classify this architecture intake request.

Intake:
{intake}

Return JSON:
{{
  "primaryDomain": "<one of: Application & Integration | Data Platform | Infrastructure & Cloud | Security & Identity | OT / IoT | Network & Connectivity | Application Modernisation | Other>",
  "secondaryDomains": ["<domain>"],
  "complexity": "<Simple | Moderate | Complex | Very Complex>",
  "changeImpact": "<Low | Medium | High | Critical>",
  "technicalRisk": "<Low | Medium | High | Critical>",
  "businessCriticality": "<Low | Medium | High | Critical>",
  "classificationConfidence": <0.0-1.0>,
  "rationale": "<2-3 sentence justification>"
}}`,
    model,
    ctx
  );
  results.classification = classificationResult;
  emit('classification', 'complete', classificationResult);

  // ─── Stage 3: Pattern Matching ────────────────────────────────────────────
  emit('pattern_matching', 'start', {});
  ctx.classification = JSON.stringify(classificationResult);
  const patternCatalog = endorsedPatterns.slice(0, 12).map(p =>
    `${p.patternId}: ${p.name} (${p.domain}) — ${p.strategicIntent || p.problemStatement || ''}`
  ).join('\n');

  const patternResult = await runStage(
    'pattern_matching',
    `You are a McCain Architecture Library pattern matcher. Match intake requests to relevant endorsed patterns. Return ONLY valid JSON.`,
    `Match this intake to the most relevant architecture patterns.

Intake:
{intake}

Available endorsed patterns:
${patternCatalog}

Return JSON:
{{
  "matchedPatterns": [
    {{
      "patternId": "<id>",
      "patternName": "<name>",
      "relevanceScore": <0.0-1.0>,
      "matchReason": "<why this pattern applies>"
    }}
  ],
  "gapPatterns": ["<description of pattern gap — something needed but not in catalogue>"],
  "deviationRisk": "<Low | Medium | High>",
  "patternAlignmentScore": <0-100>
}}`,
    model,
    ctx
  );
  results.pattern_matching = patternResult;
  emit('pattern_matching', 'complete', patternResult);

  // ─── Stage 4: Vendor Analysis ─────────────────────────────────────────────
  emit('vendor_analysis', 'start', {});
  ctx.pattern_matching = JSON.stringify(patternResult);
  const vendorResult = await runStage(
    'vendor_analysis',
    `You are a vendor risk analyst at McCain Foods. Assess vendor risk and approval status for architecture requests. Return ONLY valid JSON.`,
    `Analyse the vendor landscape for this intake request.

Intake:
{intake}

Assess the registered vendors and any new/unvetted vendors proposed.

Return JSON:
{{
  "registeredVendorFlags": [
    {{
      "vendorName": "<name>",
      "concern": "<specific concern or empty string>",
      "approvalStatus": "Approved | Approved with Conditions | Needs Review"
    }}
  ],
  "newVendorRisk": "<Low | Medium | High | Critical>",
  "newVendorFlags": [
    {{
      "vendorName": "<name>",
      "riskFactors": ["<factor>"],
      "recommendedAction": "<action>"
    }}
  ],
  "overallVendorRisk": "<Low | Medium | High | Critical>",
  "vendorRiskScore": <0-100>,
  "vendorSummary": "<1-2 sentence vendor landscape summary>"
}}`,
    model,
    ctx
  );
  results.vendor_analysis = vendorResult;
  emit('vendor_analysis', 'complete', vendorResult);

  // ─── Stage 5: Risk Scoring ────────────────────────────────────────────────
  emit('risk_scoring', 'start', {});
  ctx.vendor_analysis = JSON.stringify(vendorResult);
  const riskResult = await runStage(
    'risk_scoring',
    `You are a risk scoring engine for enterprise architecture at McCain Foods. Score risk across 5 dimensions. Return ONLY valid JSON.`,
    `Score the risk profile of this architecture intake across 5 dimensions.

Intake:
{intake}

Classification: {classification}
Pattern alignment score: ${patternResult.patternAlignmentScore || 50}
Vendor risk score: ${vendorResult.vendorRiskScore || 50}

Dimensions to score (0-100 each, where 100 = highest risk):
- securityRisk: encryption, auth, WAF, MFA, Zero Trust, data classification
- dataRisk: data types, classification, sharing, compliance requirements
- vendorRisk: use the vendor analysis (${vendorResult.vendorRiskScore || 50}) as baseline
- complexityRisk: integration points, components, hosting model, legacy dependencies
- patternRisk: deviation from endorsed patterns (inverse of alignment score)

Return JSON:
{{
  "dimensions": {{
    "securityRisk": {{ "score": <0-100>, "rationale": "<reason>", "topFactors": ["<factor>"] }},
    "dataRisk": {{ "score": <0-100>, "rationale": "<reason>", "topFactors": ["<factor>"] }},
    "vendorRisk": {{ "score": <0-100>, "rationale": "<reason>", "topFactors": ["<factor>"] }},
    "complexityRisk": {{ "score": <0-100>, "rationale": "<reason>", "topFactors": ["<factor>"] }},
    "patternRisk": {{ "score": <0-100>, "rationale": "<reason>", "topFactors": ["<factor>"] }}
  }},
  "compositeScore": <0-100 weighted average>,
  "riskTier": "<Low | Medium | High | Critical>",
  "topRiskFlags": ["<flag>"],
  "confidenceScore": <0.0-1.0>
}}`,
    model,
    ctx
  );
  results.risk_scoring = riskResult;
  emit('risk_scoring', 'complete', riskResult);

  // ─── Stage 6: Routing ─────────────────────────────────────────────────────
  emit('routing', 'start', {});
  ctx.risk_scoring = JSON.stringify(riskResult);
  const routingResult = await runStage(
    'routing',
    `You are a routing engine for the McCain Architecture Review Board. Route intake requests to the correct review lane. Return ONLY valid JSON.`,
    `Determine the appropriate routing lane for this architecture intake.

Intake:
{intake}

Risk composite score: ${riskResult.compositeScore || 50}
Risk tier: ${riskResult.riskTier || 'Medium'}
Complexity: ${classificationResult.complexity || 'Moderate'}
Change impact: ${classificationResult.changeImpact || 'Medium'}

Routing lanes:
- Fast Track: Low risk, simple/moderate complexity, well-aligned patterns, no new vendors
- Standard: Medium risk or moderate complexity, standard review process (2-5 days)
- Complex: High risk or complex, requires Architecture Review Board (1-2 weeks)
- Exception: Critical risk, board-level review, potential blocking issues

Return JSON:
{{
  "routingLane": "Fast Track | Standard | Complex | Exception",
  "reviewType": "<e.g. Peer Review | Architecture Board | ARB | Emergency Board>",
  "estimatedReviewTime": "<e.g. 1-2 days | 3-5 days | 1-2 weeks>",
  "routingRationale": "<2-3 sentence explanation>",
  "prerequisites": ["<required before review begins>"],
  "escalationTriggers": ["<condition that would escalate to next lane>"],
  "assignedTeam": "<e.g. EA Team | Security Architect | ARB Panel>",
  "priority": "<Low | Medium | High | Urgent>"
}}`,
    model,
    ctx
  );
  results.routing = routingResult;
  emit('routing', 'complete', routingResult);

  // ─── Stage 7: Executive Summary ───────────────────────────────────────────
  emit('executive_summary', 'start', {});
  ctx.routing = JSON.stringify(routingResult);
  const summaryResult = await runStage(
    'executive_summary',
    `You are a Senior Enterprise Architect at McCain Foods writing an executive decision package for the Architecture Review Board. Be concise, actionable, and specific. Return ONLY valid JSON.`,
    `Write the executive triage decision package for this architecture intake.

Intake:
{intake}

Triage results:
- Completeness: ${completenessResult.completenessScore} (${completenessResult.summary || ''})
- Classification: ${classificationResult.primaryDomain}, ${classificationResult.complexity} complexity
- Pattern alignment score: ${patternResult.patternAlignmentScore || 50}
- Vendor risk: ${vendorResult.overallVendorRisk}
- Composite risk score: ${riskResult.compositeScore}/100 (${riskResult.riskTier})
- Routing lane: ${routingResult.routingLane}

Return JSON:
{{
  "headline": "<one punchy sentence summarising the request and its triage outcome, max 20 words>",
  "executiveSummary": "<3-4 sentences for CTO/CIO: what is it, what is the risk, what is the recommended action>",
  "keyStrengths": ["<strength>"],
  "keyRisks": [
    {{
      "risk": "<title>",
      "severity": "Critical | High | Medium | Low",
      "mitigation": "<specific action>"
    }}
  ],
  "mustDoBeforeApproval": ["<required action>"],
  "shouldConsider": ["<recommendation>"],
  "overallVerdict": "Proceed | Proceed with Conditions | Rework Required | Escalate",
  "confidenceLevel": "High | Medium | Low",
  "generatedAt": "<ISO timestamp>"
}}`,
    model,
    ctx
  );
  summaryResult.generatedAt = new Date().toISOString();
  results.executive_summary = summaryResult;
  emit('executive_summary', 'complete', summaryResult);

  return {
    stages: results,
    halted: false,
    routingLane: routingResult.routingLane,
    riskScores: riskResult.dimensions,
    compositeScore: riskResult.compositeScore,
    riskTier: riskResult.riskTier,
    riskFlags: riskResult.topRiskFlags || [],
    matchedPatterns: patternResult.matchedPatterns || [],
    vendorFlags: {
      registered: vendorResult.registeredVendorFlags || [],
      new: vendorResult.newVendorFlags || [],
      overallRisk: vendorResult.overallVendorRisk,
    },
    executiveSummary: summaryResult,
    confidenceScore: riskResult.confidenceScore || 0.8,
  };
}

async function runSingleStage(stageName, intake) {
  const model = new ChatAnthropic({
    model: 'claude-haiku-4-5',
    maxTokens: 4096,
    temperature: 0,
  });

  const patterns = loadPatterns();
  const endorsedPatterns = patterns.filter(p => p.status === 'Endorsed');
  const intakeSummary = buildIntakeSummary(intake);
  const intakeJson = JSON.stringify(intakeSummary, null, 2);
  const ctx = { intake: intakeJson };

  if (!STAGES.includes(stageName)) {
    throw new Error(`Unknown stage: ${stageName}. Valid stages: ${STAGES.join(', ')}`);
  }

  const patternCatalog = endorsedPatterns.slice(0, 12).map(p =>
    `${p.patternId}: ${p.name} (${p.domain}) — ${p.strategicIntent || p.problemStatement || ''}`
  ).join('\n');

  const stagePrompts = {
    completeness: {
      system: 'You are an enterprise architecture intake validator. Assess whether an intake submission has sufficient information to proceed with triage. Return ONLY valid JSON, no markdown.',
      user: `Evaluate this intake request for completeness. Check if these required fields are present and meaningful: title, description, architectureType, hostingModel, dataClassification, requestorName.

Intake:
{intake}

Return JSON:
{{
  "completenessScore": <0.0-1.0>,
  "isComplete": <true if score >= 0.6>,
  "missingFields": ["<field name>"],
  "unclearFields": ["<field that needs clarification>"],
  "summary": "<one sentence assessment>"
}}`
    },
    classification: {
      system: 'You are an enterprise architecture classifier at McCain Foods. Return ONLY valid JSON.',
      user: `Classify this architecture intake request.

Intake:
{intake}

Return JSON:
{{
  "primaryDomain": "<domain>",
  "secondaryDomains": ["<domain>"],
  "complexity": "<Simple | Moderate | Complex | Very Complex>",
  "changeImpact": "<Low | Medium | High | Critical>",
  "technicalRisk": "<Low | Medium | High | Critical>",
  "businessCriticality": "<Low | Medium | High | Critical>",
  "classificationConfidence": <0.0-1.0>,
  "rationale": "<2-3 sentences>"
}}`
    },
    pattern_matching: {
      system: 'You are a McCain Architecture Library pattern matcher. Return ONLY valid JSON.',
      user: `Match this intake to relevant architecture patterns.

Intake:
{intake}

Available endorsed patterns:
${patternCatalog}

Return JSON:
{{
  "matchedPatterns": [
    {{
      "patternId": "<id>",
      "patternName": "<name>",
      "relevanceScore": <0.0-1.0>,
      "matchReason": "<reason>"
    }}
  ],
  "gapPatterns": ["<gap description>"],
  "deviationRisk": "<Low | Medium | High>",
  "patternAlignmentScore": <0-100>
}}`
    },
    vendor_analysis: {
      system: 'You are a vendor risk analyst at McCain Foods. Return ONLY valid JSON.',
      user: `Analyse vendor landscape for this intake.

Intake:
{intake}

Return JSON:
{{
  "registeredVendorFlags": [],
  "newVendorRisk": "<Low | Medium | High | Critical>",
  "newVendorFlags": [],
  "overallVendorRisk": "<Low | Medium | High | Critical>",
  "vendorRiskScore": <0-100>,
  "vendorSummary": "<summary>"
}}`
    },
    risk_scoring: {
      system: 'You are a risk scoring engine for enterprise architecture at McCain Foods. Return ONLY valid JSON.',
      user: `Score the risk profile across 5 dimensions (0-100 each, higher = more risk).

Intake:
{intake}

Return JSON:
{{
  "dimensions": {{
    "securityRisk": {{ "score": <0-100>, "rationale": "<reason>", "topFactors": ["<factor>"] }},
    "dataRisk": {{ "score": <0-100>, "rationale": "<reason>", "topFactors": ["<factor>"] }},
    "vendorRisk": {{ "score": <0-100>, "rationale": "<reason>", "topFactors": ["<factor>"] }},
    "complexityRisk": {{ "score": <0-100>, "rationale": "<reason>", "topFactors": ["<factor>"] }},
    "patternRisk": {{ "score": <0-100>, "rationale": "<reason>", "topFactors": ["<factor>"] }}
  }},
  "compositeScore": <0-100>,
  "riskTier": "<Low | Medium | High | Critical>",
  "topRiskFlags": ["<flag>"],
  "confidenceScore": <0.0-1.0>
}}`
    },
    routing: {
      system: 'You are a routing engine for the McCain Architecture Review Board. Return ONLY valid JSON.',
      user: `Determine the appropriate routing lane for this intake.

Intake:
{intake}

Routing lanes: Fast Track | Standard | Complex | Exception

Return JSON:
{{
  "routingLane": "<lane>",
  "reviewType": "<type>",
  "estimatedReviewTime": "<time>",
  "routingRationale": "<reason>",
  "prerequisites": ["<prerequisite>"],
  "escalationTriggers": ["<trigger>"],
  "assignedTeam": "<team>",
  "priority": "<Low | Medium | High | Urgent>"
}}`
    },
    executive_summary: {
      system: 'You are a Senior Enterprise Architect writing an executive decision package for the Architecture Review Board. Return ONLY valid JSON.',
      user: `Write the executive triage decision package for this intake.

Intake:
{intake}

Return JSON:
{{
  "headline": "<max 20 words>",
  "executiveSummary": "<3-4 sentences>",
  "keyStrengths": ["<strength>"],
  "keyRisks": [{{"risk": "<title>", "severity": "<level>", "mitigation": "<action>"}}],
  "mustDoBeforeApproval": ["<action>"],
  "shouldConsider": ["<recommendation>"],
  "overallVerdict": "Proceed | Proceed with Conditions | Rework Required | Escalate",
  "confidenceLevel": "High | Medium | Low",
  "generatedAt": "<ISO timestamp>"
}}`
    }
  };

  const sp = stagePrompts[stageName];
  const result = await runStage(stageName, sp.system, sp.user, model, ctx);
  if (stageName === 'executive_summary') result.generatedAt = new Date().toISOString();
  return result;
}

module.exports = { runTriagePipeline, runSingleStage, STAGES };
