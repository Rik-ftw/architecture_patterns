# Lightweight Idea Drop Feature — Implementation Spec

**Status:** Ready for Dev  
**Effort:** 1–2 dev-days  
**Priority:** Unblocks Phase 0 intake refinement  
**Owner:** Frontend + Backend dev pair

---

## Overview

A lightweight collaborative notepad for architecture ideas that evolve from high-level concepts into detailed proposals. Users can:
- Create an idea with just a title
- Invite collaborators (no permissions model—anyone invited can edit)
- Evolve the description over time (Markdown supported)
- View version history (who changed what, when)
- Convert to a full intake request when ready

**No fields, no structure, no comments.** Just title + description that grows.

---

## Database Schema

Add these three tables to `db.js` → `initDb()` function. Execute these in sequence:

### Table 1: intake_ideas

```sql
CREATE TABLE IF NOT EXISTS intake_ideas (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by TEXT,
  status TEXT DEFAULT 'draft',
  converted_to_intake_id TEXT,
  collaborator_emails TEXT DEFAULT '[]',
  CONSTRAINT valid_status CHECK (status IN ('draft', 'ready', 'converted'))
);

CREATE INDEX idx_intake_ideas_created_by ON intake_ideas(created_by);
CREATE INDEX idx_intake_ideas_status ON intake_ideas(status);
```

**Notes:**
- `slug`: Auto-generated as `idea-YYYY-NNN` (e.g., `idea-2026-001`)
- `collaborator_emails`: JSON array of email strings, e.g., `["bob@mccain.com", "carol@mccain.com"]`
- `description`: Full Markdown text (no size limit in PG, but app should warn at 50KB)
- `converted_to_intake_id`: Set when user converts to intake; prevents accidental re-conversion

### Table 2: intake_idea_versions

```sql
CREATE TABLE IF NOT EXISTS intake_idea_versions (
  id SERIAL PRIMARY KEY,
  idea_id INTEGER NOT NULL REFERENCES intake_ideas(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  description TEXT,
  updated_by TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  summary TEXT,
  CONSTRAINT unique_version_per_idea UNIQUE (idea_id, version_number)
);

CREATE INDEX idx_idea_versions_idea_id ON intake_idea_versions(idea_id);
```

**Notes:**
- `version_number`: 1, 2, 3, ... (never reused even after deletes)
- `summary`: User-provided change note, e.g., "Added vendor list and cost notes"
- Snapshot of full description at this version (allows diffs, reverts)

### Table 3: intake_idea_attachments

```sql
CREATE TABLE IF NOT EXISTS intake_idea_attachments (
  id SERIAL PRIMARY KEY,
  idea_id INTEGER NOT NULL REFERENCES intake_ideas(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  uploaded_by TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  file_size_bytes INTEGER
);

CREATE INDEX idx_attachments_idea_id ON intake_idea_attachments(idea_id);
```

**Notes:**
- `file_url`: Full URL (for now, can be external link; no file upload backend yet)
- `file_size_bytes`: Informational, not enforced
- For MVP: Users paste URLs or external doc links; file upload can be added later

---

## API Endpoints

### 1. GET /api/intake/ideas

