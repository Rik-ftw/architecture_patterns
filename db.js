const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

const db = new Database(path.join(DATA_DIR, 'ea_platform.db'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS intake_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
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
    reviewed_at TEXT,
    approved_pattern_id TEXT,
    submitted_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS intake_comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    intake_id INTEGER NOT NULL REFERENCES intake_requests(id),
    author TEXT NOT NULL,
    role TEXT,
    comment TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS intake_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    intake_id INTEGER NOT NULL REFERENCES intake_requests(id),
    action TEXT NOT NULL,
    from_status TEXT,
    to_status TEXT,
    actor TEXT,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

function generateRefId() {
  const prefix = 'EAR';
  const year = new Date().getFullYear();
  const last = db.prepare(`SELECT reference_id FROM intake_requests ORDER BY id DESC LIMIT 1`).get();
  let seq = 1;
  if (last) {
    const match = last.reference_id.match(/(\d+)$/);
    if (match) seq = parseInt(match[1]) + 1;
  }
  return `${prefix}-${year}-${String(seq).padStart(4, '0')}`;
}

module.exports = { db, generateRefId };
