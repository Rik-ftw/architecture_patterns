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
- **Future features** (from spec): Anthropic AI drafting, DOCX export, GitHub sourcing, security advisory scanning, Cloudflare vendor risk

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

### Team Portal
- Self-service landing page for non-EA team members
- Browse endorsed patterns catalogue
- Quick access to intake submission and request tracking

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
- `GET /api/solutions/:id` — Single solution with composed pattern details
- `POST /api/solutions` — Create solution design
- `PATCH /api/solutions/:id` — Update solution design
- `DELETE /api/solutions/:id` — Delete solution design

## Running
```bash
npm start
```
Starts on `http://0.0.0.0:5000`

## Deployment
Configured for Replit Autoscale using `node server.js`.
