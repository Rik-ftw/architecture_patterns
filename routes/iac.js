const express = require('express');
const router = express.Router();
const Anthropic = require('@anthropic-ai/sdk');
const { pool, parseJson } = require('../db');
const { getSystemConfig } = require('../configCache');
const fs = require('fs');
const path = require('path');

function loadPatterns() {
  const dir = path.join(__dirname, '..', 'patterns');
  return fs.readdirSync(dir).filter(f => f.endsWith('.json')).map(f => {
    try { return JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); } catch { return null; }
  }).filter(Boolean);
}

function buildPatternIaCPrompt(pattern, options = {}) {
  const { environment = 'prod', region = 'canadacentral', namingPrefix = 'mccain' } = options;
  const components = pattern.components || [];
  const guardrails = pattern.guardrails || [];
  const securityConsiderations = pattern.securityConsiderations || [];
  const hasAzureDesign = !!pattern.azureDesign;

  let azureDesignSection = '';
  if (hasAzureDesign && pattern.azureDesign.data) {
    azureDesignSection = `\n## DETAILED AZURE SPECIFICATIONS (use these SKUs and configs exactly):\n`;
    const allSpecs = [
      ...(pattern.azureDesign.data || []),
      ...(pattern.azureDesign.compute || [])
    ];
    allSpecs.forEach(s => {
      azureDesignSection += `\n### ${s.service}\n- SKU: ${s.sku}\n- Config: ${s.specs}\n- Monthly Cost: ${s.monthlyCost || 'Est. included'}\n- Justification: ${s.justification || ''}\n`;
    });
    if (pattern.azureDesign.subscriptionModel) {
      azureDesignSection += `\n### Subscription Model\n${pattern.azureDesign.subscriptionModel.slice(0, 1500)}\n`;
    }
  }

  const guardrailsSection = guardrails.length
    ? '\n## GUARDRAILS (must be enforced as Terraform configuration, not just comments):\n' +
      guardrails.map(g => `- [${g.severity}] ${g.area}: ${g.rule}`).join('\n')
    : '';

  const securitySection = securityConsiderations.length
    ? '\n## SECURITY REQUIREMENTS:\n' +
      securityConsiderations.map(s => `- ${s}`).join('\n')
    : '';

  const implementationAssets = pattern.implementationAssets || {};

  return `You are a Senior Cloud Infrastructure Engineer at McCain Foods. Generate production-grade Terraform HCL code for the following Enterprise Architecture pattern.

## PATTERN DETAILS
- Pattern ID: ${pattern.patternId}
- Name: ${pattern.name}
- Domain: ${pattern.domain}
- Level: ${pattern.level || 'Logical'}
- Status: ${pattern.status}
- Strategic Intent: ${pattern.strategicIntent || ''}

## AZURE COMPONENTS (deploy all of these):
${components.map(c => `- ${c}`).join('\n')}
${azureDesignSection}
${guardrailsSection}
${securitySection}

## DEPLOYMENT CONTEXT
- Environment: ${environment}
- Primary Region: ${region}
- Naming Prefix: ${namingPrefix}
- Terraform Module Reference: ${implementationAssets.terraformModule || 'N/A'}

## TERRAFORM REQUIREMENTS
1. Use azurerm provider version ~> 4.0
2. All resources must use variables for: var.environment, var.location, var.resource_group_name, var.naming_prefix
3. Apply standard McCain tags to ALL resources: Environment, Owner, PatternId, BusinessUnit, ManagedBy="Terraform"
4. Every guardrail listed above must be enforced as actual Terraform configuration (not just a comment)
5. Use locals block for computed names following pattern: \${var.naming_prefix}-\${resource_type}-\${var.environment}
6. Use azurerm_resource_group data source (assume RG already exists) — do NOT create the resource group
7. Enable diagnostic settings pointing to Log Analytics for all resources that support it
8. Use managed identity (system-assigned) where supported instead of secrets/keys
9. Include lifecycle blocks with prevent_destroy = true for stateful resources
10. Format naming: all lowercase, hyphens (not underscores), max 24 chars for storage accounts

Generate exactly 5 files. Return ONLY a valid JSON object (no markdown, no backticks, no prose outside the JSON):

{
  "patternId": "${pattern.patternId}",
  "patternName": "${pattern.name}",
  "files": {
    "providers.tf": "<complete providers.tf content>",
    "variables.tf": "<complete variables.tf content>",
    "main.tf": "<complete main.tf content — all Azure resources>",
    "outputs.tf": "<complete outputs.tf content>",
    "README.md": "<markdown README with: overview, resources deployed, estimated monthly cost, usage instructions, guardrails enforced>"
  },
  "resourceCount": <integer — total number of azurerm resources in main.tf>,
  "estimatedMonthlyCost": "<e.g. $1,500-$2,000/mo based on Azure pricing>",
  "guardrailsEnforced": ["<list of guardrail rules enforced>"],
  "model": "claude-sonnet-4-5"
}`;
}

