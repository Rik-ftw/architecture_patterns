const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { pool, parseJson, generateRefId } = require('../db');
const { assessRisk } = require('../riskEngine');
const { buildScaSignalsAsync, getSslCacheForDomain } = require('./riskEnrichment');

async function buildEnrichmentSignals(intake) {
  try {
    const vendors = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'vendors', 'registry.json'), 'utf8'));
    const vendorIds = (intake.vendorIds || intake.vendor_ids || []).map(Number);
    const selectedVendors = vendors.filter(v => vendorIds.includes(v.id));
    const today = new Date();
    const criticalCerts = ['SOC2 Type II', 'ISO 27001'];

    let missingCerts = 0;
    let failedSsl = 0;

    selectedVendors.forEach(v => {
      if (v.criticality === 'Critical' || v.criticality === 'High') {
        const certs = v.certifications || [];
        const hasCritCerts = criticalCerts.every(cn =>
          certs.some(c => {
            if (c.name !== cn) return false;
            if (!c.validUntil) return false;
            return new Date(c.validUntil) >= today;
          })
        );
        if (!hasCritCerts) missingCerts++;
      }
      if (v.domain) {
        const sslData = getSslCacheForDomain(v.domain.toLowerCase());
        if (sslData && sslData.grade && !['A+', 'A', 'Unknown'].includes(sslData.grade)) {
          failedSsl++;
        }
      }
    });

    const scaSignals = await buildScaSignalsAsync(intake);

    let mitreSignals = { totalTechniques: 0, riskLevel: 'Low', available: false };
    try {
      const mitreMapping = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'mitreMapping.json'), 'utf8'));
      const compReqs = intake.complianceRequirements || intake.compliance_requirements || [];
      const archType = (intake.architectureType || intake.architecture_type || '').toLowerCase();
      const components = intake.components || [];
      const isOtScada = compReqs.some(r => r.includes('IEC 62443') || r.includes('OT')) ||
        archType.includes('ot') || archType.includes('ics') || archType.includes('scada') ||
        components.some(c => ['SCADA', 'PLC', 'HMI', 'DCS', 'OPC-UA', 'Historian'].some(ot => c.toLowerCase().includes(ot.toLowerCase())));
      const hm = (intake.hostingModel || intake.hosting_model || '').toLowerCase();
      const isCloud = hm.includes('cloud') || hm.includes('saas') || hm.includes('paas') || hm.includes('azure') || hm.includes('aws');
      const intPoints = intake.integrationPoints || intake.integration_points || 0;
      const dataTypes = intake.dataTypes || intake.data_types || [];
      const dataClass = intake.dataClassification || intake.data_classification || 'Internal';
      const vendorCount = ((intake.vendorIds || intake.vendor_ids || []).length + (intake.newVendors || intake.new_vendors || []).length);
      const ctx = {
        isPublicFacing: !!(intake.isPublicFacing || intake.is_public_facing),
        hasLegacyDependencies: !!(intake.hasLegacyDependencies || intake.has_legacy_dependencies),
        hasMfa_false: !(intake.hasMfa || intake.has_mfa),
        hasWaf_false: !(intake.hasWaf || intake.has_waf),
        hasMonitoring_false: !(intake.hasMonitoring || intake.has_monitoring),
        isZeroTrustAligned_false: !(intake.isZeroTrustAligned || intake.is_zero_trust_aligned),
        encryptionAtRest_false: !(intake.encryptionAtRest || intake.encryption_at_rest),
        externalDataSharing: !!(intake.externalDataSharing || intake.external_data_sharing),
        hostingModel_cloud: isCloud,
        integrationPoints_high: intPoints > 4,
        vendorCount_high: vendorCount > 3,
        dataTypes_pii: dataTypes.some(t => t.includes('PII') || t.includes('PHI')),
        dataTypes_credentials: dataTypes.includes('Credentials/Secrets'),
        dataTypes_ot: dataTypes.includes('OT/SCADA Data'),
        dataClassification_sensitive: ['Confidential', 'Restricted'].includes(dataClass),
        otScada: isOtScada
      };
      const tacticsList = [...(mitreMapping.tactics || [])];
      if (isOtScada) (mitreMapping.ics_tactics || []).forEach(t => tacticsList.push(t));
      let totalTechniques = 0;
      tacticsList.forEach(tactic => {
        (tactic.techniques || []).forEach(tech => {
          if (tech.conditions && tech.conditions.every(c => !!ctx[c])) totalTechniques++;
        });
      });
      let riskLevel = 'Low';
      if (totalTechniques >= 12) riskLevel = 'Critical';
      else if (totalTechniques >= 7) riskLevel = 'High';
      else if (totalTechniques >= 3) riskLevel = 'Medium';
      mitreSignals = { totalTechniques, riskLevel, available: true };
    } catch (mitreErr) {
      console.error('[buildEnrichmentSignals] MITRE error:', mitreErr.message || mitreErr);
    }

    return {
      vendorSignals: { missingCerts, failedSsl },
      scaSignals,
      mitreSignals
    };
  } catch (err) {
    console.error('[buildEnrichmentSignals] error:', err.message || err);
    return null;
  }
}

