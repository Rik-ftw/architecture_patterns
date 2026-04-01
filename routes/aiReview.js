const express = require('express');
const router = express.Router();
const Anthropic = require('@anthropic-ai/sdk');
const { db } = require('../db');
const fs = require('fs');
const path = require('path');
const os = require('os');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const AdmZip = require('adm-zip');

const ACCEPTED_CODE_EXTS = new Set([
  '.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cs', '.go', '.rb', '.php',
  '.yaml', '.yml', '.json', '.xml', '.toml', '.ini', '.env', '.sh', '.bash',
  '.tf', '.hcl', '.md', '.txt', '.csv', '.sql', '.html', '.css', '.dockerfile'
]);

const MAX_EXTRACT_CHARS = 120000;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024, files: 10 },
  fileFilter(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowed = new Set(['.pdf', '.docx', '.txt', '.zip', ...ACCEPTED_CODE_EXTS]);
    if (allowed.has(ext)) return cb(null, true);
    cb(new Error(`Unsupported file type: ${ext}`));
  }
});

async function extractTextFromBuffer(filename, buffer) {
  const ext = path.extname(filename).toLowerCase();
  if (ext === '.pdf') {
    try { const d = await pdfParse(buffer); return d.text || ''; } catch { return ''; }
  }
  if (ext === '.docx') {
    try { const r = await mammoth.extractRawText({ buffer }); return r.value || ''; } catch { return ''; }
  }
  if (ext === '.zip') {
    try {
      const zip = new AdmZip(buffer);
      const entries = zip.getEntries();
      const texts = [];
      let totalExtractedBytes = 0;
      const MAX_ZIP_ENTRIES = 200;
      const MAX_ZIP_EXTRACTED_BYTES = 10 * 1024 * 1024;
      let processed = 0;
      for (const entry of entries) {
        if (entry.isDirectory) continue;
        if (processed >= MAX_ZIP_ENTRIES) break;
        const entryExt = path.extname(entry.entryName).toLowerCase();
        if (ACCEPTED_CODE_EXTS.has(entryExt) || entryExt === '.txt') {
          try {
            const entryData = entry.getData();
            totalExtractedBytes += entryData.length;
            if (totalExtractedBytes > MAX_ZIP_EXTRACTED_BYTES) break;
            const content = entryData.toString('utf8');
            texts.push(`--- ${entry.entryName} ---\n${content}`);
            processed++;
          } catch { }
        }
      }
      return texts.join('\n\n');
    } catch { return ''; }
  }
  if (ACCEPTED_CODE_EXTS.has(ext) || ext === '.txt') {
    try { return buffer.toString('utf8'); } catch { return ''; }
  }
  return '';
}

function buildDocumentExtractionPrompt(combinedText) {
  const truncated = combinedText.length > MAX_EXTRACT_CHARS
    ? combinedText.slice(0, MAX_EXTRACT_CHARS) + '\n[... content truncated for context limit ...]'
    : combinedText;

  return `You are a Senior Enterprise Architect at McCain Foods. A user has uploaded one or more documents (code, PDF, DOCX, text files) related to an architecture project they want to submit for review. Your job is to read the extracted document text and identify architecture-relevant information to pre-fill an intake form.

Extract as much relevant information as possible from the text below. If a field cannot be determined, return null or an empty array for that field — do NOT guess or invent values. Be concise and factual.

EXTRACTED DOCUMENT TEXT:
---
${truncated}
---

Respond ONLY with a valid JSON object matching this exact schema. No markdown, no prose outside the JSON:

{
  "title": "<concise project/request title, max 80 chars, or null>",
  "description": "<what the project does and why — 2-5 sentences, or null>",
  "strategicObjective": "<how it aligns to business/strategic goals, or null>",
  "architectureType": "<one of: API & Integration | Data Platform | Infrastructure & Cloud | Security & Identity | Application Modernisation | OT / IoT | Network & Connectivity | Other — or null>",
  "hostingModel": "<one of: Public Cloud (Azure) | Public Cloud (AWS) | Private Cloud | On-Premises | Hybrid | SaaS | PaaS — or null>",
  "deploymentTarget": "<one of: Production | Non-Production | Both | DR — or null>",
  "components": ["<component name>"],
  "dataClassification": "<one of: Public | Internal | Confidential | Restricted — or null>",
  "dataTypes": ["<one or more of: PII | PHI | Financial | OT/SCADA Data | Credentials/Secrets | Operational Metrics | Configuration Data | Log Data | None>"],
  "authMethods": ["<one or more of: OAuth2/OIDC | SAML | API Key | Certificate/mTLS | Windows Integrated (Kerberos) | None>"],
  "encryptionAtRest": <true | false | null>,
  "encryptionInTransit": <true | false | null>,
  "hasMfa": <true | false | null>,
  "hasWaf": <true | false | null>,
  "hasMonitoring": <true | false | null>,
  "isZeroTrustAligned": <true | false | null>,
  "isPublicFacing": <true | false | null>,
  "integrationPoints": <integer or null>,
  "newVendors": ["<unvetted vendor or SaaS product names found in documents>"],
  "complianceRequirements": ["<one or more of: GDPR | SOX | ISO 27001 | IEC 62443 | HIPAA | PCI-DSS | NIST CSF | None>"],
  "hasLegacyDependencies": <true | false | null>,
  "legacySystems": "<description of legacy systems if present, or null>",
  "techStackNotes": "<additional technology stack notes, or null>",
  "programmeDomain": "<programme or business domain if identifiable, or null>",
  "businessUnit": "<business unit or team if identifiable, or null>",
  "projectTimeline": "<one of: Immediate (< 4 weeks) | Short-term (1-3 months) | Medium-term (3-6 months) | Long-term (6-12 months) | Strategic (12+ months) — or null>"
}`;
}

