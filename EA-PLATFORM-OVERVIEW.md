# McCain EA Platform
## Enterprise Architecture Governance, Risk & Intelligence System

**Prepared for Executive Leadership** | April 2026

---

## Executive Summary

The McCain EA Platform is a purpose-built Enterprise Architecture governance system that transforms how the organisation manages technology decisions, assesses risk, and maintains architectural standards at scale. It replaces fragmented spreadsheets, manual reviews, and tribal knowledge with a single, intelligent platform that guides every architecture decision from initial request through to production operations.

**In a single platform, your architecture team can:**
- Intake and triage architecture requests with AI-powered risk assessment
- Maintain a curated library of endorsed architecture patterns
- Compose multi-pattern solution designs with formal review workflows
- Auto-generate Terraform infrastructure code, architecture diagrams, and Jira delivery plans
- Track vendor risk, licence exposure, and operational support readiness
- Present real-time KPIs to leadership through an executive dashboard

---

## The Problem We Solve

| Before the EA Platform | With the EA Platform |
|---|---|
| Architecture requests tracked in email and spreadsheets | Structured intake workflow with guided wizard and audit trail |
| Risk assessment is subjective and inconsistent | Automated 4-dimensional risk scoring engine (0-100) |
| Pattern knowledge lives in individuals' heads | Curated pattern library with Kanban board and SVG diagrams |
| Weeks spent on manual review cycles | AI-powered triage pipeline routes requests in seconds |
| No visibility into architectural debt or vendor exposure | Executive KPI dashboard with real-time metrics |
| Solution designs disconnected from delivery | One-click Jira epic/story generation and GitHub IaC push |

---

## Platform Capabilities

### 1. Architecture Intake Workflow

A guided, multi-step wizard walks requestors through submitting architecture proposals with the right level of detail from day one.

**6-Step Guided Wizard:**
1. **Overview** - Project scope, strategic objectives, business unit, timeline
2. **Technology** - Architecture type, hosting model, deployment target, components
3. **Vendors** - Select from 31+ registered vendors or flag new/unvetted ones
4. **Security & Data** - Data classification, encryption posture, auth methods, compliance requirements
5. **Dependencies** - Integration points, legacy systems, pattern alignment
6. **Risk & Submit** - AI quick-scan, final review, submission

**Key Capabilities:**
- Auto-generated reference IDs (EAR-YYYY-NNNN)
- Document upload with AI extraction (PDF, DOCX, ZIP of source code) - Claude reads uploaded documents and pre-fills wizard fields automatically
- Real-time AI Risk Sidebar (visible on steps 2-5) showing live risk estimates, contextual suggestions, and policy references as the form is completed
- Full audit history for every status transition (Draft > Submitted > Under Review > Approved/Rejected/Deferred)
- Threaded comments per request for reviewer collaboration
- Review queue sorted by risk score (highest-risk requests surface first)

---

### 2. Automated Risk Assessment Engine

A deterministic, multi-dimensional risk scoring engine that evaluates every architecture request across four domains, producing a composite score from 0-100.

| Dimension | Weight | What It Measures |
|---|---|---|
| **Data Risk** | 0-25 | Data classification (Public to Restricted), sensitive data types (PII, PHI, Financial, OT/SCADA, Credentials), external sharing, encryption posture |
| **Vendor Risk** | 0-25 | Unvetted vendors, critical/high-tier vendor concentration, SaaS shared-responsibility exposure, supply chain complexity, SSL/TLS grades, missing certifications |
| **Security Risk** | 0-25 | Authentication methods, MFA status, WAF protection, Zero Trust alignment, monitoring/observability, OT/ICS compliance (IEC 62443), public-facing restricted data exposure |
| **Complexity & Maturity Risk** | 0-25 | Pattern alignment (endorsed vs. in-development), integration point count, legacy dependencies, pattern deviations, aggressive timelines |

**Risk Tiers:**
- **Low (0-25):** Standard review process
- **Medium (26-50):** Remediation recommended before approval
- **High (51-75):** Architecture Board review required
- **Critical (76-100):** CISO and Architecture Board joint review mandatory

The engine generates specific, actionable recommendations for every risk flag identified - not generic advice, but precise remediation steps mapped to the organisation's own patterns and policies.

---

### 3. AI-Powered Intelligence Layer

The platform integrates Claude AI (Anthropic) at multiple decision points, augmenting human architects rather than replacing them.

#### 7-Stage AI Triage Pipeline (LangChain)
An automated triage pipeline processes each intake request through seven sequential AI stages:

1. **Completeness Check** - Validates whether the submission has sufficient information
2. **Classification** - Categorises by domain, complexity, change impact, business criticality
3. **Pattern Matching** - Maps the request against the endorsed pattern catalogue with relevance scoring
4. **Vendor Analysis** - Assesses registered and new vendor risk profiles
5. **Risk Scoring** - Scores across 5 risk dimensions (0-100 each) producing a composite score
6. **Routing** - Assigns to the correct review lane (Fast Track / Standard / Complex / Exception)
7. **Executive Summary** - Generates a CTO/CIO-ready decision package with verdict, strengths, risks, and required actions

