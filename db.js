const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('sslmode') ? undefined : { rejectUnauthorized: false }
});

function parseJson(val, fallback) {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'object') return val;
  try { return JSON.parse(val); } catch { return fallback; }
}

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS vendors (
      id SERIAL PRIMARY KEY,
      vendor_company TEXT NOT NULL,
      product_service TEXT NOT NULL,
      category TEXT,
      sub_category TEXT,
      criticality TEXT DEFAULT 'Low',
      data_shared BOOLEAN DEFAULT false,
      data_types_shared TEXT DEFAULT '[]',
      hosting_model TEXT,
      programme_domain TEXT,
      spend_band TEXT,
      review_date TEXT,
      notes TEXT,
      active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS risk_thresholds (
      id SERIAL PRIMARY KEY,
      tier TEXT NOT NULL,
      min_score INTEGER,
      max_score INTEGER,
      label TEXT,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS ai_prompts (
      id SERIAL PRIMARY KEY,
      prompt_key TEXT UNIQUE NOT NULL,
      prompt_text TEXT,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS policies (
      id SERIAL PRIMARY KEY,
      policy_key TEXT UNIQUE NOT NULL,
      policy_text TEXT,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS intake_requests (
      id SERIAL PRIMARY KEY,
      reference_id TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      strategic_objective TEXT,
      requestor_name TEXT,
      requestor_email TEXT,
      requestor_role TEXT,
      business_unit TEXT,
      programme_domain TEXT,
      project_timeline TEXT,
      architecture_type TEXT,
      status TEXT DEFAULT 'Draft',
      components TEXT DEFAULT '[]',
      hosting_model TEXT,
      deployment_target TEXT,
      integration_points INTEGER DEFAULT 0,
      is_public_facing INTEGER DEFAULT 0,
      tech_stack_notes TEXT,
      vendor_ids TEXT DEFAULT '[]',
      new_vendors TEXT DEFAULT '[]',
      data_classification TEXT DEFAULT 'Internal',
      data_types TEXT DEFAULT '[]',
      external_data_sharing INTEGER DEFAULT 0,
      data_sharing_details TEXT,
      encryption_at_rest INTEGER DEFAULT 0,
      encryption_in_transit INTEGER DEFAULT 0,
      auth_methods TEXT DEFAULT '[]',
      has_mfa INTEGER DEFAULT 0,
      has_waf INTEGER DEFAULT 0,
      has_monitoring INTEGER DEFAULT 0,
      is_zero_trust_aligned INTEGER DEFAULT 0,
      compliance_requirements TEXT DEFAULT '[]',
      related_pattern_ids TEXT DEFAULT '[]',
      has_legacy_dependencies INTEGER DEFAULT 0,
      legacy_systems TEXT,
      external_dependencies TEXT,
      deviates_from_patterns INTEGER DEFAULT 0,
      deviation_justification TEXT,
      risk_score INTEGER,
      risk_tier TEXT,
      risk_breakdown TEXT DEFAULT '{}',
      risk_flags TEXT DEFAULT '[]',
      risk_recommendations TEXT DEFAULT '[]',
      reviewer_notes TEXT,
      reviewer_name TEXT,
      reviewed_at TIMESTAMPTZ,
      approved_pattern_id TEXT,
      submitted_at TIMESTAMPTZ,
      ai_review TEXT,
      ai_diagram TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS intake_comments (
      id SERIAL PRIMARY KEY,
      intake_id INTEGER NOT NULL REFERENCES intake_requests(id),
      author TEXT NOT NULL,
      role TEXT,
      comment TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS intake_history (
      id SERIAL PRIMARY KEY,
      intake_id INTEGER NOT NULL REFERENCES intake_requests(id),
      action TEXT NOT NULL,
      from_status TEXT,
      to_status TEXT,
      actor TEXT,
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS operational_support (
      id SERIAL PRIMARY KEY,
      reference_id TEXT UNIQUE NOT NULL,
      solution_name TEXT NOT NULL,
      intake_id INTEGER REFERENCES intake_requests(id),
      intake_reference TEXT,
      solution_id INTEGER,
      solution_reference TEXT,
      owner_name TEXT,
      owner_email TEXT,
      owner_team TEXT,
      support_tier TEXT,
      sla TEXT,
      support_channel TEXT,
      support_channel_detail TEXT,
      escalation_contacts TEXT DEFAULT '[]',
      licenses TEXT DEFAULT '[]',
      runbook_urls TEXT DEFAULT '[]',
      dashboard_urls TEXT DEFAULT '[]',
      review_cadence TEXT,
      notes TEXT,
      status TEXT DEFAULT 'Active',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS solution_designs (
      id SERIAL PRIMARY KEY,
      reference_id TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      business_context TEXT,
      pattern_ids TEXT DEFAULT '[]',
      vendor_ids TEXT DEFAULT '[]',
      deployment_regions TEXT DEFAULT '[]',
      estimated_cost_band TEXT,
      complexity TEXT,
      owner TEXT,
      business_unit TEXT,
      status TEXT DEFAULT 'Draft',
      jira_epics TEXT,
      intake_id INTEGER,
      intake_reference TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS solution_reviews (
      id SERIAL PRIMARY KEY,
      solution_id INTEGER NOT NULL REFERENCES solution_designs(id),
      stage TEXT NOT NULL,
      reviewer_name TEXT NOT NULL,
      decision TEXT NOT NULL,
      comments TEXT,
      reviewed_at TIMESTAMPTZ DEFAULT NOW(),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS jira_settings (
      id SERIAL PRIMARY KEY,
      base_url TEXT NOT NULL,
      project_key TEXT NOT NULL,
      user_email TEXT NOT NULL,
      api_token TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS solution_pattern_alignments (
      id SERIAL PRIMARY KEY,
      solution_id INTEGER NOT NULL REFERENCES solution_designs(id),
      pattern_id TEXT NOT NULL,
      pattern_name TEXT,
      status TEXT NOT NULL DEFAULT 'Pending',
      note TEXT,
      reviewer TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(solution_id, pattern_id)
    );

    CREATE TABLE IF NOT EXISTS solution_iterations (
      id SERIAL PRIMARY KEY,
      solution_id INTEGER NOT NULL REFERENCES solution_designs(id),
      version_label TEXT NOT NULL,
      change_summary TEXT,
      author TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  const addCols = [
    `ALTER TABLE solution_designs ADD COLUMN IF NOT EXISTS jira_epics TEXT`,
    `ALTER TABLE solution_designs ADD COLUMN IF NOT EXISTS intake_id INTEGER`,
    `ALTER TABLE solution_designs ADD COLUMN IF NOT EXISTS intake_reference TEXT`,
    `ALTER TABLE solution_designs ADD COLUMN IF NOT EXISTS iac_code TEXT`,
    `ALTER TABLE solution_designs ADD COLUMN IF NOT EXISTS risk_tier TEXT`,
    `ALTER TABLE intake_requests ADD COLUMN IF NOT EXISTS ai_review TEXT`,
    `ALTER TABLE intake_requests ADD COLUMN IF NOT EXISTS ai_diagram TEXT`,
    `ALTER TABLE intake_requests ADD COLUMN IF NOT EXISTS iac_code TEXT`,
    `ALTER TABLE operational_support ADD COLUMN IF NOT EXISTS solution_id INTEGER`,
    `ALTER TABLE operational_support ADD COLUMN IF NOT EXISTS solution_reference TEXT`,
    `ALTER TABLE intake_requests ADD COLUMN IF NOT EXISTS triage_result TEXT`,
    `ALTER TABLE intake_requests ADD COLUMN IF NOT EXISTS triage_status TEXT`,
    `ALTER TABLE intake_requests ADD COLUMN IF NOT EXISTS triage_routing_lane TEXT`,
    `ALTER TABLE intake_requests ADD COLUMN IF NOT EXISTS triage_composite_score INTEGER`,
    `ALTER TABLE intake_requests ADD COLUMN IF NOT EXISTS triage_risk_tier TEXT`,
    `ALTER TABLE intake_requests ADD COLUMN IF NOT EXISTS triage_started_at TIMESTAMPTZ`,
    `ALTER TABLE intake_requests ADD COLUMN IF NOT EXISTS triage_completed_at TIMESTAMPTZ`,
  ];
  for (const sql of addCols) {
    try { await pool.query(sql); } catch {}
  }
}

initDb().catch(err => console.error('DB init error:', err));

async function generateRefId() {
  const prefix = 'EAR';
  const year = new Date().getFullYear();
  const result = await pool.query(`SELECT reference_id FROM intake_requests ORDER BY id DESC LIMIT 1`);
  let seq = 1;
  if (result.rows.length > 0) {
    const match = result.rows[0].reference_id.match(/(\d+)$/);
    if (match) seq = parseInt(match[1]) + 1;
  }
  return `${prefix}-${year}-${String(seq).padStart(4, '0')}`;
}

async function generateSolutionRefId() {
  const prefix = 'ESD';
  const year = new Date().getFullYear();
  const result = await pool.query(`SELECT reference_id FROM solution_designs ORDER BY id DESC LIMIT 1`);
  let seq = 1;
  if (result.rows.length > 0) {
    const match = result.rows[0].reference_id.match(/(\d+)$/);
    if (match) seq = parseInt(match[1]) + 1;
  }
  return `${prefix}-${year}-${String(seq).padStart(4, '0')}`;
}

async function generateOpSupportRefId() {
  const prefix = 'OPS';
  const year = new Date().getFullYear();
  const result = await pool.query(`SELECT reference_id FROM operational_support ORDER BY id DESC LIMIT 1`);
  let seq = 1;
  if (result.rows.length > 0) {
    const match = result.rows[0].reference_id.match(/(\d+)$/);
    if (match) seq = parseInt(match[1]) + 1;
  }
  return `${prefix}-${year}-${String(seq).padStart(4, '0')}`;
}

module.exports = { pool, parseJson, generateRefId, generateSolutionRefId, generateOpSupportRefId };