function loadPatterns() {
  const dir = path.join(__dirname, '..', 'patterns');
  return fs.readdirSync(dir).filter(f => f.endsWith('.json')).map(f => {
    try { return JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); } catch { return null; }
  }).filter(Boolean);
}

function loadVendors() {
  try { return JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'vendors', 'registry.json'), 'utf8')); } catch { return []; }
}

function parseJson(val, fallback) {
  try { return JSON.parse(val); } catch { return fallback; }
}

function buildReviewPrompt(intake, patterns, allVendors) {
  const relatedPatterns = patterns.filter(p => (intake.relatedPatternIds || []).includes(p.patternId));
  const endorsedPatterns = patterns.filter(p => p.status === 'Endorsed');
  const selectedVendors = allVendors.filter(v => (intake.vendorIds || []).map(Number).includes(v.id));
  const newVendors = intake.newVendors || [];

  const patternCatalogSummary = endorsedPatterns.map(p =>
    `  - ${p.patternId}: ${p.name} (${p.domain}) — ${p.strategicIntent || p.problemStatement || ''}`
  ).join('\n');

  const relatedPatternDetails = relatedPatterns.length
    ? relatedPatterns.map(p => `  - ${p.patternId}: ${p.name} [${p.status}]${p.guardrails ? ` — ${p.guardrails.length} guardrails` : ''}`).join('\n')
    : '  None referenced';

  const vendorContext = selectedVendors.length
    ? selectedVendors.map(v => `  - ${v.vendorCompany} (${v.productService}) — Criticality: ${v.criticality}, Hosting: ${v.hostingModel || 'N/A'}, Data Shared: ${v.dataShared ? 'Yes' : 'No'}`).join('\n')
    : '  None selected from registry';

  return `You are a Senior Enterprise Architect at McCain Foods, reviewing an architecture intake request submitted by a business or technical team. You have deep expertise in cloud-native architecture (Azure), OT/ICS integration, data platforms, API design, security frameworks (Zero Trust, IEC 62443, ISO 27001), and enterprise vendor management.

Your task: Provide a structured, expert architectural review of the following request. Be specific, practical, and constructive. Reference patterns from the McCain Architecture Library where relevant. Flag genuine concerns without being unnecessarily restrictive.

---
## ARCHITECTURE REQUEST

**Reference:** ${intake.reference_id}
**Title:** ${intake.title}
**Type:** ${intake.architecture_type || 'Not specified'}
**Programme Domain:** ${intake.programme_domain || 'Not specified'}
**Business Unit:** ${intake.business_unit || 'Not specified'}
**Timeline:** ${intake.project_timeline || 'Not specified'}
**Requestor:** ${intake.requestor_name || 'Not specified'} (${intake.requestor_role || 'Unknown role'})

**Description:**
${intake.description || 'Not provided'}

**Strategic Objective:**
${intake.strategic_objective || 'Not provided'}

---
## TECHNOLOGY PROFILE

- Hosting Model: ${intake.hosting_model || 'Not specified'}
- Deployment Target: ${intake.deployment_target || 'Not specified'}
- Integration Points: ${intake.integration_points || 0}
- Public-Facing: ${intake.is_public_facing ? 'Yes' : 'No'}
- Components: ${parseJson(intake.components, []).join(', ') || 'Not specified'}
- Tech Stack Notes: ${intake.tech_stack_notes || 'None'}

---
## DATA & SECURITY

- Data Classification: ${intake.data_classification || 'Not specified'}
- Data Types: ${parseJson(intake.data_types, []).join(', ') || 'None specified'}
- External Data Sharing: ${intake.external_data_sharing ? 'Yes' : 'No'}
- Encryption at Rest: ${intake.encryption_at_rest ? 'Confirmed' : 'Not confirmed'}
- Encryption in Transit: ${intake.encryption_in_transit ? 'Confirmed' : 'Not confirmed'}
- Authentication: ${parseJson(intake.auth_methods, []).join(', ') || 'None specified'}
- MFA: ${intake.has_mfa ? 'Yes' : 'No'}
- WAF: ${intake.has_waf ? 'Yes' : 'No'}
- Monitoring: ${intake.has_monitoring ? 'Yes' : 'No'}
- Zero Trust Aligned: ${intake.is_zero_trust_aligned ? 'Yes' : 'No'}
- Compliance: ${parseJson(intake.compliance_requirements, []).join(', ') || 'None'}

---
## VENDOR CONTEXT

**Registry vendors selected:**
${vendorContext}

**New/Unvetted vendors proposed:**
${newVendors.length ? newVendors.map(v => `  - ${v} (not yet security-assessed)`).join('\n') : '  None'}

---
## PATTERN ALIGNMENT

**Patterns referenced by requestor:**
${relatedPatternDetails}

**Deviates from patterns:** ${intake.deviates_from_patterns ? 'Yes — ' + (intake.deviation_justification || 'No justification provided') : 'No'}
**Legacy dependencies:** ${intake.has_legacy_dependencies ? 'Yes — ' + (intake.legacy_systems || 'Not specified') : 'No'}

---
## McCAIN ENDORSED PATTERN CATALOGUE (for reference):
${patternCatalogSummary}

---
## AUTOMATED RISK ASSESSMENT RESULT

- Total Risk Score: ${intake.risk_score || 'Not calculated'}/100
- Risk Tier: ${intake.risk_tier || 'Not assessed'}
${intake.risk_flags ? '- Automated flags:\n' + parseJson(intake.risk_flags, []).map(f => `  · ${f}`).join('\n') : ''}

---

Respond ONLY with a valid JSON object (no markdown, no prose outside the JSON) matching this exact schema:

{
  "overallRating": "Approved" | "Approved with Conditions" | "Needs Rework" | "Major Concerns",
  "confidenceLevel": "High" | "Medium" | "Low",
  "executiveSummary": "<2-3 sentence plain-language summary suitable for a CTO or CIO>",
  "patternAlignment": {
    "score": <0-100>,
    "assessment": "<specific comment on how well this fits existing patterns>",
    "recommendedPatterns": ["<patternId: name>", ...],
    "gaps": ["<gap or missing pattern reference>", ...]
  },
  "securityPosture": {
    "score": <0-100>,
    "assessment": "<specific security architecture commentary>",
    "gaps": ["<specific gap>", ...],
    "positives": ["<security strength noted>", ...]
  },
  "architectureQuality": {
    "score": <0-100>,
    "assessment": "<commentary on design quality, scalability, maintainability, cloud-native alignment>",
    "concerns": ["<concern>", ...]
  },
  "riskCommentary": "<AI perspective on the automated risk score — agree, disagree, nuance, or additional context not captured by the rule-based engine>",
  "keyRisks": [
    { "risk": "<risk title>", "severity": "Critical" | "High" | "Medium" | "Low", "detail": "<explanation>", "mitigation": "<specific action>" }
  ],
  "recommendations": [
    { "priority": "Must", "action": "<required action before approval>" },
    { "priority": "Should", "action": "<strongly recommended>" },
    { "priority": "Consider", "action": "<optional improvement>" }
  ],
  "architectureNotes": "<longer-form architecture narrative, 3-5 sentences with specific Azure service suggestions or design guidance relevant to the request>",
  "reviewComplexity": "Standard" | "Elevated" | "Complex" | "Board-level",
  "estimatedReviewEffort": "<e.g. 2-4 hours, 1-2 days, 1 week>"
}`;
}

