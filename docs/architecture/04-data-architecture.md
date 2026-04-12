# 04 — Data Architecture

**Owner:** Core Architects
**Status:** Draft

---

## Principles

1. **Schema-per-service.** Each service owns a dedicated PostgreSQL schema. No service reads another service's tables directly. Cross-service reads go through APIs; cross-service writes go through events.
2. **Events are the integration contract.** The canonical source of truth for "something happened" is the event on Event Hubs, not a row in another team's table.
3. **Immutable audit by default.** Every state change writes an append-only record to the shared `audit.*` schema. No updates, no deletes.
4. **Explicit ownership in DDL.** Every table has a `created_by_service` comment; every schema is owned by a single PostgreSQL role.
5. **Versioned payloads.** Anything stored as JSON (intake requests, AI outputs, events) carries a `schema_version` field so we can evolve without breaking reads.

---

## Database Topology

One Azure PostgreSQL Flexible Server per environment, one logical database (`intake_platform`), seven schemas:

```
intake_platform
├── intake         ← svc-intake-governance
├── patterns       ← svc-pattern-catalog
├── vendors        ← svc-vendor-registry
├── ai             ← svc-ai-orchestrator
├── iac            ← svc-iac-dispatcher
├── mcp            ← svc-mcp-gateway
└── audit          ← shared, append-only
```

Roles and privileges described in `02-target-azure-architecture.md`. Migrations are owned per service (Flyway or Liquibase in each service repo) and run as part of that service's deploy pipeline — **never as platform-wide migrations**.

---

## Schema: `intake` (svc-intake-governance)

Owns the workflow state machine and request lifecycle.

```sql
-- Core entities
intake.requests
  id                uuid PK
  tracking_id       text UNIQUE        -- human-visible ID
  request_type      text               -- new_app | enhancement | integration | ...
  title             text
  payload           jsonb              -- full intake form body (versioned)
  payload_version   text               -- schema version
  submitter_email   text
  submitter_unit    text
  current_state     text               -- maps to state-machine.json state
  lane              text               -- fast_track | standard | complex | exception | NULL
  created_at        timestamptz
  updated_at        timestamptz

intake.workflow_events
  id                bigserial PK
  request_id        uuid FK → requests
  from_state        text
  to_state          text
  actor_type        text               -- system | ai | human
  actor_id          text
  reason            text
  occurred_at       timestamptz

intake.assignments
  id                uuid PK
  request_id        uuid FK → requests
  review_type       text               -- triage | architecture | security | vendor | arb
  assignee_id       text               -- Entra user object id
  status            text               -- pending | in_progress | done | declined
  sla_due_at        timestamptz
  created_at        timestamptz
  completed_at      timestamptz

intake.decisions
  id                uuid PK
  request_id        uuid FK → requests
  decision_type     text               -- ai_triage | human_review | final
  decision          text               -- approve | reject | needs_info | route
  rationale         text
  evidence          jsonb              -- pattern refs, AI run id, etc.
  actor_id          text
  created_at        timestamptz

intake.attachments
  id                uuid PK
  request_id        uuid FK → requests
  blob_uri          text               -- Azure Blob private URL
  content_hash      bytea              -- pgcrypto
  content_type      text
  size_bytes        bigint
  uploaded_by       text
  created_at        timestamptz
```

**Indexes:** `requests(current_state)`, `requests(submitter_email)`, `assignments(assignee_id, status)`, `workflow_events(request_id, occurred_at)`.

**Retention:** live rows indefinite; requests older than 7 years archived to Blob Storage and purged.

---

## Schema: `patterns` (svc-pattern-catalog)

Owns the endorsed pattern catalogue. Sourced from the existing `patterns/*.json` files at launch, migrated into the database for query speed and pgvector.

```sql
patterns.patterns
  id                text PK            -- e.g., 'CK-001'
  domain            text               -- compute | data | network | security | ai | integration
  name              text
  version           text
  status            text               -- endorsed | draft | deprecated | retired
  summary           text
  body              jsonb              -- full pattern doc
  tags              text[]
  created_at        timestamptz
  updated_at        timestamptz
  retired_at        timestamptz

patterns.pattern_versions
  pattern_id        text FK → patterns
  version           text
  body              jsonb
  published_at      timestamptz
  published_by      text
  PRIMARY KEY (pattern_id, version)

patterns.pattern_embeddings
  pattern_id        text FK → patterns
  version           text
  embedding         vector(1536)       -- pgvector, OpenAI/Anthropic embedding
  model             text               -- which embedding model
  created_at        timestamptz
  PRIMARY KEY (pattern_id, version, model)

patterns.pattern_usage
  id                bigserial PK
  pattern_id        text FK → patterns
  request_id        uuid                -- reference to intake.requests (loose ref, no FK)
  relevance_score   numeric(3,2)
  matched_by        text                -- ai | human
  created_at        timestamptz
```

