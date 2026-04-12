# 00 — Overview & Principles

**Owner:** EA team
**Status:** Draft

---

## Vision

A modular, AI-driven governance platform that routes every new application and solution through the right review, the right approvers, and the right implementation path — with full auditability and minimal friction for low-risk work.

The platform serves three personas:

1. **Requestors** — business stakeholders, product teams, engineering squads submitting intake
2. **Reviewers** — EA, security, architecture, vendor, ARB, CCoE
3. **Implementers** — cloud engineering teams receiving approved work with IaC-ready specs

---

## Target State (one-paragraph summary)

A private AKS-hosted set of microservices, each owned by a distinct team, exposing versioned APIs through Azure API Management. Intake requests flow through a LangGraph-orchestrated AI pipeline that performs completeness checks, pattern matching, vendor analysis, and multi-dimensional risk scoring, routing each request to one of four lanes (fast track, standard, complex, exception) with human-in-the-loop review at defined checkpoints. All state is persisted in Azure PostgreSQL Flexible Server, with workflow events broadcast via Azure Event Hubs. Pattern catalogue and vendor registry are first-class services queryable by any client, including an MCP gateway that exposes them to AI agents. The UI is a Next.js portal. Infrastructure and deployments are 100% IaC via Terraform and ArgoCD.

---

## Guiding Principles

### 1. Modularity over Monolith
Each bounded context is a deployable service with its own database schema, API version, and release cadence. Teams must be able to ship Monday-morning changes without waiting on other teams.

### 2. Contracts over Conventions
Inter-service communication is via versioned REST APIs (OpenAPI 3.1) or published events (CloudEvents). Breaking changes require a new major version and a deprecation period.

### 3. AI as a Shared Service, Not Embedded Logic
LangGraph workflows, prompts, and models are versioned artifacts stored in the AI orchestrator service. Other services *call* the AI service; they don't embed prompts.

### 4. Governance Must Eat Its Own Dog Food
The platform follows every pattern in the catalogue it enforces:
- CK-001 (AKS Platform) for hosting
- NW-001 (Hub-Spoke) for networking
- SC-001 (Zero Trust) for access
- AP-001 (API Gateway) for ingress
- AP-004 (Event-Driven Integration) for async
- IN-003 (API Productization) for external APIs

### 5. Evidence-Based Decisions
Every routing decision, risk score, and approval is captured with the reasoning (AI output or reviewer comment) and stored immutably for audit. Post-implementation outcomes feed back into AI retraining.

### 6. Fail Toward Safety
When AI confidence is low, when completeness is insufficient, or when novel patterns are detected, the default is to route to human review — not to auto-approve.

### 7. 100% IaC, 0% Click-Ops
The platform itself, the AKS cluster it runs on, the PostgreSQL database, the APIM instance, and the networking are all provisioned via Terraform. No console clicks in production.

---

## Success Metrics

| Metric | Target | Rationale |
|--------|--------|-----------|
| Mean time to decision (fast track) | ≤ 48 hours | Low-friction path for pattern-aligned requests |
| Mean time to decision (standard) | ≤ 7 days | Match current SLA |
| Mean time to decision (complex) | ≤ 14 days | Match current SLA |
| AI triage accuracy (vs human override) | ≥ 85% | Below this, humans lose trust in AI recommendations |
| Fast-track auto-approval rate | 30–40% of submissions | Indicator that patterns are being followed |
| Pattern catalogue coverage | ≥ 90% of submissions match an endorsed pattern | Drives future pattern investment |
| SLA compliance | ≥ 95% | Commitment to requestors |
| System uptime | 99.9% | Non-production system, but business-visible |

---

## Non-Goals

What this platform will **not** do:

- **Execute IaC deployments.** It produces approved specs and hands off to existing cloud deployment pipelines.
- **Replace ServiceNow or Jira.** Integration yes, replacement no.
- **Act as the pattern authoring tool.** Patterns are authored in markdown/JSON by architects and published via the pattern service.
- **Host production workloads for other teams.** It's a governance platform, not a PaaS.
- **Store secrets or credentials.** Azure Key Vault only.

---

## Key Architectural Decisions (summary — expanded in later docs)

| ADR | Decision | Rationale |
|-----|----------|-----------|
| ADR-01 | Monorepo with per-service folders, not polyrepo | Preserve cross-cutting refactors; PR-level ownership via CODEOWNERS |
| ADR-02 | AKS (shared CK-001 cluster) not dedicated cluster | Follow own pattern; cost efficiency |
| ADR-03 | PostgreSQL Flexible Server, schema-per-service | Operational simplicity; strong isolation via schemas + roles |
| ADR-04 | LangGraph over LangChain for AI orchestration | Conditional routing, parallelism, HITL, state persistence |
| ADR-05 | Azure Event Hubs for workflow events | AP-004 alignment; CloudEvents format |
| ADR-06 | Next.js 15 + shadcn/ui for portal | Matches AP-003 BFF pattern |
| ADR-07 | MCP gateway as first-class service | Enables AI agent access beyond the portal |
| ADR-08 | Terraform for IaC, ArgoCD for GitOps | CK-001 alignment |
| ADR-09 | Microsoft Entra ID for identity | Enterprise SSO |

Each ADR will be expanded in a separate `adr/ADR-XX.md` file under this folder.
