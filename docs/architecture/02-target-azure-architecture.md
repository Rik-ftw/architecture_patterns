# 02 — Target Azure Architecture (AKS)

**Owner:** Cloud Engineering
**Status:** Draft

---

## Purpose

Define the Azure infrastructure that hosts the Architecture Intake Platform. The platform **eats its own dog food** — it runs on the same patterns it enforces: CK-001 (AKS), NW-001 (Hub-Spoke), SC-001 (Zero Trust), AP-001 (API Gateway).

---

## High-Level Topology

```
Internet
   │
   ▼
┌───────────────────┐
│ Cloudflare WAF    │  ← Edge, DDoS, WAF (per McCain standard)
└────────┬──────────┘
         │
         ▼
┌──────────────────────────────────────┐
│ Hub VNet (shared)                    │
│                                      │
│   ┌──────────────────┐               │
│   │ Azure Firewall   │  ← Egress     │
│   └──────────────────┘               │
│   ┌──────────────────┐               │
│   │ App Gateway v2   │  ← L7 ingress │
│   │ + WAF            │               │
│   └──────┬───────────┘               │
│          │                           │
└──────────┼───────────────────────────┘
           │ Private Link / VNet peering
           ▼
┌──────────────────────────────────────────────────────┐
│ Spoke VNet — Intake Platform                         │
│                                                      │
│  ┌────────────────────────────────────────────────┐  │
│  │ AKS (private, CK-001 shared cluster)           │  │
│  │                                                │  │
│  │  Namespace: intake-platform                    │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────┐   │  │
│  │  │svc-intake│ │svc-      │ │svc-ai-       │   │  │
│  │  │governance│ │pattern-  │ │orchestrator  │   │  │
│  │  │          │ │catalog   │ │ (LangGraph)  │   │  │
│  │  └──────────┘ └──────────┘ └──────────────┘   │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────┐   │  │
│  │  │svc-vendor│ │svc-iac-  │ │svc-mcp-      │   │  │
│  │  │registry  │ │dispatcher│ │gateway       │   │  │
│  │  └──────────┘ └──────────┘ └──────────────┘   │  │
│  │  ┌──────────────────┐                         │  │
│  │  │ app-portal (BFF) │                         │  │
│  │  └──────────────────┘                         │  │
│  │                                                │  │
│  │  Managed NGINX Ingress (internal)             │  │
│  │  Cilium network policies (per-namespace)      │  │
│  │  Workload Identity (OIDC → Entra)             │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  Private endpoints:                                  │
│  ┌──────────────────┐ ┌──────────────────────────┐   │
│  │ PostgreSQL       │ │ Azure Key Vault          │   │
│  │ Flexible Server  │ │ (secrets, certs, LLM     │   │
│  │ HA, zone-redund. │ │  API keys)               │   │
│  └──────────────────┘ └──────────────────────────┘   │
│                                                      │
│  ┌──────────────────┐ ┌──────────────────────────┐   │
│  │ Event Hubs       │ │ Azure Container Registry │   │
│  │ (CloudEvents)    │ │ (Premium, private, signed│   │
│  │                  │ │  images via Notation v2) │   │
│  └──────────────────┘ └──────────────────────────┘   │
│                                                      │
│  ┌──────────────────┐ ┌──────────────────────────┐   │
│  │ Blob Storage     │ │ Log Analytics / Grafana  │   │
│  │ (attachments,    │ │ Managed Prometheus       │   │
│  │  Private Link)   │ │                          │   │
│  └──────────────────┘ └──────────────────────────┘   │
│                                                      │
└──────────────────────────────────────────────────────┘
         │
         │ Private Link
         ▼
┌──────────────────────────────────────┐
│ Azure API Management (internal)      │
│ — versioned product: intake-v1       │
│ — throttling, JWT validation         │
│ — OpenAPI-backed                     │
└──────────────────────────────────────┘
```

---

## Azure Resource Inventory

| Resource | SKU / Tier | Purpose | Pattern Reference |
|----------|-----------|---------|-------------------|
| AKS cluster (shared) | Standard, private API server | Hosts all services | CK-001 |
| Node pool: `intake-platform` | Standard_D4s_v5, 3 nodes min, 10 max, zone-redundant | Dedicated for this namespace | CK-001 |
| PostgreSQL Flexible Server | General Purpose, D4s_v3, 256 GB, HA zone-redundant | Shared DB server, per-service schemas | DT-001 |
| Azure Key Vault | Standard, Premium for HSM-backed keys | LLM API keys, DB creds, TLS certs | SC-001 |
| Event Hubs Namespace | Standard, 2 throughput units | CloudEvents backbone | AP-004 |
| Azure Container Registry | Premium, geo-replicated | Signed container images | CK-001 |
| Blob Storage | Standard LRS, private endpoint | Intake attachments (docs, diagrams) | DT-001 |
| API Management | Developer tier (POC) → Premium v2 (prod) | Public API facade, OAuth2/OIDC | AP-001, IN-003 |
| Application Gateway v2 | WAF_v2 | L7 ingress to AKS | CK-001 |
| Log Analytics Workspace | Pay-as-you-go | Logs, metrics, traces | Observability stack |
| Managed Prometheus + Grafana | Standard | Dashboards, alerting | Observability stack |
| Microsoft Entra ID | — | OIDC for portal and APIs | Identity |
| Azure AI Foundry / Azure OpenAI | Standard, dedicated deployment for prod | LLM backend for LangGraph | AI |