**List all ideas (user's own + shared with them)**

**Query params:**
- `status` (optional): Filter by 'draft', 'ready', 'converted' (default: all)
- `sort` (optional): 'updated', 'created' (default: 'updated' desc)

**Request:**
```
GET /api/intake/ideas?status=draft&sort=updated
```

**Response:**
```json
{
  "ideas": [
    {
      "id": 1,
      "slug": "idea-2026-001",
      "title": "Cloud Migration to Azure",
      "created_by": "alice@mccain.com",
      "created_at": "2026-04-14T10:00:00Z",
      "updated_at": "2026-04-14T12:30:00Z",
      "updated_by": "bob@mccain.com",
      "status": "draft",
      "collaborator_count": 2,
      "version_count": 3,
      "converted_to_intake_id": null,
      "preview": "# Context\nMove on-prem workloads to Azure..."
    }
  ],
  "total": 15
}
```

**Auth:** Authenticated user sees own ideas + ideas where they're a collaborator

---

### 2. POST /api/intake/ideas

**Create new idea**

**Request:**
```json
{
  "title": "Cloud Migration to Azure"
}
```

**Response (201):**
```json
{
  "id": 1,
  "slug": "idea-2026-001",
  "title": "Cloud Migration to Azure",
  "description": "",
  "created_by": "alice@mccain.com",
  "created_at": "2026-04-14T10:00:00Z",
  "updated_at": "2026-04-14T10:00:00Z",
  "status": "draft",
  "collaborators": ["alice@mccain.com"],
  "versions": []
}
```

**Slug generation:**
```
SELECT MAX(CAST(SUBSTRING(slug, 9) AS INTEGER)) FROM intake_ideas 
WHERE slug LIKE 'idea-' || TO_CHAR(NOW(), 'YYYY') || '-%'

Next slug = 'idea-2026-NNN' where NNN = (last + 1)
```

**Auth:** Authenticated user only

---

### 3. GET /api/intake/ideas/:id

**Fetch single idea + full version history**

**Request:**
```
GET /api/intake/ideas/idea-2026-001
```

**Response:**
```json
{
  "id": 1,
  "slug": "idea-2026-001",
  "title": "Cloud Migration to Azure",
  "description": "# Context\nMove on-prem workloads to Azure...",
  "created_by": "alice@mccain.com",
  "created_at": "2026-04-14T10:00:00Z",
  "updated_at": "2026-04-14T12:30:00Z",
  "updated_by": "bob@mccain.com",
  "status": "draft",
  "converted_to_intake_id": null,
  "collaborators": [
    {
      "email": "alice@mccain.com",
      "role": "owner"
    },
    {
      "email": "bob@mccain.com",
      "role": "collaborator"
    }
  ],
  "versions": [
    {
      "version_number": 3,
      "description": "# Context\n...",
      "updated_by": "bob@mccain.com",
      "updated_at": "2026-04-14T12:30:00Z",
      "summary": "Added vendor list and cost SKUs"
    },
    {
      "version_number": 2,
      "description": "# Context\n...",
      "updated_by": "alice@mccain.com",
      "updated_at": "2026-04-14T11:00:00Z",
      "summary": "AKS vs VMs decision"
    },
    {
      "version_number": 1,
      "description": "# Context\nMove...",
      "updated_by": "alice@mccain.com",
      "updated_at": "2026-04-14T10:00:00Z",
      "summary": null
    }
  ],
  "attachments": [
    {
      "id": 1,
      "file_name": "Architecture Diagram.pdf",
      "file_url": "https://example.com/diagram.pdf",
      "uploaded_by": "carol@mccain.com",
      "uploaded_at": "2026-04-14T11:30:00Z"
    }
  ]
}
```

**Auth:** Owner or collaborator only (403 if neither)

---

### 4. PUT /api/intake/ideas/:id

**Update idea description (creates new version)**

**Request:**
```json
{
  "description": "# Context\nMove on-prem workloads...\n\n# Decisions\n- AKS...",
  "summary": "Added vendor details and timeline"
}
```

**Response:**
```json
{
  "id": 1,
  "slug": "idea-2026-001",
  "description": "# Context\n...",
  "updated_at": "2026-04-14T12:30:00Z",
  "updated_by": "alice@mccain.com",
  "status": "draft",
  "current_version": 4,
  "versions": [...]
}
```

**Behavior:**
1. Fetch current idea
2. If description has changed:
   - Insert new row in `intake_idea_versions` with `version_number = MAX(version_number) + 1`
   - Update `intake_ideas` set `description`, `updated_by`, `updated_at`
3. Return updated idea with full version history
4. If description identical to current, return 204 No Content

**Auth:** Owner or collaborator only

---

### 5. POST /api/intake/ideas/:id/invite

**Add collaborators (emails)**

**Request:**
```json
{
  "emails": ["bob@mccain.com", "carol@mccain.com"]
}
```

**Response:**
```json
{
  "id": 1,
  "slug": "idea-2026-001",
  "collaborators": [
    {"email": "alice@mccain.com", "role": "owner"},
    {"email": "bob@mccain.com", "role": "collaborator"},
    {"email": "carol@mccain.com", "role": "collaborator"}
  ],
  "invited": ["bob@mccain.com", "carol@mccain.com"],
  "already_collaborators": []
}
```

**Behavior:**
1. Parse `collaborator_emails` JSON array
2. Merge new emails, deduplicate
3. Update row, store as JSON
4. Return full collaborator list
5. (Optional: Email the new collaborators with link to idea)

**Auth:** Owner only

---

### 6. POST /api/intake/ideas/:id/convert

**Convert idea to full intake request**

**Request:**
```json
{
  "title": "Cloud Migration to Azure"
}
```

**Response (201):**
```json
{
  "idea": {
    "id": 1,
    "slug": "idea-2026-001",
    "status": "converted",
    "converted_to_intake_id": "REQ-2026-0001"
  },
  "intake": {
    "id": 1,
    "reference_id": "REQ-2026-0001",
    "title": "Cloud Migration to Azure",
    "description": "# Context\nMove on-prem workloads...",
    "status": "Draft",
    "created_at": "2026-04-14T12:30:00Z"
  }
}
```

**Behavior:**
1. Verify user is owner of idea
2. Check `converted_to_intake_id` is null; if not, return 409 Conflict
3. Create new row in `intake_requests`:
   - `reference_id`: Generate REQ-YYYY-NNNN (existing logic)
   - `title`: From request or idea.title
   - `description`: idea.description (pre-filled for context)
   - `status`: 'Draft'
   - `requestor_name`, `requestor_email`: From auth context
   - Other fields: Empty/defaults
4. Update `intake_ideas`:
   - `status = 'converted'`
   - `converted_to_intake_id = 'REQ-2026-0001'`
5. Return both idea + intake
6. Frontend navigates to intake detail page (wizard)

**Auth:** Owner only

---

## Frontend Structure

### UI Components

#### 1. Home Page — New Section

Add this section to `public/index.html` in the main navigation area. Insert **before** the "Recent Intakes" section:

```html
<!-- Ideas Section -->
<section id="ideas-section" class="section" style="display: none;">
  <div class="section-header">
    <h2>💡 Architecture Ideas</h2>
    <button id="btn-new-idea" class="btn-primary">+ New Idea</button>
  </div>

  <div id="ideas-list" class="ideas-grid">
    <!-- Populated by JavaScript -->
  </div>

  <div id="ideas-empty" class="empty-state" style="display: none;">
    <p>No ideas yet. <a href="#" onclick="showNewIdeaModal()">Create one</a> to get started.</p>
  </div>
</section>

<style>
.ideas-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
}

.idea-card {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: box-shadow 0.2s;
}

.idea-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.idea-card-title {
  font-weight: 600;
  font-size: 16px;
  margin-bottom: 8px;
  color: #1b3a6b;
}

.idea-card-meta {
  font-size: 12px;
  color: #666;
  margin-bottom: 12px;
}

.idea-card-version {
  display: inline-block;
  background: #e7f3ff;
  color: #0066cc;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  margin-right: 8px;
}

.idea-card-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.idea-card-actions button {
  flex: 1;
  padding: 6px 12px;
  font-size: 12px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
  cursor: pointer;
}

.idea-card-actions button:hover {
  background: #f0f0f0;
}
</style>
```

#### 2. Navigation Menu Update

In the sidebar/nav menu (likely in `public/index.html` nav), add:

```html
<li><a href="#" onclick="showIdeasSection(); return false;">💡 Ideas</a></li>
```

Make it toggle the ideas section (see JavaScript below).

#### 3. Idea Detail View (Modal or New Page)

When user clicks "Edit" on an idea card, show:

```html
<div id="idea-detail-modal" class="modal" style="display: none;">
  <div class="modal-content idea-detail-view">
    <div class="detail-header">
      <h2 id="idea-detail-title"></h2>
      <span id="idea-detail-status" class="badge"></span>
      <button id="btn-close-idea" class="btn-close">×</button>
    </div>

    <div class="detail-meta">
      <span>Started by <strong id="idea-creator"></strong></span>
      <span>Last edited <strong id="idea-last-edited"></strong> by <span id="idea-last-editor"></span></span>
      <span id="idea-collaborators-display"></span>
    </div>

    <div class="detail-body">
      <div class="idea-editor">
        <label>Title</label>
        <input id="idea-edit-title" type="text" placeholder="Idea title">

        <label>Description (Markdown)</label>
        <textarea id="idea-edit-description" placeholder="Write your idea here...&#10;&#10;Supports Markdown: # Headers, **bold**, *italic*, - lists, [links](url)"></textarea>

        <div class="form-row">
          <input id="idea-edit-summary" type="text" placeholder="Change summary (e.g., 'Added vendor list')">
          <button id="btn-save-idea" class="btn-primary">Save</button>
        </div>
      </div>

      <div class="idea-preview">
        <h3>Preview</h3>
        <div id="idea-markdown-preview" class="markdown-render"></div>
      </div>
    </div>

    <div class="idea-sidebar">
      <h3>Collaborators</h3>
      <ul id="idea-collaborators-list"></ul>
      <button id="btn-invite-collaborators" class="btn-secondary">+ Invite</button>

      <h3>Version History</h3>
      <ul id="idea-version-history">
        <!-- Generated by JS -->
      </ul>
    </div>

    <div class="idea-actions">
      <button id="btn-convert-idea" class="btn-success">Convert to Intake Request →</button>
      <button id="btn-delete-idea" class="btn-danger">Delete Idea</button>
    </div>
  </div>
</div>

<style>
.idea-detail-view {
  max-width: 1000px;
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 24px;
  padding: 24px;
}

.detail-header {
  grid-column: 1 / -1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #eee;
  padding-bottom: 16px;
}

.idea-editor {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.idea-editor label {
  font-weight: 600;
  color: #333;
}

.idea-editor input,
.idea-editor textarea {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.idea-editor textarea {
  min-height: 300px;
  resize: vertical;
  font-family: monospace;
  font-size: 13px;
}

.form-row {
  display: flex;
  gap: 8px;
}

.form-row input {
  flex: 1;
}

.idea-preview {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 4px;
  border: 1px solid #e9ecef;
  max-height: 500px;
  overflow-y: auto;
}

.markdown-render {
  font-size: 14px;
  line-height: 1.6;
}

.markdown-render h1 { font-size: 24px; font-weight: 700; margin: 16px 0 8px; }
.markdown-render h2 { font-size: 20px; font-weight: 700; margin: 12px 0 6px; }
.markdown-render h3 { font-size: 16px; font-weight: 600; margin: 8px 0 4px; }
.markdown-render ul { margin: 8px 0; padding-left: 20px; }
.markdown-render li { margin: 4px 0; }
.markdown-render code { background: #f0f0f0; padding: 2px 6px; border-radius: 3px; font-family: monospace; }

.idea-sidebar {
  border-left: 1px solid #eee;
  padding-left: 16px;
}

.idea-sidebar h3 {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 8px;
}

.idea-sidebar ul {
  list-style: none;
  padding: 0;
  margin-bottom: 16px;
}

.idea-sidebar li {
  padding: 4px 0;
  font-size: 13px;
  color: #666;
}

.idea-actions {
  grid-column: 1 / -1;
  display: flex;
  gap: 8px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #eee;
}
</style>
```

#### 4. Invite Modal

```html
<div id="invite-modal" class="modal" style="display: none;">
  <div class="modal-content">
    <h2>Invite Collaborators</h2>
    <p>Enter email addresses separated by commas</p>
    <textarea id="invite-emails" placeholder="alice@example.com, bob@example.com"></textarea>
    <div class="modal-actions">
      <button id="btn-cancel-invite" class="btn-secondary">Cancel</button>
      <button id="btn-confirm-invite" class="btn-primary">Invite</button>
    </div>
  </div>
</div>
```

#### 5. Convert Modal

```html
<div id="convert-modal" class="modal" style="display: none;">
  <div class="modal-content">
    <h2>Convert to Intake Request</h2>
    <p>This will create a new Architecture Intake Request using your idea as context.</p>
    <div class="form-group">
      <label>Request Title</label>
      <input id="convert-title" type="text" placeholder="Same as idea title">
    </div>
    <p class="info-text">You can then fill out the full 6-step intake wizard.</p>
    <div class="modal-actions">
      <button id="btn-cancel-convert" class="btn-secondary">Cancel</button>
      <button id="btn-confirm-convert" class="btn-success">Create & Open Wizard</button>
    </div>
  </div>
</div>
```

---

### JavaScript Functions (Add to public/index.html)

Insert this block in the `<script>` section:

```javascript
// ============ IDEA DROP FEATURE ============

let currentIdea = null;

// Show ideas section in navigation
function showIdeasSection() {
  document.querySelectorAll('.section').forEach(s => s.style.display = 'none');
  document.getElementById('ideas-section').style.display = 'block';
  loadIdeas();
}

// Load all ideas
async function loadIdeas() {
  try {
    const res = await fetch('/api/intake/ideas');
    const data = await res.json();
    
    const list = document.getElementById('ideas-list');
    const empty = document.getElementById('ideas-empty');
    
    if (!data.ideas || data.ideas.length === 0) {
      list.innerHTML = '';
      empty.style.display = 'block';
      return;
    }
    
    empty.style.display = 'none';
    list.innerHTML = data.ideas.map(idea => `
      <div class="idea-card">
        <div class="idea-card-title">${escapeHtml(idea.title)}</div>
        <div class="idea-card-meta">
          Started by ${escapeHtml(idea.created_by)}<br>
          Last edited ${formatDate(idea.updated_at)} by ${escapeHtml(idea.updated_by || idea.created_by)}
        </div>
        <span class="idea-card-version">v${idea.version_count}</span>
        <span class="idea-card-version">${idea.collaborator_count} collaborators</span>
        <div class="idea-card-actions">
          <button onclick="editIdea('${idea.slug}')">Edit</button>
          <button onclick="viewIdea('${idea.slug}')">View</button>
          <button onclick="deleteIdea('${idea.slug}')">Delete</button>
        </div>
      </div>
    `).join('');
  } catch (err) {
    console.error('Failed to load ideas:', err);
    showError('Failed to load ideas');
  }
}

// Show new idea modal
function showNewIdeaModal() {
  const title = prompt('Idea title:');
  if (!title) return;
  
  createIdea(title);
}

// Create new idea
async function createIdea(title) {
  try {
    const res = await fetch('/api/intake/ideas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title })
    });
    
    if (!res.ok) throw new Error('Failed to create idea');
    
    const idea = await res.json();
    editIdea(idea.slug);
    showIdeasSection();
  } catch (err) {
    console.error('Failed to create idea:', err);
    showError('Failed to create idea');
  }
}

// Edit idea (show detail view)
async function editIdea(slug) {
  try {
    const res = await fetch(`/api/intake/ideas/${slug}`);
    if (!res.ok) throw new Error('Not found');
    
    const idea = await res.json();
    currentIdea = idea;
    
    // Populate form
    document.getElementById('idea-detail-title').textContent = idea.title;
    document.getElementById('idea-detail-status').textContent = idea.status;
    document.getElementById('idea-creator').textContent = idea.created_by;
    document.getElementById('idea-last-edited').textContent = formatDate(idea.updated_at);
    document.getElementById('idea-last-editor').textContent = idea.updated_by || idea.created_by;
    
    document.getElementById('idea-edit-title').value = idea.title;
    document.getElementById('idea-edit-description').value = idea.description || '';
    document.getElementById('idea-edit-summary').value = '';
    
    // Populate collaborators
    const collabList = document.getElementById('idea-collaborators-list');
    collabList.innerHTML = idea.collaborators.map(c => `
      <li>${escapeHtml(c.email)} ${c.role === 'owner' ? '(owner)' : ''}</li>
    `).join('');
    
    // Populate version history
    const versionList = document.getElementById('idea-version-history');
    versionList.innerHTML = idea.versions.map(v => `
      <li>
        <strong>v${v.version_number}</strong> (${formatDate(v.updated_at)})
        <br><small>${escapeHtml(v.summary || 'No summary')}</small>
        <br><small>by ${escapeHtml(v.updated_by)}</small>
      </li>
    `).join('');
    
    // Show preview
    updateMarkdownPreview(idea.description || '');
    
    // Show modal
    document.getElementById('idea-detail-modal').style.display = 'flex';
    
    // Wire up buttons
    document.getElementById('btn-save-idea').onclick = saveIdea;
    document.getElementById('btn-invite-collaborators').onclick = showInviteModal;
    document.getElementById('btn-convert-idea').onclick = showConvertModal;
    document.getElementById('btn-delete-idea').onclick = () => deleteIdea(slug);
    document.getElementById('btn-close-idea').onclick = closeIdeaDetail;
    
  } catch (err) {
    console.error('Failed to load idea:', err);
    showError('Failed to load idea');
  }
}

// Save idea
async function saveIdea() {
  if (!currentIdea) return;
  
  const title = document.getElementById('idea-edit-title').value;
  const description = document.getElementById('idea-edit-description').value;
  const summary = document.getElementById('idea-edit-summary').value;
  
  if (!title.trim()) {
    showError('Title is required');
    return;
  }
  
  try {
    const res = await fetch(`/api/intake/ideas/${currentIdea.slug}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description, summary: summary || undefined })
    });
    
    if (!res.ok) throw new Error('Failed to save');
    
    const updated = await res.json();
    currentIdea = updated;
    showSuccess('Idea saved');
    editIdea(currentIdea.slug); // Refresh
  } catch (err) {
    console.error('Failed to save idea:', err);
    showError('Failed to save idea');
  }
}

