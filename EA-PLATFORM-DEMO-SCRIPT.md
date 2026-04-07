# McCain EA Platform — Demo Video Script

**Duration:** ~12-15 minutes
**Audience:** Executive leadership, CIO/CTO, Architecture Review Board
**Tone:** Confident, conversational, outcome-focused

---

## OPENING (30 seconds)

> "Today I'm going to walk you through the McCain Enterprise Architecture Platform — a system we've built to bring governance, intelligence, and speed to every architecture decision we make across the organisation.
>
> Instead of telling you what it does, I'm going to show you by following a real scenario from start to finish — from the moment a team submits an architecture request, all the way through to production-ready Terraform code and a Jira delivery plan."

---

## SCENE 1: THE EXECUTIVE DASHBOARD (90 seconds)

**Screen:** Main dashboard view

> "This is where leadership lives. At a glance, you can see the health of our architecture landscape."

**Walk through the KPI cards:**

> "Across the top — total architecture patterns in our library, how many are endorsed and production-ready, active intake requests in the pipeline, how many are pending review, and critically — how many requests are flagged as high or critical risk.
>
> Below that, we've got four views that matter:
>
> - **Intake by Domain** — where are requests coming from? Application & Integration is our busiest domain right now.
> - **Risk Distribution** — how many requests fall into each risk tier. You want to see green, not red.
> - **Recent Activity** — a live feed of what's moving through the pipeline.
> - **Pattern Board** — a snapshot of our endorsed architecture building blocks.
>
> This dashboard updates in real time. No one has to compile a status report — the data is always current."

**TRANSITION:** *"Let's see what happens when a new request comes in."*

---

## SCENE 2: SUBMITTING AN ARCHITECTURE REQUEST (3 minutes)

**Screen:** Click "New Request" to open the intake wizard

> "Let's say a team in Supply Chain wants to build a new real-time data integration between our factory OT systems and the Azure cloud. They come here and start the guided intake wizard."

### Step 1 — Overview

> "First, the basics — project title, description, strategic objective, who's requesting it, which business unit, and the timeline. Nothing unusual here, but notice the **document upload panel** at the top."

**Demo the document upload:**

> "If the team already has a design document — a PDF, a Word doc, even a ZIP of their source code — they can drag it in here. Claude AI reads the document and **auto-fills the wizard fields**. It extracts the technology stack, the hosting model, vendor references, compliance requirements — all mapped into the right fields. The team reviews and adjusts, but it saves significant time on complex submissions."

### Step 2 — Technology

> "Architecture type, hosting model, deployment target, key components. And notice what's appeared on the right — the **AI Risk Sidebar**."

**Point to the sidebar:**

> "As the submitter fills in fields, the sidebar is already giving them live feedback. It's showing a preliminary risk estimate, contextual suggestions — 'You've selected a public-facing deployment but haven't confirmed WAF protection' — and references to our own policies. This is self-service with guardrails. The team gets guidance *before* they submit, not after a two-week review cycle."

### Step 3 — Vendors

> "Here they select from our registered vendor catalogue — 31 vendors, all pre-assessed with criticality ratings and data-sharing flags. If they need a vendor that's not in the registry, they flag it here as a new vendor. That automatically increases the risk score and triggers a vendor assessment requirement."

### Step 4 — Security & Data

> "Data classification — Public, Internal, Confidential, or Restricted. Data types in scope — are we handling PII, financial data, OT/SCADA data, credentials? Encryption posture, authentication methods, MFA, WAF, Zero Trust alignment. Every answer here feeds directly into the automated risk score."

### Step 5 — Dependencies

> "Integration points, legacy system dependencies, which existing architecture patterns this aligns with. The more integration points, the higher the complexity score. Legacy dependencies flag additional risk."

### Step 6 — Risk & Submit

> "Before they submit, they can run an **AI Quick Scan**. Claude Haiku gives them an instant assessment — a rating, the top concern, and the single most important thing to fix. This takes about two seconds."

**Click Quick Scan and show the result:**

> "It's telling us: 'Review Needed — OT data integration with cloud services requires explicit Zero Trust alignment and IEC 62443 compliance confirmation.' That's specific, actionable feedback before the request even reaches a reviewer.
>
> Now they submit. The request gets a reference ID — EAR-2026-0012 — and enters the pipeline."

**TRANSITION:** *"Now let's see what the architecture team sees."*

---

## SCENE 3: AUTOMATED RISK SCORING (2 minutes)

**Screen:** Open the submitted intake request detail view