#### Full AI Architecture Review
- Overall rating: Endorsed / Approved with Conditions / Requires Rework / Not Recommended
- Three scored dimensions: Pattern Alignment, Security Posture, Architecture Quality (each 0-10)
- Prioritised recommendations (Must / Should / Consider)

#### AI Quick Scan
- Instant lightweight assessment available at the wizard's final step before submission
- Powered by Claude Haiku for sub-second response

#### AI Document Extraction
- Upload PDF, DOCX, TXT, ZIP (source code archives) and Claude extracts structured intake fields automatically
- Supports drag-and-drop, up to 10 files at 20 MB each

#### AI Architecture Diagram Generation
- On-demand Mermaid.js flowchart generation from any intake request
- Produces layered zone diagrams (External, Security, Integration, Application, Data, User)
- Rendered live in-browser with dark theme and McCain brand accents

---

### 4. Architecture Pattern Library

A curated catalogue of **17 architecture patterns across 6 domains**, each representing an endorsed, reusable building block for solution composition.

**Domains Covered:**
| Domain | Example Patterns |
|---|---|
| Application & Integration | API Gateway (AP-001), Service Mesh (AP-002), BFF (AP-003), Event-Driven Integration (AP-004), Saga/Distributed Transactions (AP-005), ESB (IN-001) |
| Containers & Kubernetes | AKS Private Multi-Tenant Platform (CK-001, CK-004) |
| Cloud & Platform | Azure Landing Zone Foundation (CP-001) |
| Data & Storage | Data Lake Architecture (DT-001) |
| Network & Connectivity | Hub-Spoke Network Topology (NW-001) |
| Security & Controls | Zero Trust Network Access (SC-001), Device Compliance-Gated DLP (SEC-DLP-001) |

**Pattern Features:**
- Full detail view: components, interaction flows, guardrails, use cases, exception process
- SVG architecture diagrams for visual reference
- Kanban board view (Endorsed / In Development / Under Review / Deprecated)
- CCoE certification badges
- Pattern composition relationships for building solutions

---

### 5. Solution Design Composition

Solutions combine multiple architecture patterns into a single, deployable design with formal governance.

**7-Stage Review Pipeline:**
1. Intake Approved
2. Design Draft
3. Pattern Alignment
4. EA Review
5. Security Review
6. Architecture Board
7. Published

**Key Capabilities:**
- Reference IDs: ESD-YYYY-NNNN format
- Pattern Alignment review: side-by-side comparison UI with Aligned / Conditional / Deviation ratings per pattern
- Design iteration tracking with version labels, change summaries, and author attribution
- Direct linkage to originating intake requests (one-click "Begin Solution Design" from approved intakes)
- Published solutions unlock the full output toolkit (IaC, Jira, GitHub, Diagrams)

---

### 6. Infrastructure-as-Code Generation

One-click Terraform code generation powered by Claude, available for three contexts:

| Context | Output |
|---|---|
| **Pattern IaC** | `main.tf`, `variables.tf`, `outputs.tf`, `providers.tf`, `README.md` per pattern |
| **Intake IaC** | Context-aware Terraform using data classification, auth, and WAF settings from the request |
| **Solution IaC** | Multi-module root configuration with per-pattern module stubs |

- File-tabbed code viewer with syntax highlighting
- One-click copy, Download as ZIP, or Push to GitHub
- GitHub integration pushes to organised paths: `iac/{patterns,intake,solutions}/{refId}/`

---

### 7. Jira Integration

Automated delivery planning for published solution designs:

- **AI-Generated Epics & Stories** - Claude Sonnet reads the solution's patterns, vendors, regions, and business context to produce 4-7 Epics with 3-6 Stories each (titles, descriptions, acceptance criteria)
- **Expandable Accordion UI** - Epics collapse/expand to reveal stories with acceptance criteria
- **Push to Jira** - One-click creation of Jira issues via REST API v3 (Epic + linked Story hierarchy)
- **Bi-directional linking** - After push, each item shows its Jira issue key as a clickable link
- Connection settings saved securely (API tokens never persisted)

---

### 8. Vendor Registry & Intelligence

A centralised registry of **31 technology vendors** with risk metadata:

- Vendor company, product/service, category, sub-category
- **Criticality tiers:** Critical, High, Medium, Low
- Data sharing flags and data type classifications
- Hosting model (SaaS, IaaS, On-Prem, Hybrid)
- Programme domain alignment
- Spend band tracking
- Active/inactive lifecycle status

The risk engine automatically factors vendor criticality, SaaS exposure, and supply chain concentration into every intake assessment.

---

