const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const https = require('https');

const NVD_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const nvdCacheFile = path.join(__dirname, '..', 'data', 'nvdCache.json');
const sslCacheFile = path.join(__dirname, '..', 'data', 'sslCache.json');
const vendorRegistryFile = path.join(__dirname, '..', 'vendors', 'registry.json');

const nvdCache = new Map();

function loadNvdDiskCache() {
  try {
    const raw = JSON.parse(fs.readFileSync(nvdCacheFile, 'utf8'));
    Object.entries(raw).forEach(([k, v]) => nvdCache.set(k, v));
  } catch {}
}

function saveNvdDiskCache() {
  try {
    const obj = {};
    nvdCache.forEach((v, k) => { obj[k] = v; });
    fs.writeFileSync(nvdCacheFile, JSON.stringify(obj, null, 2), 'utf8');
  } catch {}
}

function loadSslCache() {
  try { return JSON.parse(fs.readFileSync(sslCacheFile, 'utf8')); } catch { return {}; }
}

function saveSslCache(cache) {
  fs.writeFileSync(sslCacheFile, JSON.stringify(cache, null, 2), 'utf8');
}

function loadVendors() {
  try { return JSON.parse(fs.readFileSync(vendorRegistryFile, 'utf8')); } catch { return []; }
}

function httpsGet(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const opts = Object.assign({ headers: { 'User-Agent': 'McCain-EA-Platform/1.0', ...headers } }, require('url').parse(url));
    https.get(opts, res => {
      let data = '';
      res.on('data', d => { data += d; });
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    }).on('error', reject);
  });
}

function getCveUrl(keyword) {
  const encoded = encodeURIComponent(keyword);
  const apiKey = process.env.NVD_API_KEY;
  const keyParam = apiKey ? `&apiKey=${encodeURIComponent(apiKey)}` : '';
  return `https://services.nvd.nist.gov/rest/json/cves/2.0?keywordSearch=${encoded}&resultsPerPage=30${keyParam}`;
}

async function fetchNvdData(keyword) {
  if (!process.env.NVD_API_KEY) {
    return { keyword, cveCount: 0, highestCvss: 0, severity: 'None', topCves: [], nvdKeyMissing: true };
  }

  const cacheKey = keyword.toLowerCase().trim();
  const cached = nvdCache.get(cacheKey);
  if (cached && (Date.now() - cached.fetchedAt) < NVD_CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    const result = await httpsGet(getCveUrl(keyword));
    if (result.status !== 200 || !result.body || !result.body.vulnerabilities) {
      const data = { keyword, cveCount: 0, highestCvss: 0, severity: 'None', topCves: [], fetchedAt: new Date().toISOString() };
      nvdCache.set(cacheKey, { data, fetchedAt: Date.now() });
      saveNvdDiskCache();
      return data;
    }
    const vulns = result.body.vulnerabilities || [];
    let highestCvss = 0;
    const topCves = [];

    vulns.forEach(v => {
      const cve = v.cve;
      if (!cve) return;
      const cveId = cve.id;
      let score = 0;
      const metrics = cve.metrics;
      if (metrics) {
        const cvssV31 = metrics.cvssMetricV31 && metrics.cvssMetricV31[0];
        const cvssV30 = metrics.cvssMetricV30 && metrics.cvssMetricV30[0];
        const cvssV2 = metrics.cvssMetricV2 && metrics.cvssMetricV2[0];
        if (cvssV31) score = cvssV31.cvssData?.baseScore || 0;
        else if (cvssV30) score = cvssV30.cvssData?.baseScore || 0;
        else if (cvssV2) score = cvssV2.cvssData?.baseScore || 0;
      }
      if (score > highestCvss) highestCvss = score;
      if (topCves.length < 5) {
        const desc = cve.descriptions && cve.descriptions.find(d => d.lang === 'en');
        topCves.push({
          id: cveId,
          score,
          description: desc ? desc.value.substring(0, 120) + '...' : '',
          url: `https://nvd.nist.gov/vuln/detail/${cveId}`
        });
      }
    });

    topCves.sort((a, b) => b.score - a.score);

    let severity = 'None';
    if (highestCvss >= 9.0) severity = 'Critical';
    else if (highestCvss >= 7.0) severity = 'High';
    else if (highestCvss >= 4.0) severity = 'Medium';
    else if (highestCvss > 0) severity = 'Low';

    const data = {
      keyword,
      cveCount: vulns.length,
      highestCvss: Math.round(highestCvss * 10) / 10,
      severity,
      topCves,
      fetchedAt: new Date().toISOString()
    };

    nvdCache.set(cacheKey, { data, fetchedAt: Date.now() });
    saveNvdDiskCache();
    return data;
  } catch (err) {
    return { keyword, cveCount: 0, highestCvss: 0, severity: 'None', topCves: [], error: err.message };
  }
}

