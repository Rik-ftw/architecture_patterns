# 05 — Branching & Release Strategy

**Owner:** EA + Engineering leads
**Status:** Draft

---

## Goal

A branching model that **matches the modular decomposition in doc 01**. No team should wait on another team to ship. At the same time, cross-cutting refactors (renaming an event, bumping a shared contract) must remain tractable.

The shape of the repos must reinforce the team boundaries: EA, Core Architects, AI/Platform, Cloud Engineering, Frontend, Procurement.

---

## Repo Topology

We split the platform into **seven repos** — one per bounded context plus shared contracts and IaC. This is a deliberate move **away** from the single prototype repo so that each team has independent CI, release cadence, and `main` branch protection.

```
platform-contracts/           ← OpenAPI + CloudEvents schemas + JSON Schemas
                                Owner: EA (curator) + service leads (contributors)
                                Everything else depends on this.

platform-ea-intake/           ← svc-intake-governance (Node/TS)
                                Owner: EA team

platform-pattern-svc/         ← svc-pattern-catalog (Node/TS)
                                Owner: Core Architects

platform-vendor-svc/          ← svc-vendor-registry (Node/TS)
                                Owner: EA + Procurement

platform-ai-orchestrator/     ← svc-ai-orchestrator (Python, LangGraph)
                                Owner: AI/Platform + Core Architects

platform-mcp-gateway/         ← svc-mcp-gateway (Node/TS)
                                Owner: AI/Platform

platform-iac-dispatcher/      ← svc-iac-dispatcher (Node/TS)
                                Owner: Cloud Engineering

platform-portal-ui/           ← app-portal (Next.js 15)
                                Owner: Frontend guild

platform-iac/                 ← Terraform + Helm + ArgoCD apps
                                Owner: Cloud Engineering
```

**Why polyrepo (not monorepo)** — we considered both. Monorepo gives easier cross-cutting refactors but couples CI, release trains, and `main` across teams. With six teams of different cadences and two language stacks (TS + Python), the coupling cost wins. Polyrepo forces versioned contracts, which is exactly the discipline the user asked for: *"changes in one area do not impact the other."*

Where cross-repo changes are unavoidable (e.g., event schema bump), we coordinate via the `platform-contracts` repo and its versioning rules (below).

---

## `platform-contracts` — the Shared Seam

This is the only repo every team depends on. It holds:

```
platform-contracts/
├── openapi/
│   ├── intake-governance/v1.yaml
│   ├── pattern-catalog/v1.yaml
│   ├── vendor-registry/v1.yaml
│   ├── ai-orchestrator/v1.yaml
│   ├── mcp-gateway/v1.yaml
│   └── iac-dispatcher/v1.yaml
├── events/
│   ├── intake.request.submitted.v1.json       ← JSON Schema
│   ├── intake.request.state-changed.v1.json
│   ├── ai.triage.completed.v1.json
│   └── ...
├── schemas/
│   ├── intake-request.v1.json                  ← canonical intake form
│   ├── pattern.v1.json
│   └── vendor.v1.json
└── versioning-policy.md
```

- Published as versioned **packages**: `@platform/contracts-intake-v1`, `@platform/contracts-events-v1`, `platform-contracts-py` (for the Python AI service).
- Each service pins to specific contract versions in its manifest.
- Breaking changes require a new major version, not an in-place edit.
- PRs to `platform-contracts` require approval from **at least two of**: EA, the producing service owner, any consuming service owner. This is the only place in the platform with multi-team approval enforced.

---

## Branch Model — Per Repo

Each repo uses a lightweight trunk-based model:

```
main              ← protected, always deployable, auto-deploys to dev
│
├── feat/<ticket>-<slug>      ← feature branches, short-lived (< 1 week)
├── fix/<ticket>-<slug>       ← bugfix branches
├── chore/<ticket>-<slug>     ← housekeeping, deps, docs
└── release/<version>         ← only if we need to stabilize a release candidate
```

### Rules