**Indexes:**
- `pattern_embeddings USING ivfflat (embedding vector_cosine_ops)` — semantic search
- `patterns(domain, status)`
- `pattern_usage(pattern_id, created_at)`

**Notes:**
- `pattern_versions` is the immutable history; `patterns.body` is always the latest.
- Cross-schema reference to `intake.requests` is by UUID only — no FK — because services don't share FK graphs.

---

## Schema: `vendors` (svc-vendor-registry)

Owns the vendor/technology approval registry. Sourced from `vendors/registry.json`.

```sql
vendors.vendors
  id                uuid PK
  name              text
  canonical_name    text                -- normalized for fuzzy match
  category          text                -- iaas | paas | saas | tooling | library
  status            text                -- approved | conditional | restricted | prohibited
  approval_scope    jsonb               -- {domains, environments, usage_limits}
  contract_ref      text                -- MSA / OEA reference
  renewal_date      date
  owner_team        text
  body              jsonb               -- full vendor record
  created_at        timestamptz
  updated_at        timestamptz

vendors.vendor_aliases
  vendor_id         uuid FK → vendors
  alias             text
  PRIMARY KEY (vendor_id, alias)

vendors.vendor_evaluations
  id                uuid PK
  vendor_id         uuid FK → vendors
  evaluated_by      text
  verdict           text                -- approve | conditional | reject
  notes             text
  created_at        timestamptz
```

**Indexes:**
- `vendors USING gin (canonical_name gin_trgm_ops)` — pg_trgm fuzzy search
- `vendor_aliases USING gin (alias gin_trgm_ops)`
- `vendors(status, category)`

---

## Schema: `ai` (svc-ai-orchestrator)

Owns AI run state, checkpoints, and feedback. This schema carries the highest write volume.

```sql
ai.triage_runs
  id                uuid PK
  request_id        uuid                -- references intake.requests (loose)
  graph_version     text                -- e.g., 'triage_v1.1'
  status            text                -- running | completed | failed | halted
  started_at        timestamptz
  completed_at      timestamptz
  total_tokens_in   int
  total_tokens_out  int
  total_cost_usd    numeric(10,4)
  final_state       jsonb                -- TriageState snapshot at end
  trace_id          text                -- OTel trace id

ai.node_executions
  id                bigserial PK
  run_id            uuid FK → triage_runs
  node_name         text
  model             text
  tokens_in         int
  tokens_out        int
  latency_ms        int
  confidence        numeric(3,2)
  input_hash        bytea
  output            jsonb
  status            text                 -- ok | retry | failed
  started_at        timestamptz
  completed_at      timestamptz

ai.graph_checkpoints
  -- Managed by langgraph-checkpoint-postgres; structure owned by LangGraph
  thread_id         text                 -- = request_id
  checkpoint_id     text
  parent_id         text
  state             jsonb
  metadata          jsonb
  created_at        timestamptz
  PRIMARY KEY (thread_id, checkpoint_id)

ai.feedback_events
  id                bigserial PK
  run_id            uuid FK → triage_runs
  ai_recommendation jsonb
  human_decision    jsonb
  delta             jsonb                -- diff summary
  reviewer_id       text
  created_at        timestamptz

ai.prompt_versions
  prompt_name       text
  version           text
  body              text                 -- the prompt template
  model             text
  published_at      timestamptz
  published_by      text
  golden_set_score  numeric(3,2)
  PRIMARY KEY (prompt_name, version)

ai.embeddings_cache
  content_hash      bytea PK
  model             text
  embedding         vector(1536)
  created_at        timestamptz
```

**Indexes:**
- `triage_runs(request_id, started_at)`
- `node_executions(run_id, started_at)`
- `feedback_events(created_at)` — for monthly review queries
- `embeddings_cache USING ivfflat (embedding vector_cosine_ops)`

**Retention:**
- `graph_checkpoints`: 90 days, archived to Blob
- `node_executions`: 180 days live, summarized to monthly aggregates afterward
- `feedback_events`: indefinite — retraining signal
- `triage_runs`: 2 years live, archived after

---

## Schema: `iac` (svc-iac-dispatcher)

Owns the handoff artifacts that go to cloud engineering's IaC pipelines.

