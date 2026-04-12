# 03 — LangGraph AI Orchestration

**Owner:** AI/Platform + Core Architects
**Status:** Draft

---

## Why LangGraph (and not LangChain)

The prototype uses a **LangChain sequential chain** — a linear 7-stage pipeline. That works for a happy path but breaks down when we need:

1. **Conditional routing** — e.g., halt on low completeness, skip vendor check if no vendors proposed, escalate to human if confidence is low
2. **Parallel execution** — pattern matching and vendor analysis are independent and can run concurrently
3. **Human-in-the-loop (HITL)** — triage analyst, architecture reviewer, security reviewer are graph nodes, not separate systems
4. **State persistence** — a triage run may span hours or days; we need to checkpoint, resume, and time-travel debug
5. **Multi-model routing** — some nodes should use Claude Sonnet, some GPT-4 for cross-check, some a small local model for classification
6. **Reflection and retry** — a node that produces invalid JSON should self-correct; a low-confidence output should trigger a second opinion

LangGraph gives us all of this: stateful graphs, conditional edges, parallel branches, interrupts for HITL, persistent checkpointers, streaming.

---

## Graph Topology

The triage graph has **four phases** with **human interrupts** between them:

```
                          ┌─────────────┐
                          │   START     │
                          │(new request)│
                          └──────┬──────┘
                                 │
                                 ▼
                    ┌──────────────────────────┐
                    │  1. Completeness Check   │ ← Node
                    │     (classify + score)   │
                    └─────────┬────────────────┘
                              │
                   ┌──────────┼────────────┐
                   │ score<0.6│  score≥0.6 │
                   ▼          │            ▼
              ┌─────────┐     │    ┌───────────────┐
              │NEEDS_INFO│────┘    │ 2. Classify   │ ← Node
              │(halt HITL)│         │ (domain/tier) │
              └─────────┘         └───────┬───────┘
                                          │
                          ┌───────────────┴───────────────┐
                          │   PARALLEL BRANCH (fan-out)   │
                          ▼                               ▼
              ┌───────────────────┐          ┌───────────────────┐
              │3a. Pattern Match  │          │3b. Vendor Analysis│ ← Parallel
              │  (semantic+RAG)   │          │  (registry lookup)│
              └─────────┬─────────┘          └─────────┬─────────┘
                        │                              │
                        └──────────────┬───────────────┘
                                       │ (join)
                                       ▼
                           ┌──────────────────────┐
                           │  4. Risk Scoring     │ ← Node
                           │  (5-dimension)       │
                           └──────────┬───────────┘
                                      │
                           ┌──────────▼───────────┐
                           │  5. Routing Decision │ ← Node
                           └──────────┬───────────┘
                                      │
               ┌──────────────────────┼──────────────┬──────────────┐
               │ fast_track           │ standard     │ complex      │ exception
               ▼                      ▼              ▼              ▼
      ┌──────────────┐    ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
      │6a. Summarize │    │6b. Summarize │ │6c. Summarize │ │6d. Summarize │
      │   + auto-    │    │   + assign   │ │   + multi-   │ │   + ARB prep │
      │   approve    │    │   architect  │ │   review     │ │   + exception│
      └──────┬───────┘    └──────┬───────┘ └──────┬───────┘ └──────┬───────┘
             │                   │                │                │
             ▼                   ▼                ▼                ▼
                       ┌──────────────────────────────┐
                       │   INTERRUPT: HITL Review     │ ← Human nodes
                       │   (triage analyst / reviewer)│
                       └──────────────┬───────────────┘
                                      │
                                      ▼
                           ┌──────────────────────┐
                           │   END (triage done)  │
                           │   emit event         │
                           └──────────────────────┘
```

---

## State Schema

LangGraph holds the running state of a triage execution in a single typed dict that all nodes can read from and append to:

