# McCain Architecture Patterns

This repository is the canonical source for all approved and in-development Enterprise Architecture patterns and solution designs at McCain Foods.

> **Auto-synced** from the [McCain EA Platform](https://ea-platform.replit.app) · Last updated: 10 April 2026

## Pattern Library

This repository contains **25 architecture patterns** across six domains, each with JSON metadata and 10 SVG architecture diagrams.

### Pattern Levels

Each pattern is classified at one of three abstraction levels:

| Level | Description |
|-------|-------------|
| **Conceptual** | High-level architectural principles and strategic direction |
| **Logical** | Platform-agnostic architectural patterns and design decisions |
| **Component** | Technology-specific implementation blueprints |

### Domains

| Domain | Description |
|--------|-------------|
| Application & Integration | API gateways, service mesh, event-driven patterns |
| Cloud & Platform | Azure landing zones, cloud-native foundations |
| Containers & Kubernetes | AKS, container runtimes, GitOps |
| Data & Storage | Data lake, time-series, CQRS |
| Network & Connectivity | Zero Trust, VPN, SD-WAN |
| Security & Controls | IAM, WAF, secrets management |

### Pattern Status

- **Endorsed** — Approved by Architecture Board, ready for production use
- **In Development** — Under active development, not yet production-ready
- **Under Review** — Awaiting Architecture Board sign-off
- **Deprecated** — Superseded; migrate away from this pattern

## Pattern File Structure

Each pattern is a JSON file in the `patterns/` directory named by its Pattern ID (e.g. `AP-001.json`). SVG architecture diagrams are pushed alongside their JSON file where available.

```
patterns/
  AP-001.json   — API Gateway Pattern (JSON metadata)
  AP-001.svg    — Architecture diagram (where available)
  ...
```

Each pattern JSON file contains the following top-level fields:

| Field | Description |
|-------|-------------|
| `type` | Always `"pattern"` — identifies this as a pattern document |
| `patternId` | Unique pattern identifier (e.g. `AP-001`) |
| `name` | Pattern name |
| `domain` | Architecture domain |
| `tier` | Abstraction level (Conceptual / Logical / Component) |
| `status` | Pattern status (Endorsed, In Development, Under Review, Deprecated) |
| `version` | Current version number |
| `owner` | Pattern owner name |
| `leanixRef` | LeanIX reference ID |
| `ccoeCertRef` | CCoE certification reference |
| `level` | Additional classification level field |
| `guardrails` | Mandatory constraints and guardrails |
| `composition` | Composed sub-patterns or building blocks |
| `implementationAssets` | Links to reference implementations and assets |
| `revisionHistory` | Version history entries |
| `useCases` | When to use / when not to use guidance |
| `interactionSteps` | Step-by-step interaction flow |
| `securityConsiderations` | Security requirements and controls |
| `azureDesign` | Azure-specific design notes |
| `thirdPartyRisks` | Third-party and vendor risk considerations |

> Note: The `id` database field and embedded `diagramSvg` blob are omitted from exported files. Diagram files are pushed separately as `.svg` files.

## Solution Designs

This repository contains **2 approved solution designs** that compose patterns into end-to-end architectures.

Solution designs follow a multi-stage approval pipeline:
**Draft → EA Review → Security Review → Architecture Board → Approved**

Each approved solution is stored in the `solutions/` folder as a structured JSON file named by its Reference ID (e.g. `ESD-2026-0001.json`).

```
solutions/
  ESD-2026-0001.json   — Solution design with full data model
  ...
```

Each solution JSON file contains the following top-level fields:

| Field | Description |
|-------|-------------|
| `type` | Always `"solution"` — identifies this as a solution document |
| `referenceId` | Unique solution identifier (e.g. `ESD-2026-0001`) |
| `title` | Solution name |
| `description` | Detailed solution description |
| `businessContext` | Business problem and context |
| `owner` | Solution owner name |
| `businessUnit` | Owning business unit |
| `complexity` | Assessed complexity level |
| `estimatedCostBand` | Cost band estimate |
| `riskTier` | Risk tier assessed during intake (e.g. High / Medium / Low) |
| `patternIds` | Array of pattern IDs this solution composes |
| `vendorIds` | Array of vendor record IDs referenced by this solution |
| `deploymentRegions` | Target Azure/cloud deployment regions |
| `intakeReference` | Linked intake request reference ID |
| `jiraEpics` | Associated Jira epic keys or references |
| `iacReference` | IaC generation summary (`generated` boolean + note) |
| `status` | Current solution status |
| `createdAt` | Creation timestamp |
| `updatedAt` | Last updated timestamp |
| `reviews` | Full review trail — stage, reviewer, decision, comments, timestamp |
| `patternAlignments` | Pattern alignment records — patternId, patternName, status, note, reviewer |
| `iterationHistory` | Version/iteration history — versionLabel, changeSummary, author, createdAt |
| `operationalSupportReference` | Reference ID of the linked operational support record (if any) |

## Contributing

All pattern and solution changes must go through the EA Platform intake process. Do not edit files in this repository directly — changes will be overwritten on the next sync.

---
*Maintained by the McCain Centre of Excellence for Enterprise Architecture*