// Update markdown preview (real-time as user types)
function updateMarkdownPreview(markdown) {
  const preview = document.getElementById('idea-markdown-preview');
  // Simple markdown rendering (consider using a library like marked.js for production)
  preview.innerHTML = simpleMarkdown(markdown);
}

// Simple markdown parser (replace with marked.js for production)
function simpleMarkdown(text) {
  return text
    .replace(/^### (.*?)$/gm, '<h3>$1</h3>')
    .replace(/^## (.*?)$/gm, '<h2>$1</h2>')
    .replace(/^# (.*?)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^- (.*?)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
    .replace(/\n/g, '<br>');
}

// Show invite modal
function showInviteModal() {
  document.getElementById('invite-modal').style.display = 'flex';
  document.getElementById('btn-confirm-invite').onclick = confirmInvite;
  document.getElementById('btn-cancel-invite').onclick = () => {
    document.getElementById('invite-modal').style.display = 'none';
  };
}

// Confirm invite
async function confirmInvite() {
  if (!currentIdea) return;
  
  const emails = document.getElementById('invite-emails').value
    .split(',')
    .map(e => e.trim())
    .filter(e => e);
  
  if (emails.length === 0) {
    showError('Enter at least one email');
    return;
  }
  
  try {
    const res = await fetch(`/api/intake/ideas/${currentIdea.slug}/invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emails })
    });
    
    if (!res.ok) throw new Error('Failed to invite');
    
    showSuccess(`Invited ${emails.length} collaborators`);
    document.getElementById('invite-modal').style.display = 'none';
    document.getElementById('invite-emails').value = '';
    editIdea(currentIdea.slug); // Refresh
  } catch (err) {
    console.error('Failed to invite:', err);
    showError('Failed to invite collaborators');
  }
}

// Show convert modal
function showConvertModal() {
  document.getElementById('convert-title').value = currentIdea.title;
  document.getElementById('convert-modal').style.display = 'flex';
  document.getElementById('btn-confirm-convert').onclick = confirmConvert;
  document.getElementById('btn-cancel-convert').onclick = () => {
    document.getElementById('convert-modal').style.display = 'none';
  };
}

// Confirm convert to intake
async function confirmConvert() {
  if (!currentIdea) return;
  
  const title = document.getElementById('convert-title').value;
  if (!title.trim()) {
    showError('Title is required');
    return;
  }
  
  try {
    const res = await fetch(`/api/intake/ideas/${currentIdea.slug}/convert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title })
    });
    
    if (!res.ok) throw new Error('Failed to convert');
    
    const result = await res.json();
    showSuccess(`Created ${result.intake.reference_id}`);
    
    // Close modal and navigate to intake
    document.getElementById('convert-modal').style.display = 'none';
    closeIdeaDetail();
    
    // Navigate to intake detail (you'll need to implement this based on your routing)
    setTimeout(() => {
      loadIntakeDetail(result.intake.reference_id);
    }, 1000);
  } catch (err) {
    console.error('Failed to convert:', err);
    showError('Failed to convert to intake request');
  }
}

