const express = require('express');
const router = express.Router();
const Anthropic = require('@anthropic-ai/sdk');
const { db } = require('../db');
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

function loadVendors() {
  try { return JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'vendors', 'registry.json'), 'utf8')); } catch { return []; }
}

function buildEpicsPrompt(solution, patterns, vendors) {
  const selectedPatterns = patterns.filter(p => (solution.patternIds || []).includes(p.patternId));
  const selectedVendors = vendors.filter(v => (solution.vendorIds || []).map(Number).includes(v.id));
  const regions = solution.deploymentRegions || [];

  return `You are a Senior Enterprise Architect at McCain Foods. You need to generate a structured set of Jira Epics and Stories for implementing a solution design.

## SOLUTION DESIGN

**Title:** ${solution.title}
**Complexity:** ${solution.complexity || 'Not specified'}
**Cost Band:** ${solution.estimated_cost_band || 'Not specified'}
**Business Unit:** ${solution.business_unit || 'Not specified'}
**Owner:** ${solution.owner || 'Not specified'}
**Status:** ${solution.status}

**Description:**
${solution.description || 'Not provided'}

**Business Context:**
${solution.business_context || 'Not provided'}

**Deployment Regions:** ${regions.join(', ') || 'Not specified'}

**Composed Patterns:**
${selectedPatterns.length ? selectedPatterns.map(p => `  - ${p.patternId}: ${p.name} (${p.domain}) — ${p.strategicIntent || p.problemStatement || ''}`).join('\n') : '  None selected'}

**Vendors in Scope:**
${selectedVendors.length ? selectedVendors.map(v => `  - ${v.vendorCompany} (${v.productService}) — Criticality: ${v.criticality}`).join('\n') : '  None specified'}

## INSTRUCTIONS

Generate a comprehensive set of Jira Epics and Stories to implement this solution. Organize them into logical implementation phases. Each Epic should represent a major workstream. Each Story should be a discrete, implementable unit of work.

Typical Epic categories to consider (include only what is relevant):
- Infrastructure & Environment Setup
- Security & Identity Configuration
- Integration & API Development
- Data Pipeline / Platform Work
- Application Development / Modernisation
- Vendor Onboarding & Configuration
- Testing, Quality Assurance & Performance
- Operational Readiness & Go-Live
- Documentation & Training
- Monitoring & Observability Setup

Generate between 4 and 7 Epics. Each Epic should have 3–6 Stories.

Respond ONLY with a valid JSON array (no markdown, no prose outside the JSON):

[
  {
    "epicKey": "EPIC-1",
    "title": "<Epic title>",
    "description": "<2-3 sentence description of what this epic covers and why>",
    "stories": [
      {
        "storyKey": "STORY-1-1",
        "title": "<Story title — concise, imperative verb, max 80 chars>",
        "description": "<1-2 sentence description of what needs to be done>",
        "acceptanceCriteria": [
          "<criterion 1>",
          "<criterion 2>",
          "<criterion 3>"
        ]
      }
    ]
  }
]`;
}

router.post('/:id/generate-epics', async (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM solution_designs WHERE id=? OR reference_id=?').get(req.params.id, req.params.id);
    if (!row) return res.status(404).json({ error: 'Solution design not found' });

    if (row.status !== 'Published') {
      return res.status(400).json({ error: 'Epics can only be generated for Published solution designs' });
    }

    const solution = {
      ...row,
      patternIds: parseJson(row.pattern_ids, []),
      vendorIds: parseJson(row.vendor_ids, []),
      deploymentRegions: parseJson(row.deployment_regions, []),
    };

    const patterns = loadPatterns();
    const vendors = loadVendors();
    const client = new Anthropic();

    const message = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 8192,
      messages: [{ role: 'user', content: buildEpicsPrompt(solution, patterns, vendors) }]
    });

    let text = message.content[0].text.trim();
    if (text.startsWith('```')) text = text.replace(/^```json?\n?/, '').replace(/\n?```$/, '').trim();

    let epics;
    try {
      epics = JSON.parse(text);
    } catch (parseErr) {
      const closingBracketIdx = text.lastIndexOf(']');
      if (closingBracketIdx !== -1) {
        try {
          epics = JSON.parse(text.slice(0, closingBracketIdx + 1));
        } catch {
          throw new Error('Failed to parse AI response as JSON: ' + parseErr.message);
        }
      } else {
        throw new Error('Failed to parse AI response as JSON: ' + parseErr.message);
      }
    }

    const jiraEpicsPayload = {
      epics,
      generatedAt: new Date().toISOString(),
      model: 'claude-sonnet-4-5',
      jiraKeys: null,
    };

    db.prepare(`UPDATE solution_designs SET jira_epics=?, updated_at=datetime('now') WHERE id=?`)
      .run(JSON.stringify(jiraEpicsPayload), row.id);

    res.json({ jiraEpics: jiraEpicsPayload });
  } catch (err) {
    console.error('Generate epics error:', err);
    res.status(500).json({ error: err.message || 'Epic generation failed' });
  }
});

