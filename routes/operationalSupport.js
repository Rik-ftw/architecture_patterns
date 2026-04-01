const express = require('express');
const router = express.Router();
const { pool, parseJson, generateOpSupportRefId } = require('../db');

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

async function resolveIntakeLink(intakeReference) {
  if (!intakeReference) return { intakeId: null, validRef: null };
  const result = await pool.query('SELECT id, status FROM intake_requests WHERE reference_id = $1', [intakeReference]);
  if (!result.rows.length) return { intakeId: null, validRef: null, error: `Intake reference '${intakeReference}' not found` };
  return { intakeId: result.rows[0].id, validRef: intakeReference };
}

async function resolveSolutionLink(solutionReference) {
  if (!solutionReference) return { solutionId: null, validRef: null };
  const result = await pool.query('SELECT id FROM solution_designs WHERE reference_id = $1', [solutionReference]);
  if (!result.rows.length) return { solutionId: null, validRef: null, error: `Solution reference '${solutionReference}' not found` };
  return { solutionId: result.rows[0].id, validRef: solutionReference };
}

router.get('/', async (req, res) => {
  try {
    const { search, intake_reference, solution_reference, expiring } = req.query;
    let query = 'SELECT * FROM operational_support';
    const params = [];
    const conditions = [];
    if (intake_reference) { conditions.push(`intake_reference = $${params.length + 1}`); params.push(intake_reference); }
    if (solution_reference) { conditions.push(`solution_reference = $${params.length + 1}`); params.push(solution_reference); }
    if (search) {
      const s = `%${search}%`;
      conditions.push(`(solution_name ILIKE $${params.length + 1} OR reference_id ILIKE $${params.length + 2} OR owner_name ILIKE $${params.length + 3} OR owner_team ILIKE $${params.length + 4})`);
      params.push(s, s, s, s);
    }
    if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY created_at DESC';
    const result = await pool.query(query, params);
    let rows = result.rows.map(serializeRecord);
    if (expiring === 'true') {
      rows = rows.filter(r => (r.licenses || []).some(l => isExpiringWithin90Days(l.renewalDate)));
    }
    rows = rows.map(r => ({ ...r, hasExpiringLicense: (r.licenses || []).some(l => isExpiringWithin90Days(l.renewalDate)) }));
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const [totalResult, allResult] = await Promise.all([
      pool.query('SELECT COUNT(*) as n FROM operational_support'),
      pool.query('SELECT * FROM operational_support')
    ]);
    const rows = allResult.rows.map(serializeRecord);
    const expiring = rows.filter(r => (r.licenses || []).some(l => isExpiringWithin90Days(l.renewalDate))).length;
    res.json({ total: parseInt(totalResult.rows[0].n), expiring });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM operational_support WHERE id = $1 OR reference_id = $1', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
    const rec = serializeRecord(result.rows[0]);
    rec.hasExpiringLicense = (rec.licenses || []).some(l => isExpiringWithin90Days(l.renewalDate));
    res.json(rec);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const d = req.body;
    if (!d.solutionName) return res.status(400).json({ error: 'solutionName is required' });
    const refId = await generateOpSupportRefId();

    let intakeId = null, resolvedIntakeRef = null;
    if (d.intakeReference) {
      const { intakeId: iid, validRef, error } = await resolveIntakeLink(d.intakeReference);
      if (error) return res.status(400).json({ error });
      intakeId = iid; resolvedIntakeRef = validRef;
    }

    let solutionId = null, resolvedSolutionRef = null;
    if (d.solutionReference) {
      const { solutionId: sid, validRef, error } = await resolveSolutionLink(d.solutionReference);
      if (error) return res.status(400).json({ error });
      solutionId = sid; resolvedSolutionRef = validRef;
    }

    const result = await pool.query(`
      INSERT INTO operational_support (
        reference_id, solution_name, intake_id, intake_reference,
        solution_id, solution_reference, owner_name, owner_email, owner_team,
        support_tier, sla, support_channel, support_channel_detail,
        escalation_contacts, licenses, runbook_urls, dashboard_urls,
        review_cadence, notes, status
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20) RETURNING *`,
      [refId, d.solutionName, intakeId, resolvedIntakeRef, solutionId, resolvedSolutionRef,
       d.ownerName || null, d.ownerEmail || null, d.ownerTeam || null,
       d.supportTier || null, d.sla || null, d.supportChannel || null, d.supportChannelDetail || null,
       JSON.stringify(d.escalationContacts || []), JSON.stringify(d.licenses || []),
       JSON.stringify(d.runbookUrls || []), JSON.stringify(d.dashboardUrls || []),
       d.reviewCadence || null, d.notes || null, d.status || 'Active']
    );
    res.status(201).json(serializeRecord(result.rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const existingResult = await pool.query('SELECT * FROM operational_support WHERE id = $1 OR reference_id = $1', [req.params.id]);
    if (!existingResult.rows.length) return res.status(404).json({ error: 'Not found' });
    const existing = existingResult.rows[0];
    const d = req.body;

    let intakeId = existing.intake_id, resolvedIntakeRef = existing.intake_reference;
    if (d.intakeReference !== undefined && d.intakeReference !== existing.intake_reference) {
      if (d.intakeReference) {
        const { intakeId: iid, validRef, error } = await resolveIntakeLink(d.intakeReference);
        if (error) return res.status(400).json({ error });
        intakeId = iid; resolvedIntakeRef = validRef;
      } else { intakeId = null; resolvedIntakeRef = null; }
    }

    let solutionId = existing.solution_id, resolvedSolutionRef = existing.solution_reference;
    if (d.solutionReference !== undefined && d.solutionReference !== existing.solution_reference) {
      if (d.solutionReference) {
        const { solutionId: sid, validRef, error } = await resolveSolutionLink(d.solutionReference);
        if (error) return res.status(400).json({ error });
        solutionId = sid; resolvedSolutionRef = validRef;
      } else { solutionId = null; resolvedSolutionRef = null; }
    }

    await pool.query(`UPDATE operational_support SET
      solution_name=$1, intake_id=$2, intake_reference=$3, solution_id=$4, solution_reference=$5,
      owner_name=$6, owner_email=$7, owner_team=$8, support_tier=$9, sla=$10,
      support_channel=$11, support_channel_detail=$12, escalation_contacts=$13, licenses=$14,
      runbook_urls=$15, dashboard_urls=$16, review_cadence=$17, notes=$18, status=$19, updated_at=NOW()
      WHERE id=$20`,
      [d.solutionName || existing.solution_name, intakeId, resolvedIntakeRef, solutionId, resolvedSolutionRef,
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
       existing.id]
    );
    const updated = await pool.query('SELECT * FROM operational_support WHERE id = $1', [existing.id]);
    res.json(serializeRecord(updated.rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