```sql
iac.dispatch_packages
  id                uuid PK
  request_id        uuid                 -- references intake.requests (loose)
  target_repo       text                 -- e.g., 'cloud-iac-landing-zones'
  pattern_refs      text[]               -- e.g., ['CK-001','NW-001']
  spec              jsonb                -- structured IaC spec
  status            text                 -- pending | pushed | acknowledged | failed
  pr_url            text
  created_at        timestamptz
  pushed_at         timestamptz
  acknowledged_at   timestamptz

iac.dispatch_events
  id                bigserial PK
  package_id        uuid FK → dispatch_packages
  event_type        text                 -- created | pushed | pr_merged | pr_closed | failed
  details           jsonb
  occurred_at       timestamptz
```

---

## Schema: `mcp` (svc-mcp-gateway)

Owns agent sessions and tool-call audit for the MCP gateway.

```sql
mcp.agent_registrations
  id                uuid PK
  agent_name        text
  owner_team        text
  scopes            text[]               -- tool names the agent may call
  client_id         text                 -- OAuth 2.1 client
  created_at        timestamptz
  revoked_at        timestamptz

mcp.sessions
  id                uuid PK
  agent_id          uuid FK → agent_registrations
  started_at        timestamptz
  ended_at          timestamptz
  ip_hash           bytea
  user_agent        text

mcp.tool_calls
  id                bigserial PK
  session_id        uuid FK → sessions
  tool_name         text
  arguments_hash    bytea                -- don't store PII raw
  result_summary    jsonb
  latency_ms        int
  status            text
  occurred_at       timestamptz
```

**Retention:** `tool_calls` 90 days live, then summarized aggregates.

---

## Schema: `audit` (shared, append-only)

The single cross-service audit trail. Every service writes to `audit.events`; nobody deletes or updates.

```sql
audit.events
  id                bigserial PK
  event_time        timestamptz NOT NULL DEFAULT now()
  service           text NOT NULL        -- which service wrote this
  actor_type        text                 -- system | ai | user
  actor_id          text
  entity_type       text                 -- request | pattern | vendor | ai_run | ...
  entity_id         text
  action            text                 -- create | update | approve | route | ...
  before_state      jsonb
  after_state       jsonb
  trace_id          text
  metadata          jsonb
```

**Enforcement:**
- Role granted `INSERT` only; `UPDATE` and `DELETE` revoked.
- Partitioned by month for query performance and archival.
- Monthly partitions older than 90 days moved to read-only storage; partitions older than 7 years dropped after archive.
- Hash chain column added in phase 2 for tamper evidence.

**Why a shared schema for audit (but not for anything else):** audit is cross-cutting by definition. Having one table lets compliance query "everything that happened to request X" without joining 6 schemas. Write-only access control preserves isolation.

---

## Event Model (Event Hubs)

Events carry the same information as audit rows but in a format consumers can subscribe to. CloudEvents v1.0 envelope, JSON payload, schema-versioned.

### Naming

`<domain>.<entity>.<action>.<version>`

### Canonical Events

| Event | Producer | Key Consumers | Purpose |
|-------|----------|---------------|---------|
| `intake.request.submitted.v1` | svc-intake-governance | svc-ai-orchestrator, audit | New request entered |
| `intake.request.state-changed.v1` | svc-intake-governance | app-portal, audit | Workflow state transition |
| `intake.request.assigned.v1` | svc-intake-governance | app-portal, notifications | Reviewer assigned |
| `intake.request.decided.v1` | svc-intake-governance | svc-iac-dispatcher, audit | Final decision recorded |
| `ai.triage.started.v1` | svc-ai-orchestrator | audit | Graph run began |
| `ai.triage.hitl-required.v1` | svc-ai-orchestrator | svc-intake-governance, app-portal | Interrupt — human needed |
| `ai.triage.completed.v1` | svc-ai-orchestrator | svc-intake-governance, audit | Graph run finished |
| `ai.triage.failed.v1` | svc-ai-orchestrator | svc-intake-governance, ops alerts | Graph run failed |
| `patterns.pattern.published.v1` | svc-pattern-catalog | svc-ai-orchestrator (cache invalidate) | New pattern version |
| `patterns.pattern.retired.v1` | svc-pattern-catalog | svc-ai-orchestrator, audit | Pattern retired |
| `vendors.vendor.status-changed.v1` | svc-vendor-registry | svc-ai-orchestrator, audit | Vendor reclassified |
| `iac.dispatch.created.v1` | svc-iac-dispatcher | audit | Spec handed off |
| `iac.dispatch.acknowledged.v1` | svc-iac-dispatcher | svc-intake-governance | Cloud team accepted |

### Envelope

```json
{
  "specversion": "1.0",
  "id": "01J...",
  "source": "svc-intake-governance",
  "type": "intake.request.submitted.v1",
  "subject": "request/REQ-2026-0001",
  "time": "2026-04-12T10:15:30Z",
  "datacontenttype": "application/json",
  "traceparent": "00-...",
  "data": { ... }
}
```

### Ordering and Idempotency

