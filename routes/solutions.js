const express = require('express');
const router = express.Router();
const { pool, parseJson, generateSolutionRefId } = require('../db');
const fs = require('fs');
const path = require('path');

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
  };
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
      (reference_id, title, description, business_context, pattern_ids, vendor_ids, deployment_regions, estimated_cost_band, complexity, owner, business_unit, status)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [refId, d.title, d.description, d.businessContext,
       JSON.stringify(d.patternIds || []), JSON.stringify(d.vendorIds || []),
       JSON.stringify(d.deploymentRegions || []),
       d.estimatedCostBand, d.complexity, d.owner, d.businessUnit, d.status || 'Draft']
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
    await pool.query('DELETE FROM solution_designs WHERE id=$1', [existingResult.rows[0].id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
