const { pool } = require('./db');

const CACHE_TTL = 60 * 1000;

const cache = {
  vendors: { data: null, ts: 0 },
  riskThresholds: { data: null, ts: 0 },
  systemConfig: { data: null, ts: 0 },
  aiPrompts: { data: null, ts: 0 },
  policies: { data: null, ts: 0 },
};

function isFresh(entry) {
  return entry.data !== null && Date.now() - entry.ts < CACHE_TTL;
}

async function getVendors() {
  if (isFresh(cache.vendors)) return cache.vendors.data;
  const result = await pool.query(`SELECT * FROM vendors WHERE active = true ORDER BY vendor_company, product_service`);
  const vendors = result.rows.map(r => ({
    id: r.id,
    vendorCompany: r.vendor_company,
    productService: r.product_service,
    category: r.category,
    subCategory: r.sub_category,
    criticality: r.criticality,
    dataShared: r.data_shared,
    dataTypesShared: r.data_types_shared,
    hostingModel: r.hosting_model,
    programmeDomain: r.programme_domain,
    spendBand: r.spend_band,
    reviewDate: r.review_date,
    notes: r.notes,
    active: r.active,
    createdAt: r.created_at,
    updatedAt: r.updated_at
  }));
  cache.vendors = { data: vendors, ts: Date.now() };
  return vendors;
}

async function getRiskThresholds() {
  if (isFresh(cache.riskThresholds)) return cache.riskThresholds.data;
  const result = await pool.query(`SELECT parameter, value FROM risk_thresholds`);
  const thresholds = {};
  for (const row of result.rows) {
    thresholds[row.parameter] = parseFloat(row.value);
  }
  cache.riskThresholds = { data: thresholds, ts: Date.now() };
  return thresholds;
}

async function getSystemConfig() {
  if (isFresh(cache.systemConfig)) return cache.systemConfig.data;
  const result = await pool.query(`SELECT config_key, config_value FROM system_config`);
  const config = {};
  for (const row of result.rows) {
    config[row.config_key] = row.config_value;
  }
  cache.systemConfig = { data: config, ts: Date.now() };
  return config;
}

async function getAiPrompts() {
  if (isFresh(cache.aiPrompts)) return cache.aiPrompts.data;
  const result = await pool.query(`SELECT prompt_key, prompt_text FROM ai_prompts`);
  const prompts = {};
  for (const row of result.rows) {
    prompts[row.prompt_key] = row.prompt_text;
  }
  cache.aiPrompts = { data: prompts, ts: Date.now() };
  return prompts;
}

async function getPolicies() {
  if (isFresh(cache.policies)) return cache.policies.data;
  const result = await pool.query(`SELECT * FROM policies WHERE active = true ORDER BY category, name`);
  cache.policies = { data: result.rows, ts: Date.now() };
  return result.rows;
}

function invalidateCache(key) {
  if (key && cache[key]) {
    cache[key] = { data: null, ts: 0 };
  } else {
    for (const k of Object.keys(cache)) {
      cache[k] = { data: null, ts: 0 };
    }
  }
}

module.exports = { getVendors, getRiskThresholds, getSystemConfig, getAiPrompts, getPolicies, invalidateCache };