// Delete idea
async function deleteIdea(slug) {
  if (!confirm('Delete this idea? This cannot be undone.')) return;
  
  try {
    const res = await fetch(`/api/intake/ideas/${slug}`, {
      method: 'DELETE'
    });
    
    if (!res.ok) throw new Error('Failed to delete');
    
    showSuccess('Idea deleted');
    closeIdeaDetail();
    loadIdeas();
  } catch (err) {
    console.error('Failed to delete idea:', err);
    showError('Failed to delete idea');
  }
}

// Close idea detail
function closeIdeaDetail() {
  document.getElementById('idea-detail-modal').style.display = 'none';
  currentIdea = null;
}

// Markdown preview live update
document.addEventListener('DOMContentLoaded', () => {
  const descInput = document.getElementById('idea-edit-description');
  if (descInput) {
    descInput.addEventListener('input', (e) => {
      updateMarkdownPreview(e.target.value);
    });
  }
});

// Helper functions
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString() + ' ' + new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function showSuccess(msg) {
  alert(msg); // Replace with toast if available
}

function showError(msg) {
  alert('Error: ' + msg); // Replace with toast if available
}

// ============ END IDEA DROP FEATURE ============
```

---

## Backend Implementation (routes/ideas.js)

Create a new file `routes/ideas.js`:

```javascript
const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// Get current user from request (assumes auth middleware sets req.user.email)
function getAuthUser(req) {
  return req.user?.email || req.headers['x-user-email'] || 'anonymous@mccain.com';
}