function serializeIntake(row) {
  if (!row) return null;
  return {
    ...row,
    components: parseJson(row.components, []),
    vendorIds: parseJson(row.vendor_ids, []),
    newVendors: parseJson(row.new_vendors, []),
    dataTypes: parseJson(row.data_types, []),
    authMethods: parseJson(row.auth_methods, []),
    complianceRequirements: parseJson(row.compliance_requirements, []),
    relatedPatternIds: parseJson(row.related_pattern_ids, []),
    riskBreakdown: parseJson(row.risk_breakdown, {}),
    riskFlags: parseJson(row.risk_flags, []),
    riskRecommendations: parseJson(row.risk_recommendations, []),
    aiReview: parseJson(row.ai_review, null),
    aiDiagram: parseJson(row.ai_diagram, null),
    iacCode: parseJson(row.iac_code, null),
    triageResult: parseJson(row.triage_result, null),
    triageStatus: row.triage_status || null,
    triageRoutingLane: row.triage_routing_lane || null,
    triageCompositeScore: row.triage_composite_score || null,
    triageRiskTier: row.triage_risk_tier || null,
    triageStartedAt: row.triage_started_at || null,
    triageCompletedAt: row.triage_completed_at || null,
    is_public_facing: row.is_public_facing === 1 || row.is_public_facing === true,
    external_data_sharing: row.external_data_sharing === 1 || row.external_data_sharing === true,
    encryption_at_rest: row.encryption_at_rest === 1 || row.encryption_at_rest === true,
    encryption_in_transit: row.encryption_in_transit === 1 || row.encryption_in_transit === true,
    has_mfa: row.has_mfa === 1 || row.has_mfa === true,
    has_waf: row.has_waf === 1 || row.has_waf === true,
    has_monitoring: row.has_monitoring === 1 || row.has_monitoring === true,
    is_zero_trust_aligned: row.is_zero_trust_aligned === 1 || row.is_zero_trust_aligned === true,
    has_legacy_dependencies: row.has_legacy_dependencies === 1 || row.has_legacy_dependencies === true,
    deviates_from_patterns: row.deviates_from_patterns === 1 || row.deviates_from_patterns === true,
  };
}

