# McCain Architecture Patterns

This repository is the canonical source for all approved and in-development Enterprise Architecture patterns at McCain Foods.

> **Auto-synced** from the [McCain EA Platform](https://ea-platform.replit.app) · Last updated: 01 April 2026

## Pattern Library

This repository contains **17 architecture patterns** across six domains, each with JSON metadata and 10 SVG architecture diagrams.

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

## Contributing

All pattern changes must go through the EA Platform intake process. Do not edit files in this repository directly — changes will be overwritten on the next sync.

---
*Maintained by the McCain Centre of Excellence for Enterprise Architecture*