```python
from typing import TypedDict, Literal, Optional
from langgraph.graph.message import add_messages
from typing_extensions import Annotated

class TriageState(TypedDict):
    # --- Input ---
    request_id: str
    intake_request: dict

    # --- Stage outputs (populated as graph executes) ---
    completeness: Optional[dict]           # {score, clarity, missing_fields, proceed}
    classification: Optional[dict]         # {domain, complexity, archetype}
    pattern_matches: Optional[list]        # [{patternId, relevance, recommendation, gaps}]
    vendor_analysis: Optional[dict]        # {matches, unapproved, flags}
    risk_scores: Optional[dict]            # {security, compliance, arch, ops, vendor, overall}
    routing: Optional[dict]                # {lane, reviews, sla}
    summary: Optional[dict]                # {executive_summary, recommendations, next_steps}

    # --- Control flow ---
    halt_reason: Optional[Literal["incomplete", "low_confidence", "error"]]
    retry_count: int
    current_node: str
    trace_id: str

    # --- HITL ---
    human_review_required: bool
    human_review_type: Optional[Literal["triage", "architecture", "security", "vendor", "arb"]]
    human_decision: Optional[dict]         # populated when human resumes the graph

    # --- Audit ---
    node_history: Annotated[list, add_messages]   # append-only log of node executions
    errors: list
```

---

## Nodes — What Each Does

### Node 1: `completeness_check`
**Model:** `claude-sonnet-4-6` (low temperature)
**Purpose:** Validate the intake request is complete enough to proceed.
**Input:** `intake_request`
**Output:** `completeness` dict
**Edge logic:** If `completeness.score < 0.6`, go to `needs_info_halt`. Else go to `classify`.

### Node 2: `classify`
**Model:** `claude-sonnet-4-6` (structured output)
**Purpose:** Assign domain, complexity tier, and archetype.
**Input:** `intake_request`, `completeness`
**Output:** `classification` dict
**Edge logic:** Fan out to `pattern_match` AND `vendor_analysis` in parallel.

### Node 3a: `pattern_match` (parallel)
**Model:** `claude-sonnet-4-6` + embedding retrieval
**Purpose:** Match the request against endorsed patterns.
**Tools called:**
- `svc-pattern-catalog` semantic search (vector similarity via pgvector)
- `svc-pattern-catalog` pattern detail lookups
**Output:** `pattern_matches` list, `exception_flags`, `unmatched_aspects`
**Reflection step:** If any matched pattern has `relevance < 0.5`, re-query with a refined description.

### Node 3b: `vendor_analysis` (parallel)
**Model:** `claude-haiku-4-5` (cheaper model — simpler task)
**Purpose:** Cross-reference proposed technologies against the vendor registry.
**Tools called:**
- `svc-vendor-registry` fuzzy search
- `svc-vendor-registry` approval status
**Output:** `vendor_analysis` dict with approval flags

### Node 4: `risk_scoring` (join point)
**Model:** `claude-sonnet-4-6`
**Purpose:** 5-dimension weighted risk scoring.
**Input:** Everything above.
**Output:** `risk_scores` dict.
**Reflection:** If `risk_scores.weighted_total` is inconsistent with individual dimensions (sanity check), retry once with explicit formula.

### Node 5: `routing_decision`
**Model:** `claude-sonnet-4-6` (very low temperature, structured output)
**Purpose:** Deterministic-ish routing to one of four lanes.
**Input:** `risk_scores`, `pattern_matches`, `vendor_analysis`
**Output:** `routing` dict with lane, reviews, SLA, rationale.
**Edge logic:** Routes to one of four summarization nodes based on `routing.lane`.

### Nodes 6a-6d: `summarize_*`
Four parallel summarization nodes, one per lane. Each produces a decision package tailored to its audience:
- `summarize_fast_track`: brief auto-approval note + pattern references
- `summarize_standard`: architect-focused brief
- `summarize_complex`: multi-reviewer brief with parallel assignments
- `summarize_exception`: ARB-ready decision pack with full risk narrative