// Generate next idea slug
async function generateSlug() {
  const year = new Date().getFullYear();
  const result = await pool.query(
    `SELECT MAX(CAST(SUBSTRING(slug, 10) AS INTEGER)) as max_num 
     FROM intake_ideas 
     WHERE slug LIKE $1`,
    [`idea-${year}-%`]
  );
  
  const maxNum = result.rows[0]?.max_num || 0;
  return `idea-${year}-${String(maxNum + 1).padStart(3, '0')}`;
}

// GET /api/intake/ideas
router.get('/', async (req, res) => {
  const user = getAuthUser(req);
  const { status, sort } = req.query;
  
  try {
    let query = `
      SELECT id, slug, title, created_by, created_at, updated_at, updated_by, status, converted_to_intake_id,
             array_length(string_to_array(collaborator_emails, ','), 1) as collaborator_count,
             SUBSTRING(description, 1, 150) as preview
      FROM intake_ideas
      WHERE created_by = $1 
         OR collaborator_emails LIKE '%' || $1 || '%'
    `;
    
    const params = [user];
    
    if (status) {
      query += ` AND status = $${params.length + 1}`;
      params.push(status);
    }
    
    query += ` ORDER BY ${sort === 'created' ? 'created_at' : 'updated_at'} DESC`;
    
    const result = await pool.query(query, params);
    
    // Parse collaborator count from JSON array
    const ideas = result.rows.map(row => ({
      ...row,
      collaborator_count: row.collaborator_count || 1,
      version_count: 1 // Will be enriched from versions table if needed
    }));
    
    res.json({ ideas, total: ideas.length });
  } catch (err) {
    console.error('GET /api/intake/ideas error:', err);
    res.status(500).json({ error: 'Failed to fetch ideas' });
  }
});