function buildQuickAssessPrompt(intake, patterns) {
  const endorsedPatterns = patterns.filter(p => p.status === 'Endorsed');
  return `You are an Enterprise Architect at McCain Foods reviewing a partial architecture intake during wizard completion.

Title: ${intake.title || 'Untitled'}
Type: ${intake.architectureType || intake.architecture_type || 'Not specified'}
Domain: ${intake.programmeDomain || intake.programme_domain || 'Not specified'}
Description: ${intake.description || 'Not provided'}
Data Classification: ${intake.dataClassification || intake.data_classification || 'Not specified'}
Hosting: ${intake.hostingModel || intake.hosting_model || 'Not specified'}
Public Facing: ${intake.isPublicFacing || intake.is_public_facing ? 'Yes' : 'No'}
Security Controls: MFA=${intake.hasMfa ? 'Yes' : 'No'}, WAF=${intake.hasWaf ? 'Yes' : 'No'}, ZeroTrust=${intake.isZeroTrustAligned ? 'Yes' : 'No'}
Components: ${(intake.components || []).join(', ') || 'Not specified'}
New Vendors: ${(intake.newVendors || []).join(', ') || 'None'}

Endorsed patterns available: ${endorsedPatterns.slice(0, 8).map(p => `${p.patternId}: ${p.name}`).join('; ')}

Respond with ONLY a JSON object:
{
  "quickRating": "Low Concern" | "Review Needed" | "Significant Gaps" | "Major Issues",
  "headline": "<one punchy sentence, max 15 words>",
  "topConcerns": ["<concern 1>", "<concern 2>", "<concern 3 max>"],
  "suggestedPatterns": ["<patternId: name>", ...],
  "oneThingToFix": "<the single most important thing to address before submitting>"
}`;
}