---

## PostgreSQL Architecture

### Why Flexible Server (not Hyperscale Citus)
- Right-sized for workload (10s of MB/day of writes, not distributed scale)
- Zone-redundant HA out of the box
- PITR, automated backups
- pgvector extension support for pattern embeddings
- Private endpoint, no public exposure
- Cheaper than Hyperscale for single-cluster workloads

### Topology
- **Single Flexible Server instance** per environment (dev, test, uat, prod)
- **One database:** `intake_platform`
- **One schema per service** with strict role-based isolation:
  - `intake` (owned by `svc-intake-governance`)
  - `patterns` (owned by `svc-pattern-catalog`)
  - `vendors` (owned by `svc-vendor-registry`)
  - `ai` (owned by `svc-ai-orchestrator`)
  - `iac` (owned by `svc-iac-dispatcher`)
  - `mcp` (owned by `svc-mcp-gateway`)
  - `audit` (shared, append-only, cross-service audit log)

### Role-Based Access
```sql
-- Each service has its own role with access to only its schema.
CREATE ROLE svc_intake_governance LOGIN;
GRANT CONNECT ON DATABASE intake_platform TO svc_intake_governance;
GRANT USAGE ON SCHEMA intake TO svc_intake_governance;
GRANT ALL ON ALL TABLES IN SCHEMA intake TO svc_intake_governance;
-- No access to other schemas. Forced to use APIs to cross boundaries.
REVOKE ALL ON SCHEMA patterns FROM svc_intake_governance;
```

### Extensions Enabled
- `pgvector` — for pattern semantic search (used by `svc-pattern-catalog`)
- `pg_trgm` — fuzzy text search for vendor name lookups
- `pgcrypto` — for attachment integrity hashes
- `uuid-ossp` — UUID generation

### HA and DR
- Zone-redundant HA (primary + standby in different AZ)
- Automated backups: 35-day retention, PITR
- Geo-redundant backup to paired region
- RPO ≤ 15 min, RTO ≤ 1 hour

### Schemas authored separately
Each service owns its schema migrations. Migrations are applied via:
- `svc-intake-governance`: Flyway or Liquibase in the service's own repo
- Schema-per-service prevents cross-team migration conflicts

---

## AKS Deployment Model

### Namespace: `intake-platform`
All six services deploy into one Kubernetes namespace on the shared CK-001 cluster. Namespace isolation is enforced via:
- Cilium network policies (default-deny, explicit allow between services)
- Azure RBAC for kubectl access (per-team groups from Entra)
- ResourceQuotas and LimitRanges

### Per-Service Deployment Footprint

| Service | Replicas (prod) | CPU req / limit | Mem req / limit | HPA |
|---------|----------------|-----------------|-----------------|-----|
| `svc-intake-governance` | 3 | 200m / 1000m | 512Mi / 1Gi | 3-10 on CPU |
| `svc-pattern-catalog` | 2 | 100m / 500m | 256Mi / 512Mi | 2-6 |
| `svc-vendor-registry` | 2 | 100m / 500m | 256Mi / 512Mi | 2-6 |
| `svc-ai-orchestrator` | 3 | 500m / 2000m | 1Gi / 2Gi | 3-12 on queue depth |
| `svc-mcp-gateway` | 2 | 100m / 500m | 256Mi / 512Mi | 2-6 |
| `svc-iac-dispatcher` | 2 | 100m / 500m | 256Mi / 512Mi | 2-4 |
| `app-portal` | 3 | 200m / 1000m | 512Mi / 1Gi | 3-10 |

### Workload Identity
Each service runs under its own Kubernetes ServiceAccount federated to an Entra ID App Registration via AKS Workload Identity (OIDC). This allows:
- No long-lived secrets in pods
- Per-service RBAC to Azure resources (Key Vault, Event Hubs, Storage)
- Auditable access logs per service

Example: `svc-ai-orchestrator` SA → Entra App → Key Vault secret `llm-api-key` + Event Hub write permission.

### Deployment Pipeline
- **GitOps via ArgoCD** — all manifests in `platform-iac/kubernetes/` watched by ArgoCD
- **Per-service image tags** — each service bumps its own Kustomize overlay
- **Progressive delivery** — Flagger-backed canary for `svc-ai-orchestrator` (highest blast radius)
- **Image signing** — Notation v2, enforced by Ratify admission controller

---

## Networking & Zero Trust

