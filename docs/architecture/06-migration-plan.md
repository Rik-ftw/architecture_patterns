# 06 — Migration Plan (Replit → Azure)

**Owner:** Platform + EA
**Status:** Draft

---

## Starting Point

What exists today (the prototype, committed on this branch):

- `intake-workflow/` — intake schema, state machine, AI pipeline config, API contract, mockup
- `mcp-server/` — MCP server exposing 10 governance tools, LangChain sequential triage pipeline, Express REST API, CLI runner
- `patterns/` — 18 endorsed patterns across 6 domains (JSON)
- `vendors/` — registry of 31 approved/conditional/restricted vendors
- `.replit`, `replit.nix` — Replit runtime config

It runs on Replit end-to-end: submit an intake via the API, watch LangChain execute 7 stages against Anthropic, get a routing decision.

## Target State

Everything described in docs 00–05: seven repos, schema-per-service PostgreSQL, LangGraph orchestration, AKS private cluster, Terraform + ArgoCD, versioned contracts.

## Migration Philosophy

1. **No big bang.** Replit keeps running as the reference until Azure reaches parity and passes UAT.
2. **Parallel run, then cutover.** For the overlap period, both systems process new intakes; we diff outputs.
3. **Ship each service independently.** As soon as a service is prod-ready it starts serving real traffic; we don't wait for the whole platform.
4. **Contracts first, implementation second.** Every phase starts by freezing the relevant contract in `platform-contracts`.
5. **Assume nothing is done until it's observed in prod.** "Deployed" ≠ "working."

---

## Phase 0 — Foundations (weeks 1–2)

**Goal:** Azure landing zone and shared plumbing ready. Nothing about the intake platform yet.

**Cloud Engineering owns the bulk of this phase.**

| Task | Owner | Output |
|------|-------|--------|
| Create `platform-iac` repo, seed Terraform structure | Cloud Eng | Repo exists with `environments/dev,test,uat,prod` |
| Provision dev + test + uat + prod subscriptions, RGs, VNets | Cloud Eng | Four environments, hub-spoke wired |
| Deploy shared AKS (CK-001), private, with `intake-platform` namespace | Cloud Eng | Cluster + namespace + Cilium policies |
| Provision PG Flex Server (dev, test first; uat, prod later) | Cloud Eng | PG instance, `intake_platform` DB, seven schemas, seven roles |
| Provision Event Hubs namespace, ACR, Key Vault, Log Analytics, Managed Prometheus | Cloud Eng | All resources live |
| Set up ArgoCD, connect to `platform-iac` repo | Cloud Eng | GitOps loop closed |
| Create `platform-contracts` repo, publish initial OpenAPI + event schemas derived from prototype | EA | Versioned contract packages available |
| Set up Entra ID app registrations and Workload Identity federations for each planned service | Cloud Eng + EA | SAs ready to be adopted |

**Exit criteria:** A "hello world" service can be deployed to `dev` via ArgoCD, authenticate via Workload Identity, read a secret from Key Vault, write to PG, and publish an event to Event Hubs. All in dev only.

---

## Phase 1 — Lift the Pattern Catalogue (weeks 2–4)

**Why first:** pattern catalogue is read-mostly, stateless from the workflow perspective, and every other service depends on it. Smallest blast radius, highest unblocking value.

| Task | Owner | Output |
|------|-------|--------|
| Stand up `platform-pattern-svc` repo | Core Architects | Node/TS service skeleton |
| Port pattern JSON loading to PG-backed queries | Core Architects | `patterns.*` tables populated |
| Build embedding pipeline (pgvector, Anthropic embeddings) | Core Architects + AI/Platform | `pattern_embeddings` populated |
| Implement OpenAPI v1 endpoints: CRUD, semantic search, list by domain | Core Architects | Service serving contract |
| Deploy to `dev` → `test` → `uat` | Core Architects | Live endpoints |
| Shadow traffic: Replit prototype continues to serve; Azure svc validated against same queries | Core Architects | Diff report |
| Promote to `prod`, publish `patterns.pattern.published.v1` events | Core Architects | First Azure service in prod |