function buildIntakeIaCPrompt(intake, patterns, options = {}) {
  const { environment = 'prod', region = 'canadacentral', namingPrefix = 'mccain' } = options;
  const components = parseJson(intake.components, []);
  const authMethods = parseJson(intake.auth_methods, []);
  const dataTypes = parseJson(intake.data_types, []);
  const relatedPatternIds = parseJson(intake.related_pattern_ids, []);
  const relatedPatterns = patterns.filter(p => relatedPatternIds.includes(p.patternId));
  const newVendors = parseJson(intake.new_vendors, []);

  const patternsSection = relatedPatterns.length
    ? '\n## REFERENCED ARCHITECTURE PATTERNS:\n' +
      relatedPatterns.map(p => {
        let patternInfo = `### ${p.patternId}: ${p.name}\nComponents: ${(p.components || []).join(', ')}`;
        if (p.guardrails) {
          patternInfo += `\nGuardrails: ${p.guardrails.map(g => `[${g.severity}] ${g.rule}`).join('; ')}`;
        }
        return patternInfo;
      }).join('\n\n')
    : '';

  return `You are a Senior Cloud Infrastructure Engineer at McCain Foods. Generate production-grade Terraform HCL for the following approved architecture request.

## ARCHITECTURE REQUEST
- Reference: ${intake.reference_id}
- Title: ${intake.title}
- Architecture Type: ${intake.architecture_type || 'Not specified'}
- Programme Domain: ${intake.programme_domain || 'Not specified'}
- Business Unit: ${intake.business_unit || 'Not specified'}
- Description: ${intake.description || 'Not provided'}
- Strategic Objective: ${intake.strategic_objective || 'Not provided'}

## TECHNOLOGY PROFILE
- Hosting Model: ${intake.hosting_model || 'Public Cloud (Azure)'}
- Deployment Target: ${intake.deployment_target || 'Production'}
- Integration Points: ${intake.integration_points || 0}
- Public Facing: ${intake.is_public_facing ? 'Yes' : 'No'}
- Components Requested: ${components.join(', ') || 'Not specified'}
- Tech Stack Notes: ${intake.tech_stack_notes || 'None'}
- New Vendors/SaaS: ${newVendors.join(', ') || 'None'}

## DATA & SECURITY REQUIREMENTS
- Data Classification: ${intake.data_classification || 'Internal'}
- Data Types: ${dataTypes.join(', ') || 'None specified'}
- Auth Methods: ${authMethods.join(', ') || 'None specified'}
- MFA Required: ${intake.has_mfa ? 'Yes' : 'No'}
- WAF Required: ${intake.has_waf ? 'Yes' : 'No'}
- Monitoring Required: ${intake.has_monitoring ? 'Yes' : 'No'}
- Zero Trust Aligned: ${intake.is_zero_trust_aligned ? 'Yes' : 'No'}
- Encryption at Rest: ${intake.encryption_at_rest ? 'Required' : 'TBD'}
- Encryption in Transit: ${intake.encryption_in_transit ? 'Required (TLS 1.2+)' : 'TBD'}
- Legacy Dependencies: ${intake.has_legacy_dependencies ? (intake.legacy_systems || 'Yes') : 'None'}

## DEPLOYMENT CONTEXT
- Environment: ${environment}
- Primary Region: ${region}
- Naming Prefix: ${namingPrefix}
${patternsSection}

## TERRAFORM REQUIREMENTS
1. Use azurerm provider version ~> 4.0
2. All resources must use variables for: var.environment, var.location, var.resource_group_name, var.naming_prefix
3. Apply standard McCain tags to ALL resources: Environment, Owner, PatternRef="${intake.reference_id}", BusinessUnit="${intake.business_unit || 'N/A'}", ManagedBy="Terraform"
4. If data classification is Confidential or Restricted: enable encryption with customer-managed keys, private endpoints, audit logging
5. If WAF is required: include azurerm_application_gateway or azurerm_frontdoor_firewall_policy resource
6. If MFA/Zero Trust: include azurerm_conditional_access_policy or note Entra ID configuration
7. Use managed identity (system-assigned) for all service-to-service auth
8. Include azurerm_monitor_diagnostic_setting for all applicable resources
9. Use lifecycle blocks with prevent_destroy = true for critical stateful resources
10. Generate a tfvars.example file showing sample values for this specific request

Generate exactly 6 files. Return ONLY a valid JSON object (no markdown, no backticks, no prose outside JSON):

{
  "referenceId": "${intake.reference_id}",
  "title": "${intake.title}",
  "files": {
    "providers.tf": "<complete providers.tf>",
    "variables.tf": "<complete variables.tf>",
    "main.tf": "<complete main.tf with all Azure resources for this request>",
    "outputs.tf": "<complete outputs.tf>",
    "terraform.tfvars.example": "<example tfvars with real values for this request>",
    "README.md": "<markdown README: what this deploys, resources, cost estimate, guardrails, usage>"
  },
  "resourceCount": <integer>,
  "estimatedMonthlyCost": "<cost estimate string>",
  "model": "claude-sonnet-4-5"
}`;
}