1. **Feature branches are short-lived.** Target < 1 week. Long-running branches lose to `main` and create merge hell.
2. **Squash merge to `main`.** One commit per PR. Preserves a linear history.
3. **`main` is always deployable.** Every green `main` auto-deploys to `dev` via ArgoCD.
4. **No direct pushes to `main`.** PR + required reviews + CI green.
5. **No force pushes, ever, to `main` or `release/*`.**
6. **Tag releases with semver.** `v1.4.2`. Tags trigger the prod promotion pipeline.

### Branch protection (all repos, enforced via `platform-iac/github-settings`)

- Require PR, 1 reviewer minimum (2 for `platform-contracts`)
- Require CI passing (build, unit tests, contract tests, security scan)
- Require up-to-date with `main` before merge
- Require signed commits
- Linear history enforced
- Admin override disabled

---

## Release Cadence

Each service releases **independently**. There is no platform-wide release train — that was the explicit ask: *changes in one area do not impact others*.

| Service | Typical cadence | Who gates prod? |
|---------|----------------|-----------------|
| `svc-intake-governance` | Weekly | EA lead |
| `svc-pattern-catalog` | Bi-weekly | Core Architects lead |
| `svc-vendor-registry` | Monthly | EA + Procurement lead |
| `svc-ai-orchestrator` | Weekly (prompts) / bi-weekly (graph) | AI/Platform lead |
| `svc-mcp-gateway` | Bi-weekly | AI/Platform lead |
| `svc-iac-dispatcher` | Monthly | Cloud Engineering lead |
| `app-portal` | Weekly | Frontend guild lead |
| `platform-contracts` | As needed, never without 48h heads-up | EA curator |
| `platform-iac` | As needed | Cloud Engineering lead |

Prod promotion requires CAB approval **only for** `platform-iac` changes touching networking, AKS cluster config, or PG server config. Application-level service releases do not need CAB.

---

## CI/CD Pipelines (per service repo)

Azure DevOps YAML pipelines, identical skeleton across repos:

```yaml
# .azdo/pipelines/ci.yaml
stages:
  - build        # compile, lint, unit tests
  - contract     # validate against pinned platform-contracts version
  - security     # SCA (Dependabot), SAST, container scan (Defender)
  - package      # build + sign container image (Notation v2) → ACR
  - deploy-dev   # ArgoCD sync on main merge
  - integration  # run E2E tests in dev against real services
  - promote-test # auto on green
  - promote-uat  # manual gate
  - promote-prod # manual gate + optional CAB
```

- `main` → auto to `dev` → auto to `test` on green integration
- `test` → `uat`: manual approval in ADO (service lead)
- `uat` → `prod`: manual approval in ADO (service lead, + CAB for platform-iac)

Progressive delivery:
- `svc-ai-orchestrator` uses Flagger canary (10% → 50% → 100%) because it has the highest blast radius.
- Other services do rolling deploy with PDB.
- `app-portal` uses blue/green via two Ingress rules.

---

## Versioning Rules (per service)

Each service is semver-versioned independently:

- **MAJOR**: breaking API change (new OpenAPI version published in `platform-contracts`)
- **MINOR**: new feature, backward compatible
- **PATCH**: bugfix, no contract change

**API versioning:** services expose both `/api/v1` and `/api/v2` during a transition window. Minimum 90-day overlap. Deprecation headers after sunset date.

**Event versioning:** producers publish both `.v1` and `.v2` during a 90-day transition, then drop `.v1` after consumers confirm migration (via consumer-version tracking in Event Hubs properties).

---

## Cross-Repo Change Coordination

When a change spans multiple repos (e.g., adding a new field to `intake-request` that the AI orchestrator must also handle):

1. **Design note** lands in `platform-contracts/design-notes/` as a PR. Affected team leads comment.
2. **Contract PR** lands in `platform-contracts` first — new version published.
3. **Producer PR** lands in owning service repo, pinning the new contract version.
4. **Consumer PRs** land in each consuming service repo, pinning the new contract version at their own cadence.
5. **Old contract version kept alive** for the deprecation window.

The key property: **no simultaneous merges across repos are ever required**. Each PR can be merged when its team is ready, as long as the contract versioning rule holds.

---

## CODEOWNERS (per repo)

