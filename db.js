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