function extractTechKeywords(intake) {
  const techs = new Set();
  const hm = (intake.hostingModel || intake.hosting_model || '').toLowerCase();
  if (hm.includes('azure')) techs.add('Microsoft Azure');
  if (hm.includes('aws')) techs.add('AWS');
  if (hm.includes('saas')) techs.add('SaaS');
  const at = intake.architectureType || intake.architecture_type || '';
  if (at.includes('OT')) { techs.add('SCADA'); techs.add('Modbus'); techs.add('OPC-UA'); }
  if (at.includes('API')) techs.add('API Gateway');
  (intake.components || []).forEach(c => { if (c && c.trim()) techs.add(c.trim()); });
  const notes = intake.techStackNotes || intake.tech_stack_notes || '';
  ['Node.js','Python','Java','Azure','Kubernetes','Docker','Terraform','Nginx','Redis','PostgreSQL','MongoDB'].forEach(t => {
    if (notes.toLowerCase().includes(t.toLowerCase())) techs.add(t);
  });
  const list = [...techs].slice(0, 12);
  return list.length ? list : ['Node.js', 'Azure'];
}

function buildScaSignals(intake) {
  const techs = extractTechKeywords(intake);
  let criticalCount = 0;
  let highCount = 0;
  techs.forEach(t => {
    const cacheKey = t.toLowerCase().trim();
    const cached = nvdCache.get(cacheKey);
    if (cached && (Date.now() - cached.fetchedAt) < NVD_CACHE_TTL_MS) {
      if (cached.data.severity === 'Critical') criticalCount++;
      else if (cached.data.severity === 'High') highCount++;
    }
  });
  return { criticalCount, highCount };
}

async function buildScaSignalsAsync(intake, timeoutMs = 8000) {
  const techs = extractTechKeywords(intake);
  let criticalCount = 0;
  let highCount = 0;
  try {
    const fetchWithTimeout = (t) => Promise.race([
      fetchNvdData(t),
      new Promise(resolve => setTimeout(() => resolve(null), timeoutMs))
    ]);
    const results = await Promise.all(techs.map(t => fetchWithTimeout(t)));
    results.forEach(r => {
      if (!r) return;
      if (r.severity === 'Critical') criticalCount++;
      else if (r.severity === 'High') highCount++;
    });
  } catch {}
  return { criticalCount, highCount };
}

function getSslCacheForDomain(domain) {
  if (!domain) return null;
  const key = domain.toLowerCase();
  const cache = loadSslCache();
  const entry = cache[key];
  if (!entry) {
    const vendors = loadVendors();
    const v = vendors.find(v2 => v2.domain && v2.domain.toLowerCase() === key && v2.sslCache);
    if (v && v.sslCache) {
      const age = Date.now() - new Date(v.sslCache.fetchedAt).getTime();
      if (age <= NVD_CACHE_TTL_MS) return v.sslCache;
    }
    return null;
  }
  const age = Date.now() - new Date(entry.fetchedAt).getTime();
  if (age > NVD_CACHE_TTL_MS) return null;
  return entry;
}