### 9. Operational Support Module

Post-deployment lifecycle tracking for solutions in production:

- **Reference IDs:** OPS-YYYY-NNNN format
- **Ownership tracking:** Owner name, email, team, support tier, SLA
- **Support channels:** Primary channel, escalation contact chains
- **Licence management:** Vendor, type, seat count, cost, renewal dates, responsible owner - with automatic 90-day expiry warnings
- **Operational assets:** Runbook URLs, monitoring dashboard links, review cadence
- **Lifecycle indicator:** Intake status extends to "Live" once operational support is activated
- Linked to intake requests and solution designs for full traceability

---

### 10. Executive KPI Dashboard

Real-time visibility for leadership with at-a-glance metrics:

**KPI Cards:**
- Total Architecture Patterns (with endorsed rate)
- Active Intake Requests and pending review count
- Critical Risk requests requiring attention
- Critical-tier vendor count
- Solution design pipeline status

**Visual Analytics:**
- Pattern health chart (status breakdown by lifecycle stage)
- Patterns by domain distribution
- Risk distribution by tier (Low / Medium / High / Critical)
- Vendor criticality breakdown
- Recent intake activity feed
- Solution design summary cards

---

## Technology Architecture

| Layer | Technology |
|---|---|
| **Runtime** | Node.js 20 |
| **API Framework** | Express 5 |
| **Database** | PostgreSQL (with SQLite fallback) |
| **AI / LLM** | Anthropic Claude (Sonnet 4.5 for reviews/generation, Haiku 4.5 for quick scans) |
| **AI Orchestration** | LangChain.js (multi-stage pipeline) |
| **Frontend** | Responsive SPA (Vanilla JS) + React component system (Radix UI, Tailwind CSS, Recharts) |
| **Document Processing** | pdf-parse, mammoth (DOCX), adm-zip (ZIP/source code) |
| **Diagrams** | Mermaid.js v10 (AI-generated, browser-rendered) |
| **IaC** | Terraform (AI-generated, GitHub-pushable) |
| **Integrations** | Jira REST API v3, GitHub API |
| **Design System** | McCain brand identity (Navy #1B3A6B, Teal #109977), multi-theme support |

**Architecture Principles:**
- RESTful API design with 40+ endpoints
- Deterministic risk scoring (rule-based) augmented by AI intelligence (LLM-based)
- Full audit trail on all state transitions
- Secure file processing (in-memory only, no disk persistence)
- Auto-generated reference IDs across all entities for traceability

---

## Competitive Differentiators

1. **AI-Native, Not AI-Bolted** - Claude AI is woven into every workflow: intake triage, risk assessment, architecture review, diagram generation, IaC output, and delivery planning. This isn't a chatbot sidebar - it's embedded intelligence.

2. **End-to-End Lifecycle** - From initial request to production operations in a single platform. No handoffs between tools for intake, design, review, code generation, delivery planning, and operational support.

3. **Deterministic + Probabilistic Risk** - The rule-based risk engine provides consistent, auditable scoring while AI provides contextual analysis and recommendations. Both perspectives inform decisions.

4. **Pattern-First Architecture Governance** - Every decision is anchored to the organisation's endorsed pattern library. Solutions compose patterns. Risk scores reflect pattern alignment. AI reviews assess pattern adherence.

5. **Self-Service with Guardrails** - The guided wizard, real-time risk sidebar, and AI quick-scan empower teams to self-serve while automatically routing high-risk requests to the right reviewers.

6. **Delivery-Ready Outputs** - Published solutions don't stop at approval. One-click Terraform generation, Jira epic/story creation, and GitHub push close the gap between architecture decision and engineering execution.

---

## Business Value

| Metric | Impact |
|---|---|
| **Time to Architecture Decision** | Reduce from weeks to days through automated triage and AI-assisted review |
| **Risk Visibility** | 100% of architecture requests scored and tiered before human review |
| **Consistency** | Every request assessed against the same 4-dimensional risk framework |
| **Pattern Reuse** | Endorsed patterns surface automatically via AI matching, reducing reinvention |
| **Audit & Compliance** | Full history of every decision, status change, and reviewer action |
| **Vendor Risk** | Centralised vendor intelligence with automatic risk factor integration |
| **Delivery Velocity** | Architecture-to-Jira pipeline eliminates manual epic/story drafting |
| **Operational Readiness** | Licence expiry tracking and support ownership built into the governance flow |

---

## Summary

The McCain EA Platform is not a documentation tool or a project tracker. It is an **architecture governance operating system** - a system that captures institutional knowledge in patterns, applies consistent risk frameworks to every decision, augments human judgment with AI intelligence, and connects architecture decisions directly to engineering delivery.

It gives the Architecture team scalable governance without bureaucratic overhead, and it gives leadership real-time visibility into the technology risk landscape across the enterprise.

**Built for McCain. Powered by AI. Governed by design.**
