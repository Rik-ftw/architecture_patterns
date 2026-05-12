# McCain Architecture Pattern Library (APL)

The Architecture Pattern Library is a structured set of reusable design references for McCain Foods technology delivery across cloud, enterprise IT, security, data, integration, plant-floor OT, observability, AI, and resilience domains. Patterns are guardrails and vetted reference points, not prescriptive blueprints; they help teams move quickly while staying aligned with enterprise architecture, secure-by-design expectations, and governance review.

## Current scope and evidence status

This repository has been populated with Draft v1.0 patterns based on the supplied McCain APL taxonomy and AP-004 quality bar. Fields that require internal McCain evidence that was not provided in the attached context are marked `TBD — ...`, including accountable owner, named approver, CCoE certification reference, LeanIX reference, and approved implementation asset links. Draft patterns must be reviewed by the relevant architecture board before being treated as endorsed.

## Domain map

| Prefix | Domain | Folder | Patterns |
|---|---|---|---:|
| NW | Network & Connectivity | `patterns/nw/` | 3 |
| CL | Cloud & Platform | `patterns/cl/` | 3 |
| SC | Security & Controls | `patterns/sc/` | 3 |
| ID | Identity & Access | `patterns/id/` | 3 |
| DT | Data & Storage | `patterns/dt/` | 3 |
| AP | Application & Integration | `patterns/ap/` | 3 |
| IN | Integration Connectors | `patterns/in/` | 3 |
| DV | DevOps & CI/CD | `patterns/dv/` | 3 |
| CT | Containers & Kubernetes | `patterns/ct/` | 3 |
| OT | OT & Industrial | `patterns/ot/` | 3 |
| OB | Observability & SOC | `patterns/ob/` | 3 |
| AI | AI & Analytics | `patterns/ai/` | 3 |
| RS | Resilience & Continuity | `patterns/rs/` | 3 |

> Note: the prompt refers to 12 domains but lists 13 prefixes, including `RS` for Resilience & Continuity. This library implements every listed prefix.

## How to read a pattern

Each JSON pattern contains:

1. **Identity and governance** — `patternId`, domain, tier, status, owner, approvers, review cycle, CCoE and LeanIX references.
2. **Intent and decision context** — strategic intent, McCain-specific problem statement, use and don't-use scenarios.
3. **Design reference** — components, numbered interaction steps, and an inline SVG with matching step labels.
4. **Controls** — security considerations, required/recommended guardrails, compliance mapping, and exception process.
5. **Delivery support** — trade-offs, composition links, implementation assets, maturity level, and revision history.

## How to propose a new pattern

1. Confirm the domain prefix and next available `NNN` identifier.
2. Create a JSON file under `patterns/<prefix-lowercase>/PREFIX-NNN.json` using the required schema.
3. Include explicit use and don't-use scenarios, at least two Required guardrails, compliance mapping, trade-offs, composition links, implementation assets or `TBD` rationale, and revision history.
4. Validate that interaction step numbers match the inline SVG labels.
5. Submit the pattern through the McCain architecture governance intake for review by the relevant domain architect and governing board.
6. Update `index.json` and `CHANGELOG.md` in the same change.

## Exception process

Exceptions are handled through the McCain Enterprise Architecture Review Board with the relevant domain architect. Requests must include an Architecture Decision Record, data classification, threat model, operational impact assessment, compliance impact mapping, and compensating controls. Production implementation must not proceed until the exception is approved and recorded.

## Status definitions

- **Draft** — pattern is structurally complete but not yet endorsed; TBD fields identify missing McCain-specific evidence.
- **Review** — pattern is under domain and governance review.
- **Endorsed** — pattern has named approval and a valid CCoE certification reference where applicable.
- **Deprecated** — pattern has been replaced or retired and should not be used for new designs.