router.post('/review/:id', async (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM intake_requests WHERE id=? OR reference_id=?').get(req.params.id, req.params.id);
    if (!row) return res.status(404).json({ error: 'Intake not found' });

    const intake = {
      ...row,
      relatedPatternIds: parseJson(row.related_pattern_ids, []),
      vendorIds: parseJson(row.vendor_ids, []),
      newVendors: parseJson(row.new_vendors, []),
      dataTypes: parseJson(row.data_types, []),
      authMethods: parseJson(row.auth_methods, []),
      components: parseJson(row.components, []),
      complianceRequirements: parseJson(row.compliance_requirements, []),
      riskBreakdown: parseJson(row.risk_breakdown, {}),
      riskFlags: parseJson(row.risk_flags, []),
    };

    const patterns = loadPatterns();
    const vendors = loadVendors();
    const client = new Anthropic();

    const message = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 4096,
      messages: [{ role: 'user', content: buildReviewPrompt(intake, patterns, vendors) }]
    });

    let reviewText = message.content[0].text.trim();
    if (reviewText.startsWith('```')) reviewText = reviewText.replace(/^```json?\n?/, '').replace(/\n?```$/, '');
    const review = JSON.parse(reviewText);
    review.generatedAt = new Date().toISOString();
    review.model = 'claude-sonnet-4-5';

    db.prepare(`UPDATE intake_requests SET ai_review=?, updated_at=datetime('now') WHERE id=?`)
      .run(JSON.stringify(review), row.id);

    res.json({ review });
  } catch (err) {
    console.error('AI review error:', err);
    res.status(500).json({ error: err.message || 'AI review failed' });
  }
});

router.post('/quick-assess', async (req, res) => {
  try {
    const intake = req.body;
    const patterns = loadPatterns();
    const client = new Anthropic();

    const message = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 512,
      messages: [{ role: 'user', content: buildQuickAssessPrompt(intake, patterns) }]
    });

    let text = message.content[0].text.trim();
    if (text.startsWith('```')) text = text.replace(/^```json?\n?/, '').replace(/\n?```$/, '');
    const result = JSON.parse(text);
    res.json(result);
  } catch (err) {
    console.error('Quick assess error:', err);
    res.status(500).json({ error: err.message || 'Quick assessment failed' });
  }
});