**Exit criteria:** Any internal caller can query patterns from Azure and get the same (or richer) results as Replit.

---

## Phase 2 — Lift the Vendor Registry (week 3–4, parallel with Phase 1)

Same pattern as Phase 1, different team.

| Task | Owner | Output |
|------|-------|--------|
| Stand up `platform-vendor-svc` repo | EA + Procurement | Service skeleton |
| Migrate `vendors/registry.json` → `vendors.*` tables | EA + Procurement | PG-backed registry |
| Implement fuzzy search (pg_trgm) and approval-status endpoint | EA + Procurement | Service serving contract |
| Ship to prod | EA + Procurement | Live |

**Exit criteria:** Vendor lookups now served from Azure.

---

## Phase 3 — Rebuild AI Orchestrator on LangGraph (weeks 4–8)

**This is the biggest single piece of work.** It replaces the LangChain sequential pipeline with the LangGraph graph described in doc 03.

| Task | Owner | Output |
|------|-------|--------|
| Stand up `platform-ai-orchestrator` repo (Python) | AI/Platform + Core Architects | Python service skeleton, LangGraph dep |
| Port prompt templates from `mcp-server/src/pipeline/` to versioned `prompts/` | AI/Platform | All prompts have v1 files + golden set |
| Implement TriageState schema + node functions | AI/Platform | `graphs/triage_v1.py` builds |
| Wire up pattern and vendor tools to call Phase 1 + Phase 2 services | AI/Platform | Nodes can read fresh data |
| Configure PG checkpointer, test HITL interrupt flow end-to-end | AI/Platform | Graph pauses and resumes correctly |
| Build golden-set regression harness (20 sample requests) | AI/Platform + EA | CI gate |
| Shadow run against Replit: every real Replit run also runs through Azure; compare outputs | AI/Platform + EA | Shadow diff dashboard |
| Deploy with Flagger canary in uat, then prod (10% → 50% → 100%) | AI/Platform + Cloud Eng | Live |

**Exit criteria:**
- Golden set passes ≥ 95%
- Shadow diff shows Azure matches Replit within tolerances for at least 2 weeks
- HITL interrupt flow proven end-to-end (mock human decision in uat)
- Observability: per-node traces, tokens, costs visible in Grafana

**Risk callouts:**
- Prompt drift — moving from LangChain's prompt templates to LangGraph nodes can change token counts and outputs subtly. The golden set is the safety net.
- LangGraph is newer than LangChain; expect edge cases around checkpointer behavior. Budget time for this.

---

## Phase 4 — Intake Governance Service (weeks 6–9, overlaps Phase 3 tail)

The state machine heart of the platform. Owns the workflow.

| Task | Owner | Output |
|------|-------|--------|
| Stand up `platform-ea-intake` repo | EA | Service skeleton |
| Port XState state machine from `intake-workflow/workflows/state-machine.json` to runtime | EA | State machine executes |
| Migrate `intake.*` DDL; port intake request ingestion | EA | Requests persist in PG |
| Implement OpenAPI v1 (submit, get, list, transition, assign, decide) | EA | Service serving contract |
| Wire up Event Hubs publisher for `intake.*` events | EA | Events land on the bus |
| Integrate with Phase 3 AI orchestrator via `/api/v1/ai/triage` | EA + AI/Platform | End-to-end AI path |
| HITL flow: consume `ai.triage.hitl-required.v1`, transition state, notify portal | EA + AI/Platform | Human-in-the-loop works |
| Parallel run: Replit prototype and Azure both accept test intakes | EA | Diff report |
| Cutover: app-portal (or curl) points at Azure | EA | Live |

**Exit criteria:**
- New intake → AI triage → routing decision → HITL review → final decision works end-to-end in uat against real reviewers (shadow personas).
- Event Hubs shows complete event stream for each request.
- Audit rows written for every transition.

---

## Phase 5 — MCP Gateway & IaC Dispatcher (weeks 8–11)