// POST /api/intake/ideas
router.post('/', async (req, res) => {
  const user = getAuthUser(req);
  const { title } = req.body;
  
  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Title is required' });
  }
  
  try {
    const slug = await generateSlug();
    
    const result = await pool.query(
      `INSERT INTO intake_ideas (slug, title, created_by, updated_by, collaborator_emails)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [slug, title.trim(), user, user, JSON.stringify([user])]
    );
    
    const idea = result.rows[0];
    res.status(201).json({
      id: idea.id,
      slug: idea.slug,
      title: idea.title,
      description: '',
      created_by: idea.created_by,
      created_at: idea.created_at,
      updated_at: idea.updated_at,
      status: idea.status,
      collaborators: [{ email: user, role: 'owner' }],
      versions: []
    });
  } catch (err) {
    console.error('POST /api/intake/ideas error:', err);
    res.status(500).json({ error: 'Failed to create idea' });
  }
});

// GET /api/intake/ideas/:slug
router.get('/:slug', async (req, res) => {
  const user = getAuthUser(req);
  const { slug } = req.params;
  
  try {
    // Fetch idea
    const ideaResult = await pool.query(
      `SELECT * FROM intake_ideas WHERE slug = $1`,
      [slug]
    );
    
    if (ideaResult.rows.length === 0) {
      return res.status(404).json({ error: 'Idea not found' });
    }
    
    const idea = ideaResult.rows[0];
    
    // Check permissions
    const collaborators = JSON.parse(idea.collaborator_emails || '[]');
    if (idea.created_by !== user && !collaborators.includes(user)) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    // Fetch versions
    const versionsResult = await pool.query(
      `SELECT version_number, description, updated_by, updated_at, summary
       FROM intake_idea_versions
       WHERE idea_id = $1
       ORDER BY version_number DESC`,
      [idea.id]
    );
    
    // Fetch attachments
    const attachmentsResult = await pool.query(
      `SELECT id, file_url, file_name, uploaded_by, uploaded_at, file_size_bytes
       FROM intake_idea_attachments
       WHERE idea_id = $1
       ORDER BY uploaded_at DESC`,
      [idea.id]
    );
    
    res.json({
      id: idea.id,
      slug: idea.slug,
      title: idea.title,
      description: idea.description,
      created_by: idea.created_by,
      created_at: idea.created_at,
      updated_at: idea.updated_at,
      updated_by: idea.updated_by,
      status: idea.status,
      converted_to_intake_id: idea.converted_to_intake_id,
      collaborators: collaborators.map((email, idx) => ({
        email,
        role: email === idea.created_by ? 'owner' : 'collaborator'
      })),
      versions: versionsResult.rows,
      attachments: attachmentsResult.rows
    });
  } catch (err) {
    console.error('GET /api/intake/ideas/:slug error:', err);
    res.status(500).json({ error: 'Failed to fetch idea' });
  }
});

// PUT /api/intake/ideas/:slug
router.put('/:slug', async (req, res) => {
  const user = getAuthUser(req);
  const { slug } = req.params;
  const { description, summary } = req.body;
  
  try {
    // Fetch current idea
    const ideaResult = await pool.query(
      `SELECT * FROM intake_ideas WHERE slug = $1`,
      [slug]
    );
    
    if (ideaResult.rows.length === 0) {
      return res.status(404).json({ error: 'Idea not found' });
    }
    
    const idea = ideaResult.rows[0];
    
    // Check permissions
    const collaborators = JSON.parse(idea.collaborator_emails || '[]');
    if (idea.created_by !== user && !collaborators.includes(user)) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    // If no change, return 204
    if (idea.description === description) {
      return res.status(204).send();
    }
    
    // Get next version number
    const versionResult = await pool.query(
      `SELECT MAX(version_number) as max_ver FROM intake_idea_versions WHERE idea_id = $1`,
      [idea.id]
    );
    
    const nextVersion = (versionResult.rows[0]?.max_ver || 0) + 1;
    
    // Insert version
    await pool.query(
      `INSERT INTO intake_idea_versions (idea_id, version_number, description, updated_by, summary)
       VALUES ($1, $2, $3, $4, $5)`,
      [idea.id, nextVersion, description || '', user, summary || null]
    );
    
    // Update idea
    const updateResult = await pool.query(
      `UPDATE intake_ideas 
       SET description = $1, updated_by = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [description || '', user, idea.id]
    );
    
    const updated = updateResult.rows[0];
    
    // Fetch all versions
    const versionsResult = await pool.query(
      `SELECT version_number, description, updated_by, updated_at, summary
       FROM intake_idea_versions
       WHERE idea_id = $1
       ORDER BY version_number DESC`,
      [idea.id]
    );
    
    res.json({
      id: updated.id,
      slug: updated.slug,
      description: updated.description,
      updated_at: updated.updated_at,
      updated_by: updated.updated_by,
      status: updated.status,
      current_version: nextVersion,
      versions: versionsResult.rows
    });
  } catch (err) {
    console.error('PUT /api/intake/ideas/:slug error:', err);
    res.status(500).json({ error: 'Failed to update idea' });
  }
});

