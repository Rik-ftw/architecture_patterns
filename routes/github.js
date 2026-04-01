const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const REPO = 'Rik-ftw/architecture_patterns';
const BRANCH = 'dev';
const PATTERNS_DIR = path.join(__dirname, '..', 'patterns');
const GITHUB_API = 'https://api.github.com';

function getToken() {
  const token = process.env.GITHUB_PAT;
  if (!token) throw new Error('GITHUB_PAT secret is not configured');
  return token;
}

async function ghFetch(url, options = {}) {
  const { default: fetch } = await import('node-fetch');
  const res = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${getToken()}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`GitHub API error ${res.status}: ${body.message || JSON.stringify(body)}`);
  return body;
}

async function ensureBranchExists() {
  try {
    await ghFetch(`${GITHUB_API}/repos/${REPO}/git/ref/heads/${BRANCH}`);
  } catch (e) {
    if (!e.message.includes('404')) throw e;
    const defaultBranch = await ghFetch(`${GITHUB_API}/repos/${REPO}`);
    const baseSha = await ghFetch(`${GITHUB_API}/repos/${REPO}/git/ref/heads/${defaultBranch.default_branch}`);
    await ghFetch(`${GITHUB_API}/repos/${REPO}/git/refs`, {
      method: 'POST',
      body: JSON.stringify({ ref: `refs/heads/${BRANCH}`, sha: baseSha.object.sha })
    });
  }
}

async function getExistingFileSha(filePath) {
  try {
    const data = await ghFetch(`${GITHUB_API}/repos/${REPO}/contents/${filePath}?ref=${BRANCH}`);
    return data.sha;
  } catch {
    return null;
  }
}

async function upsertFile(repoPath, content, message) {
  const sha = await getExistingFileSha(repoPath);
  const body = {
    message,
    content: Buffer.from(content).toString('base64'),
    branch: BRANCH
  };
  if (sha) body.sha = sha;
  return ghFetch(`${GITHUB_API}/repos/${REPO}/contents/${repoPath}`, {
    method: 'PUT',
    body: JSON.stringify(body)
  });
}

router.post('/sync-patterns', async (req, res) => {
  try {
    const files = fs.readdirSync(PATTERNS_DIR);
    const jsonFiles = files.filter(f => f.endsWith('.json'));
    const svgFiles = files.filter(f => f.endsWith('.svg'));

    if (jsonFiles.length === 0) return res.status(400).json({ error: 'No pattern files found' });

    await ensureBranchExists();

    const results = [];
    const errors = [];

    for (const file of jsonFiles) {
      try {
        const content = fs.readFileSync(path.join(PATTERNS_DIR, file), 'utf8');
        await upsertFile(`patterns/${file}`, content, `chore: sync pattern ${file} from EA Platform`);
        results.push({ file, status: 'synced' });
      } catch (e) {
        errors.push({ file, error: e.message });
      }
    }

    for (const file of svgFiles) {
      try {
        const content = fs.readFileSync(path.join(PATTERNS_DIR, file));
        const b64 = content.toString('base64');
        const sha = await getExistingFileSha(`patterns/${file}`);
        const body = {
          message: `chore: sync pattern diagram ${file} from EA Platform`,
          content: b64,
          branch: BRANCH
        };
        if (sha) body.sha = sha;
        const { default: fetch } = await import('node-fetch');
        const r = await fetch(`${GITHUB_API}/repos/${REPO}/contents/patterns/${file}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${getToken()}`,
            'Accept': 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body)
        });
        const rb = await r.json();
        if (!r.ok) throw new Error(rb.message || r.status);
        results.push({ file, status: 'synced' });
      } catch (e) {
        errors.push({ file, error: e.message });
      }
    }

    const readme = generateReadme(jsonFiles.length, svgFiles.length);
    try {
      await upsertFile('README.md', readme, 'docs: update README from EA Platform sync');
      results.push({ file: 'README.md', status: 'synced' });
    } catch (e) {
      errors.push({ file: 'README.md', error: e.message });
    }

    res.json({
      success: errors.length === 0,
      repo: REPO,
      branch: BRANCH,
      synced: results.length,
      errors: errors.length,
      results,
      errors,
      syncedAt: new Date().toISOString()
    });
  } catch (err) {
    console.error('GitHub sync error:', err);
    res.status(500).json({ error: err.message || 'GitHub sync failed' });
  }
});

router.get('/sync-status', async (req, res) => {
  try {
    const repoInfo = await ghFetch(`${GITHUB_API}/repos/${REPO}`);
    let branchInfo = null;
    let patternCount = 0;
    try {
      branchInfo = await ghFetch(`${GITHUB_API}/repos/${REPO}/git/ref/heads/${BRANCH}`);
      const contents = await ghFetch(`${GITHUB_API}/repos/${REPO}/contents/patterns?ref=${BRANCH}`);
      patternCount = Array.isArray(contents) ? contents.filter(f => f.name.endsWith('.json')).length : 0;
    } catch {}

    res.json({
      repo: REPO,
      branch: BRANCH,
      repoExists: true,
      branchExists: !!branchInfo,
      patternsSynced: patternCount,
      repoUrl: repoInfo.html_url,
      lastPush: repoInfo.pushed_at
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Could not check sync status' });
  }
});

function generateReadme(jsonCount, svgCount) {
  const now = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
  return `# McCain Architecture Patterns

This repository is the canonical source for all approved and in-development Enterprise Architecture patterns at McCain Foods.

> **Auto-synced** from the [McCain EA Platform](https://ea-platform.replit.app) · Last updated: ${now}

## Pattern Library

This repository contains **${jsonCount} architecture patterns** across six domains, each with JSON metadata${svgCount > 0 ? ` and ${svgCount} SVG architecture diagrams` : ''}.

### Domains

| Domain | Description |
|--------|-------------|
| Application & Integration | API gateways, service mesh, event-driven patterns |
| Cloud & Platform | Azure landing zones, cloud-native foundations |
| Containers & Kubernetes | AKS, container runtimes, GitOps |
| Data & Storage | Data lake, time-series, CQRS |
| Network & Connectivity | Zero Trust, VPN, SD-WAN |
| Security & Controls | IAM, WAF, secrets management |

### Pattern Status

- **Endorsed** — Approved by Architecture Board, ready for production use
- **In Development** — Under active development, not yet production-ready
- **Under Review** — Awaiting Architecture Board sign-off
- **Deprecated** — Superseded; migrate away from this pattern

## Pattern File Structure

Each pattern is a JSON file in the \`patterns/\` directory named by its Pattern ID (e.g. \`AP-001.json\`).

\`\`\`
patterns/
  AP-001.json   — API Gateway Pattern
  AP-001.svg    — Architecture diagram (where available)
  ...
\`\`\`

## Contributing

All pattern changes must go through the EA Platform intake process. Do not edit files in this repository directly — changes will be overwritten on the next sync.

---
*Maintained by the McCain Centre of Excellence for Enterprise Architecture*
`;
}

module.exports = router;