- Events are partitioned by `request_id` in Event Hubs — preserves per-request ordering.
- Consumers must be idempotent; every event has a stable `id`. Duplicate handling via consumer-side dedupe table.
- No cross-partition ordering guarantees. Services must not assume "event A from service X arrived before event B from service Y."

### Versioning

- Additive changes (new optional fields) keep the same version.
- Breaking changes emit a new version (`.v2`) alongside `.v1` for a deprecation window of at least 90 days.
- Consumers declare which versions they accept; producers publish both during transition.

---

## Data Ownership Matrix

| Data | Owning Service | Written By | Read By |
|------|----------------|------------|---------|
| Intake requests | svc-intake-governance | svc-intake-governance | svc-ai-orchestrator (via API), app-portal (via API) |
| Workflow state | svc-intake-governance | svc-intake-governance | everyone else via events |
| Pattern catalogue | svc-pattern-catalog | svc-pattern-catalog | svc-ai-orchestrator (via tool), app-portal, svc-mcp-gateway |
| Pattern embeddings | svc-pattern-catalog | svc-pattern-catalog (re-embed on publish) | svc-ai-orchestrator (via tool) |
| Vendor registry | svc-vendor-registry | svc-vendor-registry | svc-ai-orchestrator (via tool), app-portal, svc-mcp-gateway |
| AI triage runs | svc-ai-orchestrator | svc-ai-orchestrator | app-portal (via API), audit |
| Graph checkpoints | svc-ai-orchestrator | LangGraph runtime | svc-ai-orchestrator only |
| IaC dispatch packages | svc-iac-dispatcher | svc-iac-dispatcher | cloud engineering (via API + events) |
| MCP sessions & tool calls | svc-mcp-gateway | svc-mcp-gateway | audit |
| Audit events | all services | all services (INSERT only) | compliance, SOC, incident response |

---

## Cross-Service Data Access Rules

1. **No cross-schema SQL.** A service's DB role is granted access only to its own schema. Period.
2. **Reference by ID, not by FK.** When `ai.triage_runs.request_id` refers to `intake.requests.id`, there is no foreign key. The reference is loose and validated by the application layer.
3. **To read another service's data, call its API.** Latency cost is acceptable; coupling cost of shared tables is not.
4. **To act on another service's state change, subscribe to its events.** Event Hubs consumer groups are per service.
5. **Audit writes are the exception** — every service can `INSERT` into `audit.events` with its own `service` column.

---

## Data Migration from Prototype

| Prototype source | Target schema | Method |
|------------------|---------------|--------|
| `patterns/*.json` | `patterns.patterns` + `patterns.pattern_versions` | One-time load script, compute embeddings into `pattern_embeddings` |
| `vendors/registry.json` | `vendors.vendors` + `vendors.vendor_aliases` | One-time load script |
| `intake-workflow/schemas/` | Not migrated; becomes the OpenAPI / event schema source | Published to `platform-contracts` repo |
| `mcp-server/data/*.json` | Archived | For reference only |

Load scripts live in `platform-migrations/bootstrap/` and run once per environment during bootstrap.

---

## Backup, DR, and PITR

- **Backups:** PG Flex Server automated backups, 35-day retention, geo-redundant to paired region.
- **PITR:** any point in the 35-day window.
- **DR drills:** quarterly restore to a DR environment, verified via a smoke-test script.
- **RPO ≤ 15 min, RTO ≤ 1 hour** as stated in `02-target-azure-architecture.md`.
- **Blob Storage** (attachments, archives): RA-GRS in paired region.
- **Event Hubs:** enable Geo-DR pairing for prod.

---

## PII, PHI, and Data Classification

The platform handles **internal enterprise data only** — no customer PII, no PHI, no payment data. The sensitive fields we do hold:

| Field | Classification | Handling |
|-------|----------------|----------|
| Submitter email | Internal | Stored plain; not logged at INFO level |
| Intake narrative | Internal / confidential | May contain project names, cost figures; access-controlled |
| Attachments | Internal / confidential | Blob Storage with private endpoint; scanned by Defender |
| Vendor contract refs | Confidential | Access via role, not broadcast in events |
| AI prompts & outputs | Internal | Stored, auditable, subject to retention policy |

Data classification tags in table comments; Purview scan in prod.

---

## What the Core Architects Team Actually Owns (for data)

1. **Schema DDL for `patterns`** and the `pattern_versions` migration strategy
2. **pgvector embedding pipeline** — which model, when to re-embed, quality gates
3. **Event schema registry entries** for `patterns.*` events
4. **Contract review for all cross-service data reads** — ensure no team is sneaking in a cross-schema query
5. **Data retention and archival policy** for the shared `audit.*` schema (in coordination with EA and compliance)