> "The request lands in the review queue, automatically sorted by risk score — highest risk at the top. Let's open this one."

**Point to the risk breakdown:**

> "The platform has already scored this request across four dimensions:
>
> - **Data Risk:** 18 out of 25 — we're handling OT/SCADA data with external sharing.
> - **Vendor Risk:** 14 out of 25 — two critical-tier vendors plus a new unvetted one.
> - **Security Risk:** 16 out of 25 — no WAF confirmed on a public-facing endpoint, Zero Trust not declared.
> - **Complexity Risk:** 12 out of 25 — eight integration points and a legacy system dependency.
>
> Total: 60 out of 100 — **High risk tier.** That means this requires Architecture Board review. The system isn't just scoring — it's generating specific recommendations: 'Deploy Azure Front Door with WAF using OWASP Top 10 ruleset,' 'Apply IEC 62443 zone and conduit model before approval,' 'Complete vendor security assessment for the new vendor.'
>
> None of this required a human to calculate. It's consistent, auditable, and instant."

**TRANSITION:** *"But we don't stop at rules-based scoring. Let's bring in the AI."*

---

## SCENE 4: AI TRIAGE PIPELINE (2 minutes)

**Screen:** Click "Run AI Triage" on the intake request

> "This is our seven-stage AI triage pipeline, powered by Claude and LangChain. Watch — it runs through each stage in real time."

**Show the stages completing one by one (SSE streaming):**

> "Stage 1 — **Completeness check.** Is there enough information to proceed? Yes, 0.85 completeness score.
>
> Stage 2 — **Classification.** Primary domain: Application & Integration. Complexity: Complex. Business criticality: High.
>
> Stage 3 — **Pattern Matching.** It's mapped this request to three endorsed patterns — AP-001 API Gateway, AP-004 Event-Driven Integration, and AP-006 Secure Integration Zones — with relevance scores and explanations for each match.
>
> Stage 4 — **Vendor Analysis.** Overall vendor risk: Medium. Flags the unvetted vendor for assessment.
>
> Stage 5 — **Risk Scoring.** Composite score: 62. High tier.
>
> Stage 6 — **Routing.** This gets routed to the **Complex** lane — Architecture Review Board, estimated 1-2 week review.
>
> Stage 7 — **Executive Summary.** And here's the output that matters most."

**Read the executive summary:**

> "A CTO-ready decision package: headline, three-sentence executive summary, key strengths, key risks with severity and mitigations, must-do actions before approval, and an overall verdict — in this case, 'Proceed with Conditions.'
>
> This entire analysis took about 15 seconds. It would take a senior architect half a day to produce the same output manually."

**TRANSITION:** *"Let's also generate the architecture diagram."*

---

## SCENE 5: AI ARCHITECTURE DIAGRAM (60 seconds)

**Screen:** Click "Generate Diagram"

> "One click. Claude reads the entire request — components, vendors, hosting model, auth methods, data flows — and generates a layered architecture diagram."

**Show the Mermaid diagram rendering:**

> "It's organised into zones — External sources on the left, security layer, integration layer, application layer, data layer. Each component is named, the data flows are labelled, and there's a legend explaining the architecture in plain language.
>
> This isn't a template. It's generated from *this specific request's* details. Change the request, regenerate, and you get a different diagram."

**TRANSITION:** *"Once the request is approved, we move to solution design."*

---

## SCENE 6: SOLUTION DESIGN & PATTERN COMPOSITION (2 minutes)

**Screen:** Click "Begin Solution Design" from the approved intake

> "From any approved intake, one click creates a Solution Design — pre-populated with the intake reference, title, and context. The architect selects which patterns compose this solution."

**Show the pattern chips and 7-stage pipeline:**

> "This solution composes three patterns: API Gateway, Event-Driven Integration, and Secure Integration Zones. And it follows a formal seven-stage review pipeline:
>
> Intake Approved → Design Draft → **Pattern Alignment** → EA Review → Security Review → Architecture Board → Published.
>
> At the Pattern Alignment stage, the reviewer assesses each pattern individually — Aligned, Conditional, or Deviation — with notes and attribution. This creates a clear record of *why* each pattern was selected and any conditions attached."

**Show the iterations log:**

> "Every design change is versioned — who changed it, what changed, when. Full traceability."

**TRANSITION:** *"Once the solution is published, this is where it gets really powerful."*

---

## SCENE 7: DELIVERY OUTPUTS (2 minutes)

**Screen:** Published solution — Output section

> "A published solution unlocks three delivery accelerators."

### 7a — Terraform IaC Generation

