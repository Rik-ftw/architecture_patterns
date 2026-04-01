const fs = require('fs');
const path = require('path');

function loadVendors() {
  try {
    return JSON.parse(fs.readFileSync(path.join(__dirname, 'vendors', 'registry.json'), 'utf8'));
  } catch { return []; }
}

function loadPatterns() {
  try {
    const dir = path.join(__dirname, 'patterns');
    return fs.readdirSync(dir).filter(f => f.endsWith('.json')).map(f => {
      try { return JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); } catch { return null; }
    }).filter(Boolean);
  } catch { return []; }
}

function scoreDataRisk(intake) {
  let score = 0;
  const flags = [];
  const recs = [];

  const classScores = { Public: 0, Internal: 4, Confidential: 14, Restricted: 22 };
  const classScore = classScores[intake.dataClassification] || 4;
  score += classScore;

  const sensitiveTypes = ['PII', 'PHI', 'Financial', 'OT/SCADA Data', 'Credentials/Secrets'];
  const dataTypes = intake.dataTypes || [];
  const sensitiveCount = dataTypes.filter(t => sensitiveTypes.includes(t)).length;
  if (sensitiveCount > 0) {
    const add = Math.min(sensitiveCount * 4, 12);
    score += add;
    flags.push(`Sensitive data types in scope: ${dataTypes.filter(t => sensitiveTypes.includes(t)).join(', ')}`);
  }

  if (intake.externalDataSharing) {
    score += 8;
    flags.push('External data sharing enabled');
    recs.push('Implement a Data Sharing Agreement (DSA) and apply field-level encryption for shared data sets');
  }

  if (!intake.encryptionAtRest && intake.dataClassification !== 'Public') {
    score += 5;
    flags.push('Encryption at rest not confirmed');
    recs.push('Enable encryption at rest (Azure Storage Service Encryption / Key Vault managed keys)');
  }

  if (!intake.encryptionInTransit) {
    score += 4;
    flags.push('Encryption in transit not confirmed');
    recs.push('Enforce TLS 1.2+ for all data in transit; disable deprecated cipher suites');
  }

  return { score: Math.min(score, 25), flags, recs, label: 'Data Risk' };
}

function scoreVendorRisk(intake, enrichment) {
  let score = 0;
  const flags = [];
  const recs = [];
  const allVendors = loadVendors();

  const newVendors = intake.newVendors || [];
  if (newVendors.length > 0) {
    score += Math.min(newVendors.length * 12, 20);
    flags.push(`${newVendors.length} unvetted vendor(s) proposed: ${newVendors.join(', ')}`);
    recs.push('Complete vendor security assessment for new vendors prior to approval. Engage Procurement and InfoSec.');
  }

  const vendorIds = (intake.vendorIds || []).map(Number);
  const selectedVendors = allVendors.filter(v => vendorIds.includes(v.id));

  const criticalVendors = selectedVendors.filter(v => v.criticality === 'Critical');
  const highVendors = selectedVendors.filter(v => v.criticality === 'High');

  if (criticalVendors.length > 0) {
    score += Math.min(criticalVendors.length * 6, 12);
    flags.push(`${criticalVendors.length} critical-tier vendor(s) in scope: ${criticalVendors.map(v => v.vendorCompany).join(', ')}`);
    recs.push('Confirm Business Continuity and Disaster Recovery (BCDR) plans for all Critical-tier vendors');
  }

  if (highVendors.length > 0) {
    score += Math.min(highVendors.length * 2, 6);
  }

  const saasVendors = selectedVendors.filter(v => v.hostingModel && v.hostingModel.toLowerCase().includes('saas'));
  if (saasVendors.length > 0) {
    score += Math.min(saasVendors.length * 2, 4);
    flags.push(`${saasVendors.length} SaaS vendor(s) involved — shared responsibility model applies`);
    recs.push('Review shared responsibility boundaries with SaaS vendors and ensure contractual security obligations');
  }

  if (selectedVendors.length + newVendors.length > 5) {
    score += 3;
    flags.push('High vendor count increases supply chain complexity');
    recs.push('Evaluate vendor consolidation opportunities to reduce supply chain attack surface');
  }

  // Enrichment: check for missing certifications and failed SSL grades
  if (enrichment && enrichment.vendorSignals) {
    const { missingCerts, failedSsl } = enrichment.vendorSignals;
    if (missingCerts && missingCerts > 0) {
      const add = Math.min(missingCerts * 2, 6);
      score += add;
      flags.push(`${missingCerts} vendor(s) missing key security certifications (SOC2/ISO27001)`);
      recs.push('Obtain and verify security certification documentation for all critical and high-tier vendors');
    }
    if (failedSsl && failedSsl > 0) {
      const add = Math.min(failedSsl * 3, 6);
      score += add;
      flags.push(`${failedSsl} vendor domain(s) with poor SSL/TLS grade`);
      recs.push('Engage affected vendors to remediate SSL/TLS configuration to achieve A grade or higher');
    }
  }

  return { score: Math.min(score, 25), flags, recs, label: 'Vendor Risk' };
}