function buildDiagramPrompt(intake, patterns, allVendors) {
  const selectedVendors = allVendors.filter(v => (intake.vendorIds || []).map(Number).includes(v.id));
  const relatedPatterns = patterns.filter(p => (intake.relatedPatternIds || []).includes(p.patternId));
  const components = parseJson(intake.components, []);
  const authMethods = parseJson(intake.auth_methods, []);
  const dataTypes = parseJson(intake.data_types, []);
  const newVendors = parseJson(intake.new_vendors, []);

  return `You are a Senior Enterprise Architect creating a Microsoft Azure-style Mermaid.js architecture diagram.

Generate a clean, professional architecture diagram following Microsoft Azure reference architecture conventions. Use Azure service names where applicable, keep zone labels concise, and produce a structured top-down layered flow consistent with Microsoft reference architectures.

STRICT MERMAID SYNTAX RULES — follow exactly or the diagram will fail to render:
1. Start with: flowchart TD
2. Node IDs: ONLY letters, digits, underscores — NO spaces, hyphens, dots, parentheses in IDs
3. Node labels use square brackets: nodeId["Label Text"]
4. Subgraphs: subgraph zoneId["Zone Name"]\\n  ...nodes...\\nend
5. Arrows: A --> B or A -->|"label"| B
6. Max 18 nodes total — keep it readable
7. NO classDef, NO click, NO style lines — plain flowchart only
8. Escape any quotes inside labels with a backslash

AZURE SERVICE NAMING — use official Azure service names where applicable:
- API Gateway → Azure API Management
- Message broker / Event Hub → Azure Service Bus or Azure Event Hubs
- Identity provider / MFA → Microsoft Entra ID (Azure AD)
- WAF → Azure Web Application Firewall
- Cache → Azure Cache for Redis
- Storage → Azure Blob Storage or Azure Data Lake Storage
- CDN → Azure Front Door
- Functions / Logic → Azure Functions or Azure Logic Apps
- Container runtime → Azure Kubernetes Service (AKS) or Azure Container Apps

ZONES TO USE (include only what is relevant, top-down order):
- Client Zone: end users, browsers, mobile apps, IoT devices
- Security Zone: Azure Web Application Firewall, Microsoft Entra ID, Zero Trust gateway
- Integration Zone: Azure API Management, Azure Service Bus, Azure Event Hubs
- Application Zone: main services, Azure Functions, Azure Logic Apps, microservices
- Data Zone: Azure SQL, Azure Cosmos DB, Azure Blob Storage, Azure Cache for Redis
- External Zone: external vendors, SaaS tools, legacy systems, on-premises / OT equipment

ARCHITECTURE REQUEST:
Title: ${intake.title}
Type: ${intake.architecture_type || 'Not specified'}
Description: ${intake.description || 'Not provided'}
Strategic Objective: ${intake.strategic_objective || 'Not provided'}
Hosting: ${intake.hosting_model || 'Not specified'} | Deployment: ${intake.deployment_target || 'Not specified'}
Integration Points: ${intake.integration_points || 0} | Public Facing: ${intake.is_public_facing ? 'Yes' : 'No'}
Components: ${components.join(', ') || 'Not specified'}
Data Types: ${dataTypes.join(', ') || 'None'}
Data Classification: ${intake.data_classification || 'Not specified'}
Auth Methods: ${authMethods.join(', ') || 'None'} | MFA: ${intake.has_mfa ? 'Yes' : 'No'} | WAF: ${intake.has_waf ? 'Yes' : 'No'} | Zero Trust: ${intake.is_zero_trust_aligned ? 'Yes' : 'No'}
Registered Vendors: ${selectedVendors.map(v => v.vendorCompany + ' (' + v.productService + ')').join(', ') || 'None'}
New Vendors: ${newVendors.join(', ') || 'None'}
Referenced Patterns: ${relatedPatterns.map(p => p.patternId + ': ' + p.name).join(', ') || 'None'}
Legacy Systems: ${intake.has_legacy_dependencies ? (intake.legacy_systems || 'Yes') : 'None'}
Tech Stack Notes: ${intake.tech_stack_notes || 'None'}

Respond with ONLY a valid JSON object — no markdown, no code fences, no explanation:
{
  "title": "<concise diagram title, e.g. Azure Event Hub OT Telemetry Architecture>",
  "mermaidCode": "<complete valid flowchart TD mermaid code — newlines as \\\\n>",
  "legend": "<1-2 sentences describing what the diagram shows and the main data flow>"
}`;
}