> "One click generates production-grade Terraform — `main.tf`, `variables.tf`, `outputs.tf`, `providers.tf`, and a `README`. It's Azure-native, uses the right SKUs from our pattern definitions, and includes the guardrails from our endorsed patterns — encryption, monitoring, access controls.
>
> From here, the engineer can copy the code, download it as a ZIP, or **push it directly to GitHub** into our IaC repository."

### 7b — Jira Epic & Story Generation

> "One click generates a structured delivery plan — 4 to 7 Epics, each with 3 to 6 Stories, complete with titles, descriptions, and acceptance criteria. Claude reads the solution's patterns, vendors, deployment regions, and business context to produce work items that actually make sense.
>
> And then — **Push to Jira**. It creates the issues via Jira's API, links stories to their parent epics, and shows you the Jira issue keys right here. Architecture decision to engineering backlog in two clicks."

### 7c — Operational Support

> "For the operations team — the Operator tab lets you create a support record inline. Owner, SLA, support tier, escalation contacts, runbook links, monitoring dashboards, and licence tracking with automatic 90-day expiry warnings. The solution isn't just approved — it's production-ready."

**TRANSITION:** *"Let me quickly show you two more things."*

---

## SCENE 8: PATTERN LIBRARY (60 seconds)

**Screen:** Pattern Board (Kanban view)

> "This is our architecture pattern library — 17 patterns across six domains, displayed as a Kanban board. Endorsed patterns on the left, In Development in the middle, Under Review on the right.
>
> Each pattern has full documentation — components, interaction flows, guardrails, use cases, exception processes, and SVG architecture diagrams. This is the institutional knowledge that used to live in people's heads, now codified and reusable."

---

## SCENE 9: VENDOR REGISTRY (30 seconds)

**Screen:** Vendor table

> "31 vendors, each tagged with criticality, data sharing status, hosting model, and category. When a submitter selects vendors in their intake, the risk engine automatically factors in vendor criticality, SaaS exposure, and supply chain concentration. And our vendor intelligence module can pull live CVE data from the National Vulnerability Database and SSL grades from Cloudflare."

---

## CLOSING (60 seconds)

**Screen:** Return to the Executive Dashboard

> "Let me bring it all together.
>
> What you've just seen is a single request flow from submission to production-ready outputs — and at every step, the platform added value:
>
> - **Self-service intake** with AI-guided guardrails — teams don't wait for architects to tell them what fields to fill in.
> - **Automated risk scoring** — consistent, auditable, instant.
> - **AI triage** — a seven-stage analysis that produces a CTO-ready decision package in 15 seconds.
> - **Pattern-first governance** — every solution is composed from endorsed building blocks.
> - **Delivery acceleration** — Terraform, Jira epics, and operational support records generated from the architecture decision itself.
>
> This isn't a documentation tool. It's an **architecture operating system** — and it's already running.
>
> Thank you."

---

## DEMO TIPS

- **Pre-seed data:** Have 5-8 intake requests at various stages (Draft, Submitted, Under Review, Approved) so the dashboard looks populated and the review queue has items to show.
- **Pre-generate one AI review and diagram** so you don't wait for API calls during the live demo. You can regenerate one live to show the real-time experience.
- **Have a Jira project ready** if you want to demo the Push to Jira flow live. Otherwise, show the generated output and explain the push capability.
- **Browser zoom:** Set browser to 90% zoom so more of the UI is visible on screen.
- **Use the WarmEmber or MidnightInk theme** for better contrast on video recordings.
- **Fallback:** If an AI call is slow during recording, narrate over it: "This typically takes about 10-15 seconds..." and cut to the result.
- **Total scenes:** 9 scenes. You can trim scenes 8 and 9 (Pattern Library + Vendor Registry) to save time if needed — the core story is scenes 1-7.

---

## SCENE TIMING SUMMARY

| Scene | Topic | Time |
|---|---|---|
| Opening | Hook and setup | 0:30 |
| 1 | Executive Dashboard | 1:30 |
| 2 | Submitting a Request (Wizard) | 3:00 |
| 3 | Automated Risk Scoring | 2:00 |
| 4 | AI Triage Pipeline | 2:00 |
| 5 | AI Architecture Diagram | 1:00 |
| 6 | Solution Design & Composition | 2:00 |
| 7 | Delivery Outputs (IaC, Jira, Ops) | 2:00 |
| 8 | Pattern Library | 1:00 |
| 9 | Vendor Registry | 0:30 |
| Closing | Summary and CTA | 1:00 |
| **Total** | | **~16 min** |
