# Architecture Intake Workflow — System Design

## Overview

A scalable, AI-enabled application and solution intake system that sits on top of the Architecture Pattern Library. It provides structured intake, automated triage, intelligent routing, and governed approval workflows.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        INTAKE PORTAL (UI)                           │
│  ┌──────────┐ ┌──────────────┐ ┌────────────┐ ┌─────────────────┐  │
│  │  Multi-   │ │  AI Copilot  │ │  Triage    │ │   Dashboard &   │  │
│  │  Step     │ │  Sidebar     │ │  Dashboard │ │   Analytics     │  │
│  │  Form     │ │  (Chat +     │ │  (Kanban/  │ │   (Metrics,     │  │
│  │  Wizard   │ │  Suggestions)│ │  Table)    │ │   SLA, Trends)  │  │
│  └─────┬────┘ └──────┬───────┘ └─────┬──────┘ └────────┬────────┘  │
│        │              │               │                  │           │
├────────┴──────────────┴───────────────┴──────────────────┴──────────┤
│                         API LAYER (REST)                            │
│  /intake/*    /ai/copilot/*    /workflow/*    /dashboard/*           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────┐  ┌──────────────────┐  ┌───────────────────────┐  │
│  │  WORKFLOW     │  │   AI TRIAGE      │  │  PATTERN & VENDOR     │  │
│  │  ENGINE       │  │   ENGINE         │  │  LIBRARY              │  │
│  │              │  │                  │  │                       │  │
│  │  State       │  │  1. Completeness │  │  patterns/*.json      │  │
│  │  Machine     │  │  2. Classify     │  │  vendors/registry.json│  │
│  │  (XState)    │  │  3. Pattern Match│  │                       │  │
│  │              │  │  4. Vendor Check  │  │  Semantic Search      │  │
│  │  SLA Timers  │  │  5. Risk Score   │  │  (Embeddings)         │  │
│  │  Routing     │  │  6. Route        │  │                       │  │
│  │  Escalation  │  │  7. Summarize    │  │                       │  │
│  └──────┬───────┘  └────────┬─────────┘  └───────────┬───────────┘  │
│         │                   │                        │              │
├─────────┴───────────────────┴────────────────────────┴──────────────┤
│                       DATA LAYER                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────────┐  │
│  │  Request DB   │  │  Workflow     │  │  Feedback & Analytics    │  │
│  │  (Postgres)   │  │  State Store  │  │  (for AI retraining)    │  │
│  └──────────────┘  └──────────────┘  └───────────────────────────┘  │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                     INTEGRATIONS                                    │
│  ServiceNow  │  Teams  │  Email  │  Azure AD/Entra  │  LeanIX      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Workflow State Machine

### States (20 total)

| State | Description | Owner | SLA |
|-------|-------------|-------|-----|
| `draft` | Requestor preparing form | Requestor | — |
| `submitted` | Auto-transitions to AI triage | System | 1h |
| `ai_triage` | AI engine processing | AI Engine | 30m |
| `pending_triage` | Human reviews AI recommendation | Triage Analyst | 24h |
| `needs_info` | Waiting on requestor | Requestor | 7d |
| `in_assessment` | Domain lead assessing | Domain Lead | 48h |
| `architecture_review` | Architecture team review | Architect | 72h |
| `security_review` | Security team review | Security | 72h |
| `vendor_review` | Vendor/procurement review | Vendor Analyst | 96h |
| `arb_review` | Architecture Review Board | ARB | 168h |
| `ccoe_review` | Cloud CoE review | CCoE | 120h |
| `pending_approval` | Final approval gate | Approver | 48h |
| `approved` | Ready for implementation | — | — |
| `approved_with_conditions` | Approved with caveats | — | — |
| `in_implementation` | Being built | Impl Team | — |
| `post_implementation_review` | Verify compliance | Architect | 240h |
| `rejected` | Request rejected (final) | — | — |
| `deferred` | Parked for later | — | — |
| `cancelled` | Cancelled (final) | — | — |
| `closed` | Completed (final) | — | — |

### Routing Lanes

| Lane | Risk Level | Reviews Required | SLA |
|------|-----------|-----------------|-----|
| **Fast Track** | Low risk, pattern-aligned, approved vendors | None (auto-approve) | 48h |
| **Standard** | Low-Medium, no exceptions | Architecture | 7 days |
| **Complex** | High risk, 5+ integrations, or decommission | Architecture + Security + Vendor | 14 days |
| **Exception** | Critical risk, pattern deviation, unapproved vendor | Architecture + Security + ARB | 21 days |

---

## AI Engine Pipeline

The AI triage engine runs a **7-stage pipeline** on every submitted request:

```
Submit → Completeness → Classify → Pattern Match → Vendor Check → Risk Score → Route → Summarize
           Check                                                                          ↓
                                                                            Decision Package
```

### Stage Details

1. **Completeness Check** — Validates fields, scores clarity, flags gaps
2. **Classification** — Domain, complexity tier, request archetype
3. **Pattern Matching** — Semantic + rule-based matching against 18 patterns
4. **Vendor Analysis** — Cross-reference against 31-vendor registry
5. **Risk Scoring** — 5-dimension weighted scoring (security, compliance, architectural, operational, vendor)
6. **Routing Decision** — Lane assignment + required reviews
7. **Summary Generation** — Executive decision package for reviewers

### AI-Assisted Form Features

- **Smart Start**: Natural language → structured form prefill
- **Copilot Chat**: Contextual Q&A about patterns, vendors, requirements
- **Live Pattern Matching**: Real-time sidebar showing relevant patterns as you type
- **Vendor Autocomplete**: Typeahead from registry with approval badges
- **Security Tier Suggestion**: Auto-suggests based on data classification + regulations
- **Pre-Submit Summary**: AI-generated review before submission

### Feedback Loop

Human overrides and post-implementation outcomes feed back into the AI:
- Triage overrides → routing model improvement
- Review mismatches → risk scoring calibration
- Post-impl results → overall model retraining (monthly)

---

## Front-End Component Map

### Pages & Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/intake/new` | `IntakeWizard` | Multi-step form with AI copilot |
| `/intake/:id` | `RequestDetail` | Full request view with state, triage, reviews |
| `/intake/:id/triage` | `TriageView` | AI triage results with override controls |
| `/triage` | `TriageDashboard` | Kanban/table of requests pending triage |
| `/reviews` | `ReviewQueue` | Reviewer's queue (architecture, security, vendor) |
| `/reviews/:id` | `ReviewWorkbench` | Review interface with AI analysis sidebar |
| `/arb` | `ArbBoard` | ARB meeting view with decision packages |
| `/dashboard` | `MetricsDashboard` | Analytics, SLA tracking, trends |
| `/admin/workflow` | `WorkflowAdmin` | Workflow configuration and routing rules |

### Shared Components

| Component | Purpose |
|-----------|---------|
| `AiCopilotSidebar` | Persistent chat + contextual suggestions |
| `PatternMatchCard` | Shows matched pattern with relevance score |
| `RiskScoreRadar` | 5-axis radar chart for risk dimensions |
| `WorkflowTimeline` | Visual state history with SLA indicators |
| `SlaCountdown` | Timer showing time remaining before breach |
| `ReviewDecisionForm` | Approve/reject/conditional with comments |
| `VendorStatusBadge` | Approved/under review/not in registry badge |

---

## Data Model Relationships

```
IntakeRequest (1) ─── (1) WorkflowState
      │                       │
      │                       ├── stateHistory[] (audit trail)
      │                       ├── aiTriageResult (AI output)
      │                       ├── reviews[] (review decisions)
      │                       └── slaTracking
      │
      ├── requestor (user)
      ├── technicalContext
      │     ├── integrationPoints[]
      │     ├── dataRequirements
      │     └── scalabilityRequirements
      ├── complianceContext
      ├── businessJustification
      ├── timeline
      └── attachments[]

PatternLibrary ←── matched by AI ──→ IntakeRequest
VendorRegistry ←── matched by AI ──→ IntakeRequest
```

---

## Tech Stack Recommendation

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Front-end** | Next.js 15 + React 19 | App router, RSC, form actions |
| **UI Kit** | shadcn/ui + Tailwind | Rapid prototyping, accessible |
| **State Machine** | XState v5 | Type-safe workflow engine |
| **API** | Next.js API Routes or Express | REST endpoints per contract |
| **AI/LLM** | Claude API (Anthropic) | Triage pipeline, copilot chat |
| **Embeddings** | text-embedding-3-large | Semantic pattern matching |
| **Database** | PostgreSQL + Prisma | Structured data, audit trail |
| **Auth** | Microsoft Entra ID (OIDC) | Enterprise SSO |
| **Notifications** | Teams webhooks + Email | Workflow notifications |
| **Hosting** | Azure App Service or AKS | Aligns with CK-001 pattern |

---

## Getting Started — Iteration Plan

### Phase 1: Foundation (Iterate here first)
- [ ] Validate intake schema with real request examples
- [ ] Refine routing lane criteria with triage team
- [ ] Test AI prompt templates with sample submissions
- [ ] Confirm workflow state machine covers edge cases

### Phase 2: MVP Build
- [ ] Next.js app scaffold with form wizard
- [ ] XState workflow engine integration
- [ ] Claude API integration for triage pipeline
- [ ] Basic triage dashboard

### Phase 3: Scale
- [ ] Full review workflows (architecture, security, vendor, ARB)
- [ ] SLA monitoring and escalation automation
- [ ] Dashboard analytics and reporting
- [ ] ServiceNow / Teams / Email integrations
- [ ] AI feedback loop and model improvement

### Phase 4: Enterprise
- [ ] RBAC with Entra ID
- [ ] Multi-tenant support (if cross-BU)
- [ ] Advanced AI: similar request lookup, predictive SLA, drift detection
- [ ] LeanIX integration for EA catalog sync