// POST /api/intake/ideas/:slug/invite
router.post('/:slug/invite', async (req, res) => {
  const user = getAuthUser(req);
  const { slug } = req.params;
  const { emails } = req.body;
  
  if (!emails || !Array.isArray(emails)) {
    return res.status(400).json({ error: 'Emails array required' });
  }
  
  try {
    const ideaResult = await pool.query(
      `SELECT * FROM intake_ideas WHERE slug = $1`,
      [slug]
    );
    
    if (ideaResult.rows.length === 0) {
      return res.status(404).json({ error: 'Idea not found' });
    }
    
    const idea = ideaResult.rows[0];
    
    // Only owner can invite
    if (idea.created_by !== user) {
      return res.status(403).json({ error: 'Only owner can invite' });
    }
    
    const currentCollabs = JSON.parse(idea.collaborator_emails || '[]');
    const newCollabs = [...new Set([...currentCollabs, ...emails])]; // Deduplicate
    
    await pool.query(
      `UPDATE intake_ideas SET collaborator_emails = $1 WHERE id = $2`,
      [JSON.stringify(newCollabs), idea.id]
    );
    
    res.json({
      id: idea.id,
      slug: idea.slug,
      collaborators: newCollabs.map(email => ({
        email,
        role: email === idea.created_by ? 'owner' : 'collaborator'
      })),
      invited: emails,
      already_collaborators: emails.filter(e => currentCollabs.includes(e))
    });
  } catch (err) {
    console.error('POST /api/intake/ideas/:slug/invite error:', err);
    res.status(500).json({ error: 'Failed to invite' });
  }
});

// POST /api/intake/ideas/:slug/convert
router.post('/:slug/convert', async (req, res) => {
  const user = getAuthUser(req);
  const { slug } = req.params;
  const { title } = req.body;
  
  try {
    const ideaResult = await pool.query(
      `SELECT * FROM intake_ideas WHERE slug = $1`,
      [slug]
    );
    
    if (ideaResult.rows.length === 0) {
      return res.status(404).json({ error: 'Idea not found' });
    }
    
    const idea = ideaResult.rows[0];
    
    // Only owner can convert
    if (idea.created_by !== user) {
      return res.status(403).json({ error: 'Only owner can convert' });
    }
    
    // Check if already converted
    if (idea.converted_to_intake_id) {
      return res.status(409).json({ error: 'Already converted', intake_id: idea.converted_to_intake_id });
    }
    
    // Generate intake reference ID (REQ-YYYY-NNNN)
    const year = new Date().getFullYear();
    const refResult = await pool.query(
      `SELECT MAX(CAST(SUBSTRING(reference_id, 8) AS INTEGER)) as max_ref
       FROM intake_requests
       WHERE reference_id LIKE $1`,
      [`REQ-${year}-%`]
    );
    
    const nextRef = (refResult.rows[0]?.max_ref || 0) + 1;
    const referenceId = `REQ-${year}-${String(nextRef).padStart(4, '0')}`;
    
    // Create intake request
    const intakeResult = await pool.query(
      `INSERT INTO intake_requests 
       (reference_id, title, description, requestor_name, requestor_email, status)
       VALUES ($1, $2, $3, $4, $5, 'Draft')
       RETURNING id, reference_id, title, description, status, created_at`,
      [referenceId, title || idea.title, idea.description, user, user]
    );
    
    const intake = intakeResult.rows[0];
    
    // Update idea
    await pool.query(
      `UPDATE intake_ideas SET status = 'converted', converted_to_intake_id = $1 WHERE id = $2`,
      [intake.reference_id, idea.id]
    );
    
    res.status(201).json({
      idea: {
        id: idea.id,
        slug: idea.slug,
        status: 'converted',
        converted_to_intake_id: intake.reference_id
      },
      intake: {
        id: intake.id,
        reference_id: intake.reference_id,
        title: intake.title,
        description: intake.description,
        status: intake.status,
        created_at: intake.created_at
      }
    });
  } catch (err) {
    console.error('POST /api/intake/ideas/:slug/convert error:', err);
    res.status(500).json({ error: 'Failed to convert' });
  }
});