### HITL Nodes: `hitl_triage`, `hitl_architecture`, `hitl_security`, `hitl_arb`
These are **interrupt** nodes — LangGraph pauses the graph, persists state to the checkpoint store (PostgreSQL), and waits for a human decision to resume execution.

```python
graph.add_node("hitl_triage", human_triage_node)
graph.add_interrupt_before("hitl_triage")
```

When a human submits their review via the portal, the graph is resumed with the human's decision merged into state, and execution continues from where it paused.

### Terminal Node: `finalize`
Writes final results to the `ai.triage_runs` table, publishes `ai.triage.completed.v1` event.

---

## Multi-Model Routing

Not every node needs the same model. LangGraph lets us route per node:

| Node | Model | Why |
|------|-------|-----|
| `completeness_check` | Claude Sonnet 4.6 | Accuracy matters, cost tolerable |
| `classify` | Claude Haiku 4.5 | Fast, cheap, structured output |
| `pattern_match` | Claude Sonnet 4.6 | Reasoning over unstructured pattern text |
| `vendor_analysis` | Claude Haiku 4.5 | Simple lookup task |
| `risk_scoring` | Claude Sonnet 4.6 | Critical decision, highest accuracy |
| `routing_decision` | Claude Sonnet 4.6 | Deterministic output via low temp |
| `summarize_*` | Claude Sonnet 4.6 | Quality matters for human readers |

**Where they run:** Azure OpenAI (GPT-4o for cross-validation) and/or Anthropic API (primary). Model backends are abstracted via LangChain's `ChatModel` interface so we can swap providers.

---

## Tools (Graph-Level, Shared by Nodes)

Nodes call these tools to fetch fresh data. Tools are implemented as HTTP clients to other services:

| Tool | Calls | Used by |
|------|-------|---------|
| `search_patterns(query, domain)` | `svc-pattern-catalog` `/api/v1/patterns/search/semantic` | pattern_match |
| `get_pattern(id)` | `svc-pattern-catalog` `/api/v1/patterns/{id}` | pattern_match |
| `check_vendor(name)` | `svc-vendor-registry` `/api/v1/vendors/check/{name}` | vendor_analysis |
| `search_vendors(query)` | `svc-vendor-registry` `/api/v1/vendors` | vendor_analysis |
| `get_similar_requests(embedding)` | `svc-ai-orchestrator` internal (pgvector) | pattern_match (for precedent lookup) |

These are the **same tools** exposed by `svc-mcp-gateway` — the LangGraph nodes and external AI agents share one tool layer. That's a key architectural win: AI agents and the internal orchestrator query the same data the same way.

---

## Checkpointing & State Persistence

LangGraph supports pluggable checkpointers. We use the **PostgreSQL checkpointer** (`langgraph-checkpoint-postgres`):

- Every node execution checkpoints state to `ai.graph_checkpoints`
- Graph can be resumed from any checkpoint (HITL resumes, retries, time-travel debugging)
- Checkpoints are keyed by `{thread_id}` which maps to `{request_id}`
- TTL: checkpoints retained for 90 days, archived to Blob Storage after

This means a triage run that spans 2 weeks (requestor goes on vacation, review happens later) just resumes cleanly.

---

## HITL Flow in Detail

When the graph hits an interrupt before `hitl_triage`:

1. Graph pauses, state checkpointed.
2. `svc-ai-orchestrator` emits `ai.triage.hitl-required.v1` event.
3. `svc-intake-governance` consumes the event, transitions the workflow state to `pending_triage`, assigns a triage analyst.
4. Analyst opens the request in `app-portal`, sees the AI triage output, makes a decision (approve recommendation / override route / request more info).
5. Portal POSTs the decision to `svc-ai-orchestrator` `/api/v1/ai/triage/{runId}/resume`.
6. Orchestrator calls `graph.update_state(thread_id, {"human_decision": ...})` and resumes execution.
7. Graph continues from `hitl_triage` with the human decision merged into state.

