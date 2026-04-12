# Architecture Intake Platform — Foundational Architecture

**Status:** Draft for review
**Owners:** EA team (primary), Core Architects, Cloud Engineering, AI/Platform
**Version:** 0.1
**Last updated:** 2026-04-12

---

## Purpose

This folder contains the foundational architecture and design documents for the **Architecture Intake Platform** — the enterprise-grade replacement for the Replit prototype.

The platform provides:
- Structured application & solution intake
- AI-driven triage, risk scoring, pattern matching, and routing
- Multi-lane governed approval workflows
- Pattern catalogue and vendor registry as first-class services
- Infrastructure-as-Code integration for approved solutions

It is designed to be **modular**, with clear bounded contexts owned by distinct teams, hosted on **AKS with PostgreSQL**, and evolved over time without cross-team coupling.

---

## Document Index

| # | Document | Primary Owner | What It Covers |
|---|----------|--------------|----------------|
| 00 | [Overview & Principles](./00-overview.md) | EA | Vision, principles, target state, success metrics |
| 01 | [Modular Decomposition & Team Ownership](./01-modular-decomposition.md) | EA | Service map, bounded contexts, ownership matrix, contracts |
| 02 | [Target Azure Architecture (AKS)](./02-target-azure-architecture.md) | Cloud Engineering | AKS topology, networking, PostgreSQL, observability |
| 03 | [LangGraph AI Orchestration](./03-langgraph-ai-orchestration.md) | AI/Platform + Architects | Graph model, nodes, edges, human-in-the-loop |
| 04 | [Data Architecture](./04-data-architecture.md) | Core Architects | PostgreSQL schemas, ownership, event model |
| 05 | [Branching & Release Strategy](./05-branching-strategy.md) | EA + Engineering leads | Monorepo vs polyrepo, branch model, release cadence |
| 06 | [Migration Plan (Replit → Azure)](./06-migration-plan.md) | Platform + EA | Phased migration, cutover, parallel run |

---

## Core Design Principles

1. **Modular by team ownership** — No module change should require coordinated deploys across teams. Changes are isolated behind versioned API contracts.
2. **Bounded contexts map to services** — Each service owns its data, its API, its deployment cadence, and its on-call rotation.
3. **AI as infrastructure** — The AI orchestration layer is a shared service, not embedded logic. Prompts, graphs, and models are versioned assets.
4. **Pattern catalogue is the source of truth** — All architecture decisions reference pattern IDs. The catalogue is immutable-versioned and queryable.
5. **Event-driven where appropriate** — Workflow state changes emit events; services subscribe rather than poll. Async first for cross-service work.
6. **IaC for everything** — No click-ops. The platform that governs IaC-first solutions must itself be 100% IaC.
7. **Separation of governance from implementation** — The platform hosts *decisions*, not implementations. IaC modules live in their own repos, owned by cloud engineering.

---

## Evolution Summary

| Aspect | Prototype (Replit) | Target (Azure AKS) |
|--------|-------------------|---------------------|
| Hosting | Replit one-click | Private AKS cluster (per CK-001) |
| Data | JSON files on disk | PostgreSQL (Azure DB for PostgreSQL Flexible Server) |
| Codebase | Single `mcp-server/` directory | Modular monorepo, 6 bounded contexts |
| AI | LangChain sequential chain | LangGraph with conditional routing, HITL, parallel branches |
| API | Single Express server | API gateway (Azure APIM) fronting microservices |
| Identity | None | Microsoft Entra ID (OIDC) |
| CI/CD | None | Azure DevOps Pipelines + ArgoCD (GitOps) |
| Observability | Console logs | Grafana + Log Analytics + OpenTelemetry |
| Team model | Single developer | Multi-team with ownership boundaries |

---

## Quick Reference — What Lives Where

```
architecture_patterns/
├── docs/architecture/           ← THIS FOLDER — foundational docs
├── patterns/                    ← Pattern catalogue (owned by Core Architects)
├── vendors/                     ← Vendor registry (shared, governed by EA)
├── intake-workflow/             ← Legacy prototype assets (to be split per module)
├── mcp-server/                  ← Legacy prototype code (to be split per module)
│
└── FUTURE STATE (target repos, see 05-branching-strategy.md):
    ├── platform-ea-intake/      ← EA team
    ├── platform-pattern-svc/    ← Core Architects
    ├── platform-ai-orchestrator/← AI/Platform + Architects
    ├── platform-vendor-svc/     ← EA + Procurement
    ├── platform-portal-ui/      ← Frontend (shared)
    ├── platform-iac/            ← Cloud Engineering
    └── platform-mcp-gateway/    ← AI/Platform
```