These two services are smaller, can run in parallel, and depend on the pattern/vendor/AI services already being up.

### MCP Gateway

| Task | Owner | Output |
|------|-------|--------|
| Stand up `platform-mcp-gateway` repo | AI/Platform | Service skeleton |
| Port MCP tool definitions from prototype `mcp-server/src/index.js` | AI/Platform | 10 tools exposed |
| Wire OAuth 2.1 device flow for agent auth | AI/Platform | Agent registration + session tables |
| Tool calls fan out to pattern, vendor, intake, ai services | AI/Platform | Shared tool layer with LangGraph nodes |
| Deploy, register first real external agent | AI/Platform | Live |

### IaC Dispatcher

| Task | Owner | Output |
|------|-------|--------|
| Stand up `platform-iac-dispatcher` repo | Cloud Eng | Service skeleton |
| Consume `intake.request.decided.v1` events for approved requests | Cloud Eng | Events handled |
| Build dispatch package generator (JSON → IaC spec) | Cloud Eng | `iac.dispatch_packages` rows |
| PR-open integration to existing cloud IaC landing-zone repos | Cloud Eng | Real PRs opened on approval |
| Emit `iac.dispatch.created.v1` and `iac.dispatch.acknowledged.v1` | Cloud Eng | Round-trip observable |

**Exit criteria:** An approved request in uat ends with a real PR opened on the target IaC repo, and the intake record shows the dispatch was acknowledged.

---

## Phase 6 — Portal UI (weeks 9–12, overlaps Phase 5)

The Next.js portal replaces the prototype HTML mockup.

| Task | Owner | Output |
|------|-------|--------|
| Stand up `platform-portal-ui` repo (Next.js 15 + shadcn/ui) | Frontend guild | App skeleton |
| Entra ID OIDC auth (Authorization Code + PKCE) | Frontend guild | Login works |
| Intake submission form (schema-driven from `platform-contracts`) | Frontend guild | Requestor persona flows |
| Reviewer dashboard: assignments, AI triage output, decision capture | Frontend guild | Reviewer persona flows |
| Approver views: ARB exception pack, decision recording | Frontend guild | Approver persona flows |
| WebSocket or SSE for live workflow state updates | Frontend guild | Live UX |
| Deploy behind App Gateway + WAF | Frontend guild + Cloud Eng | Live portal |

**Exit criteria:** All three personas (requestor, reviewer, approver) can complete their core flow end-to-end in uat without touching the API directly.

---

## Phase 7 — Parallel Run & Cutover (weeks 11–14)

| Task | Owner | Output |
|------|-------|--------|
| Enable parallel run: real Replit intakes also get mirrored to Azure uat | EA + Platform | Mirror pipeline |
| Daily diff report: decisions, routing, AI confidence | EA + AI/Platform | Published dashboard |
| Fix delta issues as they appear | All teams | Issue backlog drained |
| UAT sign-off by EA, Core Architects, Cloud Eng leads | Team leads | Sign-off doc |
| Cutover date set; announce to all McCain stakeholders 2 weeks in advance | EA | Comms plan |
| **Cutover** — Azure prod becomes the system of record; Replit moves to read-only | Platform | DNS / link switch |
| 2-week hypercare window with elevated on-call | All teams | Incident log |
| Replit decommissioned | Platform | Replit config archived |

**Exit criteria:**
- Azure prod handles 100% of new intakes for 2 weeks.
- No P1 incidents in hypercare.
- All historical Replit runs archived.

---

## Phase 8 — Hardening & Optimization (ongoing, post-cutover)

| Track | Lead | Examples |
|-------|------|----------|
| Cost tuning | Cloud Eng | APIM right-sizing, AKS autoscaling tuning, LLM token reduction via caching |
| AI accuracy | AI/Platform + Core Architects | Monthly prompt reviews, golden set expansion, reflection tuning |
| Pattern catalogue growth | Core Architects | New patterns based on submissions that didn't match |
| DR drill | Cloud Eng | Quarterly PG restore test, Event Hubs geo-DR failover |
| Security review | Cloud Eng + EA | Penetration test, threat model update |
| Operational runbooks | All teams | Per-service runbooks in `platform-iac/runbooks/` |

