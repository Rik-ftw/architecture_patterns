# EA Platform — Enterprise Architecture Pattern & Intake System

## Overview
A full enterprise architecture platform with a pattern library, vendor registry, and a mature intake workflow with automated risk assessment and scoring.

## Tech Stack
- **Runtime:** Node.js 20
- **Web Framework:** Express 5
- **Database:** SQLite (better-sqlite3) — stored in `data/ea_platform.db`
- **Frontend:** Vanilla HTML/CSS/JS SPA (served from `public/`)
- **Data Sources:** JSON files in `patterns/` and `vendors/`

## Project Structure
```
server.js              — Express server (port 5000, host 0.0.0.0)
db.js                  — SQLite schema (intake_requests, comments, history)
riskEngine.js          — Automated multi-dimensional risk scoring engine
routes/intake.js       — REST API for intake CRUD, status transitions, comments
public/index.html      — Full SPA frontend
patterns/              — Architecture pattern JSON + SVG files
vendors/               — Vendor registry JSON
data/                  — SQLite database (auto-created)
```

## Features

### Pattern Library
- Browse 17 architecture patterns across domains
- Full pattern detail: components, interaction flows, guardrails, diagrams
- Pattern status: Endorsed / In Development / Under Review

### Vendor Registry
- 31 vendors with criticality, data sharing, and hosting model info
- Searchable/filterable table

### Architecture Intake Workflow
- **Multi-step wizard** (6 steps): Overview → Technology → Vendors → Security & Data → Dependencies → Risk Review
- **Status lifecycle:** Draft → Submitted → Under Review → Approved / Rejected / Deferred
- **Auto-generated reference IDs:** EAR-YYYY-NNNN format
- **Audit history** for every status change
- **Comment threads** per request

### Automated Risk Assessment
Four-dimensional scoring (0-100):
1. **Data Risk** (0-25) — classification, data types, sharing, encryption
2. **Vendor Risk** (0-25) — criticality, SaaS exposure, unvetted vendors
3. **Security Risk** (0-25) — auth methods, WAF, MFA, Zero Trust alignment
4. **Complexity & Maturity Risk** (0-25) — pattern alignment, integration count, legacy deps

Risk tiers: **Low** (0-25) · **Medium** (26-50) · **High** (51-75) · **Critical** (76-100)

### Review Queue
- Sorted by risk score (highest first)
- Quick-action buttons: Approve / Defer / Reject / Mark Under Review
- Reviewer notes and linked pattern ID on approval

## API Endpoints
- `GET /api/patterns` — All patterns
- `GET /api/patterns/:file` — Single pattern (JSON or SVG)
- `GET /api/vendors` — Vendor registry
- `GET /api/intake` — All intake requests (filterable)
- `GET /api/intake/stats` — Dashboard statistics
- `GET /api/intake/:id` — Single request with comments and history
- `POST /api/intake/assess` — Run risk assessment without saving
- `POST /api/intake` — Create intake request
- `PATCH /api/intake/:id` — Update intake fields
- `POST /api/intake/:id/status` — Transition request status
- `POST /api/intake/:id/comments` — Add a comment
- `DELETE /api/intake/:id` — Delete Draft/Withdrawn requests

## Running
```bash
npm start
```
Starts on `http://0.0.0.0:5000`

## Deployment
Configured for Replit Autoscale using `node server.js`.