function buildSolutionIaCPrompt(solution, patterns, options = {}) {
  const { environment = 'prod', region = 'canadacentral', namingPrefix = 'mccain' } = options;
  const patternIds = parseJson(solution.pattern_ids, []);
  const solutionPatterns = patterns.filter(p => patternIds.includes(p.patternId));
  const deploymentRegions = parseJson(solution.deployment_regions, []);

  const patternsSection = solutionPatterns.map(p => {
    let info = `### Module: ${p.patternId} — ${p.name}\nAzure Services: ${(p.components || []).slice(0, 8).join(', ')}`;
    if (p.guardrails && p.guardrails.length) {
      info += `\nKey Guardrails: ${p.guardrails.filter(g => g.severity === 'Required').map(g => g.rule).join('; ')}`;
    }
    return info;
  }).join('\n\n');

  return `You are a Senior Cloud Infrastructure Engineer at McCain Foods. Generate a complete multi-module Terraform root configuration for the following Solution Design that composes multiple architecture patterns.

## SOLUTION DESIGN
- Reference: ${solution.reference_id}
- Title: ${solution.title}
- Description: ${solution.description || 'Not provided'}
- Business Context: ${solution.business_context || 'Not provided'}
- Owner: ${solution.owner || 'Not specified'}
- Business Unit: ${solution.business_unit || 'Not specified'}
- Complexity: ${solution.complexity || 'Not specified'}
- Estimated Cost Band: ${solution.estimated_cost_band || 'Not specified'}
- Deployment Regions: ${deploymentRegions.join(', ') || region}
- Intake Reference: ${solution.intake_reference || 'N/A'}

## COMPOSED PATTERNS (${solutionPatterns.length} patterns to deploy together):
${patternsSection}

## DEPLOYMENT CONTEXT
- Environment: ${environment}
- Primary Region: ${region}
- Naming Prefix: ${namingPrefix}

## TERRAFORM REQUIREMENTS
1. Create a ROOT module in main.tf that calls child modules using module blocks
2. Each pattern becomes a module block: module "ap_001_api_gateway" { source = "./modules/ap-001" ... }
3. Also generate module stubs in the files object: include "modules/{patternId}/main.tf" for each pattern with actual resource definitions
4. Use azurerm provider version ~> 4.0 in providers.tf
5. All variables use: var.environment, var.location, var.resource_group_name, var.naming_prefix
6. Apply McCain tags: Environment, Owner, SolutionRef="${solution.reference_id}", BusinessUnit="${solution.business_unit || 'N/A'}", ManagedBy="Terraform"
7. Wire module outputs to other module inputs where there are dependencies (e.g., Key Vault ID from security module passed to app module)
8. Include azurerm_monitor_diagnostic_setting resources via a shared monitoring module
9. Include a tfvars.example with realistic values for this solution

Return ONLY a valid JSON object (no markdown, no backticks, no prose outside JSON):

{
  "referenceId": "${solution.reference_id}",
  "title": "${solution.title}",
  "files": {
    "providers.tf": "<complete providers.tf>",
    "variables.tf": "<root variables.tf>",
    "main.tf": "<root main.tf calling all modules>",
    "outputs.tf": "<root outputs.tf aggregating key module outputs>",
    "terraform.tfvars.example": "<example tfvars>",
    "README.md": "<solution README: architecture overview, modules, cost estimate, deployment steps>"
  },
  "moduleFiles": {
    ${solutionPatterns.map(p => `"modules/${p.patternId.toLowerCase()}/main.tf": "<Terraform resources for ${p.name}>"`).join(',\n    ')}
  },
  "resourceCount": <total resources across all modules>,
  "estimatedMonthlyCost": "<aggregate cost estimate>",
  "model": "claude-sonnet-4-5"
}`;
}

