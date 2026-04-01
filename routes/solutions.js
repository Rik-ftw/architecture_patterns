const express = require('express');
const router = express.Router();
const { pool, parseJson, generateSolutionRefId } = require('../db');
const fs = require('fs');
const path = require('path');

const REVIEW_STAGES = ['EA Review', 'Security Review', 'Architecture Board'];
const REVIEW_DECISIONS = ['Approved', 'Rejected', 'Needs Changes'];

function loadPatterns() {
  const dir = path.join(__dirname, '..', 'patterns');
  return fs.readdirSync(dir).filter(f => f.endsWith('.json')).map(f => {
    try { return JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); } catch { return null; }
  }).filter(Boolean);
}

function serialize(row) {
  if (!row) return null;
  return {
    ...row,
    patternIds: parseJson(row.pattern_ids, []),
    vendorIds: parseJson(row.vendor_ids, []),
    deploymentRegions: parseJson(row.deployment_regions, []),
    jiraEpics: parseJson(row.jira_epics, null),
    iacCode: parseJson(row.iac_code, null),
  };
}

async function getReviews(solutionId) {
  const result = await pool.query(
    'SELECT * FROM solution_reviews WHERE solution_id=$1 ORDER BY created_at ASC',
    [solutionId]
  );
  return result.rows;
}

function getCurrentStage(solution, reviews) {
  if (solution.status === 'Approved') return null;
  if (solution.status === 'Rejected') return null;
  const completedStages = reviews.filter(r => r.decision === 'Approved').map(r => r.stage);
  for (const stage of REVIEW_STAGES) {
    if (!completedStages.includes(stage)) return stage;
  }
  return null;
}

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM solution_designs ORDER BY created_at DESC');
    res.json(result.rows.map(serialize));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM solution_designs WHERE id=$1 OR reference_id=$1', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
    const patterns = loadPatterns();
    const parsed = serialize(result.rows[0]);
    parsed.patterns = patterns.filter(p => parsed.patternIds.includes(p.patternId));
    const reviews = await getReviews(result.rows[0].id);
    parsed.reviews = reviews;
    parsed.currentStage = getCurrentStage(parsed, reviews);
    res.json(parsed);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const d = req.body;
    const refId = await generateSolutionRefId();
    const result = await pool.query(`INSERT INTO solution_designs
      (reference_id, title, description, business_context, pattern_ids, vendor_ids, deployment_regions, estimated_cost_band, complexity, owner, business_unit, status, intake_reference)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [refId, d.title, d.description, d.businessContext,
       JSON.stringify(d.patternIds || []), JSON.stringify(d.vendorIds || []),
       JSON.stringify(d.deploymentRegions || []),
       d.estimatedCostBand, d.complexity, d.owner, d.businessUnit,
       d.status || 'Draft', d.intakeReference || null]
    );
    res.status(201).json(serialize(result.rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const existingResult = await pool.query('SELECT * FROM solution_designs WHERE id=$1 OR reference_id=$1', [req.params.id]);
    if (!existingResult.rows.length) return res.status(404).json({ error: 'Not found' });
    const existing = serialize(existingResult.rows[0]);
    const d = req.body;
    const merged = { ...existing, ...d };
    await pool.query(`UPDATE solution_designs SET title=$1, description=$2, business_context=$3, pattern_ids=$4, vendor_ids=$5,
      deployment_regions=$6, estimated_cost_band=$7, complexity=$8, owner=$9, business_unit=$10, status=$11, updated_at=NOW()
      WHERE id=$12`,
      [merged.title, merged.description, merged.businessContext || merged.business_context,
       JSON.stringify(merged.patternIds || []), JSON.stringify(merged.vendorIds || []),
       JSON.stringify(merged.deploymentRegions || []),
       merged.estimatedCostBand || merged.estimated_cost_band,
       merged.complexity, merged.owner, merged.businessUnit || merged.business_unit,
       merged.status, existing.id]
    );
    const updated = await pool.query('SELECT * FROM solution_designs WHERE id=$1', [existing.id]);
    res.json(serialize(updated.rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const existingResult = await pool.query('SELECT * FROM solution_designs WHERE id=$1 OR reference_id=$1', [req.params.id]);
    if (!existingResult.rows.length) return res.status(404).json({ error: 'Not found' });
    const id = existingResult.rows[0].id;
    await pool.query('DELETE FROM solution_reviews WHERE solution_id=$1', [id]);
    await pool.query('DELETE FROM solution_designs WHERE id=$1', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/review', async (req, res) => {
  try {
    const existingResult = await pool.query('SELECT * FROM solution_designs WHERE id=$1 OR reference_id=$1', [req.params.id]);
    if (!existingResult.rows.length) return res.status(404).json({ error: 'Not found' });
    const existing = serialize(existingResult.rows[0]);

    const { reviewerName, decision, comments, stage } = req.body;
    if (!reviewerName || !decision || !stage) {
      return res.status(400).json({ error: 'reviewerName, decision, and stage are required' });
    }
    if (!REVIEW_DECISIONS.includes(decision)) {
      return res.status(400).json({ error: `decision must be one of: ${REVIEW_DECISIONS.join(', ')}` });
    }
    if (!REVIEW_STAGES.includes(stage)) {
      return res.status(400).json({ error: `stage must be one of: ${REVIEW_STAGES.join(', ')}` });
    }

    const reviews = await getReviews(existing.id);
    const currentStage = getCurrentStage(existing, reviews);
    if (stage !== currentStage) {
      return res.status(400).json({ error: `Current review stage is: ${currentStage || 'none (solution is already resolved)'}` });
    }

    await pool.query(
      `INSERT INTO solution_reviews (solution_id, stage, reviewer_name, decision, comments) VALUES ($1,$2,$3,$4,$5)`,
      [existing.id, stage, reviewerName, decision, comments || null]
    );

    let newStatus = existing.status;
    if (decision === 'Rejected') {
      newStatus = 'Rejected';
    } else if (decision === 'Approved') {
      const allReviews = await getReviews(existing.id);
      const approvedStages = allReviews.filter(r => r.decision === 'Approved').map(r => r.stage);
      const allPassed = REVIEW_STAGES.every(s => approvedStages.includes(s));
      newStatus = allPassed ? 'Approved' : 'In Review';
    } else {
      newStatus = 'Needs Changes';
    }

    await pool.query(`UPDATE solution_designs SET status=$1, updated_at=NOW() WHERE id=$2`, [newStatus, existing.id]);

    const updatedResult = await pool.query('SELECT * FROM solution_designs WHERE id=$1', [existing.id]);
    const parsed = serialize(updatedResult.rows[0]);
    parsed.reviews = await getReviews(existing.id);
    parsed.currentStage = getCurrentStage(parsed, parsed.reviews);
    res.json(parsed);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/jira-epics', async (req, res) => {
  try {
    const existingResult = await pool.query('SELECT * FROM solution_designs WHERE id=$1 OR reference_id=$1', [req.params.id]);
    if (!existingResult.rows.length) return res.status(404).json({ error: 'Not found' });
    const { jiraEpics } = req.body;
    await pool.query(`UPDATE solution_designs SET jira_epics=$1, updated_at=NOW() WHERE id=$2`,
      [JSON.stringify(jiraEpics), existingResult.rows[0].id]);
    const updated = await pool.query('SELECT * FROM solution_designs WHERE id=$1', [existingResult.rows[0].id]);
    res.json(serialize(updated.rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