// DELETE /api/intake/ideas/:slug
router.delete('/:slug', async (req, res) => {
  const user = getAuthUser(req);
  const { slug } = req.params;
  
  try {
    const ideaResult = await pool.query(
      `SELECT * FROM intake_ideas WHERE slug = $1`,
      [slug]
    );
    
    if (ideaResult.rows.length === 0) {
      return res.status(404).json({ error: 'Idea not found' });
    }
    
    const idea = ideaResult.rows[0];
    
    // Only owner can delete
    if (idea.created_by !== user) {
      return res.status(403).json({ error: 'Only owner can delete' });
    }
    
    // Check if converted
    if (idea.converted_to_intake_id) {
      return res.status(409).json({ error: 'Cannot delete converted idea' });
    }
    
    // Delete (cascades to versions and attachments via foreign keys)
    await pool.query(`DELETE FROM intake_ideas WHERE id = $1`, [idea.id]);
    
    res.status(204).send();
  } catch (err) {
    console.error('DELETE /api/intake/ideas/:slug error:', err);
    res.status(500).json({ error: 'Failed to delete idea' });
  }
});

module.exports = router;
```

---

## Integration Checklist

### 1. Database Setup (db.js)

In `db.js`, add the three CREATE TABLE statements above to the `initDb()` function, after existing tables.

### 2. Server Registration (server.js)

Add this line after the existing routes:

```javascript
app.use('/api/intake/ideas', require('./routes/ideas'));
```

### 3. Frontend Navigation

In `public/index.html`, add a link to the Ideas section in your navigation menu.

### 4. Auth Middleware

The routes assume `req.user.email` or look for `x-user-email` header. If you have auth middleware, ensure it sets one of these. If not, the fallback is `'anonymous@mccain.com'` for testing.

---

## Testing Checklist

### API Tests

- [ ] `POST /api/intake/ideas` — create new idea with title
- [ ] `GET /api/intake/ideas` — list user's ideas + shared
- [ ] `GET /api/intake/ideas/:slug` — fetch single idea with versions
- [ ] `PUT /api/intake/ideas/:slug` — update description, creates version
- [ ] `POST /api/intake/ideas/:slug/invite` — add collaborators
- [ ] `POST /api/intake/ideas/:slug/convert` — convert to intake request
- [ ] `DELETE /api/intake/ideas/:slug` — delete draft idea
- [ ] Permissions: non-owner/non-collaborator should get 403

### UI Tests

- [ ] Ideas section appears in nav
- [ ] Can create new idea from home
- [ ] Can edit idea, see description updated live
- [ ] Can view version history
- [ ] Can invite collaborators by email
- [ ] Can convert idea to intake request
- [ ] Converted idea shows linked intake ID
- [ ] Cannot delete converted idea

### Edge Cases

- [ ] Duplicate email in invite list (deduplicated)
- [ ] Same description saved twice (returns 204 No Change)
- [ ] Very long description (>50KB)
- [ ] Markdown rendering (headers, bold, lists)
- [ ] Empty title rejected

---

## Rollout Notes

**Phase 1 (MVP):**
- Idea CRUD, versioning, invite, convert
- Markdown description + live preview
- No attachments yet (can be added in Phase 2)

**Phase 2 (Nice-to-Have):**
- File attachment upload
- Email notifications on invite/change
- Diff viewer between versions
- Idea templates (HL Idea vs. Detailed Proposal scaffolds)
- Comment threads (if needed later)

**Data Migration:**
- When you move to 7-service architecture, ideas migrate to `platform-ea-intake` service
- Schema stays the same; endpoint becomes `POST /api/v1/ideas` (service-scoped)
- No data loss; just a repo/service boundary change

---

## Assumptions & Dependencies

- **Database:** PostgreSQL (uses native JSON functions)
- **Auth:** `req.user.email` or `x-user-email` header populated by auth middleware
- **Frontend:** Vanilla JS, no framework dependency
- **Markdown rendering:** Simple parser included; upgrade to `marked.js` library for production
- **UI framework:** Assumes existing CSS/modal structure (can be adapted to your design system)

---

## Questions for Dev During Implementation

1. **Auth**: How is the current user email populated in `req.user` or headers?
2. **Modal styling**: Are modals in your app CSS-based (`.modal { display: flex }`) or component-based?
3. **Markdown library**: Should I use `marked.js` (npm package) or keep the simple inline parser?
4. **Toast/notifications**: Do you have an existing alert/toast system to replace `showSuccess()`/`showError()`?
5. **Navigation**: How are sections (ideas, intake, etc.) currently toggled? Should ideas follow the same pattern?