async function callClaude(prompt) {
  const config = await getSystemConfig().catch(() => ({}));
  const client = new Anthropic();
  const model = config.ai_model_review || 'claude-sonnet-4-5';

  const message = await client.messages.create({
    model,
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }]
  });

  let text = message.content[0].text.trim();
  if (text.startsWith('```')) text = text.replace(/^```json?\n?/, '').replace(/\n?```$/, '');
  return { result: JSON.parse(text), model };
}

router.post('/pattern/:patternId', async (req, res) => {
  try {
    const patterns = loadPatterns();
    const pattern = patterns.find(p => p.patternId === req.params.patternId);
    if (!pattern) return res.status(404).json({ error: 'Pattern not found' });

    const options = req.body || {};
    const prompt = buildPatternIaCPrompt(pattern, options);
    const { result, model } = await callClaude(prompt);
    result.generatedAt = new Date().toISOString();
    result.model = model;

    res.json({ iac: result });
  } catch (err) {
    console.error('IaC pattern generation error:', err);
    res.status(500).json({ error: err.message || 'IaC generation failed' });
  }
});

router.post('/intake/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM intake_requests WHERE id=$1 OR reference_id=$1',
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Intake not found' });
    const row = result.rows[0];
    const patterns = loadPatterns();
    const options = req.body || {};

    const prompt = buildIntakeIaCPrompt(row, patterns, options);
    const { result: iacResult, model } = await callClaude(prompt);
    iacResult.generatedAt = new Date().toISOString();
    iacResult.model = model;

    await pool.query(
      'UPDATE intake_requests SET iac_code=$1, updated_at=NOW() WHERE id=$2',
      [JSON.stringify(iacResult), row.id]
    );

    res.json({ iac: iacResult });
  } catch (err) {
    console.error('IaC intake generation error:', err);
    res.status(500).json({ error: err.message || 'IaC generation failed' });
  }
});

router.get('/intake/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT iac_code FROM intake_requests WHERE id=$1 OR reference_id=$1',
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Intake not found' });
    const iac = parseJson(result.rows[0].iac_code, null);
    res.json({ iac });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/solution/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM solution_designs WHERE id=$1 OR reference_id=$1',
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Solution not found' });
    const row = result.rows[0];
    const patterns = loadPatterns();
    const options = req.body || {};

    const prompt = buildSolutionIaCPrompt(row, patterns, options);
    const { result: iacResult, model } = await callClaude(prompt);
    iacResult.generatedAt = new Date().toISOString();
    iacResult.model = model;

    await pool.query(
      'UPDATE solution_designs SET iac_code=$1, updated_at=NOW() WHERE id=$2',
      [JSON.stringify(iacResult), row.id]
    );

    res.json({ iac: iacResult });
  } catch (err) {
    console.error('IaC solution generation error:', err);
    res.status(500).json({ error: err.message || 'IaC generation failed' });
  }
});

router.get('/solution/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT iac_code FROM solution_designs WHERE id=$1 OR reference_id=$1',
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Solution not found' });
    const iac = parseJson(result.rows[0].iac_code, null);
    res.json({ iac });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