async function inspectSslForDomain(domain, cfToken) {
  const cfHeaders = { 'Authorization': `Bearer ${cfToken}`, 'Content-Type': 'application/json' };

  let sslData = {
    grade: 'Unknown',
    protocol: null,
    mode: null,
    minTlsVersion: null,
    findings: [],
    fetchedAt: new Date().toISOString()
  };

  const zoneResult = await httpsGet(
    `https://api.cloudflare.com/client/v4/zones?name=${domain}`,
    cfHeaders
  );

  if (zoneResult.status === 200 && zoneResult.body && zoneResult.body.success) {
    const zones = zoneResult.body.result || [];
    if (zones.length > 0) {
      const zone = zones[0];
      sslData.zoneId = zone.id;

      const [sslModeRes, minTlsRes, tlsRecommendRes] = await Promise.all([
        httpsGet(`https://api.cloudflare.com/client/v4/zones/${zone.id}/settings/ssl`, cfHeaders),
        httpsGet(`https://api.cloudflare.com/client/v4/zones/${zone.id}/settings/min_tls_version`, cfHeaders),
        httpsGet(`https://api.cloudflare.com/client/v4/zones/${zone.id}/ssl/recommendation`, cfHeaders)
      ]);

      let sslMode = null;
      if (sslModeRes.status === 200 && sslModeRes.body && sslModeRes.body.success) {
        sslMode = sslModeRes.body.result?.value;
        sslData.mode = sslMode;
      }

      let minTls = null;
      if (minTlsRes.status === 200 && minTlsRes.body && minTlsRes.body.success) {
        minTls = minTlsRes.body.result?.value;
        sslData.minTlsVersion = minTls;
      }

      let recommendation = null;
      if (tlsRecommendRes.status === 200 && tlsRecommendRes.body && tlsRecommendRes.body.success) {
        recommendation = tlsRecommendRes.body.result;
      }

      const findings = [];
      let gradePoints = 0;

      if (sslMode === 'strict') {
        gradePoints += 40;
        findings.push('SSL mode: Full (Strict) — end-to-end encryption with certificate validation');
      } else if (sslMode === 'full') {
        gradePoints += 30;
        findings.push('SSL mode: Full — end-to-end encryption (certificate not validated)');
      } else if (sslMode === 'flexible') {
        gradePoints += 10;
        findings.push('SSL mode: Flexible — origin traffic may be unencrypted (weak)');
      } else if (sslMode === 'off') {
        gradePoints = -100;
        findings.push('SSL disabled — all traffic transmitted unencrypted');
      } else {
        findings.push('SSL mode could not be determined');
      }

      if (minTls === '1.3') { gradePoints += 20; findings.push('Minimum TLS: 1.3 (excellent)'); }
      else if (minTls === '1.2') { gradePoints += 10; findings.push('Minimum TLS: 1.2'); }
      else if (minTls === '1.1' || minTls === '1.0') { gradePoints -= 10; findings.push(`Minimum TLS: ${minTls} (outdated — upgrade recommended)`); }
      sslData.protocol = minTls ? `TLS ${minTls}` : 'TLS 1.2';

      if (recommendation) {
        if (recommendation.id === 'ssl_strict') { gradePoints += 10; findings.push('Cloudflare recommends Full Strict mode'); }
        else if (recommendation.id === 'ssl_full') { gradePoints += 5; }
      }

      if (sslMode === 'off') {
        sslData.grade = 'F';
      } else if (gradePoints >= 60) {
        sslData.grade = 'A+';
      } else if (gradePoints >= 40) {
        sslData.grade = 'A';
      } else if (gradePoints >= 20) {
        sslData.grade = 'B';
      } else if (gradePoints >= 10) {
        sslData.grade = 'C';
      } else {
        sslData.grade = 'F';
      }

      sslData.findings = findings;
    } else {
      sslData.grade = 'Unknown';
      sslData.findings = ['Domain not found in Cloudflare — may not use Cloudflare CDN/proxy'];
    }
  } else if (zoneResult.status === 403 || zoneResult.status === 401) {
    sslData.grade = 'Unknown';
    sslData.findings = ['Cloudflare API authentication failed — verify CLOUDFLARE_API_TOKEN permissions'];
  } else {
    sslData.grade = 'Unknown';
    sslData.findings = ['Could not retrieve SSL data from Cloudflare API'];
  }

  const cache = loadSslCache();
  cache[domain.toLowerCase()] = sslData;
  saveSslCache(cache);

  const vendors = loadVendors();
  let registryChanged = false;
  vendors.forEach((v, i) => {
    if (v.domain && v.domain.toLowerCase() === domain.toLowerCase()) {
      vendors[i] = { ...v, sslCache: sslData };
      registryChanged = true;
    }
  });
  if (registryChanged) {
    fs.writeFileSync(vendorRegistryFile, JSON.stringify(vendors, null, 2), 'utf8');
  }

  return sslData;
}