This means humans are **nodes in the graph**, not an external system that interrupts the flow. The graph's state reflects reality including human input.

---

## Reflection / Self-Correction Pattern

For critical nodes (risk scoring, routing), we add a reflection step using a sub-graph:

```
  risk_scoring ──▶  validate_output ──┐
                        │             │
                  ┌─────┴─────┐       │
                  │ invalid   │       │ valid
                  ▼           │       ▼
              reflect ─(retry)┘       continue
               (max 2)
```

If `risk_scoring` outputs malformed JSON or inconsistent numbers (e.g., individual scores sum wrong vs the weighted total), `validate_output` flags it and routes back through a `reflect` node which re-prompts with the error context. Max 2 retries, then fall back to rule-based scoring.

---

## Graph Versioning

Graph definitions and prompts are **versioned artifacts**, not inline code:

```
svc-ai-orchestrator/
├── graphs/
│   ├── triage_v1.py          ← current production
│   ├── triage_v1.1.py        ← staging: adds new reflection step
│   └── triage_v2_draft.py    ← in development
├── prompts/
│   ├── completeness/v1.md
│   ├── completeness/v2.md
│   ├── classify/v1.md
│   └── ...
└── config/
    └── active-graph.yaml     ← which version is "active" per environment
```

**Release model:**
- Prompt changes ship as new prompt versions with CI testing
- Graph changes ship as new graph versions
- `active-graph.yaml` is environment-specific and gates which version runs
- Production can run v1 while UAT runs v1.1 for testing
- Rollback = change `active-graph.yaml` back to prior version

**Prompt testing:** Every prompt change runs through a golden set of 20 sample intake requests and asserts the output matches within tolerances.

---

## Observability of AI Runs

Every graph execution emits:

- **Traces** — OpenTelemetry spans per node, linked into the same trace as the originating HTTP request from `svc-intake-governance`
- **Token counts** — per node, per model, to attribute LLM costs
- **Timings** — p50/p99 per node, alert if any node exceeds SLO
- **Confidence scores** — a per-run "AI confidence" metric that decays when reflections happen
- **Override rate** — how often human triage analysts override the AI's routing (feeds retraining signal)

Grafana dashboard: "Triage Pipeline Health" — per-node error rate, latency, confidence, override rate, cost per run.

---

## Feedback Loop for Continuous Improvement

Every human decision that differs from the AI recommendation is captured as a signal:

- `ai_recommendation ≠ human_decision` → stored in `ai.feedback_events`
- Monthly, these events are reviewed by the AI/Platform team
- If a pattern emerges (e.g., "AI over-routes SaaS tools to exception when standard would suffice"), the corresponding prompt or graph node is updated
- Prior runs can be replayed against the new graph version for A/B comparison

**Retraining schedule:** Monthly prompt/graph review, quarterly "major" revision with A/B test against golden set.

---

## What the AI/Platform Team Actually Builds

1. **`svc-ai-orchestrator`** — Python service wrapping LangGraph, exposing REST APIs
2. **Graph definitions** in `graphs/` — one file per graph version
3. **Prompt templates** in `prompts/` — versioned markdown files
4. **Tool clients** — HTTP clients to `svc-pattern-catalog`, `svc-vendor-registry`
5. **Checkpointer config** — PG-backed, connection pooling
6. **Event handlers** — consumes `intake.request.submitted.v1`, produces `ai.triage.*`
7. **CI suite** — golden-set regression tests for every prompt/graph change
8. **Grafana dashboard** — AI pipeline health as code

### Python vs Node.js for this service
LangGraph's primary implementation is Python. The ecosystem (tools, integrations, docs) is richer in Python. Even though the rest of the platform may be Node/TypeScript, `svc-ai-orchestrator` should be **Python** — this is one place where polyglot is worth the cost. Communication across services is via REST + events, so language choice is isolated.