function scoreSecurityRisk(intake, enrichment) {
  let score = 0;
  const flags = [];
  const recs = [];

  const authMethods = intake.authMethods || [];
  if (authMethods.length === 0 || authMethods.includes('None')) {
    score += 15;
    flags.push('No authentication method specified');
    recs.push('Define an authentication strategy aligned with the APIM pattern (OAuth2/OIDC preferred)');
  } else if (!authMethods.includes('OAuth2/OIDC') && !authMethods.includes('SAML')) {
    score += 6;
    flags.push('Non-standard authentication method — verify compliance with Zero Trust policy');
    recs.push('Evaluate migration to OAuth2/OIDC to align with enterprise Zero Trust architecture (SC-001)');
  }

  if (!intake.hasMfa && intake.dataClassification !== 'Public') {
    score += 6;
    flags.push('Multi-factor authentication not confirmed');
    recs.push('Enforce MFA via Entra ID Conditional Access policies for all user-facing access');
  }

  if (intake.isPublicFacing && !intake.hasWaf) {
    score += 8;
    flags.push('Public-facing endpoint without WAF protection');
    recs.push('Deploy Azure Front Door with WAF (OWASP Top 10 ruleset) for all public-facing endpoints');
  }

  if (!intake.isZeroTrustAligned) {
    score += 5;
    flags.push('Solution does not declare Zero Trust alignment');
    recs.push('Review Zero Trust Network Access pattern (SC-001) and apply applicable guardrails');
  }

  if (!intake.hasMonitoring) {
    score += 5;
    flags.push('Monitoring and observability not confirmed');
    recs.push('Integrate with Azure Monitor / Microsoft Sentinel for real-time threat detection and alerting');
  }

  const complianceRequirements = intake.complianceRequirements || [];
  if (complianceRequirements.includes('IEC 62443') || complianceRequirements.includes('OT/SCADA')) {
    score += 4;
    flags.push('OT/ICS regulatory scope — IEC 62443 controls required');
    recs.push('Engage OT Security team; apply IEC 62443 zone and conduit model before architecture approval');
  }

  if (intake.isPublicFacing && intake.dataClassification === 'Restricted') {
    score += 6;
    flags.push('Restricted data classification on public-facing surface — high exposure risk');
    recs.push('Re-evaluate public exposure; apply strict data minimisation and consider private endpoint patterns');
  }

  // Enrichment: SCA critical CVE count adds to Security Risk
  if (enrichment && enrichment.scaSignals) {
    const { criticalCount, highCount } = enrichment.scaSignals;
    if (criticalCount && criticalCount > 0) {
      const add = Math.min(criticalCount * 4, 10);
      score += add;
      flags.push(`SCA: ${criticalCount} technology component(s) with known Critical CVEs`);
      recs.push('Review and patch or mitigate Critical CVEs identified in the technology stack via the Technology Profile tab');
    }
    if (highCount && highCount >= 3) {
      score += 3;
      flags.push(`SCA: ${highCount} technology component(s) with known High CVEs`);
      recs.push('Establish a patch management schedule for High CVE components in the technology stack');
    }
  }

  return { score: Math.min(score, 25), flags, recs, label: 'Security Risk' };
}

