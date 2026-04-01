const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { pool, parseJson } = require('../db');

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

    const solResult = await pool.query(`SELECT * FROM solution_designs WHERE status='Approved'`);
    const approvedSolutions = solResult.rows;
    const solutionCount = approvedSolutions.length;

    const readme = generateReadme(jsonFiles.length, svgFiles.length, solutionCount);
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

router.post('/sync-solutions', async (req, res) => {
  try {
    const solResult = await pool.query(`SELECT * FROM solution_designs WHERE status='Approved'`);
    const approvedSolutions = solResult.rows;
    if (!approvedSolutions.length) {
      return res.status(400).json({ error: 'No approved solutions to sync' });
    }

    await ensureBranchExists();

    const results = [];
    const errors = [];

    for (const sol of approvedSolutions) {
      try {
        const revResult = await pool.query('SELECT * FROM solution_reviews WHERE solution_id=$1 ORDER BY created_at ASC', [sol.id]);
        const reviews = revResult.rows;
        const patterns = parseJson(sol.pattern_ids, []);

        const solutionJson = {
          referenceId: sol.reference_id,
          title: sol.title,
          description: sol.description,
          businessContext: sol.business_context,
          owner: sol.owner,
          businessUnit: sol.business_unit,
          complexity: sol.complexity,
          estimatedCostBand: sol.estimated_cost_band,
          patternIds: patterns,
          deploymentRegions: parseJson(sol.deployment_regions, []),
          intakeReference: sol.intake_reference || null,
          status: sol.status,
          createdAt: sol.created_at,
          updatedAt: sol.updated_at,
          reviews: reviews.map(r => ({
            stage: r.stage,
            reviewerName: r.reviewer_name,
            decision: r.decision,
            comments: r.comments,
            reviewedAt: r.reviewed_at
          }))
        };

        const fileName = `${sol.reference_id}.json`;
        await upsertFile(`solutions/${fileName}`, JSON.stringify(solutionJson, null, 2), `chore: sync solution ${sol.reference_id} from EA Platform`);
        results.push({ file: fileName, status: 'synced' });
      } catch (e) {
        errors.push({ file: sol.reference_id, error: e.message });
      }
    }

    const jsonFiles = fs.readdirSync(PATTERNS_DIR).filter(f => f.endsWith('.json'));
    const svgFiles = fs.readdirSync(PATTERNS_DIR).filter(f => f.endsWith('.svg'));
    const readme = generateReadme(jsonFiles.length, svgFiles.length, approvedSolutions.length);
    try {
      await upsertFile('README.md', readme, 'docs: update README with solutions folder from EA Platform sync');
      results.push({ file: 'README.md', status: 'synced' });
    } catch (e) {
      errors.push({ file: 'README.md', error: e.message });
    }

    res.json({
      success: errors.length === 0,
      repo: REPO,
      branch: BRANCH,
      synced: results.length,
      solutionsSynced: approvedSolutions.length,
      errors: errors.length,
      results,
      errors,
      syncedAt: new Date().toISOString()
    });
  } catch (err) {
    console.error('GitHub solutions sync error:', err);
    res.status(500).json({ error: err.message || 'GitHub sync failed' });
  }
});

router.post('/push-iac', async (req, res) => {
  try {
    const { path: pathAlias, pathPrefix, files, label } = req.body;
    const prefix = pathAlias || pathPrefix;
    if (!prefix || !files || typeof files !== 'object') {
      return res.status(400).json({ error: 'path (or pathPrefix) and files are required' });
    }

    await ensureBranchExists();

    const results = [];
    const errors = [];

    for (const [filename, content] of Object.entries(files)) {
      if (!content) continue;
      const repoPath = `${prefix}/${filename}`;
      try {
        await upsertFile(repoPath, content, `feat(iac): add ${filename} for ${label || prefix}`);
        results.push({ file: repoPath, status: 'pushed' });
      } catch (e) {
        errors.push({ file: repoPath, error: e.message });
      }
    }

    res.json({
      success: errors.length === 0,
      repo: REPO,
      branch: BRANCH,
      path: prefix,
      pushed: results.length,
      errorCount: errors.length,
      results,
      errors,
      pushedAt: new Date().toISOString()
    });
  } catch (err) {
    console.error('GitHub IaC push error:', err);
    res.status(500).json({ error: err.message || 'GitHub IaC push failed' });
  }
});

router.get('/sync-status', async (req, res) => {
  try {
    const repoInfo = await ghFetch(`${GITHUB_API}/repos/${REPO}`);
    let branchInfo = null;
    let patternCount = 0;
    let solutionCount = 0;
    try {
      branchInfo = await ghFetch(`${GITHUB_API}/repos/${REPO}/git/ref/heads/${BRANCH}`);
      const contents = await ghFetch(`${GITHUB_API}/repos/${REPO}/contents/patterns?ref=${BRANCH}`);
      patternCount = Array.isArray(contents) ? contents.filter(f => f.name.endsWith('.json')).length : 0;
      try {
        const sContents = await ghFetch(`${GITHUB_API}/repos/${REPO}/contents/solutions?ref=${BRANCH}`);
        solutionCount = Array.isArray(sContents) ? sContents.filter(f => f.name.endsWith('.json')).length : 0;
      } catch {}
    } catch {}

    res.json({
      repo: REPO,
      branch: BRANCH,
      repoExists: true,
      branchExists: !!branchInfo,
      patternsSynced: patternCount,
      solutionsSynced: solutionCount,
      repoUrl: repoInfo.html_url,
      lastPush: repoInfo.pushed_at
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Could not check sync status' });
  }
});

function generateReadme(jsonCount, svgCount, solutionCount = 0) {
  const now = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
  return `# McCain Architecture Patterns

This repository is the canonical source for all approved and in-development Enterprise Architecture patterns and solution designs at McCain Foods.

> **Auto-synced** from the [McCain EA Platform](https://ea-platform.replit.app) · Last updated: ${now}

## Pattern Library

This repository contains **${jsonCount} architecture patterns** across six domains, each with JSON metadata${svgCount > 0 ? ` and ${svgCount} SVG architecture diagrams` : ''}.

### Pattern Levels

Each pattern is classified at one of three abstraction levels:

| Level | Description |
|-------|-------------|
| **Conceptual** | High-level architectural principles and strategic direction |
| **Logical** | Platform-agnostic architectural patterns and design decisions |
| **Component** | Technology-specific implementation blueprints |

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

## Solution Designs

${solutionCount > 0 ? `This repository contains **${solutionCount} approved solution design${solutionCount !== 1 ? 's'  : ''}** that compose patterns into end-to-end architectures.` : 'Approved solution designs are synced here as they are approved through the review pipeline.'}

Solution designs follow a multi-stage approval pipeline:
**Draft → EA Review → Security Review → Architecture Board → Approved**

Each approved solution is stored in the \`solutions/\` folder as a structured JSON file named by its Reference ID (e.g. \`ESD-2026-0001.json\`). Each file contains:
- Solution metadata (title, owner, business unit, complexity, cost band)
- Composed pattern IDs and deployment regions
- Full review trail (reviewer name, decision, comments, timestamp per stage)

\`\`\`
solutions/
  ESD-2026-0001.json   — Solution design with review artifacts
  ...
\`\`\`

## Contributing

All pattern and solution changes must go through the EA Platform intake process. Do not edit files in this repository directly — changes will be overwritten on the next sync.

---
*Maintained by the McCain Centre of Excellence for Enterprise Architecture*
`;
}

module.exports = router;