router.post('/:id/push-to-jira', async (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM solution_designs WHERE id=? OR reference_id=?').get(req.params.id, req.params.id);
    if (!row) return res.status(404).json({ error: 'Solution design not found' });

    const jiraEpicsData = parseJson(row.jira_epics, null);
    if (!jiraEpicsData || !jiraEpicsData.epics) {
      return res.status(400).json({ error: 'No generated epics found. Generate epics first.' });
    }

    const { projectKey, baseUrl, userEmail, apiToken } = req.body;
    if (!projectKey || !baseUrl || !userEmail || !apiToken) {
      return res.status(400).json({ error: 'Missing required Jira credentials: projectKey, baseUrl, userEmail, apiToken' });
    }

    const cleanBaseUrl = baseUrl.replace(/\/$/, '');
    const authHeader = 'Basic ' + Buffer.from(`${userEmail}:${apiToken}`).toString('base64');

    const jiraFetch = async (endpoint, method, body) => {
      const response = await fetch(`${cleanBaseUrl}/rest/api/3${endpoint}`, {
        method: method || 'GET',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.errorMessages ? data.errorMessages.join(', ') : (data.message || `Jira API error: ${response.status}`));
      }
      return data;
    };

    await jiraFetch(`/project/${projectKey}`);

    const createdKeys = {};
    const epicsWithKeys = [];

    for (const epic of jiraEpicsData.epics) {
      const epicBody = {
        fields: {
          project: { key: projectKey },
          summary: epic.title,
          description: {
            type: 'doc',
            version: 1,
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: epic.description || '' }]
              }
            ]
          },
          issuetype: { name: 'Epic' },
          labels: ['ea-platform', 'generated'],
        }
      };

      let createdEpic;
      try {
        createdEpic = await jiraFetch('/issue', 'POST', epicBody);
      } catch (epicErr) {
        epicBody.fields.issuetype = { name: 'Story' };
        createdEpic = await jiraFetch('/issue', 'POST', epicBody);
      }

      const epicKey = createdEpic.key;
      createdKeys[epic.epicKey] = epicKey;

      const storiesWithKeys = [];
      for (const story of (epic.stories || [])) {
        const acText = (story.acceptanceCriteria || []).map((c, i) => `${i + 1}. ${c}`).join('\n');
        const storyDesc = (story.description || '') + (acText ? `\n\nAcceptance Criteria:\n${acText}` : '');

        const storyBody = {
          fields: {
            project: { key: projectKey },
            summary: story.title,
            description: {
              type: 'doc',
              version: 1,
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: storyDesc }]
                }
              ]
            },
            issuetype: { name: 'Story' },
            labels: ['ea-platform', 'generated'],
          }
        };

        try {
          storyBody.fields.parent = { key: epicKey };
        } catch {}

        let createdStory;
        try {
          createdStory = await jiraFetch('/issue', 'POST', storyBody);
        } catch {
          delete storyBody.fields.parent;
          createdStory = await jiraFetch('/issue', 'POST', storyBody);
        }

        storiesWithKeys.push({
          ...story,
          jiraKey: createdStory.key,
          jiraUrl: `${cleanBaseUrl}/browse/${createdStory.key}`,
        });
      }

      epicsWithKeys.push({
        ...epic,
        jiraKey: epicKey,
        jiraUrl: `${cleanBaseUrl}/browse/${epicKey}`,
        stories: storiesWithKeys,
      });
    }

    const updatedPayload = {
      ...jiraEpicsData,
      epics: epicsWithKeys,
      jiraKeys: {
        pushedAt: new Date().toISOString(),
        projectKey,
        baseUrl: cleanBaseUrl,
      },
    };

    db.prepare(`UPDATE solution_designs SET jira_epics=?, updated_at=datetime('now') WHERE id=?`)
      .run(JSON.stringify(updatedPayload), row.id);

    const settings = db.prepare('SELECT * FROM jira_settings LIMIT 1').get();
    if (settings) {
      db.prepare(`UPDATE jira_settings SET base_url=?, project_key=?, user_email=?, updated_at=datetime('now') WHERE id=?`)
        .run(cleanBaseUrl, projectKey, userEmail, settings.id);
    } else {
      db.prepare(`INSERT INTO jira_settings (base_url, project_key, user_email, api_token) VALUES (?,?,?,?)`)
        .run(cleanBaseUrl, projectKey, userEmail, '');
    }

    res.json({ jiraEpics: updatedPayload });
  } catch (err) {
    console.error('Push to Jira error:', err);
    res.status(500).json({ error: err.message || 'Push to Jira failed' });
  }
});

router.get('/jira-settings/config', (req, res) => {
  const settings = db.prepare('SELECT id, base_url, project_key, user_email FROM jira_settings LIMIT 1').get();
  res.json({ settings: settings || null });
});

module.exports = router;
