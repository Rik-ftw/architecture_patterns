# 01 — Modular Decomposition & Team Ownership

**Owner:** EA team
**Status:** Draft

---

## Purpose

Define the bounded contexts, the services that implement them, their data ownership, API contracts, and which team owns each. The guiding constraint: **a change in one module must not require coordinated deploys in another**.

---

## Bounded Contexts

The platform decomposes into six bounded contexts plus a shared UI shell:

| # | Bounded Context | Service | Owner |
|---|----------------|---------|-------|
| 1 | **EA Governance** | `svc-intake-governance` | EA team |
| 2 | **Architecture Pattern Management** | `svc-pattern-catalog` | Core Architects |
| 3 | **Vendor & Third-Party Risk** | `svc-vendor-registry` | EA + Procurement |
| 4 | **AI Orchestration** | `svc-ai-orchestrator` | AI/Platform + Architects |
| 5 | **MCP Gateway** | `svc-mcp-gateway` | AI/Platform |
| 6 | **IaC Integration** | `svc-iac-dispatcher` | Cloud Engineering |
| 7 | **Portal (UI shell + BFF)** | `app-portal` | Frontend guild (shared) |

---

## Ownership Matrix

| Service | Primary Owner | Secondary | Approvers (CODEOWNERS) | Deploy Cadence |
|---------|--------------|-----------|------------------------|----------------|
| `svc-intake-governance` | EA | Platform | `@ea-team` | Weekly |
| `svc-pattern-catalog` | Core Architects | EA | `@architects` | On-demand (pattern updates) |
| `svc-vendor-registry` | EA + Procurement | Security | `@ea-team @procurement` | Weekly |
| `svc-ai-orchestrator` | AI/Platform | Architects | `@ai-platform @architects` | Bi-weekly |
| `svc-mcp-gateway` | AI/Platform | — | `@ai-platform` | Bi-weekly |
| `svc-iac-dispatcher` | Cloud Engineering | Platform | `@cloud-eng` | Bi-weekly |
| `app-portal` | Frontend guild | EA (UX) | `@frontend-guild` | Weekly |
| `platform-iac/` (repo) | Cloud Engineering | — | `@cloud-eng` | On-demand (infra changes) |

---

## Service Responsibilities (What Each Owns)

### 1. `svc-intake-governance` (EA team)
**Purpose:** Owns the intake request lifecycle and the workflow state machine.

**Owns:**
- Intake request CRUD (drafts, submissions, updates)
- Workflow state machine execution (the 20 states from `state-machine.json`)
- SLA tracking, escalation, timeout handling
- Review assignment and review outcomes
- Comments, attachments metadata, audit trail
- Workflow-related notifications (Teams, email)

**Does not own:**
- Pattern matching logic (calls `svc-ai-orchestrator`)
- Vendor lookup (calls `svc-vendor-registry`)
- Form rendering (owned by `app-portal`)

**Data owned:**
- `intake.*` schema in PostgreSQL
- Tables: `requests`, `workflow_states`, `state_history`, `reviews`, `comments`, `attachments`, `sla_events`

**API surface (examples):**
- `POST /api/v1/intake/requests` — create
- `POST /api/v1/intake/requests/{id}/submit` — submit for triage
- `POST /api/v1/intake/requests/{id}/transition` — state machine event
- `POST /api/v1/intake/requests/{id}/reviews` — submit review
- `GET /api/v1/intake/requests/{id}` — read
- `GET /api/v1/intake/dashboard` — metrics

**Events published (CloudEvents via Event Hubs):**
- `intake.request.submitted.v1`
- `intake.request.needs-info.v1`
- `intake.request.approved.v1`
- `intake.request.rejected.v1`
- `intake.state.transitioned.v1`
- `intake.sla.breached.v1`

**Events consumed:**
- `ai.triage.completed.v1` (from `svc-ai-orchestrator`)
- `vendor.status.updated.v1` (from `svc-vendor-registry`)

---

### 2. `svc-pattern-catalog` (Core Architects)
**Purpose:** The canonical source of truth for architecture patterns. Pattern authoring, versioning, lifecycle.

**Owns:**
- Pattern CRUD with semantic versioning
- Pattern lifecycle states (Draft → In Development → Under Review → Endorsed → Deprecated)
- Pattern search (full-text + semantic embeddings)
- Guardrail enforcement rules
- Pattern composition graph (which patterns depend on which)
- SVG diagram storage and rendering

