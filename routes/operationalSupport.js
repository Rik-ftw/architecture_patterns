const express = require('express');
const router = express.Router();
const { db, generateOpSupportRefId } = require('../db');

function parseJson(val, fallback) {
  try { return JSON.parse(val); } catch { return fallback; }
}

function serializeRecord(row) {
  if (!row) return null;
  return {
    ...row,
    escalationContacts: parseJson(row.escalation_contacts, []),
    licenses: parseJson(row.licenses, []),
    runbookUrls: parseJson(row.runbook_urls, []),
    dashboardUrls: parseJson(row.dashboard_urls, []),
  };
}

function isExpiringWithin90Days(dateStr) {
  if (!dateStr) return false;
  try {
    const exp = new Date(dateStr);
    const now = new Date();
    const diff = (exp - now) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 90;
  } catch { return false; }
}

function resolveIntakeLink(intakeReference) {
  if (!intakeReference) return { intakeId: null, validRef: null };
  const intake = db.prepare('SELECT id, status FROM intake_requests WHERE reference_id = ?').get(intakeReference);
  if (!intake) return { intakeId: null, validRef: null, error: `Intake reference '${intakeReference}' not found` };
  return { intakeId: intake.id, validRef: intakeReference };
}

function resolveSolutionLink(solutionReference) {
  if (!solutionReference) return { solutionId: null, validRef: null };
  const sol = db.prepare('SELECT id FROM solution_designs WHERE reference_id = ?').get(solutionReference);
  if (!sol) return { solutionId: null, validRef: null, error: `Solution reference '${solutionReference}' not found` };
  return { solutionId: sol.id, validRef: solutionReference };
}

router.get('/', (req, res) => {
  const { search, intake_reference, solution_reference, expiring } = req.query;
  let query = 'SELECT * FROM operational_support';
  const params = [];
  const conditions = [];
  if (intake_reference) {
    conditions.push('intake_reference = ?');
    params.push(intake_reference);
  }
  if (solution_reference) {
    conditions.push('solution_reference = ?');
    params.push(solution_reference);
  }
  if (search) {
    conditions.push('(solution_name LIKE ? OR reference_id LIKE ? OR owner_name LIKE ? OR owner_team LIKE ?)');
    const s = `%${search}%`;
    params.push(s, s, s, s);
  }
  if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
  query += ' ORDER BY created_at DESC';
  let rows = db.prepare(query).all(...params).map(serializeRecord);

  if (expiring === 'true') {
    rows = rows.filter(r =>
      (r.licenses || []).some(l => isExpiringWithin90Days(l.renewalDate))
    );
  }

  rows = rows.map(r => ({
    ...r,
    hasExpiringLicense: (r.licenses || []).some(l => isExpiringWithin90Days(l.renewalDate)),
  }));

  res.json(rows);
});

router.get('/stats', (req, res) => {
  const total = db.prepare('SELECT COUNT(*) as n FROM operational_support').get().n;
  const rows = db.prepare('SELECT * FROM operational_support').all().map(serializeRecord);
  const expiring = rows.filter(r =>
    (r.licenses || []).some(l => isExpiringWithin90Days(l.renewalDate))
  ).length;
  res.json({ total, expiring });
});

router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM operational_support WHERE id = ? OR reference_id = ?').get(req.params.id, req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  const rec = serializeRecord(row);
  rec.hasExpiringLicense = (rec.licenses || []).some(l => isExpiringWithin90Days(l.renewalDate));
  res.json(rec);
});