Each repo has a `CODEOWNERS` file mapping paths to GitHub teams. Example for `platform-ai-orchestrator/`:

```
# Default owner
*                       @org/ai-platform

# Graph definitions — cross-review with Core Architects
/graphs/                @org/ai-platform @org/core-architects
/prompts/               @org/ai-platform @org/core-architects

# Python service code — AI/Platform only
/src/                   @org/ai-platform

# Pipelines and infra — Cloud Engineering cross-review
/.azdo/                 @org/ai-platform @org/cloud-engineering
/helm/                  @org/ai-platform @org/cloud-engineering
```

For `platform-contracts/`:

```
/openapi/intake-governance/   @org/ea-team
/openapi/pattern-catalog/     @org/core-architects
/openapi/vendor-registry/     @org/ea-team @org/procurement
/openapi/ai-orchestrator/     @org/ai-platform
/events/                      @org/ea-team       # curator
/schemas/intake-request*      @org/ea-team
/schemas/pattern*             @org/core-architects
/schemas/vendor*              @org/ea-team @org/procurement
```

---

## Environments and Branch → Environment Mapping

| Branch / Event | Environment | Notes |
|----------------|-------------|-------|
| feature/* (PR open) | Ephemeral preview (optional) | `app-portal` only — uses Vercel-style preview on AKS |
| main merge | `dev` | Auto via ArgoCD |
| main green + smoke pass | `test` | Auto |
| Manual promote | `uat` | Service lead |
| Tagged release (`v*`) | `prod` | Manual + optional CAB |

**Environment parity** is enforced via `platform-iac` overlays:
```
platform-iac/environments/
  ├── dev/kustomization.yaml
  ├── test/kustomization.yaml
  ├── uat/kustomization.yaml
  └── prod/kustomization.yaml
```
Differences across envs are limited to: replica counts, resource limits, external hostnames, and feature flags.

---

## Hotfix Protocol

When a prod incident needs a fast patch:

1. Branch from the latest prod tag (e.g., `v1.4.2`) as `hotfix/<ticket>`.
2. Apply minimal fix, bump to `v1.4.3`.
3. PR targets `main`. CI full suite.
4. Release manager cherry-picks to any active `release/*` branches.
5. Promote to `test` → `uat` → `prod` on an expedited gate (service lead only, CAB notified post-hoc if needed).
6. Post-incident review within 5 business days.

---

## Feature Flags

All new cross-service features ship behind flags (LaunchDarkly or equivalent, managed in `svc-intake-governance`). This lets us:
- Merge to `main` without exposing a half-built feature
- Roll out per-environment, per-user-group, per-request-type
- Kill-switch instantly on prod issues

Flag lifecycle: new flag → ramp → stabilize → **remove flag and code path within 60 days of full rollout**. No permanent flags.

---

## Dependency Management

- **Renovate bot** on every repo. Auto-PRs for patch updates, weekly batch for minors, manual for majors.
- **Dependabot security alerts** enabled; critical CVEs auto-PR'd within 24h.
- **SBOM generation** (Syft) in every pipeline; published to ACR alongside images.
- **Contract package pinning:** services pin to `@platform/contracts-*@^1.0.0`, never `latest`.

---

## What This Gives Each Team

- **EA:** owns `platform-ea-intake` and is curator of `platform-contracts`. Can ship workflow changes without waiting on anyone.
- **Core Architects:** own `platform-pattern-svc` and co-own `platform-ai-orchestrator` graph + prompts. Can publish new patterns and update AI reasoning independently.
- **AI/Platform:** own `platform-ai-orchestrator` service code and `platform-mcp-gateway`. Can update LLM plumbing without touching other services.
- **Cloud Engineering:** own `platform-iac-dispatcher` and the entire `platform-iac` repo. Cluster, networking, and DB changes are theirs alone.
- **Frontend guild:** owns `platform-portal-ui`. Can ship UI changes weekly behind contracts pinned to stable versions.
- **Procurement:** co-owns `platform-vendor-svc` and `platform-contracts/schemas/vendor*`.

No team is blocked on another team's release train. The only coordination point is `platform-contracts`, and even there the rule is: **new versions are additive; old versions live until consumers migrate.**
