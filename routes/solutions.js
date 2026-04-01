const express = require('express');
const router = express.Router();
const { db, generateSolutionRefId } = require('../db');
const fs = require('fs');
const path = require('path');

function parseJson(val, fallback) {
  try { return JSON.parse(val); } catch { return fallback; }
}

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

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM solution_designs ORDER BY created_at DESC').all();
  res.json(rows.map(serialize));
});

router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM solution_designs WHERE id=? OR reference_id=?').get(req.params.id, req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  const patterns = loadPatterns();
  const parsed = serialize(row);
  parsed.patterns = patterns.filter(p => parsed.patternIds.includes(p.patternId));
  res.json(parsed);
});

router.post('/', (req, res) => {
  const d = req.body;
  const refId = generateSolutionRefId();
  const result = db.prepare(`INSERT INTO solution_designs
    (reference_id, title, description, business_context, pattern_ids, vendor_ids, deployment_regions, estimated_cost_band, complexity, owner, business_unit, status)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`).run(
    refId, d.title, d.description, d.businessContext,
    JSON.stringify(d.patternIds || []),
    JSON.stringify(d.vendorIds || []),
    JSON.stringify(d.deploymentRegions || []),
    d.estimatedCostBand, d.complexity, d.owner, d.businessUnit,
    d.status || 'Draft'
  );
  const row = db.prepare('SELECT * FROM solution_designs WHERE id=?').get(result.lastInsertRowid);
  res.status(201).json(serialize(row));
});

router.patch('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM solution_designs WHERE id=? OR reference_id=?').get(req.params.id, req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  const d = req.body;
  const merged = { ...serialize(existing), ...d };
  db.prepare(`UPDATE solution_designs SET title=?, description=?, business_context=?, pattern_ids=?, vendor_ids=?,
    deployment_regions=?, estimated_cost_band=?, complexity=?, owner=?, business_unit=?, status=?, updated_at=datetime('now')
    WHERE id=?`).run(
    merged.title, merged.description, merged.businessContext || merged.business_context,
    JSON.stringify(merged.patternIds || []), JSON.stringify(merged.vendorIds || []),
    JSON.stringify(merged.deploymentRegions || []),
    merged.estimatedCostBand || merged.estimated_cost_band,
    merged.complexity, merged.owner, merged.businessUnit || merged.business_unit,
    merged.status, existing.id
  );
  const row = db.prepare('SELECT * FROM solution_designs WHERE id=?').get(existing.id);
  res.json(serialize(row));
});

router.delete('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM solution_designs WHERE id=? OR reference_id=?').get(req.params.id, req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  db.prepare('DELETE FROM solution_designs WHERE id=?').run(existing.id);
  res.json({ success: true });
});

module.exports = router;