loadNvdDiskCache();

router.post('/cvss', async (req, res) => {
  const { technologies } = req.body;
  if (!Array.isArray(technologies) || technologies.length === 0) {
    return res.status(400).json({ error: 'technologies array required' });
  }
  if (!process.env.NVD_API_KEY) {
    return res.status(503).json({ error: 'nvd_key_missing' });
  }
  const unique = [...new Set(technologies.map(t => t.trim()).filter(Boolean))].slice(0, 15);
  try {
    const results = await Promise.all(unique.map(t => fetchNvdData(t)));
    const criticalCount = results.filter(r => r.severity === 'Critical').length;
    const highCount = results.filter(r => r.severity === 'High').length;
    let overallRisk = 'Low';
    if (criticalCount > 0) overallRisk = 'Critical';
    else if (highCount >= 2) overallRisk = 'High';
    else if (highCount >= 1) overallRisk = 'Medium';
    res.json({ results, overallRisk, criticalCount, highCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/ssl/:vendorId', async (req, res) => {
  const vendorId = parseInt(req.params.vendorId);
  const vendors = loadVendors();
  const vendor = vendors.find(v => v.id === vendorId);
  if (!vendor) return res.status(404).json({ error: 'Vendor not found' });
  if (!vendor.domain) return res.status(400).json({ error: 'Vendor has no domain configured' });

  const domain = vendor.domain.toLowerCase();
  const cached = getSslCacheForDomain(domain);
  if (cached) {
    return res.json({ vendorId, domain: vendor.domain, ssl: cached, cached: true });
  }

  const cfToken = process.env.CLOUDFLARE_API_TOKEN;
  if (!cfToken) {
    const mockSsl = {
      grade: 'Unknown',
      protocol: 'Unknown',
      findings: ['Cloudflare API token not configured'],
      fetchedAt: new Date().toISOString(),
      mock: true
    };
    const cache = loadSslCache();
    cache[domain] = mockSsl;
    saveSslCache(cache);
    const allVendors = loadVendors();
    let changed = false;
    allVendors.forEach((v, i) => {
      if (v.domain && v.domain.toLowerCase() === domain) {
        allVendors[i] = { ...v, sslCache: mockSsl };
        changed = true;
      }
    });
    if (changed) fs.writeFileSync(vendorRegistryFile, JSON.stringify(allVendors, null, 2), 'utf8');
    return res.json({ vendorId, domain: vendor.domain, ssl: mockSsl, cached: false });
  }

  try {
    const sslData = await inspectSslForDomain(domain, cfToken);
    res.json({ vendorId, domain: vendor.domain, ssl: sslData, cached: false });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/ssl/:vendorId', (req, res) => {
  const vendorId = parseInt(req.params.vendorId);
  const vendors = loadVendors();
  const vendor = vendors.find(v => v.id === vendorId);
  if (!vendor) return res.status(404).json({ error: 'Vendor not found' });
  const ssl = vendor.domain ? getSslCacheForDomain(vendor.domain.toLowerCase()) : null;
  res.json({ vendorId, domain: vendor.domain, ssl, cached: !!ssl });
});

router.post('/mitre', (req, res) => {
  const intake = req.body;
  try {
    const mapping = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'mitreMapping.json'), 'utf8'));

    const compReqs = intake.complianceRequirements || intake.compliance_requirements || [];
    const archType = (intake.architectureType || intake.architecture_type || '').toLowerCase();
    const components = intake.components || [];
    const isOtScada = compReqs.some(r => r.includes('IEC 62443') || r.includes('OT')) ||
      archType.includes('ot') || archType.includes('ics') || archType.includes('scada') ||
      components.some(c => ['SCADA', 'PLC', 'HMI', 'DCS', 'OPC-UA', 'Historian'].some(ot => c.toLowerCase().includes(ot.toLowerCase())));

    const hm = (intake.hostingModel || intake.hosting_model || '').toLowerCase();
    const isCloud = hm.includes('cloud') || hm.includes('saas') || hm.includes('paas') ||
      hm.includes('azure') || hm.includes('aws');

    const intPoints = intake.integrationPoints || intake.integration_points || 0;
    const dataTypes = intake.dataTypes || intake.data_types || [];
    const dataClass = intake.dataClassification || intake.data_classification || 'Internal';

    const vendorCount = ((intake.vendorIds || intake.vendor_ids || []).length +
      (intake.newVendors || intake.new_vendors || []).length);
    const ctx = {
      isPublicFacing: !!(intake.isPublicFacing || intake.is_public_facing),
      hasLegacyDependencies: !!(intake.hasLegacyDependencies || intake.has_legacy_dependencies),
      hasMfa_false: !(intake.hasMfa || intake.has_mfa),
      hasWaf_false: !(intake.hasWaf || intake.has_waf),
      hasMonitoring_false: !(intake.hasMonitoring || intake.has_monitoring),
      isZeroTrustAligned_false: !(intake.isZeroTrustAligned || intake.is_zero_trust_aligned),
      encryptionAtRest_false: !(intake.encryptionAtRest || intake.encryption_at_rest),
      externalDataSharing: !!(intake.externalDataSharing || intake.external_data_sharing),
      hostingModel_cloud: isCloud,
      integrationPoints_high: intPoints > 4,
      vendorCount_high: vendorCount > 3,
      dataTypes_pii: dataTypes.some(t => t.includes('PII') || t.includes('PHI')),
      dataTypes_credentials: dataTypes.includes('Credentials/Secrets'),
      dataTypes_ot: dataTypes.includes('OT/SCADA Data'),
      dataClassification_sensitive: ['Confidential', 'Restricted'].includes(dataClass),
      otScada: isOtScada
    };

    function matchesTechnique(technique) {
      return technique.conditions.every(c => !!ctx[c]);
    }

    const matched = [];
    const tacticsList = [...mapping.tactics];
    if (isOtScada) {
      mapping.ics_tactics.forEach(t => tacticsList.push(t));
    }

    tacticsList.forEach(tactic => {
      const matchedTechniques = tactic.techniques.filter(t => matchesTechnique(t));
      if (matchedTechniques.length > 0) {
        matched.push({
          tacticId: tactic.id,
          tacticName: tactic.name,
          techniques: matchedTechniques.map(t => ({
            id: t.id,
            name: t.name,
            reason: t.reason,
            mitigation: t.mitigation,
            url: t.url
          }))
        });
      }
    });

    const totalTechniques = matched.reduce((s, t) => s + t.techniques.length, 0);
    let riskLevel = 'Low';
    if (totalTechniques >= 12) riskLevel = 'Critical';
    else if (totalTechniques >= 7) riskLevel = 'High';
    else if (totalTechniques >= 3) riskLevel = 'Medium';

    res.json({
      tactics: matched,
      totalTechniques,
      riskLevel,
      isOtScada,
      context: {
        isPublicFacing: ctx.isPublicFacing,
        hasMfa: !ctx.hasMfa_false,
        hasWaf: !ctx.hasWaf_false,
        hasMonitoring: !ctx.hasMonitoring_false,
        isZeroTrustAligned: !ctx.isZeroTrustAligned_false,
        integrationPoints: intPoints,
        isCloud,
        isOtScada
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
module.exports.buildScaSignals = buildScaSignals;
module.exports.buildScaSignalsAsync = buildScaSignalsAsync;
module.exports.getSslCacheForDomain = getSslCacheForDomain;
module.exports.extractTechKeywords = extractTechKeywords;
module.exports.fetchNvdData = fetchNvdData;
