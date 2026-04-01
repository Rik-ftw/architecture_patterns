const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const https = require('https');

const RADAR_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const radarCacheFile = path.join(__dirname, '..', 'data', 'radarCache.json');

const radarCache = new Map();

function loadRadarDiskCache() {
  try {
    const raw = JSON.parse(fs.readFileSync(radarCacheFile, 'utf8'));
    Object.entries(raw).forEach(([k, v]) => radarCache.set(k, v));
  } catch {}
}

function saveRadarDiskCache() {
  try {
    const obj = {};
    radarCache.forEach((v, k) => { obj[k] = v; });
    fs.writeFileSync(radarCacheFile, JSON.stringify(obj, null, 2), 'utf8');
  } catch {}
}

function httpsRequest(method, url, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const parsed = require('url').parse(url);
    const opts = {
      hostname: parsed.hostname,
      path: parsed.path,
      method,
      headers: {
        'User-Agent': 'McCain-EA-Platform/1.0',
        'Accept': 'application/json',
        ...headers
      }
    };
    if (body) {
      const bodyStr = JSON.stringify(body);
      opts.headers['Content-Type'] = 'application/json';
      opts.headers['Content-Length'] = Buffer.byteLength(bodyStr);
    }
    const req = https.request(opts, res => {
      let data = '';
      res.on('data', d => { data += d; });
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function fetchRadarDomainCategories(domain, token) {
  const url = `https://api.cloudflare.com/client/v4/radar/domains/top?name=${encodeURIComponent(domain)}&limit=5`;
  try {
    const r = await httpsRequest('GET', url, { 'Authorization': `Bearer ${token}` });
    if (r.status === 200 && r.body && r.body.success) {
      return r.body.result || {};
    }
  } catch {}
  return null;
}

async function fetchRadarUrlScan(domain, token) {
  const scanUrl = `https://api.cloudflare.com/client/v4/radar/url-scanner/scan`;
  try {
    const createRes = await httpsRequest('POST', scanUrl, { 'Authorization': `Bearer ${token}` }, {
      url: `https://${domain}`,
      screenshotsResolutions: ['desktop'],
      visibility: 'Unlisted'
    });

    if (createRes.status !== 200 || !createRes.body || !createRes.body.success) {
      return { error: 'Could not initiate URL scan', status: createRes.status };
    }

    const uuid = createRes.body.result && createRes.body.result.uuid;
    if (!uuid) return { error: 'No scan UUID returned' };

    for (let attempt = 0; attempt < 8; attempt++) {
      await sleep(3000);
      const resultUrl = `https://api.cloudflare.com/client/v4/radar/url-scanner/scan/${uuid}`;
      const pollRes = await httpsRequest('GET', resultUrl, { 'Authorization': `Bearer ${token}` });
      if (pollRes.status === 200 && pollRes.body && pollRes.body.success) {
        const scan = pollRes.body.result || {};
        return parseScanResult(scan);
      }
    }
    return { error: 'URL scan timed out' };
  } catch (err) {
    return { error: err.message };
  }
}

function parseScanResult(scan) {
  const page = scan.scan || scan;
  const meta = page.meta || {};
  const dom = page.dom || {};
  const resources = page.links || [];

  const secHeaders = {};
  const rawHeaders = (meta.http && meta.http.responseHeaders) || {};
  const importantHeaders = [
    'strict-transport-security',
    'content-security-policy',
    'x-frame-options',
    'x-content-type-options',
    'referrer-policy',
    'permissions-policy'
  ];
  importantHeaders.forEach(h => {
    secHeaders[h] = !!(rawHeaders[h] || rawHeaders[h.toLowerCase()]);
  });

  const technologies = [];
  const techs = (page.technologies || meta.technologies || []);
  techs.forEach(t => {
    const name = t.name || t;
    if (name && !technologies.includes(name)) technologies.push(name);
  });

  const tlsCert = meta.tls || null;
  const verdict = (page.verdict || meta.verdict || {});
  const malicious = verdict.malicious || false;
  const categories = verdict.categories || [];
  const tags = verdict.tags || [];

  return {
    scanned: true,
    securityHeaders: secHeaders,
    technologies: technologies.slice(0, 20),
    tlsCert: tlsCert ? {
      issuer: tlsCert.issuer || null,
      validTo: tlsCert.validTo || null,
      protocol: tlsCert.protocol || null
    } : null,
    verdict: {
      malicious,
      categories,
      tags
    }
  };
}

async function fetchRadarDnsSummary(domain, token) {
  const url = `https://api.cloudflare.com/client/v4/radar/dns/summary/protocol?dateRange=7d&name=${encodeURIComponent(domain)}`;
  try {
    const r = await httpsRequest('GET', url, { 'Authorization': `Bearer ${token}` });
    if (r.status === 200 && r.body && r.body.success) {
      return r.body.result || null;
    }
  } catch {}
  return null;
}

async function fetchRadarDnsTopLocations(domain, token) {
  const url = `https://api.cloudflare.com/client/v4/radar/dns/top/locations?name=${encodeURIComponent(domain)}&limit=5`;
  try {
    const r = await httpsRequest('GET', url, { 'Authorization': `Bearer ${token}` });
    if (r.status === 200 && r.body && r.body.success) {
      return r.body.result || null;
    }
  } catch {}
  return null;
}

async function fetchRadarDomainDetails(domain, token) {
  const url = `https://api.cloudflare.com/client/v4/radar/domains/${encodeURIComponent(domain)}`;
  try {
    const r = await httpsRequest('GET', url, { 'Authorization': `Bearer ${token}` });
    if (r.status === 200 && r.body && r.body.success) {
      return r.body.result || null;
    }
  } catch {}
  return null;
}

async function fetchDnsSecStatus(domain) {
  try {
    const url = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=DNSKEY`;
    const r = await httpsRequest('GET', url, { 'Accept': 'application/dns-json' });
    if (r.status === 200 && r.body) {
      const status = r.body.Status;
      const hasRrsig = (r.body.Answer || []).some(a => a.type === 46);
      const hasDnskey = (r.body.Answer || []).some(a => a.type === 48);
      return {
        enabled: hasDnskey && hasRrsig,
        status: status === 0 ? 'OK' : `Error (${status})`,
        authenticated: r.body.AD === true
      };
    }
  } catch {}
  return { enabled: false, status: 'Unknown', authenticated: false };
}

async function fetchDnsMxRecords(domain) {
  try {
    const url = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=MX`;
    const r = await httpsRequest('GET', url, { 'Accept': 'application/dns-json' });
    if (r.status === 200 && r.body) {
      const mx = (r.body.Answer || []).filter(a => a.type === 15).map(a => a.data);
      return mx;
    }
  } catch {}
  return [];
}

async function fetchDnsTxtRecords(domain) {
  try {
    const url = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=TXT`;
    const r = await httpsRequest('GET', url, { 'Accept': 'application/dns-json' });
    if (r.status === 200 && r.body) {
      const txt = (r.body.Answer || []).filter(a => a.type === 16).map(a => (a.data || '').replace(/"/g, ''));
      return txt;
    }
  } catch {}
  return [];
}

function calculateVendorRiskGrade(signals) {
  let points = 100;
  const breakdown = {};

  const THREAT_MAX = 100;
  const DNS_MAX = 30;
  const SSL_MAX = 25;
  const HEADERS_MAX = 8;
  const CVE_MAX = 15;

  const threat = signals.threat || {};
  let threatDeductions = 0;
  if (threat.malicious) threatDeductions += 40;
  if (threat.phishing) threatDeductions += 30;
  if (threat.botnet) threatDeductions += 20;
  if (threat.spam) threatDeductions += 10;
  threatDeductions = Math.min(threatDeductions, THREAT_MAX);
  points -= threatDeductions;
  breakdown.threat = { label: 'Threat Intel', deduction: threatDeductions, max: THREAT_MAX };

  const dns = signals.dns || {};
  let dnsDeductions = 0;
  if (!dns.dnssecEnabled) dnsDeductions += 15;
  if (!dns.hasMx) dnsDeductions += 5;
  if (!dns.hasSPF) dnsDeductions += 5;
  if (!dns.hasDMARC) dnsDeductions += 5;
  dnsDeductions = Math.min(dnsDeductions, DNS_MAX);
  points -= dnsDeductions;
  breakdown.dns = { label: 'DNS Health', deduction: dnsDeductions, max: DNS_MAX };

  const ssl = signals.ssl || {};
  let sslDeductions = 0;
  const sslGrade = ssl.grade || 'Unknown';
  if (sslGrade === 'F') sslDeductions += 25;
  else if (sslGrade === 'C') sslDeductions += 15;
  else if (sslGrade === 'B') sslDeductions += 8;
  else if (sslGrade === 'Unknown') sslDeductions += 5;
  sslDeductions = Math.min(sslDeductions, SSL_MAX);
  points -= sslDeductions;
  breakdown.ssl = { label: 'SSL / TLS', deduction: sslDeductions, max: SSL_MAX };

  const urlScan = signals.urlScan || {};
  let headerDeductions = 0;
  const scanUnavailable = !urlScan.scanned && (urlScan.note || urlScan.error);
  if (!scanUnavailable) {
    const secHeaders = urlScan.securityHeaders || {};
    const headerChecks = ['strict-transport-security', 'content-security-policy', 'x-frame-options', 'x-content-type-options'];
    let missingHeaders = 0;
    headerChecks.forEach(h => { if (!secHeaders[h]) missingHeaders++; });
    headerDeductions = Math.min(missingHeaders * 2, HEADERS_MAX);
  }
  points -= headerDeductions;
  breakdown.headers = {
    label: 'Security Headers',
    deduction: headerDeductions,
    max: HEADERS_MAX,
    unavailable: scanUnavailable ? true : undefined
  };

  const cves = signals.cves || {};
  let cveDeductions = 0;
  if (cves.severity === 'Critical') cveDeductions = 15;
  else if (cves.severity === 'High') cveDeductions = 10;
  else if (cves.severity === 'Medium') cveDeductions = 5;
  cveDeductions = Math.min(cveDeductions, CVE_MAX);
  points -= cveDeductions;
  breakdown.cves = { label: 'Known CVEs', deduction: cveDeductions, max: CVE_MAX };

  const finalScore = Math.max(0, Math.min(100, points));

  let grade;
  if (signals.threat && signals.threat.malicious) {
    grade = 'F';
  } else if (finalScore >= 90) {
    grade = 'A';
  } else if (finalScore >= 75) {
    grade = 'B';
  } else if (finalScore >= 60) {
    grade = 'C';
  } else if (finalScore >= 45) {
    grade = 'D';
  } else {
    grade = 'F';
  }

  return { grade, score: finalScore, breakdown };
}

function resolveDomainFromName(input) {
  const fs2 = require('fs');
  const path2 = require('path');
  try {
    const registry = JSON.parse(fs2.readFileSync(path2.join(__dirname, '..', 'vendors', 'registry.json'), 'utf8'));
    const lc = input.toLowerCase();
    const match = registry.find(v =>
      (v.vendorCompany && v.vendorCompany.toLowerCase() === lc) ||
      (v.vendorCompany && v.vendorCompany.toLowerCase().startsWith(lc)) ||
      (v.domain && v.domain.toLowerCase() === lc)
    );
    if (match && match.domain) {
      return { domain: match.domain.toLowerCase().replace(/^www\./, ''), vendorName: match.vendorCompany };
    }
  } catch {}
  return null;
}

function isDomain(input) {
  return /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+$/.test(input);
}

async function buildVendorIntelReport(domain, token, resolvedVendorName) {
  const cacheKey = domain.toLowerCase();
  const cached = radarCache.get(cacheKey);
  if (cached && (Date.now() - cached.fetchedAt) < RADAR_CACHE_TTL_MS) {
    return { ...cached.data, cached: true };
  }

  const report = {
    domain,
    fetchedAt: new Date().toISOString(),
    cached: false
  };

  if (resolvedVendorName) report.resolvedVendorName = resolvedVendorName;

  const noToken = !token;

  const [dnssec, mxRecords, txtRecords] = await Promise.all([
    fetchDnsSecStatus(domain),
    fetchDnsMxRecords(domain),
    fetchDnsTxtRecords(domain)
  ]);

  const hasSPF = txtRecords.some(t => t.startsWith('v=spf1'));
  const hasDMARC = txtRecords.some(t => t.startsWith('v=DMARC1'));

  report.dns = {
    dnssecEnabled: dnssec.enabled,
    dnssecStatus: dnssec.status,
    dnssecAuthenticated: dnssec.authenticated,
    hasMx: mxRecords.length > 0,
    mxRecords: mxRecords.slice(0, 5),
    hasSPF,
    hasDMARC,
    spfRecord: txtRecords.find(t => t.startsWith('v=spf1')) || null,
    dmarcRecord: txtRecords.find(t => t.startsWith('v=DMARC1')) || null,
    radarSummary: null
  };

  if (noToken) {
    report.threat = {
      malicious: false,
      phishing: false,
      botnet: false,
      spam: false,
      categories: [],
      note: 'Cloudflare Radar token not configured — threat intel unavailable'
    };
    report.urlScan = {
      scanned: false,
      note: 'Cloudflare Radar token not configured — URL scan unavailable',
      securityHeaders: {},
      technologies: [],
      tlsCert: null,
      verdict: { malicious: false, categories: [], tags: [] }
    };
  } else {
    const [domainDetails, urlScan, radarDnsSummary, radarDnsLocations] = await Promise.all([
      fetchRadarDomainDetails(domain, token),
      fetchRadarUrlScan(domain, token),
      fetchRadarDnsSummary(domain, token),
      fetchRadarDnsTopLocations(domain, token)
    ]);

    if (radarDnsSummary || radarDnsLocations) {
      report.dns.radarSummary = {
        protocol: radarDnsSummary || null,
        topLocations: radarDnsLocations ? (radarDnsLocations.locations || radarDnsLocations.top_0 || []).slice(0, 5) : []
      };
    }

    const cats = (domainDetails && domainDetails.categories) || [];
    const maliciousCats = ['Malware', 'Phishing', 'Spam', 'Botnet', 'Command and Control'];
    const phishingCats = ['Phishing'];
    const botnetCats = ['Botnet', 'Command and Control'];
    const spamCats = ['Spam'];

    report.threat = {
      malicious: cats.some(c => maliciousCats.includes(c.name || c)),
      phishing: cats.some(c => phishingCats.includes(c.name || c)),
      botnet: cats.some(c => botnetCats.includes(c.name || c)),
      spam: cats.some(c => spamCats.includes(c.name || c)),
      categories: cats.map(c => c.name || c).slice(0, 10),
      rank: domainDetails ? (domainDetails.rank || null) : null
    };

    if (urlScan && !urlScan.error) {
      report.urlScan = urlScan;
      if (urlScan.verdict && urlScan.verdict.malicious) {
        report.threat.malicious = true;
      }
    } else {
      report.urlScan = {
        scanned: false,
        error: urlScan ? urlScan.error : 'Scan not available',
        securityHeaders: {},
        technologies: [],
        tlsCert: null,
        verdict: { malicious: false, categories: [], tags: [] }
      };
    }
  }

  const { getSslCacheForDomain, fetchNvdData } = require('./riskEnrichment');
  const sslData = getSslCacheForDomain(domain);
  report.ssl = sslData ? {
    grade: sslData.grade,
    protocol: sslData.protocol,
    mode: sslData.mode,
    findings: sslData.findings || [],
    fetchedAt: sslData.fetchedAt
  } : { grade: 'Unknown', findings: ['SSL not yet inspected — run SSL check from Vendor Registry'] };

  const cveKeyword = resolvedVendorName || domain.split('.')[0];
  try {
    const cveData = await fetchNvdData(cveKeyword);
    report.cves = cveData;
  } catch {
    report.cves = { keyword: cveKeyword, cveCount: 0, highestCvss: 0, severity: 'None', topCves: [], error: 'CVE lookup failed' };
  }

  radarCache.set(cacheKey, { data: report, fetchedAt: Date.now() });
  saveRadarDiskCache();

  return report;
}

loadRadarDiskCache();

router.get('/', (req, res) => {
  const { domain } = req.query;
  if (!domain) return res.status(400).json({ error: 'domain query param required' });
  const cacheKey = domain.toLowerCase().replace(/^https?:\/\//i, '').replace(/\/.*/,'');
  const cached = radarCache.get(cacheKey);
  if (cached && (Date.now() - cached.fetchedAt) < RADAR_CACHE_TTL_MS) {
    return res.json({ ...cached.data, cached: true });
  }
  res.json({ domain: cacheKey, cached: false, noData: true });
});

router.post('/', async (req, res) => {
  let { domain } = req.body;
  if (!domain) return res.status(400).json({ error: 'domain required' });
  let input = domain.toLowerCase().trim()
    .replace(/^https?:\/\//i, '')
    .replace(/\/.*/,'')
    .replace(/^www\./, '');

  let resolvedVendorName = null;

  if (!isDomain(input)) {
    const resolved = resolveDomainFromName(input);
    if (resolved) {
      input = resolved.domain;
      resolvedVendorName = resolved.vendorName;
    } else {
      return res.status(400).json({
        error: `"${input}" does not appear to be a valid domain and no matching vendor was found in the registry. Try entering a domain like "claroty.com".`
      });
    }
  } else {
    const resolved = resolveDomainFromName(input);
    if (resolved) resolvedVendorName = resolved.vendorName;
  }

  const token = process.env.CLOUDFLARE_RADAR_TOKEN;

  try {
    const reportBase = await buildVendorIntelReport(input, token, resolvedVendorName || undefined);
    const signals = {
      threat: reportBase.threat,
      dns: { dnssecEnabled: reportBase.dns.dnssecEnabled, hasMx: reportBase.dns.hasMx, hasSPF: reportBase.dns.hasSPF, hasDMARC: reportBase.dns.hasDMARC },
      ssl: reportBase.ssl,
      urlScan: reportBase.urlScan,
      cves: reportBase.cves || {}
    };
    const riskGrade = calculateVendorRiskGrade(signals);
    res.json({ ...reportBase, resolvedVendorName, riskGrade });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/cves', async (req, res) => {
  const { domain } = req.body;
  if (!domain) return res.status(400).json({ error: 'domain required' });
  const { fetchNvdData } = require('./riskEnrichment');
  if (!fetchNvdData) return res.status(501).json({ error: 'NVD lookup not available' });
  const vendorName = domain.split('.')[0];
  try {
    const cveData = await fetchNvdData(vendorName);
    res.json(cveData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
module.exports.buildVendorIntelReport = buildVendorIntelReport;
module.exports.calculateVendorRiskGrade = calculateVendorRiskGrade;