router.get('/', async (req, res) => {
  try {
    const { status, search } = req.query;
    let query = 'SELECT * FROM intake_requests';
    const params = [];
    const conditions = [];
    if (status) { conditions.push(`status = $${params.length + 1}`); params.push(status); }
    if (search) {
      const s = `%${search}%`;
      conditions.push(`(title ILIKE $${params.length + 1} OR reference_id ILIKE $${params.length + 2} OR requestor_name ILIKE $${params.length + 3} OR business_unit ILIKE $${params.length + 4})`);
      params.push(s, s, s, s);
    }
    if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY created_at DESC';
    const result = await pool.query(query, params);
    res.json(result.rows.map(serializeIntake));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const [total, byStatus, byTier, recent] = await Promise.all([
      pool.query('SELECT COUNT(*) as n FROM intake_requests'),
      pool.query('SELECT status, COUNT(*) as n FROM intake_requests GROUP BY status'),
      pool.query(`SELECT risk_tier, COUNT(*) as n FROM intake_requests WHERE risk_tier IS NOT NULL GROUP BY risk_tier`),
      pool.query(`SELECT id, reference_id, title, status, risk_tier, risk_score, created_at FROM intake_requests ORDER BY created_at DESC LIMIT 5`)
    ]);
    res.json({
      total: parseInt(total.rows[0].n),
      byStatus: byStatus.rows,
      byTier: byTier.rows,
      recent: recent.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/risk-dashboard', async (req, res) => {
  try {
    const allRows = await pool.query(
      `SELECT reference_id, title, status, risk_tier, risk_score, risk_breakdown, risk_flags, programme_domain, created_at, hosting_model, architecture_type, components, tech_stack_notes FROM intake_requests WHERE status NOT IN ('Draft','Withdrawn') ORDER BY created_at ASC`
    );
    const rows = allRows.rows;

    const pillarTotals = { dataRisk: 0, vendorRisk: 0, securityRisk: 0, complexityRisk: 0 };
    const pillarCounts = { dataRisk: 0, vendorRisk: 0, securityRisk: 0, complexityRisk: 0 };
    const flagFreq = {};
    const domainRisk = {};
    const DOMAINS = ['Application & Integration', 'Data & Analytics', 'Security & Compliance', 'Infrastructure & Cloud', 'OT/ICS'];

    DOMAINS.forEach(d => { domainRisk[d] = { high: 0, critical: 0 }; });

    rows.forEach(row => {
      const breakdown = parseJson(row.risk_breakdown, {});
      ['dataRisk', 'vendorRisk', 'securityRisk', 'complexityRisk'].forEach(k => {
        if (breakdown[k] && typeof breakdown[k].score === 'number') {
          pillarTotals[k] += breakdown[k].score;
          pillarCounts[k]++;
        }
      });

      const flags = parseJson(row.risk_flags, []);
      flags.forEach(f => {
        if (typeof f === 'string') { flagFreq[f] = (flagFreq[f] || 0) + 1; }
      });

      const tier = row.risk_tier;
      if (tier === 'High' || tier === 'Critical') {
        const pd = (row.programme_domain || '').toLowerCase();
        let domainKey = null;
        if (pd.includes('ot') || pd.includes('ics') || pd.includes('scada') || pd.includes('operational')) domainKey = 'OT/ICS';
        else if (pd.includes('security') || pd.includes('compliance') || pd.includes('iam')) domainKey = 'Security & Compliance';
        else if (pd.includes('data') || pd.includes('analytics') || pd.includes('log') || pd.includes('lake')) domainKey = 'Data & Analytics';
        else if (pd.includes('infra') || pd.includes('cloud') || pd.includes('network') || pd.includes('storage')) domainKey = 'Infrastructure & Cloud';
        else domainKey = 'Application & Integration';
        if (domainRisk[domainKey]) {
          if (tier === 'Critical') domainRisk[domainKey].critical++;
          else domainRisk[domainKey].high++;
        }
      }
    });

    const pillarAverages = {
      'Data Risk': pillarCounts.dataRisk ? Math.round(pillarTotals.dataRisk / pillarCounts.dataRisk * 10) / 10 : 0,
      'Vendor Risk': pillarCounts.vendorRisk ? Math.round(pillarTotals.vendorRisk / pillarCounts.vendorRisk * 10) / 10 : 0,
      'Security Risk': pillarCounts.securityRisk ? Math.round(pillarTotals.securityRisk / pillarCounts.securityRisk * 10) / 10 : 0,
      'Complexity Risk': pillarCounts.complexityRisk ? Math.round(pillarTotals.complexityRisk / pillarCounts.complexityRisk * 10) / 10 : 0,
    };

    const topRisky = rows
      .filter(r => r.risk_score != null)
      .sort((a, b) => parseFloat(b.risk_score) - parseFloat(a.risk_score))
      .slice(0, 5)
      .map(r => {
        const breakdown = parseJson(r.risk_breakdown, {});
        let primaryPillar = 'N/A';
        let primaryScore = -1;
        const pillarMap = { dataRisk: 'Data Risk', vendorRisk: 'Vendor Risk', securityRisk: 'Security Risk', complexityRisk: 'Complexity Risk' };
        Object.entries(pillarMap).forEach(([k, label]) => {
          if (breakdown[k] && breakdown[k].score > primaryScore) {
            primaryScore = breakdown[k].score;
            primaryPillar = label;
          }
        });
        return { referenceId: r.reference_id, title: r.title, tier: r.risk_tier, score: parseFloat(r.risk_score) || 0, primaryPillar };
      });

    const topFlags = Object.entries(flagFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([flag, count]) => ({ flag, count }));

    const now = Date.now();
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    const thisWeekRows = rows.filter(r => new Date(r.created_at).getTime() >= now - weekMs);
    const lastWeekRows = rows.filter(r => {
      const t = new Date(r.created_at).getTime();
      return t >= now - 2 * weekMs && t < now - weekMs;
    });
    const avgScore = arr => arr.length ? arr.reduce((s, r) => s + (parseFloat(r.risk_score) || 0), 0) / arr.length : null;
    const thisAvg = avgScore(thisWeekRows);
    const lastAvg = avgScore(lastWeekRows);
    let trend = 'stable';
    if (thisAvg !== null && lastAvg !== null) {
      if (thisAvg > lastAvg + 2) trend = 'degrading';
      else if (thisAvg < lastAvg - 2) trend = 'improving';
    } else if (thisAvg !== null && lastAvg === null) {
      trend = 'stable';
    }
    const overallAvg = rows.length ? Math.round(rows.reduce((s, r) => s + (parseFloat(r.risk_score) || 0), 0) / rows.length * 10) / 10 : 0;

    const supplyChain = computeSupplyChainSignals(rows);

    res.json({
      pillarAverages,
      topRisky,
      domainRisk,
      topFlags,
      trend: { direction: trend, thisWeekAvg: thisAvg !== null ? Math.round(thisAvg * 10) / 10 : null, lastWeekAvg: lastAvg !== null ? Math.round(lastAvg * 10) / 10 : null, overallAvg },
      supplyChain,
      submissionCount: rows.length
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

function extractTechKeywordsFromRow(row) {
  const techs = new Set();
  const hm = (row.hosting_model || '').toLowerCase();
  if (hm.includes('azure')) techs.add('microsoft azure');
  if (hm.includes('aws')) techs.add('aws');
  const at = (row.architecture_type || '').toLowerCase();
  if (at.includes('ot')) { techs.add('scada'); techs.add('modbus'); techs.add('opc-ua'); }
  if (at.includes('api')) techs.add('api gateway');
  const components = parseJson(row.components, []);
  components.forEach(c => { if (c && c.trim()) techs.add(c.trim().toLowerCase()); });
  const notes = (row.tech_stack_notes || '').toLowerCase();
  ['node.js','python','java','azure','kubernetes','docker','terraform','nginx','redis','postgresql','mongodb'].forEach(t => {
    if (notes.includes(t)) techs.add(t);
  });
  return [...techs];
}

function computeSupplyChainSignals(submissionRows) {
  const cacheStatus = { vendors: false, ssl: false, radar: false, nvd: false, mitre: false };

  let vendors = [];
  try { vendors = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'vendors', 'registry.json'), 'utf8')); cacheStatus.vendors = true; } catch {}

  let sslCache = {};
  try { sslCache = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'sslCache.json'), 'utf8')); if (Object.keys(sslCache).length > 0) cacheStatus.ssl = true; } catch {}

  let radarCache = {};
  try { radarCache = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'radarCache.json'), 'utf8')); if (Object.keys(radarCache).length > 0) cacheStatus.radar = true; } catch {}

  let nvdCache = {};
  try { nvdCache = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'nvdCache.json'), 'utf8')); if (Object.keys(nvdCache).length > 0) cacheStatus.nvd = true; } catch {}

  let mitreMapping = { tactics: [], ics_tactics: [] };
  try { mitreMapping = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'mitreMapping.json'), 'utf8')); cacheStatus.mitre = true; } catch {}

  const today = new Date();
  const criticalCerts = ['SOC2 Type II', 'ISO 27001'];
  let certGapCount = 0;
  let lowSslCount = 0;
  let radarFlaggedCount = 0;
  const seenDomains = new Set();

  vendors.forEach(v => {
    if (v.criticality === 'Critical' || v.criticality === 'High') {
      const certs = v.certifications || [];
      const hasCritCerts = criticalCerts.every(cn =>
        certs.some(c => c.name === cn && c.validUntil && new Date(c.validUntil) >= today)
      );
      if (!hasCritCerts) certGapCount++;
    }

    if (v.domain) {
      const domain = v.domain.toLowerCase();
      if (!seenDomains.has(domain)) {
        seenDomains.add(domain);

        const sslEntry = sslCache[domain] || (v.sslCache || null);
        if (sslEntry && sslEntry.grade) {
          const grade = sslEntry.grade;
          if (!['A+', 'A', 'B', 'Unknown'].includes(grade)) {
            lowSslCount++;
          }
        }

        const radarEntry = radarCache[domain];
        if (radarEntry && radarEntry.data && radarEntry.data.threat) {
          const t = radarEntry.data.threat;
          if (t.malicious || t.phishing || t.botnet) radarFlaggedCount++;
        }
      }
    }
  });

  let totalCriticalHighCves = 0;
  if (submissionRows && submissionRows.length > 0) {
    const allTechKeys = new Set();
    submissionRows.forEach(row => {
      extractTechKeywordsFromRow(row).forEach(k => allTechKeys.add(k));
    });
    allTechKeys.forEach(key => {
      const entry = nvdCache[key];
      if (entry && entry.data) {
        if (entry.data.severity === 'Critical' || entry.data.severity === 'High') {
          totalCriticalHighCves += entry.data.cveCount || 0;
        }
      }
    });
  }

  let t1195Count = 0;
  const allTactics = [...(mitreMapping.tactics || []), ...(mitreMapping.ics_tactics || [])];
  allTactics.forEach(tactic => {
    (tactic.techniques || []).forEach(tech => {
      if (tech.id === 'T1195' || (tech.id && tech.id.startsWith('T1195.'))) t1195Count++;
    });
  });

  const cacheAvailable = cacheStatus.vendors && (cacheStatus.nvd || cacheStatus.ssl || cacheStatus.radar);

  return {
    criticalHighCves: totalCriticalHighCves,
    certGapVendors: certGapCount,
    lowSslVendors: lowSslCount,
    radarFlaggedVendors: radarFlaggedCount,
    supplyChainTechniqueCount: t1195Count,
    cacheAvailable,
    cacheStatus
  };
}

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM intake_requests WHERE id::text = $1 OR reference_id = $1', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
    const row = result.rows[0];
    const [comments, history] = await Promise.all([
      pool.query('SELECT * FROM intake_comments WHERE intake_id = $1 ORDER BY created_at ASC', [row.id]),
      pool.query('SELECT * FROM intake_history WHERE intake_id = $1 ORDER BY created_at ASC', [row.id])
    ]);
    res.json({ ...serializeIntake(row), comments: comments.rows, history: history.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/assess', async (req, res) => {
  try {
    const enrichment = await buildEnrichmentSignals(req.body);
    const result = await assessRisk(req.body, enrichment);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const d = req.body;
    const refId = await generateRefId();
    const enrichment = await buildEnrichmentSignals(d);
    const risk = await assessRisk(d, enrichment);
    const status = d.submitAsDraft ? 'Draft' : 'Submitted';

    const result = await pool.query(`
      INSERT INTO intake_requests (
        reference_id, title, description, strategic_objective,
        requestor_name, requestor_email, requestor_role, business_unit, programme_domain,
        project_timeline, architecture_type, status,
        components, hosting_model, deployment_target, integration_points, is_public_facing, tech_stack_notes,
        vendor_ids, new_vendors,
        data_classification, data_types, external_data_sharing, data_sharing_details,
        encryption_at_rest, encryption_in_transit, auth_methods, has_mfa, has_waf, has_monitoring, is_zero_trust_aligned, compliance_requirements,
        related_pattern_ids, has_legacy_dependencies, legacy_systems, external_dependencies, deviates_from_patterns, deviation_justification,
        risk_score, risk_tier, risk_breakdown, risk_flags, risk_recommendations,
        submitted_at
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,
        $21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35,$36,$37,$38,
        $39,$40,$41,$42,$43,$44
      ) RETURNING *`,
      [
        refId, d.title, d.description, d.strategicObjective,
        d.requestorName, d.requestorEmail, d.requestorRole, d.businessUnit, d.programmeDomain,
        d.projectTimeline, d.architectureType, status,
        JSON.stringify(d.components || []),
        d.hostingModel, d.deploymentTarget, d.integrationPoints || 0, d.isPublicFacing ? 1 : 0, d.techStackNotes,
        JSON.stringify(d.vendorIds || []), JSON.stringify(d.newVendors || []),
        d.dataClassification, JSON.stringify(d.dataTypes || []), d.externalDataSharing ? 1 : 0, d.dataSharingDetails,
        d.encryptionAtRest ? 1 : 0, d.encryptionInTransit ? 1 : 0,
        JSON.stringify(d.authMethods || []), d.hasMfa ? 1 : 0, d.hasWaf ? 1 : 0, d.hasMonitoring ? 1 : 0, d.isZeroTrustAligned ? 1 : 0,
        JSON.stringify(d.complianceRequirements || []),
        JSON.stringify(d.relatedPatternIds || []), d.hasLegacyDependencies ? 1 : 0, d.legacySystems, d.externalDependencies,
        d.deviatesFromPatterns ? 1 : 0, d.deviationJustification,
        risk.score, risk.tier, JSON.stringify(risk.breakdown), JSON.stringify(risk.flags), JSON.stringify(risk.recommendations),
        status === 'Submitted' ? new Date().toISOString() : null
      ]
    );

    const newRow = result.rows[0];
    await pool.query(
      `INSERT INTO intake_history (intake_id, action, from_status, to_status, actor) VALUES ($1, $2, $3, $4, $5)`,
      [newRow.id, status === 'Submitted' ? 'Submitted' : 'Created as Draft', null, status, d.requestorName || 'System']
    );

    res.status(201).json(serializeIntake(newRow));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const existingResult = await pool.query('SELECT * FROM intake_requests WHERE id::text = $1 OR reference_id = $1', [req.params.id]);
    if (!existingResult.rows.length) return res.status(404).json({ error: 'Not found' });
    const existing = serializeIntake(existingResult.rows[0]);
    const d = req.body;
    const merged = { ...existing, ...d };
    const enrichment = await buildEnrichmentSignals(merged);
    const risk = await assessRisk(merged, enrichment);

    await pool.query(`UPDATE intake_requests SET
      title=$1, description=$2, strategic_objective=$3,
      requestor_name=$4, requestor_email=$5, requestor_role=$6, business_unit=$7, programme_domain=$8,
      project_timeline=$9, architecture_type=$10,
      components=$11, hosting_model=$12, deployment_target=$13, integration_points=$14, is_public_facing=$15, tech_stack_notes=$16,
      vendor_ids=$17, new_vendors=$18,
      data_classification=$19, data_types=$20, external_data_sharing=$21, data_sharing_details=$22,
      encryption_at_rest=$23, encryption_in_transit=$24, auth_methods=$25, has_mfa=$26, has_waf=$27, has_monitoring=$28, is_zero_trust_aligned=$29, compliance_requirements=$30,
      related_pattern_ids=$31, has_legacy_dependencies=$32, legacy_systems=$33, external_dependencies=$34, deviates_from_patterns=$35, deviation_justification=$36,
      risk_score=$37, risk_tier=$38, risk_breakdown=$39, risk_flags=$40, risk_recommendations=$41,
      updated_at=NOW()
      WHERE id=$42`,
      [
        merged.title, merged.description, merged.strategicObjective || merged.strategic_objective,
        merged.requestorName || merged.requestor_name, merged.requestorEmail || merged.requestor_email, merged.requestorRole || merged.requestor_role,
        merged.businessUnit || merged.business_unit, merged.programmeDomain || merged.programme_domain,
        merged.projectTimeline || merged.project_timeline, merged.architectureType || merged.architecture_type,
        JSON.stringify(merged.components || []),
        merged.hostingModel || merged.hosting_model, merged.deploymentTarget || merged.deployment_target,
        merged.integrationPoints || merged.integration_points || 0,
        (merged.isPublicFacing || merged.is_public_facing) ? 1 : 0,
        merged.techStackNotes || merged.tech_stack_notes,
        JSON.stringify(merged.vendorIds || []), JSON.stringify(merged.newVendors || []),
        merged.dataClassification || merged.data_classification,
        JSON.stringify(merged.dataTypes || []),
        (merged.externalDataSharing || merged.external_data_sharing) ? 1 : 0,
        merged.dataSharingDetails || merged.data_sharing_details,
        (merged.encryptionAtRest || merged.encryption_at_rest) ? 1 : 0,
        (merged.encryptionInTransit || merged.encryption_in_transit) ? 1 : 0,
        JSON.stringify(merged.authMethods || []),
        (merged.hasMfa || merged.has_mfa) ? 1 : 0, (merged.hasWaf || merged.has_waf) ? 1 : 0,
        (merged.hasMonitoring || merged.has_monitoring) ? 1 : 0,
        (merged.isZeroTrustAligned || merged.is_zero_trust_aligned) ? 1 : 0,
        JSON.stringify(merged.complianceRequirements || []),
        JSON.stringify(merged.relatedPatternIds || []),
        (merged.hasLegacyDependencies || merged.has_legacy_dependencies) ? 1 : 0,
        merged.legacySystems || merged.legacy_systems, merged.externalDependencies || merged.external_dependencies,
        (merged.deviatesFromPatterns || merged.deviates_from_patterns) ? 1 : 0,
        merged.deviationJustification || merged.deviation_justification,
        risk.score, risk.tier, JSON.stringify(risk.breakdown), JSON.stringify(risk.flags), JSON.stringify(risk.recommendations),
        existing.id
      ]
    );

    const updated = await pool.query('SELECT * FROM intake_requests WHERE id = $1', [existing.id]);
    res.json(serializeIntake(updated.rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/status', async (req, res) => {
  try {
    const existingResult = await pool.query('SELECT * FROM intake_requests WHERE id::text = $1 OR reference_id = $1', [req.params.id]);
    if (!existingResult.rows.length) return res.status(404).json({ error: 'Not found' });
    const existing = existingResult.rows[0];
    const { status, reviewerName, reviewerNotes, approvedPatternId } = req.body;

    const validTransitions = {
      Draft: ['Submitted'],
      Submitted: ['Under Review', 'Withdrawn'],
      'Under Review': ['Approved', 'Approved with Conditions', 'Rejected', 'Deferred', 'Submitted'],
      Deferred: ['Under Review', 'Withdrawn'],
      Approved: ['Superseded'],
      'Approved with Conditions': ['Superseded'],
      Rejected: ['Submitted'],
    };

    const allowed = validTransitions[existing.status] || [];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: `Cannot transition from '${existing.status}' to '${status}'` });
    }

    await pool.query(`UPDATE intake_requests SET status=$1, reviewer_name=$2, reviewer_notes=$3, approved_pattern_id=$4,
      reviewed_at=NOW(), updated_at=NOW() WHERE id=$5`,
      [status, reviewerName || existing.reviewer_name, reviewerNotes || existing.reviewer_notes, approvedPatternId || null, existing.id]
    );

    await pool.query(`INSERT INTO intake_history (intake_id, action, from_status, to_status, actor, notes) VALUES ($1,$2,$3,$4,$5,$6)`,
      [existing.id, `Status changed to ${status}`, existing.status, status, reviewerName || 'System', reviewerNotes || null]
    );

    const updated = await pool.query('SELECT * FROM intake_requests WHERE id = $1', [existing.id]);
    res.json(serializeIntake(updated.rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/comments', async (req, res) => {
  try {
    const existingResult = await pool.query('SELECT * FROM intake_requests WHERE id::text = $1 OR reference_id = $1', [req.params.id]);
    if (!existingResult.rows.length) return res.status(404).json({ error: 'Not found' });
    const { author, role, comment } = req.body;
    if (!comment) return res.status(400).json({ error: 'Comment required' });
    const result = await pool.query(
      'INSERT INTO intake_comments (intake_id, author, role, comment) VALUES ($1,$2,$3,$4) RETURNING *',
      [existingResult.rows[0].id, author || 'Anonymous', role, comment]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const existingResult = await pool.query('SELECT * FROM intake_requests WHERE id::text = $1 OR reference_id = $1', [req.params.id]);
    if (!existingResult.rows.length) return res.status(404).json({ error: 'Not found' });
    const existing = existingResult.rows[0];
    if (!['Draft', 'Withdrawn'].includes(existing.status)) {
      return res.status(400).json({ error: 'Only Draft or Withdrawn requests can be deleted' });
    }
    await pool.query('DELETE FROM intake_comments WHERE intake_id = $1', [existing.id]);
    await pool.query('DELETE FROM intake_history WHERE intake_id = $1', [existing.id]);
    await pool.query('DELETE FROM intake_requests WHERE id = $1', [existing.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
