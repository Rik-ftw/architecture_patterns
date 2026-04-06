# McCain Architecture Patterns

This repository is the canonical source for all approved and in-development Enterprise Architecture patterns and solution designs at McCain Foods.

> **Auto-synced** from the [McCain EA Platform](https://ea-platform.replit.app) · Last updated: 06 April 2026

## Pattern Library

This repository contains **17 architecture patterns** across six domains, each with JSON metadata and 10 SVG architecture diagrams.

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

Each pattern is a JSON file in the `patterns/` directory named by its Pattern ID (e.g. `AP-001.json`).

```
patterns/
  AP-001.json   — API Gateway Pattern
  AP-001.svg    — Architecture diagram (where available)
  ...
```

## Solution Designs

This repository contains **2 approved solution designs** that compose patterns into end-to-end architectures.

Solution designs follow a multi-stage approval pipeline:
**Draft → EA Review → Security Review → Architecture Board → Approved**

Each approved solution is stored in the `solutions/` folder as a structured JSON file named by its Reference ID (e.g. `ESD-2026-0001.json`). Each file contains:
- Solution metadata (title, owner, business unit, complexity, cost band)
- Composed pattern IDs and deployment regions
- Full review trail (reviewer name, decision, comments, timestamp per stage)

```
solutions/
  ESD-2026-0001.json   — Solution design with review artifacts
  ...
```

## Contributing

All pattern and solution changes must go through the EA Platform intake process. Do not edit files in this repository directly — changes will be overwritten on the next sync.

---
*Maintained by the McCain Centre of Excellence for Enterprise Architecture*
