const express = require('express');
const router = express.Router();
const { db, generateRefId } = require('../db');
const { assessRisk } = require('../riskEngine');

function parseJson(val, fallback) {
  try { return JSON.parse(val); } catch { return fallback; }
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
  };
}

router.get('/', (req, res) => {
  const { status, search } = req.query;
  let query = 'SELECT * FROM intake_requests';
  const params = [];
  const conditions = [];
  if (status) { conditions.push('status = ?'); params.push(status); }
  if (search) {
    conditions.push('(title LIKE ? OR reference_id LIKE ? OR requestor_name LIKE ? OR business_unit LIKE ?)');
    const s = `%${search}%`;
    params.push(s, s, s, s);
  }
  if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
  query += ' ORDER BY created_at DESC';
  const rows = db.prepare(query).all(...params);
  res.json(rows.map(serializeIntake));
});

router.get('/stats', (req, res) => {
  const total = db.prepare('SELECT COUNT(*) as n FROM intake_requests').get().n;
  const byStatus = db.prepare('SELECT status, COUNT(*) as n FROM intake_requests GROUP BY status').all();
  const byTier = db.prepare('SELECT risk_tier, COUNT(*) as n FROM intake_requests WHERE risk_tier IS NOT NULL GROUP BY risk_tier').all();
  const recent = db.prepare('SELECT id, reference_id, title, status, risk_tier, risk_score, created_at FROM intake_requests ORDER BY created_at DESC LIMIT 5').all();
  res.json({ total, byStatus, byTier, recent });
});

router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM intake_requests WHERE id = ? OR reference_id = ?').get(req.params.id, req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  const comments = db.prepare('SELECT * FROM intake_comments WHERE intake_id = ? ORDER BY created_at ASC').all(row.id);
  const history = db.prepare('SELECT * FROM intake_history WHERE intake_id = ? ORDER BY created_at ASC').all(row.id);
  res.json({ ...serializeIntake(row), comments, history });
});

router.post('/assess', (req, res) => {
  const result = assessRisk(req.body);
  res.json(result);
});

router.post('/', (req, res) => {
  const d = req.body;
  const refId = generateRefId();
  const risk = assessRisk(d);

  const stmt = db.prepare(`
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
      ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?
    )
  `);

  const status = d.submitAsDraft ? 'Draft' : 'Submitted';
  const result = stmt.run(
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
  );

  db.prepare(`INSERT INTO intake_history (intake_id, action, from_status, to_status, actor) VALUES (?, ?, ?, ?, ?)`)
    .run(result.lastInsertRowid, status === 'Submitted' ? 'Submitted' : 'Created as Draft', null, status, d.requestorName || 'System');

  const row = db.prepare('SELECT * FROM intake_requests WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(serializeIntake(row));
});

router.patch('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM intake_requests WHERE id = ? OR reference_id = ?').get(req.params.id, req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  const d = req.body;

  const merged = { ...serializeIntake(existing), ...d };
  const risk = assessRisk(merged);

  db.prepare(`UPDATE intake_requests SET
    title=?, description=?, strategic_objective=?,
    requestor_name=?, requestor_email=?, requestor_role=?, business_unit=?, programme_domain=?,
    project_timeline=?, architecture_type=?,
    components=?, hosting_model=?, deployment_target=?, integration_points=?, is_public_facing=?, tech_stack_notes=?,
    vendor_ids=?, new_vendors=?,
    data_classification=?, data_types=?, external_data_sharing=?, data_sharing_details=?,
    encryption_at_rest=?, encryption_in_transit=?, auth_methods=?, has_mfa=?, has_waf=?, has_monitoring=?, is_zero_trust_aligned=?, compliance_requirements=?,
    related_pattern_ids=?, has_legacy_dependencies=?, legacy_systems=?, external_dependencies=?, deviates_from_patterns=?, deviation_justification=?,
    risk_score=?, risk_tier=?, risk_breakdown=?, risk_flags=?, risk_recommendations=?,
    updated_at=datetime('now')
    WHERE id=?`).run(
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
  );

  const updated = db.prepare('SELECT * FROM intake_requests WHERE id = ?').get(existing.id);
  res.json(serializeIntake(updated));
});

router.post('/:id/status', (req, res) => {
  const existing = db.prepare('SELECT * FROM intake_requests WHERE id = ? OR reference_id = ?').get(req.params.id, req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  const { status, reviewerName, reviewerNotes, approvedPatternId } = req.body;

  const validTransitions = {
    Draft: ['Submitted'],
    Submitted: ['Under Review', 'Withdrawn'],
    'Under Review': ['Approved', 'Rejected', 'Deferred', 'Submitted'],
    Deferred: ['Under Review', 'Withdrawn'],
    Approved: ['Superseded'],
    Rejected: ['Submitted'],
  };

  const allowed = validTransitions[existing.status] || [];
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: `Cannot transition from '${existing.status}' to '${status}'` });
  }

  db.prepare(`UPDATE intake_requests SET status=?, reviewer_name=?, reviewer_notes=?, approved_pattern_id=?,
    reviewed_at=datetime('now'), updated_at=datetime('now') WHERE id=?`)
    .run(status, reviewerName || existing.reviewer_name, reviewerNotes || existing.reviewer_notes, approvedPatternId || null, existing.id);

  db.prepare(`INSERT INTO intake_history (intake_id, action, from_status, to_status, actor, notes) VALUES (?,?,?,?,?,?)`)
    .run(existing.id, `Status changed to ${status}`, existing.status, status, reviewerName || 'System', reviewerNotes || null);

  const updated = db.prepare('SELECT * FROM intake_requests WHERE id = ?').get(existing.id);
  res.json(serializeIntake(updated));
});

router.post('/:id/comments', (req, res) => {
  const existing = db.prepare('SELECT * FROM intake_requests WHERE id = ? OR reference_id = ?').get(req.params.id, req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  const { author, role, comment } = req.body;
  if (!comment) return res.status(400).json({ error: 'Comment required' });
  const result = db.prepare('INSERT INTO intake_comments (intake_id, author, role, comment) VALUES (?,?,?,?)')
    .run(existing.id, author || 'Anonymous', role, comment);
  const row = db.prepare('SELECT * FROM intake_comments WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(row);
});

router.delete('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM intake_requests WHERE id = ? OR reference_id = ?').get(req.params.id, req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  if (!['Draft', 'Withdrawn'].includes(existing.status)) {
    return res.status(400).json({ error: 'Only Draft or Withdrawn requests can be deleted' });
  }
  db.prepare('DELETE FROM intake_comments WHERE intake_id = ?').run(existing.id);
  db.prepare('DELETE FROM intake_history WHERE intake_id = ?').run(existing.id);
  db.prepare('DELETE FROM intake_requests WHERE id = ?').run(existing.id);
  res.json({ success: true });
});

module.exports = router;