- **No public ingress to AKS.** Public endpoint only on App Gateway/APIM.
- **Cilium network policies:** default-deny in `intake-platform` namespace, explicit allow between service pods.
- **Egress control:** all outbound via Azure Firewall with FQDN allow-list (Azure OpenAI, Anthropic API, Event Hubs, ACR).
- **mTLS between services:** via the service mesh (AP-002) where available; HTTPS with internal CA otherwise.
- **No service exposes `/` on LoadBalancer.** All traffic via the NGINX internal ingress → App Gateway.

---

## Identity & Access

### For end users (portal)
- Microsoft Entra ID OIDC
- Authorization Code + PKCE flow
- Group-based RBAC for personas (Requestor, Reviewer, Approver, Admin)
- Conditional Access policies enforced (MFA, device compliance)

### For service-to-service
- AKS Workload Identity (OIDC federation to Entra)
- JWT-bearer validated at APIM and re-validated at each service
- No shared secrets between services

### For AI agents (via MCP gateway)
- OAuth 2.1 device code flow for agent auth
- Per-agent API keys with scoped tool access
- Rate limits per agent session

---

## Observability

### Logs
- Container stdout/stderr → AKS Container Insights → Log Analytics
- Structured JSON logs with `traceId`, `serviceName`, `requestId` fields
- 90-day retention in Log Analytics, archive to Storage for 2 years

### Metrics
- Managed Prometheus scraping each service (`/metrics` endpoint)
- Grafana dashboards per service + a cross-service platform dashboard
- SLO-based alerting (error rate, latency p99, saturation)

### Traces
- OpenTelemetry SDK in every service
- Azure Monitor Application Insights as the backend
- Distributed traces showing `app-portal → intake-governance → ai-orchestrator → pattern-catalog` flows

### Audit
- Every state-changing operation writes to the shared `audit.*` schema (append-only)
- Events also published to Event Hubs → long-term archive in Blob Storage (7-year retention for SOX)

---

## Environments

| Environment | Purpose | Cluster | Database | LLM |
|------------|---------|---------|----------|-----|
| `dev` | Developer inner loop | Shared dev AKS (different namespace) | Dev PG instance | Azure OpenAI dev deployment |
| `test` | Automated integration tests | Same as dev | Test schema (ephemeral) | Mocked LLM |
| `uat` | Business UAT, pre-release | Prod-like AKS in non-prod sub | UAT PG instance | Real LLM, lower quota |
| `prod` | Production | Shared prod CK-001 cluster | Prod PG Flex Server, HA | Dedicated Azure OpenAI deployment |

Environment promotion:
- `dev` → `test`: automatic on merge to `main`
- `test` → `uat`: manual gate after integration tests pass
- `uat` → `prod`: manual gate, requires CAB approval for platform changes

---

## Cost Estimate (Order of Magnitude)

| Component | Monthly (prod) |
|-----------|---------------|
| AKS node pool (shared cluster allocation) | ~$400 |
| PostgreSQL Flexible Server (D4s_v3, HA, 256 GB) | ~$700 |
| Event Hubs Standard (2 TU) | ~$50 |
| API Management (Premium v2, 1 unit) | ~$2,800 |
| App Gateway v2 (WAF) | ~$250 |
| Log Analytics (10 GB/day ingest) | ~$100 |
| Azure OpenAI (GPT-4 / Claude-equivalent, modest usage) | ~$500 |
| ACR Premium | ~$170 |
| Key Vault, Storage, misc. | ~$50 |
| **Total prod** | **~$5,000/month** |

Non-prod environments ~40% of prod cost.

*Note: APIM Premium dominates the cost. Consider APIM Developer/Standard v2 for launch and upgrade once traffic justifies it.*

---

## Capacity Planning (Year 1)

| Metric | Estimate | Derived |
|--------|----------|---------|
| Intake requests / month | 200 | ~7/day |
| AI triage runs / month | 400 (includes re-runs) | ~13/day |
| LLM tokens / triage run | ~50k | ~20M tokens/month |
| PostgreSQL write volume | 10 MB/day | Trivial |
| Attachments (Blob) | 500 MB/month | 6 GB/year |
| Peak concurrent users | 50 | Small footprint |

The platform is **not scale-constrained**. The dominant cost is LLM usage and APIM.

---

## What the Cloud Engineering Team Actually Builds

1. **Terraform modules** in `platform-iac/` repo (owned by them):
   - `modules/aks-namespace/` — namespace, quotas, network policies
   - `modules/postgres-flex/` — PG instance with schemas and roles
   - `modules/event-hubs/` — namespace, topics, consumer groups
   - `modules/apim-product/` — APIM product, policies, named values
   - `modules/workload-identity/` — federated credentials
2. **Helm charts** for each service (co-located with service code initially, promoted to a chart repo later)
3. **ArgoCD applications** binding charts to environments
4. **CI/CD pipelines** (Azure DevOps YAML) for build, scan, sign, deploy
5. **Observability stack** — Grafana dashboards as code, alert rules as code

The platform team **consumes** these modules; it does not own them.
