# McCain EA Platform — Enterprise Architecture System

## Overview
A full enterprise architecture platform built for McCain Foods with McCain brand identity (Navy `#1B3A6B`, Teal `#109977`). Features a pattern library with Kanban board view, vendor registry, mature intake workflow with automated risk assessment, solution design composition, and an executive KPI dashboard.

## Design Reference
The `Architecture-Pattern-Hub/` folder contains the original design specification (`replit.md`) from a prior TypeScript/React/PostgreSQL monorepo build. Key design principles extracted:
- **Brand:** McCain Navy `#1B3A6B`, Teal `#0F6E56` (uses `#109977` on dark backgrounds for readability)
- **Kanban board** for pattern status (Endorsed / In Development / Under Review / Deprecated)
- **Solution Designs** — compose multiple patterns into a unified deployment
- **Team Portal** — self-service pattern browsing and intake submission
- **Executive KPI Dashboard** with pattern health, domain breakdown, and risk distribution
- **Implemented:** Anthropic Claude AI architecture reviews (full review + wizard quick scan)
- **Future features** (from spec): DOCX export, GitHub sourcing, security advisory scanning, Cloudflare vendor risk

## Tech Stack
- **Runtime:** Node.js 20
- **Web Framework:** Express 5
- **Database:** SQLite (better-sqlite3) — stored in `data/ea_platform.db`
- **Frontend:** Vanilla HTML/CSS/JS SPA (served from `public/`)
- **Data Sources:** JSON files in `patterns/` and `vendors/`

## Project Structure
```
server.js              — Express server (port 5000, host 0.0.0.0)
db.js                  — SQLite schema (solution_designs, intake_requests, comments, history)
riskEngine.js          — Automated multi-dimensional risk scoring engine
routes/intake.js       — REST API for intake CRUD, status transitions, comments
routes/solutions.js    — REST API for solution design CRUD
routes/aiReview.js     — Anthropic Claude review endpoints (full review + quick assess)
public/index.html      — Full SPA frontend (all features in one file)
patterns/              — Architecture pattern JSON + SVG files (17 patterns)
vendors/               — Vendor registry JSON (31 vendors)
data/                  — SQLite database (auto-created)
Architecture-Pattern-Hub/ — Original monorepo spec/config (reference only)
```

## Features

### Executive KPI Dashboard
- KPI stat cards: total patterns, endorsed rate, intake requests, pending review, critical risk, critical vendors
- Pattern health chart (status breakdown with bars)
- Patterns by domain chart
- Risk distribution by tier
- Vendor criticality breakdown
- Recent intake requests feed
- Solution designs summary

### Pattern Board (Kanban)
- Visual Kanban board with four status columns: Endorsed, In Development, Under Review, Deprecated
- Each card shows pattern ID, name, domain, and CCoE certification badge
- Column headers colour-coded by status (teal, blue, amber, grey)

### Pattern Library
- Browse 17 architecture patterns across 6 domains
- Full pattern detail: components, interaction flows, guardrails, use cases, SVG diagrams
- Pattern composition relationships, implementation assets, exception process
- List view and Kanban board view

### Solution Designs
- Compose multiple architecture patterns into a named solution design
- Reference IDs: ESD-YYYY-NNNN format
- Fields: title, description, business context, owner, business unit, complexity, cost band, deployment regions
- Status lifecycle: Draft → Published
- Pattern chip display showing which patterns compose the solution

### Jira Epics & Stories Generator
- **Generate Jira Epics** button appears on Published solution designs only
- Calls `POST /api/solutions/:id/generate-epics` — Claude Sonnet 4.5 reads the solution's patterns, vendors, regions, and business context to produce a structured JSON payload of 4–7 Epics with 3–6 Stories each (titles, descriptions, acceptance criteria)
- Expandable accordion UI: Epic rows collapse/expand to reveal Stories; acceptance criteria shown per Story
- Generated output persisted in `jira_epics` JSON column on `solution_designs` table
- **Push to Jira** button opens a modal prompting for Jira base URL, project key, user email, and API token
- `POST /api/solutions/:id/push-to-jira` creates Jira issues via REST API v3 (Epic per top-level item, Story per child linked to its parent), using Atlassian Document Format for descriptions
- After push, each Epic/Story shows its newly created Jira issue key as a clickable link (↗ KEY)
- Jira connection settings (base URL, project key, email) saved to `jira_settings` table for subsequent use — API token NOT stored for security
- `GET /api/solutions/jira-settings/config` returns saved settings (without the token)
- Visual identity: Jira blue panel accent (`#4c9aff` / `rgba(38,132,255,...)`)
- Handles both `Epic` and `Story` issue types with fallback if Epic type not available in the project

