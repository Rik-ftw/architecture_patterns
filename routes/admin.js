const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { invalidateCache } = require('../configCache');

function adminAuth(req, res, next) {
  const token = req.headers['x-admin-token'] || req.query.token;
  if (!process.env.ADMIN_TOKEN) {
    return res.status(503).json({ error: 'Admin portal not configured (ADMIN_TOKEN not set)' });
  }
  if (!token || token !== process.env.ADMIN_TOKEN.trim()) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

router.use(adminAuth);

router.get('/ping', (_req, res) => res.json({ ok: true }));

// ─── AI Prompts ─────────────────────────────────────────────────────────────

router.get('/prompts', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM ai_prompts ORDER BY prompt_key');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/prompts/:key', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM ai_prompts WHERE prompt_key=$1', [req.params.key]);
    if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/prompts/:key', async (req, res) => {
  try {
    const { prompt_text, description } = req.body;
    if (!prompt_text) return res.status(400).json({ error: 'prompt_text is required' });
    const result = await pool.query(`
      INSERT INTO ai_prompts (prompt_key, prompt_text, description, version, updated_at, updated_by)
      VALUES ($1, $2, $3, 1, NOW(), 'admin')
      ON CONFLICT (prompt_key) DO UPDATE SET
        prompt_text = EXCLUDED.prompt_text,
        description = COALESCE(EXCLUDED.description, ai_prompts.description),
        version = ai_prompts.version + 1,
        updated_at = NOW(),
        updated_by = 'admin'
      RETURNING *`,
      [req.params.key, prompt_text, description || null]
    );
    invalidateCache('aiPrompts');
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── System Config ───────────────────────────────────────────────────────────

router.get('/config', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM system_config ORDER BY config_key');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/config/:key', async (req, res) => {
  try {
    const { config_value, description } = req.body;
    const result = await pool.query(`
      INSERT INTO system_config (config_key, config_value, description, updated_at, updated_by)
      VALUES ($1, $2, $3, NOW(), 'admin')
      ON CONFLICT (config_key) DO UPDATE SET
        config_value = EXCLUDED.config_value,
        description = COALESCE(EXCLUDED.description, system_config.description),
        updated_at = NOW(),
        updated_by = 'admin'
      RETURNING *`,
      [req.params.key, config_value, description || null]
    );
    invalidateCache('systemConfig');
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/config', async (req, res) => {
  try {
    const { config_key, config_value, description } = req.body;
    if (!config_key) return res.status(400).json({ error: 'config_key is required' });
    const result = await pool.query(`
      INSERT INTO system_config (config_key, config_value, description, updated_at, updated_by)
      VALUES ($1, $2, $3, NOW(), 'admin')
      ON CONFLICT (config_key) DO UPDATE SET
        config_value = EXCLUDED.config_value,
        description = COALESCE(EXCLUDED.description, system_config.description),
        updated_at = NOW(),
        updated_by = 'admin'
      RETURNING *`,
      [config_key, config_value, description || null]
    );
    invalidateCache('systemConfig');
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/config/:key', async (req, res) => {
  try {
    await pool.query('DELETE FROM system_config WHERE config_key=$1', [req.params.key]);
    invalidateCache('systemConfig');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Risk Thresholds ─────────────────────────────────────────────────────────

router.get('/risk-thresholds', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM risk_thresholds ORDER BY parameter');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/risk-thresholds/:parameter', async (req, res) => {
  try {
    const { value, description } = req.body;
    if (value === undefined || value === null) return res.status(400).json({ error: 'value is required' });
    const result = await pool.query(`
      INSERT INTO risk_thresholds (parameter, value, description, updated_at, updated_by)
      VALUES ($1, $2, $3, NOW(), 'admin')
      ON CONFLICT (parameter) DO UPDATE SET
        value = EXCLUDED.value,
        description = COALESCE(EXCLUDED.description, risk_thresholds.description),
        updated_at = NOW(),
        updated_by = 'admin'
      RETURNING *`,
      [req.params.parameter, String(value), description || null]
    );
    invalidateCache('riskThresholds');
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/risk-thresholds', async (req, res) => {
  try {
    const updates = req.body;
    if (!Array.isArray(updates)) return res.status(400).json({ error: 'Expected array of {parameter, value}' });
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const { parameter, value, description } of updates) {
        await client.query(`
          INSERT INTO risk_thresholds (parameter, value, description, updated_at, updated_by)
          VALUES ($1, $2, $3, NOW(), 'admin')
          ON CONFLICT (parameter) DO UPDATE SET value=EXCLUDED.value, description=COALESCE(EXCLUDED.description, risk_thresholds.description), updated_at=NOW(), updated_by='admin'`,
          [parameter, String(value), description || null]
        );
      }
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
    invalidateCache('riskThresholds');
    const result = await pool.query('SELECT * FROM risk_thresholds ORDER BY parameter');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Support Teams ────────────────────────────────────────────────────────────

router.get('/support-teams', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM support_teams ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/support-teams', async (req, res) => {
  try {
    const { name, contact_email, contact_slack, description, active } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });
    const result = await pool.query(
      `INSERT INTO support_teams (name, contact_email, contact_slack, description, active) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [name, contact_email || null, contact_slack || null, description || null, active !== false]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/support-teams/:id', async (req, res) => {
  try {
    const { name, contact_email, contact_slack, description, active } = req.body;
    const result = await pool.query(
      `UPDATE support_teams SET name=$1, contact_email=$2, contact_slack=$3, description=$4, active=$5, updated_at=NOW() WHERE id=$6 RETURNING *`,
      [name, contact_email || null, contact_slack || null, description || null, active !== false, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/support-teams/:id/toggle', async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE support_teams SET active = NOT active, updated_at=NOW() WHERE id=$1 RETURNING *`,
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/support-teams/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM support_teams WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Vendor Registry ─────────────────────────────────────────────────────────

router.get('/vendors', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM vendors ORDER BY vendor_company, product_service');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/vendors', async (req, res) => {
  try {
    const d = req.body;
    if (!d.vendor_company || !d.product_service) return res.status(400).json({ error: 'vendor_company and product_service are required' });
    const result = await pool.query(`
      INSERT INTO vendors (vendor_company, product_service, category, sub_category, criticality, data_shared, data_types_shared, hosting_model, programme_domain, spend_band, review_date, notes, active)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [d.vendor_company, d.product_service, d.category || null, d.sub_category || null,
       d.criticality || 'Medium', d.data_shared || false, d.data_types_shared || null,
       d.hosting_model || null, d.programme_domain || null, d.spend_band || null,
       d.review_date || null, d.notes || null, d.active !== false]
    );
    invalidateCache('vendors');
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/vendors/:id', async (req, res) => {
  try {
    const d = req.body;
    const result = await pool.query(`
      UPDATE vendors SET vendor_company=$1, product_service=$2, category=$3, sub_category=$4, criticality=$5,
        data_shared=$6, data_types_shared=$7, hosting_model=$8, programme_domain=$9, spend_band=$10,
        review_date=$11, notes=$12, active=$13, updated_at=NOW()
      WHERE id=$14 RETURNING *`,
      [d.vendor_company, d.product_service, d.category || null, d.sub_category || null,
       d.criticality || 'Medium', d.data_shared || false, d.data_types_shared || null,
       d.hosting_model || null, d.programme_domain || null, d.spend_band || null,
       d.review_date || null, d.notes || null, d.active !== false, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
    invalidateCache('vendors');
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/vendors/:id/toggle', async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE vendors SET active = NOT active, updated_at=NOW() WHERE id=$1 RETURNING *`,
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
    invalidateCache('vendors');
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Policies ─────────────────────────────────────────────────────────────────

router.get('/policies', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM policies ORDER BY category, name');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/policies/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM policies WHERE id::text=$1 OR policy_key=$1', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/policies', async (req, res) => {
  try {
    const { policy_key, name, category, source, description, version, url, rules, active } = req.body;
    if (!policy_key || !name || !category) return res.status(400).json({ error: 'policy_key, name and category are required' });
    const result = await pool.query(`
      INSERT INTO policies (policy_key, name, category, source, description, version, url, rules, active)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [policy_key, name, category, source || null, description || null, version || null,
       url || null, JSON.stringify(rules || []), active !== false]
    );
    invalidateCache('policies');
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Policy key already exists' });
    res.status(500).json({ error: err.message });
  }
});

router.put('/policies/:id', async (req, res) => {
  try {
    const { name, category, source, description, version, url, rules, active } = req.body;
    const result = await pool.query(`
      UPDATE policies SET name=$1, category=$2, source=$3, description=$4, version=$5, url=$6,
        rules=$7, active=$8, updated_at=NOW()
      WHERE id::text=$9 OR policy_key=$9 RETURNING *`,
      [name, category, source || null, description || null, version || null, url || null,
       JSON.stringify(rules || []), active !== false, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
    invalidateCache('policies');
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/policies/:id/toggle', async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE policies SET active = NOT active, updated_at=NOW() WHERE id::text=$1 OR policy_key=$1 RETURNING *`,
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
    invalidateCache('policies');
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/policies/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM policies WHERE id::text=$1 OR policy_key=$1', [req.params.id]);
    invalidateCache('policies');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Dashboard Stats ─────────────────────────────────────────────────────────

router.get('/stats', async (req, res) => {
  try {
    const [intakes, vendors, thresholds, policies] = await Promise.all([
      pool.query('SELECT COUNT(*) as n FROM intake_requests'),
      pool.query('SELECT COUNT(*) as total, SUM(CASE WHEN active THEN 1 ELSE 0 END) as active FROM vendors'),
      pool.query('SELECT COUNT(*) as n FROM risk_thresholds'),
      pool.query('SELECT COUNT(*) as total, SUM(CASE WHEN active THEN 1 ELSE 0 END) as active FROM policies')
    ]);
    res.json({
      intakes: parseInt(intakes.rows[0].n),
      vendors: { total: parseInt(vendors.rows[0].total), active: parseInt(vendors.rows[0].active || 0) },
      teams: { total: 0, active: 0 },
      configKeys: 0,
      riskParams: parseInt(thresholds.rows[0].n),
      policies: { total: parseInt(policies.rows[0].total), active: parseInt(policies.rows[0].active || 0) }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