---

## Dependencies and Critical Path

```
Phase 0 ──▶ Phase 1 (patterns) ──┐
        └─▶ Phase 2 (vendors) ───┤
                                 ├─▶ Phase 3 (AI orchestrator) ──┐
                                 │                               │
                                 └─▶ Phase 4 (intake governance)─┼─▶ Phase 7 (parallel run)
                                                                 │
                                 Phase 5 (MCP + IaC dispatch) ───┤
                                 Phase 6 (portal) ───────────────┘
```

**Critical path:** Phase 0 → Phase 1/2 → Phase 3 → Phase 4 → Phase 7. Portal and MCP can slide slightly without blocking cutover (we can cut over API-only and add portal a week or two later).

**Risk hotspots:**
1. Phase 3 prompt parity (biggest unknown)
2. Phase 4 workflow state migration (once real requests are in Azure, rollback is hard)
3. Phase 0 Azure access and subscription provisioning (procurement gates)

---

## Rollback Strategy

Per phase:

- **Phase 1, 2, 5:** These services run alongside Replit — rollback = stop routing traffic to Azure, Replit continues as primary.
- **Phase 3:** Canary + Flagger — rollback to previous graph version via `active-graph.yaml` in minutes. Shadow run catches regressions before 100% rollout.
- **Phase 4:** Until cutover, Replit is still authoritative. Rollback = revert any client changes; Azure intake service can be stopped and PG state preserved.
- **Phase 7 cutover:** Window of highest risk. Rollback plan:
  1. Within the first hour: route new intakes back to Replit.
  2. Within the first day: replay any Azure-accepted requests into Replit via a bridge script.
  3. Past day 1: rollback becomes reconciliation, not reversal. Decide per incident.

---

## Success Criteria for the Whole Migration

| Metric | Target |
|--------|--------|
| Azure prod handles 100% of new intakes | ✓ for 30 consecutive days |
| P1 incidents during hypercare | 0 |
| Replit decommissioned | ✓ |
| All 6 services deployed via ArgoCD | ✓ |
| Audit trail complete for every request | ✓ |
| Golden set pass rate | ≥ 95% |
| Fast-track auto-approval rate | 30–40% (matches target from doc 00) |
| AI triage override rate | ≤ 15% (target from doc 00) |
| Platform runs on its own pattern library (eats own dog food) | ✓ |

---

## What We Are Explicitly NOT Doing in This Migration

To keep scope tight:

- **Not migrating historical intake data from the prototype.** Replit ran as a prototype with synthetic data; we start Azure with a clean slate.
- **Not integrating ServiceNow or Jira.** Listed as a later phase after cutover stabilizes.
- **Not building a full IaC generator.** `svc-iac-dispatcher` hands off specs to existing cloud IaC repos; generating Terraform from scratch is a future ambition.
- **Not multi-region.** Single region with geo-redundant backups. Multi-region is a post-year-1 discussion.
- **Not replacing the pattern authoring tool.** Architects still author patterns as markdown/JSON in `platform-pattern-svc/patterns-source/`; the service imports them.

---

## What Each Team Signs Up For

- **Cloud Engineering:** Phase 0 (foundations), Phase 5 IaC dispatcher, `platform-iac` ownership throughout, on-call for infra.
- **EA:** Phase 4 intake governance, `platform-contracts` curation throughout, cutover coordination, stakeholder comms.
- **Core Architects:** Phase 1 pattern service, Phase 3 graph + prompt co-ownership, ongoing prompt review.
- **AI/Platform:** Phase 3 AI orchestrator, Phase 5 MCP gateway, LangGraph operational ownership.
- **EA + Procurement:** Phase 2 vendor service.
- **Frontend guild:** Phase 6 portal.

The migration ends when every team is running their own service independently, deploying on their own cadence, and no one team is a bottleneck for another.