### Vendor Registry
- 31 vendors with criticality, data sharing, and hosting model info
- Searchable table with criticality badges and data-sharing flags

### Architecture Intake Workflow
- **Multi-step wizard** (6 steps): Overview → Technology → Vendors → Security & Data → Dependencies → Risk Review
- **Status lifecycle:** Draft → Submitted → Under Review → Approved / Rejected / Deferred
- **Auto-generated reference IDs:** EAR-YYYY-NNNN format
- **Audit history** for every status change
- **Comment threads** per request
- **Review Queue** sorted by risk score (highest first)

### Automated Risk Assessment
Four-dimensional scoring (0-100):
1. **Data Risk** (0-25) — classification, data types, sharing, encryption
2. **Vendor Risk** (0-25) — criticality, SaaS exposure, unvetted vendors
3. **Security Risk** (0-25) — auth methods, WAF, MFA, Zero Trust alignment
4. **Complexity & Maturity Risk** (0-25) — pattern alignment, integration count, legacy deps

Risk tiers: **Low** (0-25) · **Medium** (26-50) · **High** (51-75) · **Critical** (76-100)

### Architecture Diagram Generation
- **On-demand diagram generation** from any intake detail page via "Generate Diagram" button
- Claude Sonnet 4.5 reads all request details (components, vendors, auth methods, hosting, data types, patterns) and generates a layered Mermaid.js flowchart
- Diagram zones: External (OT/ICS/SaaS), Security, Integration, Application, Data, User
- Rendered live in the browser using Mermaid.js v10 with dark theme and McCain colour accents
- Stored in `ai_diagram` TEXT column on `intake_requests` — persists across page loads; regeneratable on demand
- Diagram canvas has full overflow/scroll support for complex architectures
- Legend beneath diagram explains the main data flow in plain language
- "Generate Diagram" / "Regenerate Diagram" button in intake detail header (blue accent `#60a5fa`)
- Endpoints: `POST /api/ai/diagram/:id` (generate + store), `GET /api/ai/diagram/:id` (fetch stored)

### Document Upload & Architecture Draft Pre-fill
- **Optional document upload panel** shown above the wizard steps when creating a New Architecture Request
- Supports drag-and-drop or browse: PDF, DOCX, TXT, ZIP archives (of git repos), and common code file types (.js, .ts, .py, .yaml, .json, .xml, .tf, .md, etc.)
- Up to 10 files, 20 MB each
- Server-side text extraction: `pdf-parse` for PDFs, `mammoth` for DOCX, `adm-zip` for ZIP files, UTF-8 decode for code/text files
- Combined extracted text sent to Claude Sonnet 4.5 which returns structured JSON matching the intake wizard fields
- Wizard fields auto-populated from Claude response without overwriting values the user may have already entered
- Dismissible "Draft pre-filled from uploaded documents" confirmation banner shown after successful extraction
- If parsing or AI extraction fails, user sees a clear error and can continue manually
- Files processed in memory (multer `memoryStorage`) — not written to disk, no long-term persistence
- Endpoint: `POST /api/ai/parse-documents` (multipart form upload, returns `{ extracted: {...} }`)

### Claude AI Architecture Reviews
- **Full Review** — generated on demand from any intake detail page; stored in database as JSON; regeneratable
  - Overall rating (Endorsed / Approved with Conditions / Requires Rework / Not Recommended)
  - Executive summary with confidence level
  - Three scored dimensions: Pattern Alignment, Security Posture, Architecture Quality (each 0-10 with RAG status)
  - Risk commentary, key risks table, prioritised recommendations (Must / Should / Consider)
  - Architecture notes for reviewers
- **Quick Scan** — Claude Haiku 4.5 scan available at wizard Step 6 before submission
  - Instant rating, headline observation, and single most critical action item
- Models: `claude-sonnet-4-5` for full reviews (4096 tokens), `claude-haiku-4-5` for quick wizard scans
- Visual identity: purple/indigo accent panel (`#a78bfa` / `#7c5cbf`) to distinguish from teal rule-based risk panel
- `ai_review` TEXT column on `intake_requests` (added via safe ALTER TABLE migration)

### Team Portal
- Self-service landing page for non-EA team members
- Browse endorsed patterns catalogue
- Quick access to intake submission and request tracking