**Does not own:**
- Applying patterns to requests (that's `svc-ai-orchestrator`)
- Pattern exception decisions (that's `svc-intake-governance`)

**Data owned:**
- `patterns.*` schema in PostgreSQL
- Tables: `patterns`, `pattern_versions`, `pattern_guardrails`, `pattern_components`, `pattern_compositions`, `pattern_embeddings` (pgvector)

**API surface:**
- `GET /api/v1/patterns` — search/list
- `GET /api/v1/patterns/{id}` — detail
- `GET /api/v1/patterns/{id}/versions` — version history
- `POST /api/v1/patterns` — create (RBAC: architects only)
- `PUT /api/v1/patterns/{id}` — update
- `POST /api/v1/patterns/{id}/publish` — promote lifecycle state
- `GET /api/v1/patterns/{id}/embedding` — vector for similarity search
- `POST /api/v1/patterns/search/semantic` — vector search
- `GET /api/v1/guardrails?patternId=&severity=` — guardrail query

**Events published:**
- `pattern.created.v1`
- `pattern.updated.v1`
- `pattern.endorsed.v1`
- `pattern.deprecated.v1`

**Why this is its own service:** Architects author patterns on a different cadence than EA submits intake requests. A pattern update should not require an intake service deploy. Pattern embeddings are recomputed on change — isolate that workload.

---

### 3. `svc-vendor-registry` (EA + Procurement)
**Purpose:** The canonical vendor registry with criticality, data sharing, hosting, and review dates.

**Owns:**
- Vendor CRUD
- Vendor onboarding workflow (separate mini-workflow)
- Third-party risk assessments
- Vendor review scheduling and expiry
- Procurement links (SAP Ariba, etc.)

**Data owned:**
- `vendors.*` schema
- Tables: `vendors`, `vendor_versions`, `vendor_reviews`, `vendor_data_sharing`, `vendor_spend`

**API surface:**
- `GET /api/v1/vendors` — search
- `GET /api/v1/vendors/check/{name}` — approval lookup
- `POST /api/v1/vendors` — create
- `PUT /api/v1/vendors/{id}` — update
- `POST /api/v1/vendors/{id}/review` — record periodic review

**Events published:**
- `vendor.created.v1`
- `vendor.criticality.changed.v1`
- `vendor.review.overdue.v1`

---

### 4. `svc-ai-orchestrator` (AI/Platform + Architects)
**Purpose:** Runs the LangGraph AI workflows. Stateless compute on demand.

**Owns:**
- LangGraph graph definitions (versioned)
- Prompt templates (versioned)
- Model routing (which model for which node)
- Pattern matching execution (calls `svc-pattern-catalog` for data)
- Vendor analysis execution (calls `svc-vendor-registry`)
- Risk scoring model
- Triage result persistence (writes to its own schema, not intake's)
- Feedback loop capture for retraining

**Does not own:**
- Intake request state (read-only from `svc-intake-governance`)
- Pattern data (read-only from `svc-pattern-catalog`)

**Data owned:**
- `ai.*` schema
- Tables: `triage_runs`, `triage_stages`, `prompt_versions`, `graph_versions`, `feedback_events`, `model_metrics`

**API surface:**
- `POST /api/v1/ai/triage` — kick off triage for a request
- `GET /api/v1/ai/triage/{runId}` — get result
- `POST /api/v1/ai/triage/{runId}/stage/{stage}` — re-run a single stage
- `POST /api/v1/ai/feedback` — record human override / outcome
- `GET /api/v1/ai/graphs` — list graph versions
- `POST /api/v1/ai/graphs/{id}/activate` — promote a graph version

**Events published:**
- `ai.triage.started.v1`
- `ai.triage.stage.completed.v1`
- `ai.triage.completed.v1`
- `ai.triage.halted.v1` (e.g., needs-info)

**Events consumed:**
- `intake.request.submitted.v1` → trigger triage
- `intake.review.completed.v1` → capture feedback signal

**Why this is its own service:** AI work has very different resource profiles (bursty, LLM-latency-bound, GPU-optional), different secrets (API keys), and different release cadence (prompt tweaks should deploy independently of intake logic).

---

### 5. `svc-mcp-gateway` (AI/Platform)
**Purpose:** Exposes the platform as MCP tools to AI agents (Claude Code, Copilot, etc.).

**Owns:**
- MCP tool registry
- Tool call authentication and authorization
- Rate limiting per agent
- Tool-to-service adapters (calls the same internal APIs as the portal)
- Audit log of agent tool calls

**Does not own:**
- Any domain data — it's a pure gateway

**Data owned:**
- `mcp.*` schema (audit only)
- Tables: `agent_sessions`, `tool_calls`, `rate_limit_state`

**Why this is its own service:** MCP is a protocol, not a domain. Isolating it allows protocol evolution (new MCP versions, transport changes) without touching business logic.

---

### 6. `svc-iac-dispatcher` (Cloud Engineering)
**Purpose:** Converts approved intake requests into IaC work packages handed off to existing cloud deployment pipelines.

**Owns:**
- Approved request → IaC spec translation
- Module selection (which Terraform modules to include)
- Variable pre-population from intake fields
- Handoff to Azure DevOps pipelines or Backstage templates
- Implementation status tracking (polls downstream systems)

**Does not own:**
- The IaC modules themselves (those live in `platform-iac` repo, also owned by Cloud Engineering)
- Actual deployments (existing pipelines do that)

**Data owned:**
- `iac.*` schema
- Tables: `iac_work_packages`, `iac_module_mappings`, `implementation_status`

**API surface:**
- `POST /api/v1/iac/packages` — create from approved request
- `GET /api/v1/iac/packages/{id}` — status
- `POST /api/v1/iac/packages/{id}/dispatch` — trigger downstream pipeline

**Events consumed:**
- `intake.request.approved.v1` → create work package

**Why this is its own service:** Cloud Engineering owns the IaC repo and pipelines. This service is their seam into the governance platform. They can evolve their IaC module catalogue without touching EA code.

---

### 7. `app-portal` (Frontend guild, shared)
**Purpose:** The Next.js portal — intake form, triage dashboard, request detail, analytics.

**Owns:**
- All React/Next.js UI components
- Backend-for-Frontend (BFF) layer aggregating calls to backend services (AP-003 pattern)
- Session management (Entra ID OIDC)
- Client-side state management

**Does not own:**
- Any domain data — it's a read model aggregator

**BFF API surface:**
- `GET /bff/requests` — aggregated view combining intake + triage data
- `POST /bff/requests/:id/ai-copilot` — proxies to AI orchestrator
- `GET /bff/dashboard` — aggregated metrics

**Why a BFF layer:** Portal-specific aggregation and response shaping stay out of the backend services. Mobile or other clients could have their own BFFs later.

---

## Module Dependency Graph

```
                    ┌─────────────┐
                    │ app-portal  │
                    │ (Next.js)   │
                    └──────┬──────┘
                           │ REST via APIM
        ┌──────────────────┼─────────────────┬──────────────┐
        │                  │                 │              │
        ▼                  ▼                 ▼              ▼
┌──────────────┐   ┌───────────────┐  ┌────────────┐  ┌──────────┐
│svc-intake-   │──▶│svc-ai-        │─▶│svc-pattern-│  │svc-mcp-  │
│governance    │   │orchestrator   │  │catalog     │  │gateway   │
└──────┬───────┘   │ (LangGraph)   │  └────────────┘  └─────┬────┘
       │           └────┬──────────┘         ▲              │
       │                │                    │              │
       │                ▼                    │              │
       │           ┌────────────┐             │              │
       │           │svc-vendor- │◀────────────┘              │
       │           │registry    │                            │
       │           └────────────┘                            │
       │                                                     │
       ▼                                                     │
┌──────────────┐          ┌──────────────────────────────────┘
│svc-iac-      │          │ (MCP tool calls go to same
│dispatcher    │          │  internal APIs as the portal)
└──────┬───────┘          │
       │                  │
       ▼                  ▼
  Azure DevOps     AI agents (Claude Code, Copilot, etc.)
  Pipelines
  (existing)

          ┌──────────────────────┐
          │ Azure Event Hubs     │ ← all services publish/subscribe
          │ (CloudEvents topic)  │
          └──────────────────────┘
```

**Allowed dependencies:**
- `app-portal` → all services (via APIM)
- `svc-intake-governance` → `svc-ai-orchestrator` (triage kickoff), event-driven for results
- `svc-ai-orchestrator` → `svc-pattern-catalog`, `svc-vendor-registry` (read-only)
- `svc-mcp-gateway` → all read services (via internal API)
- `svc-iac-dispatcher` → `svc-intake-governance` (event-driven, reads approved requests)

**Forbidden dependencies:**
- `svc-pattern-catalog` → anything (it's a leaf)
- `svc-vendor-registry` → anything (leaf)
- Any service → another service's database (strict data ownership)

---

## Inter-Service Communication Rules

1. **Synchronous (REST):** Read operations, immediate triage kickoff, dashboard aggregation
2. **Asynchronous (Event Hubs + CloudEvents):** State changes, completion notifications, feedback signals
3. **No shared database access across service boundaries.** Each service owns its schema. Reads from another service's data go through that service's API.
4. **No chatty calls.** If a request needs data from three services, aggregate in the BFF or use an orchestration service.
5. **Idempotency required.** Every state-changing API accepts an `Idempotency-Key` header. Event handlers must be idempotent.
6. **Backward-compatible evolution.** Breaking changes require `/v2/` endpoints with a minimum 90-day deprecation period on `/v1/`.

---

## Contract Governance

All inter-service contracts live in a shared repo: `platform-contracts/`:

```
platform-contracts/
├── openapi/
│   ├── intake.v1.yaml
│   ├── pattern-catalog.v1.yaml
│   ├── vendor-registry.v1.yaml
│   ├── ai-orchestrator.v1.yaml
│   ├── iac-dispatcher.v1.yaml
│   └── mcp-gateway.v1.yaml
├── events/
│   ├── intake.request.submitted.v1.json   (JSON Schema)
│   ├── intake.state.transitioned.v1.json
│   ├── ai.triage.completed.v1.json
│   └── ...
└── docs/
    └── contract-evolution-policy.md
```

**Rules:**
- Any PR that modifies a contract requires approval from BOTH the producer team AND all consumer teams (enforced via CODEOWNERS)
- Contracts are versioned; the file itself changes only via semver-compatible changes
- Generated client SDKs are published to an internal Artifactory / Azure Artifacts feed
- Every service includes contract tests against the published schemas in CI

---

## Team Interface — Who Talks to Whom

| Team | Owns | Consumes From | Provides To |
|------|------|--------------|-------------|
| EA | Intake, vendor registry, workflow | Pattern, AI orchestrator | Portal, IaC dispatcher |
| Core Architects | Pattern catalogue | (nothing) | EA, AI orchestrator |
| AI/Platform | AI orchestrator, MCP gateway | Pattern, vendor | Intake, portal, agents |
| Cloud Engineering | IaC dispatcher, IaC repo | Intake (approved events) | (hands off to existing pipelines) |
| Frontend guild | Portal | All backend services | End users |

---

## When a New Feature Crosses Modules

**Scenario:** EA wants to add a new question to the intake form that triggers a new AI risk dimension.

**Without modularity (bad):** One PR touches UI, intake service, AI prompts, and risk scoring model. Four teams must coordinate.

**With modularity (good):**
1. **Frontend guild** adds the field to the form definition (contract: `intake-request.v1.yaml` field additions are backward-compatible since they're optional)
2. **EA team** updates `svc-intake-governance` to accept the new optional field
3. **Architects + AI/Platform** update the LangGraph risk scoring node (new prompt version, new graph version)
4. Each team ships independently. The AI upgrade is invisible to EA's service — it just passes the field through.

**Coordination only happens at the contract level,** not in code.

---

## What Moves From the Prototype

Current prototype location → target service:

| Prototype asset | Target location | Owner |
|----------------|-----------------|-------|
| `mcp-server/src/server.js` (REST API) | Split: governance routes → `svc-intake-governance`, pattern routes → `svc-pattern-catalog`, vendor routes → `svc-vendor-registry` | Respective owners |
| `mcp-server/src/index.js` (MCP server) | `svc-mcp-gateway` | AI/Platform |
| `mcp-server/src/pipeline/triage-pipeline.js` (LangChain) | Rewritten as LangGraph in `svc-ai-orchestrator` | AI/Platform |
| `intake-workflow/workflows/state-machine.json` | Migrated to `svc-intake-governance/config/` + rewritten as XState machine in code | EA |
| `intake-workflow/schemas/*.json` | Split: intake schema → `svc-intake-governance`, form definition → `app-portal` | EA + Frontend |
| `intake-workflow/ai-engine/*.prompt` | `svc-ai-orchestrator/prompts/` (versioned) | AI/Platform |
| `patterns/*.json` | Seeded into `svc-pattern-catalog` PostgreSQL schema | Core Architects |
| `vendors/registry.json` | Seeded into `svc-vendor-registry` PostgreSQL schema | EA + Procurement |

This migration happens in Phase 2 (see `06-migration-plan.md`).