function scoreComplexityRisk(intake) {
  let score = 0;
  const flags = [];
  const recs = [];
  const patterns = loadPatterns();

  const relatedIds = intake.relatedPatternIds || [];
  const relatedPatterns = patterns.filter(p => relatedIds.includes(p.patternId));
  const endorsedPatterns = relatedPatterns.filter(p => p.status === 'Endorsed');
  const devPatterns = relatedPatterns.filter(p => p.status === 'In Development');

  if (relatedIds.length === 0) {
    score += 10;
    flags.push('No existing architecture patterns referenced — potential new pattern required');
    recs.push('Identify the closest existing endorsed pattern and document deviations; initiate a new pattern proposal if needed');
  } else {
    if (endorsedPatterns.length > 0) {
      score -= Math.min(endorsedPatterns.length * 3, 8);
    }
    if (devPatterns.length > 0) {
      score += devPatterns.length * 3;
      flags.push(`References ${devPatterns.length} In-Development pattern(s) — maturity risk`);
      recs.push('Avoid dependency on In-Development patterns in production workloads until Endorsed');
    }
  }

  const intPoints = intake.integrationPoints || 0;
  if (intPoints > 8) {
    score += 10;
    flags.push(`Very high integration complexity: ${intPoints} integration points`);
    recs.push('Apply Saga or Distributed Transaction pattern (AP-005) to manage consistency across integrations');
  } else if (intPoints > 4) {
    score += 5;
    flags.push(`Elevated integration complexity: ${intPoints} integration points`);
  }

  if (intake.hasLegacyDependencies) {
    score += 8;
    flags.push('Legacy system dependencies introduce integration and security risk');
    recs.push('Apply Adapter/Façade pattern (AP-007) to isolate legacy systems; plan migration roadmap');
  }

  if (intake.deviatesFromPatterns) {
    score += 7;
    flags.push('Solution deviates from established patterns — exception review required');
    recs.push('Document deviation rationale clearly; obtain Architecture Board sign-off before implementation');
  }

  const timeline = intake.projectTimeline || '';
  if (timeline === 'Immediate (< 4 weeks)') {
    score += 4;
    flags.push('Aggressive delivery timeline may compress architecture review quality');
    recs.push('Ensure architecture sign-off gates are not bypassed due to schedule pressure');
  }

  return { score: Math.min(Math.max(score, 0), 25), flags, recs, label: 'Complexity & Maturity Risk' };
}

function getTier(total) {
  if (total <= 25) return { tier: 'Low', color: '#2ecc71', description: 'Acceptable risk profile. Standard review process applies.' };
  if (total <= 50) return { tier: 'Medium', color: '#f39c12', description: 'Elevated risk — remediation actions recommended before approval.' };
  if (total <= 75) return { tier: 'High', color: '#e67e22', description: 'Significant risk exposure — Architecture Board review required.' };
  return { tier: 'Critical', color: '#e74c3c', description: 'Critical risk — CISO and Architecture Board joint review mandatory before any implementation.' };
}

function assessRisk(intake, enrichment) {
  const data = scoreDataRisk(intake);
  const vendor = scoreVendorRisk(intake, enrichment);
  const security = scoreSecurityRisk(intake, enrichment);
  const complexity = scoreComplexityRisk(intake);

  const total = data.score + vendor.score + security.score + complexity.score;
  const { tier, color, description } = getTier(total);

  const allFlags = [...data.flags, ...vendor.flags, ...security.flags, ...complexity.flags];
  const allRecs = [...new Set([...data.recs, ...vendor.recs, ...security.recs, ...complexity.recs])];

  return {
    score: total,
    tier,
    color,
    tierDescription: description,
    breakdown: {
      dataRisk: { score: data.score, max: 25, label: data.label },
      vendorRisk: { score: vendor.score, max: 25, label: vendor.label },
      securityRisk: { score: security.score, max: 25, label: security.label },
      complexityRisk: { score: complexity.score, max: 25, label: complexity.label }
    },
    flags: allFlags,
    recommendations: allRecs
  };
}

module.exports = { assessRisk };