### Operational Support Module
Tracks ongoing ownership, support team details, and licensing for approved solutions in production.
- **Reference IDs:** OPS-YYYY-NNNN format
- **Linked to intake requests:** Each record can be associated with an approved intake request
- **Fields:** Solution name, owner (name/email/team), support tier, SLA, support channel, escalation contacts (repeatable), licences (repeatable with vendor/type/seats/cost/renewal date/owner), runbook URLs, monitoring dashboard URLs, review cadence, notes, status
- **Lifecycle indicator** on intake detail: Draft → Submitted → Under Review → Approved → Live (activates once an Ops Support record is linked)
- **Approved intake CTA:** When viewing an approved intake, a contextual button to create or view the linked support record appears
- **List view:** Searchable table with licence expiry at-a-glance highlighting (⚠ within 90 days highlighted)
- **Sidebar nav:** "Operational Support" section with all records count and expiring licence count
- **Storage:** SQLite `operational_support` table (JSON columns for arrays)

## API Endpoints
- `GET /api/patterns` — All patterns
- `GET /api/patterns/:file` — Single pattern (JSON or SVG)
- `GET /api/vendors` — Vendor registry
- `GET /api/intake` — All intake requests
- `GET /api/intake/stats` — Dashboard statistics
- `GET /api/intake/:id` — Single request with comments and history
- `POST /api/intake/assess` — Run risk assessment without saving
- `POST /api/intake` — Create intake request
- `PATCH /api/intake/:id` — Update intake fields
- `POST /api/intake/:id/status` — Transition request status
- `POST /api/intake/:id/comments` — Add a comment
- `DELETE /api/intake/:id` — Delete Draft/Withdrawn requests
- `GET /api/solutions` — All solution designs
- `GET /api/solutions/:id` — Single solution with composed pattern details (includes `jiraEpics` field)
- `POST /api/solutions` — Create solution design
- `PATCH /api/solutions/:id` — Update solution design
- `DELETE /api/solutions/:id` — Delete solution design
- `POST /api/solutions/:id/generate-epics` — Generate Jira Epics & Stories via Claude (Published only)
- `POST /api/solutions/:id/push-to-jira` — Push generated Epics & Stories to Jira REST API
- `GET /api/solutions/jira-settings/config` — Get saved Jira settings (without API token)
- `POST /api/ai/review/:id` — Generate + store full Claude Sonnet review for an intake request
- `GET /api/ai/review/:id` — Fetch stored AI review for an intake request
- `POST /api/ai/quick-assess` — Run Claude Haiku quick scan (wizard step 6; not persisted)
- `POST /api/ai/diagram/:id` — Generate + store architecture diagram (Mermaid flowchart) for an intake
- `GET /api/ai/diagram/:id` — Fetch stored diagram for an intake request
- `POST /api/ai/parse-documents` — Parse uploaded documents (multipart) and return Claude-extracted intake field JSON
- `GET /api/operational-support` — All support records (filterable: search, intake_reference, expiring=true)
- `GET /api/operational-support/stats` — Stats (total, expiring within 90 days)
- `GET /api/operational-support/:id` — Single record by id or reference_id
- `POST /api/operational-support` — Create new support record
- `PUT /api/operational-support/:id` — Update a support record
- `POST /api/iac/pattern/:patternId` — Generate Terraform IaC for an architecture pattern (Claude Sonnet)
- `GET /api/iac/pattern/:patternId` — Fetch stored IaC for a pattern
- `POST /api/iac/intake/:id` — Generate Terraform IaC for an intake request (Claude Sonnet)
- `GET /api/iac/intake/:id` — Fetch stored IaC for an intake request
- `POST /api/iac/solution/:id` — Generate multi-module Terraform IaC for a solution design (Claude Sonnet)
- `GET /api/iac/solution/:id` — Fetch stored IaC for a solution design
- `POST /api/github/push-iac` — Push generated IaC files to GitHub repo under given path prefix

## IaC Generation (Task #11)
Terraform IaC is generated by Claude Sonnet for three contexts:
- **Pattern IaC**: Per-pattern `main.tf`, `variables.tf`, `outputs.tf`, `providers.tf`, `README.md` — uses `azureDesign` SKUs when available (AP-001), otherwise `components` + `guardrails`
- **Intake IaC**: Context-aware code using data classification, auth, WAF settings
- **Solution IaC**: Multi-module root config with per-pattern module stubs

IaC panels use green accent (#4ade80) and appear in the right column of pattern, intake, and solution detail views. Features: file tabs, syntax-highlighted code viewer, copy button, Download ZIP (JSZip), and Push to GitHub button (stores to `iac/{patterns,intake,solutions}/{refId}/`).

## Running
```bash
npm start
```
Starts on `http://0.0.0.0:5000`

## Deployment
Configured for Replit Autoscale using `node server.js`.