router.post('/diagram/:id', async (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM intake_requests WHERE id=? OR reference_id=?').get(req.params.id, req.params.id);
    if (!row) return res.status(404).json({ error: 'Intake not found' });

    const intake = {
      ...row,
      relatedPatternIds: parseJson(row.related_pattern_ids, []),
      vendorIds: parseJson(row.vendor_ids, []),
      newVendors: parseJson(row.new_vendors, []),
      dataTypes: parseJson(row.data_types, []),
      authMethods: parseJson(row.auth_methods, []),
      components: parseJson(row.components, []),
    };

    const patterns = loadPatterns();
    const vendors = loadVendors();
    const client = new Anthropic();

    const message = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 2048,
      messages: [{ role: 'user', content: buildDiagramPrompt(intake, patterns, vendors) }]
    });

    let text = message.content[0].text.trim();
    if (text.startsWith('```')) text = text.replace(/^```json?\n?/, '').replace(/\n?```$/, '');
    const diagram = JSON.parse(text);
    diagram.generatedAt = new Date().toISOString();
    diagram.model = 'claude-sonnet-4-5';

    db.prepare(`UPDATE intake_requests SET ai_diagram=?, updated_at=datetime('now') WHERE id=?`)
      .run(JSON.stringify(diagram), row.id);

    res.json({ diagram });
  } catch (err) {
    console.error('Diagram generation error:', err);
    res.status(500).json({ error: err.message || 'Diagram generation failed' });
  }
});

router.get('/diagram/:id', (req, res) => {
  const row = db.prepare('SELECT ai_diagram FROM intake_requests WHERE id=? OR reference_id=?').get(req.params.id, req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  const diagram = parseJson(row.ai_diagram, null);
  if (!diagram) return res.status(404).json({ error: 'No diagram generated yet' });
  res.json({ diagram });
});

router.get('/review/:id', (req, res) => {
  const row = db.prepare('SELECT ai_review FROM intake_requests WHERE id=? OR reference_id=?').get(req.params.id, req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  const review = parseJson(row.ai_review, null);
  if (!review) return res.status(404).json({ error: 'No AI review generated yet' });
  res.json({ review });
});

function multerErrorHandler(err, req, res, next) {
  if (err && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'One or more files exceed the 20 MB size limit.' });
  }
  if (err && err.code === 'LIMIT_FILE_COUNT') {
    return res.status(400).json({ error: 'Too many files — maximum 10 files per upload.' });
  }
  if (err && err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({ error: 'Unexpected upload field.' });
  }
  if (err) {
    return res.status(400).json({ error: err.message || 'File upload error.' });
  }
  next();
}

router.post('/parse-documents', (req, res, next) => {
  upload.array('files', 10)(req, res, err => {
    if (err) return multerErrorHandler(err, req, res, next);
    next();
  });
}, async (req, res) => {
  try {
    const files = req.files;
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded.' });
    }

    const textParts = [];
    for (const file of files) {
      const text = await extractTextFromBuffer(file.originalname, file.buffer);
      if (text && text.trim()) {
        textParts.push(`=== FILE: ${file.originalname} ===\n${text.trim()}`);
      }
    }

    if (textParts.length === 0) {
      return res.status(422).json({ error: 'No readable text could be extracted from the uploaded files.' });
    }

    const combinedText = textParts.join('\n\n');
    const client = new Anthropic();

    const message = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 2048,
      messages: [{ role: 'user', content: buildDocumentExtractionPrompt(combinedText) }]
    });

    let text = message.content[0].text.trim();
    if (text.startsWith('```')) text = text.replace(/^```json?\n?/, '').replace(/\n?```$/, '');
    const extracted = JSON.parse(text);

    res.json({ extracted });
  } catch (err) {
    console.error('Document parse error:', err);
    res.status(500).json({ error: err.message || 'Document parsing failed' });
  }
});

module.exports = router;