router.post('/', (req, res) => {
  const d = req.body;
  if (!d.solutionName) return res.status(400).json({ error: 'solutionName is required' });

  const refId = generateOpSupportRefId();

  let intakeId = null, resolvedIntakeRef = null;
  if (d.intakeReference) {
    const { intakeId: iid, validRef, error } = resolveIntakeLink(d.intakeReference);
    if (error) return res.status(400).json({ error });
    intakeId = iid; resolvedIntakeRef = validRef;
  }

  let solutionId = null, resolvedSolutionRef = null;
  if (d.solutionReference) {
    const { solutionId: sid, validRef, error } = resolveSolutionLink(d.solutionReference);
    if (error) return res.status(400).json({ error });
    solutionId = sid; resolvedSolutionRef = validRef;
  }

  const stmt = db.prepare(`
    INSERT INTO operational_support (
      reference_id, solution_name, intake_id, intake_reference,
      solution_id, solution_reference,
      owner_name, owner_email, owner_team,
      support_tier, sla, support_channel, support_channel_detail,
      escalation_contacts, licenses, runbook_urls, dashboard_urls,
      review_cadence, notes, status
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `);

  const result = stmt.run(
    refId,
    d.solutionName,
    intakeId,
    resolvedIntakeRef,
    solutionId,
    resolvedSolutionRef,
    d.ownerName || null,
    d.ownerEmail || null,
    d.ownerTeam || null,
    d.supportTier || null,
    d.sla || null,
    d.supportChannel || null,
    d.supportChannelDetail || null,
    JSON.stringify(d.escalationContacts || []),
    JSON.stringify(d.licenses || []),
    JSON.stringify(d.runbookUrls || []),
    JSON.stringify(d.dashboardUrls || []),
    d.reviewCadence || null,
    d.notes || null,
    d.status || 'Active'
  );

  const row = db.prepare('SELECT * FROM operational_support WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(serializeRecord(row));
});

router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM operational_support WHERE id = ? OR reference_id = ?').get(req.params.id, req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  const d = req.body;

  let intakeId = existing.intake_id;
  let resolvedIntakeRef = existing.intake_reference;
  if (d.intakeReference !== undefined && d.intakeReference !== existing.intake_reference) {
    if (d.intakeReference) {
      const { intakeId: iid, validRef, error } = resolveIntakeLink(d.intakeReference);
      if (error) return res.status(400).json({ error });
      intakeId = iid; resolvedIntakeRef = validRef;
    } else {
      intakeId = null; resolvedIntakeRef = null;
    }
  }

  let solutionId = existing.solution_id;
  let resolvedSolutionRef = existing.solution_reference;
  if (d.solutionReference !== undefined && d.solutionReference !== existing.solution_reference) {
    if (d.solutionReference) {
      const { solutionId: sid, validRef, error } = resolveSolutionLink(d.solutionReference);
      if (error) return res.status(400).json({ error });
      solutionId = sid; resolvedSolutionRef = validRef;
    } else {
      solutionId = null; resolvedSolutionRef = null;
    }
  }

  db.prepare(`UPDATE operational_support SET
    solution_name=?, intake_id=?, intake_reference=?,
    solution_id=?, solution_reference=?,
    owner_name=?, owner_email=?, owner_team=?,
    support_tier=?, sla=?, support_channel=?, support_channel_detail=?,
    escalation_contacts=?, licenses=?, runbook_urls=?, dashboard_urls=?,
    review_cadence=?, notes=?, status=?,
    updated_at=datetime('now')
    WHERE id=?`).run(
    d.solutionName || existing.solution_name,
    intakeId,
    resolvedIntakeRef,
    solutionId,
    resolvedSolutionRef,
    d.ownerName !== undefined ? d.ownerName : existing.owner_name,
    d.ownerEmail !== undefined ? d.ownerEmail : existing.owner_email,
    d.ownerTeam !== undefined ? d.ownerTeam : existing.owner_team,
    d.supportTier !== undefined ? d.supportTier : existing.support_tier,
    d.sla !== undefined ? d.sla : existing.sla,
    d.supportChannel !== undefined ? d.supportChannel : existing.support_channel,
    d.supportChannelDetail !== undefined ? d.supportChannelDetail : existing.support_channel_detail,
    JSON.stringify(d.escalationContacts !== undefined ? d.escalationContacts : parseJson(existing.escalation_contacts, [])),
    JSON.stringify(d.licenses !== undefined ? d.licenses : parseJson(existing.licenses, [])),
    JSON.stringify(d.runbookUrls !== undefined ? d.runbookUrls : parseJson(existing.runbook_urls, [])),
    JSON.stringify(d.dashboardUrls !== undefined ? d.dashboardUrls : parseJson(existing.dashboard_urls, [])),
    d.reviewCadence !== undefined ? d.reviewCadence : existing.review_cadence,
    d.notes !== undefined ? d.notes : existing.notes,
    d.status !== undefined ? d.status : existing.status,
    existing.id
  );

  const updated = db.prepare('SELECT * FROM operational_support WHERE id = ?').get(existing.id);
  res.json(serializeRecord(updated));
});

module.exports = router;
