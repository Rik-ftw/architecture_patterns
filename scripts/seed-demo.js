/**
 * McCain EA Platform — Demo Data Seed Script
 * Creates realistic intake requests at every workflow stage, plus solution designs,
 * comments, audit history, and pre-populated AI review artifacts.
 *
 * Run: node scripts/seed-demo.js
 */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('sslmode')
    ? undefined
    : { rejectUnauthorized: false }
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
function j(v) { return JSON.stringify(v); }
function daysAgo(n) { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString(); }

// ─── Intake requests payload ──────────────────────────────────────────────────
const intakes = [
  // ── 1. APPROVED — Customer Data Platform
  {
    reference_id: 'IR-2025-001',
    title: 'Global Customer Data Platform (CDP)',
    description: 'Unified customer data platform consolidating consumer touchpoints across retail, foodservice, and direct channels. Integrates POS, e-commerce, loyalty, and CRM data into a single 360° profile store.',
    strategic_objective: 'Enable hyper-personalisation, reduce data silos across 50+ markets, and provide a single source of truth for customer analytics. Directly supports McCain 2030 digital growth strategy.',
    requestor_name: 'Sarah Mitchell',
    requestor_email: 'sarah.mitchell@mccain.com',
    requestor_role: 'VP Digital & eCommerce',
    business_unit: 'Digital & Consumer',
    programme_domain: 'Application & Integration',
    project_timeline: '12-18 months',
    architecture_type: 'Greenfield',
    status: 'Approved',
    components: ['Azure Event Hubs', 'Azure Synapse Analytics', 'Azure Cosmos DB', 'Azure API Management', 'Salesforce Marketing Cloud', 'Snowflake'],
    hosting_model: 'Cloud (Azure)',
    deployment_target: 'Azure Canada Central + East US',
    integration_points: 12,
    is_public_facing: true,
    tech_stack_notes: 'React frontend, Python/FastAPI microservices, dbt for transformation, Terraform IaC',
    vendor_ids: ['salesforce', 'snowflake'],
    new_vendors: [],
    data_classification: 'Confidential',
    data_types: ['PII', 'Behavioural', 'Transactional', 'Marketing'],
    external_data_sharing: true,
    data_sharing_details: 'Salesforce Marketing Cloud for campaign activation; Adobe Audience Manager for DMP',
    encryption_at_rest: true,
    encryption_in_transit: true,
    auth_methods: ['OAuth 2.0', 'Azure AD', 'API Keys'],
    has_mfa: true,
    has_waf: true,
    has_monitoring: true,
    is_zero_trust_aligned: true,
    compliance_requirements: ['GDPR', 'PIPEDA', 'SOC 2'],
    related_pattern_ids: ['AP-001', 'AP-002', 'DT-001'],
    has_legacy_dependencies: false,
    legacy_systems: null,
    external_dependencies: 'Salesforce, Snowflake, Adobe',
    deviates_from_patterns: false,
    deviation_justification: null,
    risk_score: 62,
    risk_tier: 'Medium',
    risk_breakdown: { dataRisk: 28, securityRisk: 12, complianceRisk: 14, integrationRisk: 8 },
    risk_flags: ['PII data processing at scale', 'Cross-border data transfer (GDPR)'],
    risk_recommendations: ['Implement consent management layer', 'Appoint Data Protection Officer', 'Privacy-by-design review required'],
    reviewer_name: 'James Okafor',
    reviewer_notes: 'Approved. Strong security posture, comprehensive pattern alignment. Consent management platform must be in place before go-live. DPO sign-off required at 60% build.',
    reviewed_at: daysAgo(14),
    submitted_at: daysAgo(28),
    approved_pattern_id: 'AP-001',
    ai_review: JSON.stringify({
      summary: 'This architecture demonstrates strong alignment with McCain EA patterns, particularly AP-001 (API Gateway) and DT-001 (Data Lake). The CDP design correctly employs event-driven ingestion via Azure Event Hubs, providing scalable consumer data pipelines. Security posture is above average with WAF, MFA, and zero-trust alignment all confirmed.',
      strengths: ['Event-driven ingestion correctly uses Azure Event Hubs as per AP-004', 'API Gateway layer (AP-001) enforces consistent auth across all upstream integrations', 'Snowflake on Azure ensures data residency compliance', 'Encryption at rest and in transit both confirmed'],
      concerns: ['Cross-border PII transfer to Adobe Audience Manager requires GDPR adequacy review', 'Salesforce Marketing Cloud data processor agreement must be updated for PIPEDA', '12 integration points increases blast radius — circuit breaker pattern recommended'],
      recommendations: ['Implement Azure API Management rate limiting per consumer', 'Deploy Consent Management Platform (OneTrust or equivalent) before go-live', 'Add Azure Private Endpoints for Snowflake connectivity', 'Define data retention policy per data type'],
      patternAlignment: [{ patternId: 'AP-001', status: 'Aligned', note: 'API Gateway pattern fully applied' }, { patternId: 'DT-001', status: 'Aligned', note: 'Data lake ingestion follows prescribed pattern' }],
      riskRating: 'Medium',
      overallScore: 72,
      model: 'claude-sonnet-4-5',
      generatedAt: daysAgo(21)
    })
  },

  // ── 2. APPROVED WITH CONDITIONS — SAP S/4HANA Migration
  {
    reference_id: 'IR-2025-002',
    title: 'SAP S/4HANA Cloud Migration (ERP Modernisation)',
    description: 'Migration from SAP ECC on-premises to SAP S/4HANA Public Cloud. Covers Finance, Procurement, Supply Chain, and Manufacturing modules across all North American entities. Phase 1: Canada manufacturing plants.',
    strategic_objective: 'Retire aging SAP ECC (2009 install) ahead of SAP support end-date 2027. Enable real-time financial close, AI-assisted procurement, and integrated supply chain visibility.',
    requestor_name: 'David Chen',
    requestor_email: 'd.chen@mccain.com',
    requestor_role: 'Director, Enterprise Systems',
    business_unit: 'Global Technology',
    programme_domain: 'Application & Integration',
    project_timeline: '18-24 months',
    architecture_type: 'Lift & Shift + Refactor',
    status: 'Approved with Conditions',
    components: ['SAP S/4HANA Public Cloud', 'SAP BTP (Business Technology Platform)', 'Azure Integration Services', 'SAP Datasphere', 'Azure Monitor'],
    hosting_model: 'SaaS + Cloud (Azure)',
    deployment_target: 'SAP Data Centre + Azure Canada Central',
    integration_points: 24,
    is_public_facing: false,
    tech_stack_notes: 'SAP ABAP, CAP (Cloud Application Programming), SAP Fiori, BTP middleware',
    vendor_ids: ['sap'],
    new_vendors: [{ name: 'Accenture', reason: 'SAP implementation partner — will be formally onboarded via vendor intake' }],
    data_classification: 'Confidential',
    data_types: ['Financial', 'HR', 'Supply Chain', 'Manufacturing'],
    external_data_sharing: false,
    data_sharing_details: null,
    encryption_at_rest: true,
    encryption_in_transit: true,
    auth_methods: ['Azure AD SSO', 'SAP Identity Authentication Service'],
    has_mfa: true,
    has_waf: false,
    has_monitoring: true,
    is_zero_trust_aligned: false,
    compliance_requirements: ['SOX', 'PIPEDA', 'ISO 27001'],
    related_pattern_ids: ['AP-001', 'AP-002', 'IN-001'],
    has_legacy_dependencies: true,
    legacy_systems: 'SAP ECC 6.0 (2009), legacy ABAP custom code (~3,200 custom objects), SAP BW on HANA',
    external_dependencies: 'SAP, Accenture (SI), Manhattan Associates (WMS)',
    deviates_from_patterns: true,
    deviation_justification: 'SAP S/4HANA Public Cloud limits custom ABAP — deviation from in-house middleware pattern (AP-002) is accepted as the BTP platform provides equivalent capabilities.',
    risk_score: 81,
    risk_tier: 'High',
    risk_breakdown: { dataRisk: 18, securityRisk: 22, complianceRisk: 24, integrationRisk: 17 },
    risk_flags: ['SOX financial data controls must be validated pre-cutover', 'No WAF configured for BTP exposure', '3,200 custom ABAP objects require refactoring assessment', 'Zero-trust not yet aligned'],
    risk_recommendations: ['Conduct ABAP custom code simplification assessment (SAP Readiness Check)', 'Deploy WAF for SAP BTP Internet-facing endpoints', 'Engage SOX auditors for control framework mapping', 'Implement Zero Trust Network Access for BTP connectivity'],
    reviewer_name: 'Patricia Kowalski',
    reviewer_notes: 'Approved with Conditions. High complexity and SOX implications require additional controls. Conditions: (1) WAF must be deployed for BTP endpoints before UAT; (2) SOX control matrix signed off by Finance Director; (3) Accenture vendor intake completed before project kickoff. Recommend quarterly EA checkpoint reviews.',
    reviewed_at: daysAgo(7),
    submitted_at: daysAgo(21),
    approved_pattern_id: null,
    ai_review: JSON.stringify({
      summary: 'SAP S/4HANA migration represents a strategic imperative for McCain, but the architecture presents elevated risk due to 24 integration points, legacy ABAP debt, and SOX financial data controls. The absence of WAF on BTP endpoints and non-zero-trust alignment are notable gaps that must be resolved.',
      strengths: ['Azure AD SSO provides unified identity layer', 'SAP Datasphere correctly used for analytics separation', 'Phased approach (starting Canada) reduces blast radius'],
      concerns: ['WAF not deployed for SAP BTP public endpoints — high priority gap', '3,200 custom ABAP objects risk introducing undiscovered vulnerabilities in cloud', 'Zero Trust not aligned — ECC to S/4HANA VPN-based connectivity is legacy pattern', 'No circuit breaker between ECC and S/4HANA during parallel run'],
      recommendations: ['Deploy Azure Application Gateway + WAF v2 in front of BTP', 'Run SAP Readiness Check to quantify ABAP simplification effort', 'Implement SAP Cloud ALM for lifecycle management', 'Define rollback plan with RTO < 4 hours for each module cutover'],
      patternAlignment: [{ patternId: 'AP-001', status: 'Partial', note: 'API Management used for some interfaces but not all SAP APIs' }, { patternId: 'IN-001', status: 'Deviation Approved', note: 'BTP replaces in-house middleware per approved deviation' }],
      riskRating: 'High',
      overallScore: 54,
      model: 'claude-sonnet-4-5',
      generatedAt: daysAgo(10)
    })
  },

  // ── 3. UNDER REVIEW — IoT Edge Platform
  {
    reference_id: 'IR-2025-003',
    title: 'Factory IoT Edge Intelligence Platform',
    description: 'Deploy Azure IoT Edge runtime across 8 manufacturing plants (Florenceville, Grand Falls, Carberry, Coaldale, and 4 international). Real-time OEE monitoring, predictive maintenance ML models at the edge, and digital twin integration.',
    strategic_objective: 'Achieve 95% OEE across all plants by 2026. Enable autonomous quality control using computer vision. Reduce unplanned downtime by 40% through predictive maintenance.',
    requestor_name: 'Marcus Weber',
    requestor_email: 'm.weber@mccain.com',
    requestor_role: 'Head of Manufacturing Technology',
    business_unit: 'Operations & Supply Chain',
    programme_domain: 'Cloud & Platform',
    project_timeline: '12 months',
    architecture_type: 'Greenfield',
    status: 'Under Review',
    components: ['Azure IoT Hub', 'Azure IoT Edge Runtime', 'Azure Digital Twins', 'Azure Stream Analytics', 'Azure ML', 'InfluxDB (edge)', 'MQTT Broker'],
    hosting_model: 'Hybrid (Edge + Cloud)',
    deployment_target: 'On-premises edge + Azure Canada Central',
    integration_points: 8,
    is_public_facing: false,
    tech_stack_notes: 'Python ML models (PyTorch), Rust edge modules, OPC-UA protocol for PLC communication',
    vendor_ids: ['microsoft'],
    new_vendors: [{ name: 'PTC ThingWorx', reason: 'Digital twin platform — under evaluation vs Azure Digital Twins' }],
    data_classification: 'Internal',
    data_types: ['OT/Sensor', 'Machine Telemetry', 'Quality Control', 'Video/Vision'],
    external_data_sharing: false,
    data_sharing_details: null,
    encryption_at_rest: true,
    encryption_in_transit: true,
    auth_methods: ['Azure AD', 'X.509 Device Certificates', 'TPM 2.0'],
    has_mfa: false,
    has_monitoring: true,
    has_waf: false,
    is_zero_trust_aligned: false,
    compliance_requirements: ['IEC 62443', 'NIST CSF', 'ISO 27001'],
    related_pattern_ids: ['CP-001', 'AP-004'],
    has_legacy_dependencies: true,
    legacy_systems: 'Rockwell Allen-Bradley PLCs (2008-2015 vintage), Wonderware SCADA, OSIsoft PI Historian',
    external_dependencies: 'PLC vendors, SCADA integrators',
    deviates_from_patterns: false,
    deviation_justification: null,
    risk_score: 71,
    risk_tier: 'High',
    risk_breakdown: { dataRisk: 12, securityRisk: 32, complianceRisk: 15, integrationRisk: 12 },
    risk_flags: ['OT/IT convergence introduces ICS security risks', 'Legacy PLCs not patchable — air-gap required', 'MFA not feasible for machine-to-machine connections', 'IEC 62443 compliance gap on edge modules'],
    risk_recommendations: ['Implement OT DMZ between IT and OT networks per IEC 62443 Zone/Conduit model', 'Conduct ICS security assessment before production deployment', 'Define backup/failover for edge runtime (plant cannot stop)', 'Evaluate Purdue model alignment'],
    reviewer_name: null,
    reviewer_notes: null,
    reviewed_at: null,
    submitted_at: daysAgo(10),
    approved_pattern_id: null,
    ai_review: null
  },

  // ── 4. UNDER REVIEW — AI/ML Platform
  {
    reference_id: 'IR-2025-004',
    title: 'Enterprise AI & MLOps Platform',
    description: 'Centralised MLOps platform on Azure ML Studio and Databricks to standardise model development, training, deployment, and monitoring. Enables data science teams across Analytics, Supply Chain, and Marketing to ship production ML models.',
    strategic_objective: 'Reduce time-to-production for ML models from 6 months to 6 weeks. Standardise feature stores, model registry, and A/B testing infrastructure. Enable responsible AI governance and audit trails.',
    requestor_name: 'Aisha Patel',
    requestor_email: 'a.patel@mccain.com',
    requestor_role: 'Chief Data & AI Officer',
    business_unit: 'Data & Analytics',
    programme_domain: 'Data & Storage',
    project_timeline: '9 months',
    architecture_type: 'Greenfield',
    status: 'Under Review',
    components: ['Azure Machine Learning', 'Azure Databricks', 'Azure Data Factory', 'Azure Container Registry', 'MLflow', 'Feature Store (Feast)', 'Azure Monitor'],
    hosting_model: 'Cloud (Azure)',
    deployment_target: 'Azure Canada Central',
    integration_points: 6,
    is_public_facing: false,
    tech_stack_notes: 'Python (scikit-learn, PyTorch, XGBoost), Databricks Runtime, Delta Lake, Terraform',
    vendor_ids: ['databricks', 'microsoft'],
    new_vendors: [],
    data_classification: 'Confidential',
    data_types: ['Behavioural', 'Transactional', 'Financial', 'Supply Chain'],
    external_data_sharing: false,
    data_sharing_details: null,
    encryption_at_rest: true,
    encryption_in_transit: true,
    auth_methods: ['Azure AD', 'Service Principals', 'Managed Identity'],
    has_mfa: true,
    has_waf: false,
    has_monitoring: true,
    is_zero_trust_aligned: true,
    compliance_requirements: ['GDPR', 'SOC 2', 'ISO 27001'],
    related_pattern_ids: ['DT-001', 'CP-001'],
    has_legacy_dependencies: false,
    legacy_systems: null,
    external_dependencies: 'Databricks, Snowflake (feature source)',
    deviates_from_patterns: false,
    deviation_justification: null,
    risk_score: 48,
    risk_tier: 'Medium',
    risk_breakdown: { dataRisk: 18, securityRisk: 10, complianceRisk: 12, integrationRisk: 8 },
    risk_flags: ['Model bias/fairness not yet addressed', 'Feature store contains confidential financial data'],
    risk_recommendations: ['Implement Responsible AI framework with bias testing', 'Define model governance policy (versioning, rollback, audit)', 'Conduct adversarial ML threat model'],
    reviewer_name: null,
    reviewer_notes: null,
    reviewed_at: null,
    submitted_at: daysAgo(5),
    approved_pattern_id: null,
    ai_review: null
  },

  // ── 5. SUBMITTED — E-Commerce Replatform
  {
    reference_id: 'IR-2025-005',
    title: 'B2C E-Commerce Replatforming (Salesforce Commerce Cloud)',
    description: 'Replace legacy Magento 1.9 e-commerce sites across 12 market websites with Salesforce Commerce Cloud (Salesforce B2C). Includes headless storefront (Next.js), product catalogue, checkout, and order management.',
    strategic_objective: 'Exit Magento 1.9 (end-of-life 2020) and deliver a modern, headless commerce experience. Enable same-day cart and catalogue sync across all markets. Support 10x Black Friday traffic spikes.',
    requestor_name: 'Claire Fontaine',
    requestor_email: 'c.fontaine@mccain.com',
    requestor_role: 'Senior Director, eCommerce',
    business_unit: 'Digital & Consumer',
    programme_domain: 'Application & Integration',
    project_timeline: '12 months',
    architecture_type: 'Replatform',
    status: 'Submitted',
    components: ['Salesforce Commerce Cloud', 'Next.js (Storefront)', 'Azure Front Door', 'Azure CDN', 'Adyen Payment Gateway', 'Contentful CMS'],
    hosting_model: 'SaaS + Cloud (Azure)',
    deployment_target: 'Salesforce + Azure Global',
    integration_points: 9,
    is_public_facing: true,
    tech_stack_notes: 'Next.js 14, TypeScript, SFCC OCAPI, Adyen Web SDK, Contentful GraphQL API',
    vendor_ids: ['salesforce', 'microsoft'],
    new_vendors: [{ name: 'Adyen', reason: 'Global payment orchestration — replacing Stripe per finance requirements' }, { name: 'Contentful', reason: 'Headless CMS for product content management' }],
    data_classification: 'Confidential',
    data_types: ['PII', 'Payment Card', 'Transactional', 'Behavioural'],
    external_data_sharing: true,
    data_sharing_details: 'Adyen receives payment data; Salesforce holds customer profiles',
    encryption_at_rest: true,
    encryption_in_transit: true,
    auth_methods: ['OAuth 2.0', 'JWT', 'Salesforce Identity'],
    has_mfa: true,
    has_waf: true,
    has_monitoring: true,
    is_zero_trust_aligned: false,
    compliance_requirements: ['PCI DSS Level 1', 'GDPR', 'PIPEDA'],
    related_pattern_ids: ['AP-001', 'SC-001'],
    has_legacy_dependencies: true,
    legacy_systems: 'Magento 1.9 (12 instances), legacy SAP order management integration',
    external_dependencies: 'Salesforce, Adyen, Contentful, SAP OMS',
    deviates_from_patterns: false,
    deviation_justification: null,
    risk_score: 74,
    risk_tier: 'High',
    risk_breakdown: { dataRisk: 22, securityRisk: 20, complianceRisk: 22, integrationRisk: 10 },
    risk_flags: ['PCI DSS Level 1 scope — requires QSA assessment', 'Payment card data in scope', 'Magento 1.9 migration risk (unpatched vulnerabilities in legacy)'],
    risk_recommendations: ['Engage QSA before Adyen integration begins', 'Implement tokenisation for all payment flows', 'Conduct penetration test on headless storefront', 'Define cut-over runbook for each market'],
    reviewer_name: null,
    reviewer_notes: null,
    reviewed_at: null,
    submitted_at: daysAgo(3),
    approved_pattern_id: null,
    ai_review: null
  },

  // ── 6. SUBMITTED — Zero Trust Network
  {
    reference_id: 'IR-2025-006',
    title: 'Zero Trust Network Architecture (ZTNA) Implementation',
    description: 'Replace legacy VPN with Microsoft Entra Private Access (ZTNA). Deploy Defender for Cloud across all Azure subscriptions. Implement conditional access policies for all 4,200 corporate users and all Azure workloads.',
    strategic_objective: 'Eliminate implicit trust from the network perimeter model. Reduce attack surface by 70%. Enable secure remote access without VPN for global workforce. CISecurity benchmark compliance.',
    requestor_name: 'Roberto Sanchez',
    requestor_email: 'r.sanchez@mccain.com',
    requestor_role: 'CISO',
    business_unit: 'Global Technology',
    programme_domain: 'Security & Controls',
    project_timeline: '18 months',
    architecture_type: 'Greenfield',
    status: 'Submitted',
    components: ['Microsoft Entra Private Access', 'Microsoft Defender for Cloud', 'Microsoft Sentinel (SIEM)', 'Azure AD Conditional Access', 'Microsoft Intune (MDM)', 'Zscaler Internet Access'],
    hosting_model: 'Cloud (Azure)',
    deployment_target: 'Azure Global (All regions)',
    integration_points: 16,
    is_public_facing: false,
    tech_stack_notes: 'Microsoft 365 E5 Security stack, Terraform for policy-as-code',
    vendor_ids: ['microsoft'],
    new_vendors: [{ name: 'Zscaler', reason: 'Internet access proxy for zero trust web filtering — replacing Cisco Umbrella' }],
    data_classification: 'Restricted',
    data_types: ['Identity', 'Network Logs', 'Security Telemetry'],
    external_data_sharing: false,
    data_sharing_details: null,
    encryption_at_rest: true,
    encryption_in_transit: true,
    auth_methods: ['Azure AD', 'FIDO2', 'Certificate-based Auth', 'Passwordless'],
    has_mfa: true,
    has_waf: true,
    has_monitoring: true,
    is_zero_trust_aligned: true,
    compliance_requirements: ['NIST CSF', 'CIS Benchmark', 'ISO 27001', 'SOC 2'],
    related_pattern_ids: ['SC-001', 'IN-002'],
    has_legacy_dependencies: true,
    legacy_systems: 'Cisco AnyConnect VPN (3 concentrators), Cisco Umbrella, legacy RADIUS',
    external_dependencies: 'Microsoft, Zscaler',
    deviates_from_patterns: false,
    deviation_justification: null,
    risk_score: 38,
    risk_tier: 'Low',
    risk_breakdown: { dataRisk: 8, securityRisk: 12, complianceRisk: 10, integrationRisk: 8 },
    risk_flags: ['VPN cutover requires careful user communication', 'Legacy RADIUS integration may block some plant OT access'],
    risk_recommendations: ['Pilot with IT team (100 users) before broad rollout', 'Define OT exclusion scope for ZTNA', 'Test Zscaler coexistence with Entra Private Access'],
    reviewer_name: null,
    reviewer_notes: null,
    reviewed_at: null,
    submitted_at: daysAgo(1),
    approved_pattern_id: null,
    ai_review: null
  },

  // ── 7. REJECTED — Custom ML Model Serving
  {
    reference_id: 'IR-2025-007',
    title: 'Custom ML Inference Platform (Self-hosted)',
    description: 'Build a self-hosted Kubernetes-based ML inference platform running custom LLM and vision models. Replace all Azure ML managed endpoints with self-managed NVIDIA GPU clusters in on-premises data centre.',
    strategic_objective: 'Reduce Azure ML inference costs by 60% by moving to on-premises GPU servers. Achieve sub-5ms latency for real-time computer vision quality control on production lines.',
    requestor_name: 'Tom Bradley',
    requestor_email: 't.bradley@mccain.com',
    requestor_role: 'ML Engineering Lead',
    business_unit: 'Data & Analytics',
    programme_domain: 'Cloud & Platform',
    project_timeline: '6 months',
    architecture_type: 'Greenfield',
    status: 'Rejected',
    components: ['On-premises NVIDIA A100 GPUs', 'Kubernetes (self-managed)', 'Triton Inference Server', 'MinIO (object store)', 'Custom model registry'],
    hosting_model: 'On-Premises',
    deployment_target: 'Florenceville Data Centre',
    integration_points: 4,
    is_public_facing: false,
    tech_stack_notes: 'NVIDIA Triton, Kubernetes 1.28, Python, custom MLflow fork',
    vendor_ids: [],
    new_vendors: [{ name: 'NVIDIA', reason: 'GPU hardware procurement' }],
    data_classification: 'Internal',
    data_types: ['ML Model Weights', 'Inference Payloads', 'Vision Data'],
    external_data_sharing: false,
    data_sharing_details: null,
    encryption_at_rest: false,
    encryption_in_transit: true,
    auth_methods: ['API Keys'],
    has_mfa: false,
    has_waf: false,
    has_monitoring: false,
    is_zero_trust_aligned: false,
    compliance_requirements: [],
    related_pattern_ids: [],
    has_legacy_dependencies: false,
    legacy_systems: null,
    external_dependencies: 'NVIDIA support contracts',
    deviates_from_patterns: true,
    deviation_justification: 'Cost justification — author claims on-prem GPU is 60% cheaper. EA team disputes this when factoring in CapEx, power, cooling, and operational overhead.',
    risk_score: 91,
    risk_tier: 'Critical',
    risk_breakdown: { dataRisk: 12, securityRisk: 38, complianceRisk: 18, integrationRisk: 23 },
    risk_flags: ['No encryption at rest', 'No WAF or MFA', 'No monitoring defined', 'Deviates from Cloud-first strategy', 'Self-managed Kubernetes increases operational burden', 'No HA/DR plan', 'Single DC deployment — no resilience'],
    risk_recommendations: ['Strongly recommend rejection — does not meet McCain security baseline', 'If reconsidered, must meet all security control minimums', 'Total cost of ownership analysis required including CapEx, ops, DR'],
    reviewer_name: 'James Okafor',
    reviewer_notes: 'Rejected. This proposal deviates from McCain Cloud-first strategy without adequate justification. Security posture is critically deficient: no encryption at rest, no WAF, no MFA, no monitoring, and no HA/DR design. The proposed cost savings do not account for CapEx, data centre power, cooling, and operational overhead. Requestor is encouraged to resubmit using Azure ML with reserved compute for cost optimisation.',
    reviewed_at: daysAgo(30),
    submitted_at: daysAgo(38),
    approved_pattern_id: null,
    ai_review: null
  },

  // ── 8. DEFERRED — Legacy EDI Modernisation
  {
    reference_id: 'IR-2025-008',
    title: 'EDI B2B Integration Modernisation',
    description: 'Modernise legacy EDI platform (IBM Sterling B2B Integrator) serving 340 trading partners across retail and foodservice. Replace with Azure Logic Apps + APIM-based API-first integration hub supporting EDI X12, EDIFACT, and REST.',
    strategic_objective: 'Decommission IBM Sterling by Q4 2026 (end of extended support). Enable real-time PO/ASN processing vs current batch windows. Support new retail partners requiring API-first integration.',
    requestor_name: 'Jennifer Park',
    requestor_email: 'j.park@mccain.com',
    requestor_role: 'Integration Architect',
    business_unit: 'Global Technology',
    programme_domain: 'Application & Integration',
    project_timeline: '24 months',
    architecture_type: 'Replatform',
    status: 'Deferred',
    components: ['Azure Logic Apps Standard', 'Azure API Management', 'Azure Service Bus', 'Azure B2B AS2/X12 Connector', 'MuleSoft (evaluated, not selected)'],
    hosting_model: 'Cloud (Azure)',
    deployment_target: 'Azure Canada Central',
    integration_points: 22,
    is_public_facing: false,
    tech_stack_notes: 'Logic Apps Standard, BizTalk migration tooling, custom X12 validators',
    vendor_ids: ['microsoft'],
    new_vendors: [],
    data_classification: 'Confidential',
    data_types: ['B2B Trade Documents', 'Supply Chain', 'Financial', 'Logistics'],
    external_data_sharing: true,
    data_sharing_details: '340 trading partners receive EDI documents (POs, ASNs, invoices)',
    encryption_at_rest: true,
    encryption_in_transit: true,
    auth_methods: ['OAuth 2.0', 'AS2 Certificates', 'SFTP Key Exchange'],
    has_mfa: false,
    has_waf: false,
    has_monitoring: true,
    is_zero_trust_aligned: false,
    compliance_requirements: ['SOX', 'ISO 27001'],
    related_pattern_ids: ['AP-001', 'AP-002', 'AP-004'],
    has_legacy_dependencies: true,
    legacy_systems: 'IBM Sterling B2B Integrator v6.1, legacy BizTalk 2010 instances',
    external_dependencies: '340 trading partners, IBM, AS2 certificate authorities',
    deviates_from_patterns: false,
    deviation_justification: null,
    risk_score: 67,
    risk_tier: 'Medium',
    risk_breakdown: { dataRisk: 14, securityRisk: 16, complianceRisk: 18, integrationRisk: 19 },
    risk_flags: ['340 partner migration risk — partner readiness not validated', 'Parallel run with Sterling adds complexity', 'No WAF for B2B endpoints'],
    risk_recommendations: ['Conduct partner readiness survey before project kickoff', 'Define rollback SLA per partner', 'Pilot with 5 low-risk partners before broad migration'],
    reviewer_name: 'Patricia Kowalski',
    reviewer_notes: 'Deferred. Architecture is sound and well-aligned with EA patterns. Deferral reason: SAP S/4HANA migration (IR-2025-002) must complete first as it impacts EDI order management flows. Recommend re-submission in Q3 2025 after SAP go-live. Keep IBM Sterling support contract active.',
    reviewed_at: daysAgo(18),
    submitted_at: daysAgo(25),
    approved_pattern_id: null,
    ai_review: null
  },

  // ── 9. DRAFT — Data Mesh Platform
  {
    reference_id: 'IR-2025-009',
    title: 'Enterprise Data Mesh Platform',
    description: 'Implement a federated data mesh architecture with decentralised domain ownership. Each business domain (Supply Chain, Finance, Consumer, Operations) owns and publishes data products. Central Data Platform team provides infrastructure-as-a-service.',
    strategic_objective: 'Solve the central data team bottleneck — data consumers waiting 6-8 weeks for new data sets. Enable business domains to own data quality and SLAs. Foundation for AI/ML self-service analytics.',
    requestor_name: 'Aisha Patel',
    requestor_email: 'a.patel@mccain.com',
    requestor_role: 'Chief Data & AI Officer',
    business_unit: 'Data & Analytics',
    programme_domain: 'Data & Storage',
    project_timeline: '18-24 months',
    architecture_type: 'Greenfield',
    status: 'Draft',
    components: ['Azure Purview (Data Catalogue)', 'Azure Databricks Unity Catalog', 'Azure Data Factory', 'Snowflake (per-domain schemas)', 'dbt Cloud', 'OpenMetadata'],
    hosting_model: 'Cloud (Azure)',
    deployment_target: 'Azure Canada Central',
    integration_points: 8,
    is_public_facing: false,
    tech_stack_notes: 'Databricks, dbt, Terraform, Python',
    vendor_ids: ['databricks', 'snowflake'],
    new_vendors: [],
    data_classification: 'Internal',
    data_types: ['Analytics', 'Financial', 'Supply Chain', 'Consumer'],
    external_data_sharing: false,
    data_sharing_details: null,
    encryption_at_rest: true,
    encryption_in_transit: true,
    auth_methods: ['Azure AD', 'Managed Identity'],
    has_mfa: true,
    has_waf: false,
    has_monitoring: true,
    is_zero_trust_aligned: true,
    compliance_requirements: ['GDPR', 'PIPEDA'],
    related_pattern_ids: ['DT-001'],
    has_legacy_dependencies: false,
    legacy_systems: null,
    external_dependencies: 'Snowflake, Databricks',
    deviates_from_patterns: false,
    deviation_justification: null,
    risk_score: null,
    risk_tier: null,
    risk_breakdown: {},
    risk_flags: [],
    risk_recommendations: [],
    reviewer_name: null,
    reviewer_notes: null,
    reviewed_at: null,
    submitted_at: null,
    approved_pattern_id: null,
    ai_review: null
  },

  // ── 10. DRAFT — Mobile Field Operations App
  {
    reference_id: 'IR-2025-010',
    title: 'Mobile Field Operations & Quality Inspection App',
    description: 'Replace paper-based quality inspection forms and field audit processes with a mobile-first app (iOS/Android). Offline-first capability for use in potato fields and manufacturing plants with limited connectivity.',
    strategic_objective: 'Digitise 100% of quality inspection workflows by Q2 2026. Reduce audit cycle time from 5 days to same-day. Enable real-time defect tracking and corrective action management.',
    requestor_name: 'Carlos Hernandez',
    requestor_email: 'c.hernandez@mccain.com',
    requestor_role: 'Head of Quality Assurance',
    business_unit: 'Operations & Supply Chain',
    programme_domain: 'Application & Integration',
    project_timeline: '9 months',
    architecture_type: 'Greenfield',
    status: 'Draft',
    components: ['React Native (iOS/Android)', 'Azure App Service', 'Azure SQL Database', 'Azure Blob Storage', 'Power Apps (considered)', 'Azure App Configuration'],
    hosting_model: 'Cloud (Azure)',
    deployment_target: 'Azure Canada Central',
    integration_points: 4,
    is_public_facing: false,
    tech_stack_notes: 'React Native, Expo, .NET 8 API, Azure SQL, offline sync via WatermelonDB',
    vendor_ids: ['microsoft'],
    new_vendors: [],
    data_classification: 'Internal',
    data_types: ['Quality Records', 'Inspection Reports', 'Field Audit Data'],
    external_data_sharing: false,
    data_sharing_details: null,
    encryption_at_rest: true,
    encryption_in_transit: true,
    auth_methods: ['Azure AD', 'Biometric (device-level)'],
    has_mfa: true,
    has_waf: false,
    has_monitoring: false,
    is_zero_trust_aligned: false,
    compliance_requirements: ['FSMA', 'ISO 22000'],
    related_pattern_ids: ['AP-003'],
    has_legacy_dependencies: false,
    legacy_systems: null,
    external_dependencies: null,
    deviates_from_patterns: false,
    deviation_justification: null,
    risk_score: null,
    risk_tier: null,
    risk_breakdown: {},
    risk_flags: [],
    risk_recommendations: [],
    reviewer_name: null,
    reviewer_notes: null,
    reviewed_at: null,
    submitted_at: null,
    approved_pattern_id: null,
    ai_review: null
  },

  // ── 11. APPROVED — Azure Landing Zone Expansion
  {
    reference_id: 'IR-2024-047',
    title: 'Azure Landing Zone Expansion — APAC Region',
    description: 'Extend McCain Azure Landing Zone to APAC region (Australia East, Southeast Asia). Deploy Hub-and-Spoke network topology, Azure Policy initiatives, and Security Centre configuration aligned with global standards.',
    strategic_objective: 'Enable APAC markets to consume Azure services with same security guardrails as North America and Europe. Support new Australia e-commerce and digital marketing initiatives.',
    requestor_name: 'Kenji Watanabe',
    requestor_email: 'k.watanabe@mccain.com',
    requestor_role: 'Platform Engineering Lead',
    business_unit: 'Global Technology',
    programme_domain: 'Cloud & Platform',
    project_timeline: '6 months',
    architecture_type: 'Greenfield',
    status: 'Approved',
    components: ['Azure Landing Zone (CAF)', 'Azure Policy', 'Azure Security Centre', 'Hub-and-Spoke VNet', 'ExpressRoute', 'Azure Firewall Premium', 'Microsoft Defender for Cloud'],
    hosting_model: 'Cloud (Azure)',
    deployment_target: 'Azure Australia East + Southeast Asia',
    integration_points: 5,
    is_public_facing: false,
    tech_stack_notes: 'Terraform (Azure CAF Terraform modules), Azure DevOps pipelines',
    vendor_ids: ['microsoft'],
    new_vendors: [],
    data_classification: 'Internal',
    data_types: ['Infrastructure Config', 'Network Telemetry'],
    external_data_sharing: false,
    data_sharing_details: null,
    encryption_at_rest: true,
    encryption_in_transit: true,
    auth_methods: ['Azure AD', 'Managed Identity', 'PIM (Privileged Identity Management)'],
    has_mfa: true,
    has_waf: true,
    has_monitoring: true,
    is_zero_trust_aligned: true,
    compliance_requirements: ['ISO 27001', 'NIST CSF', 'Australian Privacy Act'],
    related_pattern_ids: ['CP-001', 'SC-001'],
    has_legacy_dependencies: false,
    legacy_systems: null,
    external_dependencies: 'Microsoft, Telstra (ExpressRoute)',
    deviates_from_patterns: false,
    deviation_justification: null,
    risk_score: 28,
    risk_tier: 'Low',
    risk_breakdown: { dataRisk: 4, securityRisk: 10, complianceRisk: 8, integrationRisk: 6 },
    risk_flags: ['Australian Privacy Act requires data residency in AU — confirmed Azure AU East'],
    risk_recommendations: ['Enable Azure Policy for data residency enforcement', 'Configure Defender for Cloud at management group level'],
    reviewer_name: 'James Okafor',
    reviewer_notes: 'Approved. Excellent alignment with CAF and EA security patterns. Low risk. Expedited approval granted.',
    reviewed_at: daysAgo(60),
    submitted_at: daysAgo(65),
    approved_pattern_id: 'CP-001',
    ai_review: null
  },

  // ── 12. UNDER REVIEW — Supplier Portal
  {
    reference_id: 'IR-2025-011',
    title: 'Global Supplier Self-Service Portal',
    description: 'B2B portal for McCain\'s 2,400+ agricultural and packaging suppliers. Enable self-service PO acknowledgement, invoice submission, quality certificate upload, and sustainability reporting. Replace email and manual processes.',
    strategic_objective: 'Reduce supplier onboarding time from 3 weeks to 2 days. Enable real-time PO visibility for suppliers. Automate invoice processing (target 85% touchless). Support ESG supplier data collection.',
    requestor_name: 'Fatima Al-Hassan',
    requestor_email: 'f.alhassan@mccain.com',
    requestor_role: 'VP Procurement Technology',
    business_unit: 'Operations & Supply Chain',
    programme_domain: 'Application & Integration',
    project_timeline: '12 months',
    architecture_type: 'Greenfield',
    status: 'Under Review',
    components: ['Azure App Service', 'Azure API Management', 'Azure B2C (External Identity)', 'Azure SQL Database', 'Azure Blob Storage', 'SAP Integration Suite'],
    hosting_model: 'Cloud (Azure)',
    deployment_target: 'Azure Canada Central + Europe West',
    integration_points: 7,
    is_public_facing: true,
    tech_stack_notes: 'React, .NET 8, Azure B2C for 2,400+ external identities, SAP IDoc integration',
    vendor_ids: ['microsoft', 'sap'],
    new_vendors: [],
    data_classification: 'Confidential',
    data_types: ['B2B Trade Documents', 'Financial', 'Supplier Identity', 'ESG Data'],
    external_data_sharing: true,
    data_sharing_details: '2,400 suppliers access their own PO and invoice data via the portal',
    encryption_at_rest: true,
    encryption_in_transit: true,
    auth_methods: ['Azure B2C', 'MFA', 'Magic Link (email)'],
    has_mfa: true,
    has_waf: true,
    has_monitoring: true,
    is_zero_trust_aligned: false,
    compliance_requirements: ['GDPR', 'PIPEDA', 'SOX'],
    related_pattern_ids: ['AP-001', 'AP-003', 'SC-001'],
    has_legacy_dependencies: false,
    legacy_systems: null,
    external_dependencies: 'SAP S/4HANA, 2,400 supplier email systems',
    deviates_from_patterns: false,
    deviation_justification: null,
    risk_score: 55,
    risk_tier: 'Medium',
    risk_breakdown: { dataRisk: 16, securityRisk: 16, complianceRisk: 14, integrationRisk: 9 },
    risk_flags: ['2,400 external B2C identities require robust identity lifecycle management', 'SOX implications for invoice and PO data'],
    risk_recommendations: ['Implement B2C identity governance (account lockout, deprovisioning)', 'SOX audit trail on invoice approval workflows', 'Penetration test on B2B portal before go-live'],
    reviewer_name: null,
    reviewer_notes: null,
    reviewed_at: null,
    submitted_at: daysAgo(8),
    approved_pattern_id: null,
    ai_review: null
  }
];

// ─── Comments data ─────────────────────────────────────────────────────────────
const commentsByRef = {
  'IR-2025-001': [
    { author: 'James Okafor', role: 'EA Lead', comment: 'Strong architecture proposal. Please confirm which consent management platform you\'re using — OneTrust or TrustArc? This will affect the GDPR sign-off timeline.', created_at: daysAgo(25) },
    { author: 'Sarah Mitchell', role: 'Requestor', comment: 'We\'ve selected OneTrust — contract is being finalised. DPO engagement is scheduled for next week.', created_at: daysAgo(24) },
    { author: 'Legal & Privacy', role: 'Reviewer', comment: 'OneTrust is approved on our vendor list. Cross-border data transfer to Adobe requires Standard Contractual Clauses (SCCs) — please ensure these are in the DPA with Adobe.', created_at: daysAgo(22) },
    { author: 'James Okafor', role: 'EA Lead', comment: 'Approved. All conditions met. Proceed to detailed design. Next EA checkpoint at 60% build milestone.', created_at: daysAgo(14) }
  ],
  'IR-2025-002': [
    { author: 'Patricia Kowalski', role: 'Senior EA', comment: 'SOX control matrix needs to be submitted before we can complete the review. Has Finance been engaged?', created_at: daysAgo(18) },
    { author: 'David Chen', role: 'Requestor', comment: 'Finance Director meeting scheduled for next Tuesday. KPMG has been briefed on the S/4HANA SOX framework.', created_at: daysAgo(17) },
    { author: 'Security Team', role: 'Reviewer', comment: 'WAF gap for BTP endpoints is a blocker. Please add Azure Application Gateway + WAF v2 to the architecture. Cost estimate needed.', created_at: daysAgo(12) },
    { author: 'David Chen', role: 'Requestor', comment: 'Azure App Gateway + WAF v2 added to the design. Estimated cost ~$850/month. Updated architecture diagram attached.', created_at: daysAgo(10) },
    { author: 'Patricia Kowalski', role: 'Senior EA', comment: 'Approved with conditions as noted. Ensure Accenture vendor intake is completed before work starts — procurement requires this.', created_at: daysAgo(7) }
  ],
  'IR-2025-003': [
    { author: 'James Okafor', role: 'EA Lead', comment: 'IEC 62443 Zone/Conduit model needs to be reflected in the architecture diagram. Can you provide a network segmentation diagram showing the OT DMZ?', created_at: daysAgo(8) },
    { author: 'Marcus Weber', role: 'Requestor', comment: 'OT DMZ network diagram will be ready by end of week. We\'re working with the plant network team on the zone classification.', created_at: daysAgo(7) }
  ],
  'IR-2025-007': [
    { author: 'James Okafor', role: 'EA Lead', comment: 'Several critical security gaps identified. No encryption at rest, no WAF, no MFA, no monitoring. This does not meet McCain security baseline. Please review security requirements framework before resubmission.', created_at: daysAgo(35) },
    { author: 'Tom Bradley', role: 'Requestor', comment: 'The cost savings justify the approach. On-prem GPU is significantly cheaper than Azure ML.', created_at: daysAgo(34) },
    { author: 'Finance', role: 'Reviewer', comment: 'Total cost of ownership analysis needed. CapEx for GPU hardware, data centre space, power, cooling, and operational overhead not included in cost comparison.', created_at: daysAgo(33) },
    { author: 'James Okafor', role: 'EA Lead', comment: 'Rejected for the reasons noted. Recommend resubmitting using Azure ML Reserved Compute which provides significant cost savings while maintaining security and compliance.', created_at: daysAgo(30) }
  ],
  'IR-2025-008': [
    { author: 'Patricia Kowalski', role: 'Senior EA', comment: 'Architecture is solid. Deferring pending SAP S/4HANA go-live — the order management flows through SAP and must be stable before EDI migration begins.', created_at: daysAgo(18) },
    { author: 'Jennifer Park', role: 'Requestor', comment: 'Understood. We\'ll keep IBM Sterling support active and plan re-submission for Q3 2025. Can we start the partner readiness assessment in the meantime?', created_at: daysAgo(17) },
    { author: 'Patricia Kowalski', role: 'Senior EA', comment: 'Yes, proceed with partner readiness assessment — this is preparatory work and doesn\'t require architecture approval. Good planning ahead.', created_at: daysAgo(16) }
  ],
  'IR-2025-011': [
    { author: 'James Okafor', role: 'EA Lead', comment: 'Azure B2C for 2,400 external identities is the right call. Please confirm SOX audit trail requirements with Finance — invoice approval workflows need to be in scope.', created_at: daysAgo(6) },
    { author: 'Fatima Al-Hassan', role: 'Requestor', comment: 'Finance have confirmed the SOX audit trail requirements. We\'re adding a full audit log for all PO acknowledgements and invoice approvals with 7-year retention.', created_at: daysAgo(5) }
  ]
};

// ─── History data ──────────────────────────────────────────────────────────────
const historyByRef = {
  'IR-2025-001': [
    { action: 'Submitted', from_status: 'Draft', to_status: 'Submitted', actor: 'Sarah Mitchell', notes: 'Initial submission for CDP architecture review.', created_at: daysAgo(28) },
    { action: 'Status changed to Under Review', from_status: 'Submitted', to_status: 'Under Review', actor: 'James Okafor', notes: 'Assigned to EA Lead for full review.', created_at: daysAgo(26) },
    { action: 'Approved', from_status: 'Under Review', to_status: 'Approved', actor: 'James Okafor', notes: 'Approved subject to OneTrust deployment and DPO sign-off at 60% build.', created_at: daysAgo(14) }
  ],
  'IR-2025-002': [
    { action: 'Submitted', from_status: 'Draft', to_status: 'Submitted', actor: 'David Chen', notes: null, created_at: daysAgo(21) },
    { action: 'Status changed to Under Review', from_status: 'Submitted', to_status: 'Under Review', actor: 'Patricia Kowalski', notes: 'High complexity — assigned to Senior EA.', created_at: daysAgo(19) },
    { action: 'Approved with Conditions', from_status: 'Under Review', to_status: 'Approved with Conditions', actor: 'Patricia Kowalski', notes: 'Conditions: WAF on BTP, SOX sign-off, Accenture vendor intake.', created_at: daysAgo(7) }
  ],
  'IR-2025-003': [
    { action: 'Submitted', from_status: 'Draft', to_status: 'Submitted', actor: 'Marcus Weber', notes: null, created_at: daysAgo(12) },
    { action: 'Status changed to Under Review', from_status: 'Submitted', to_status: 'Under Review', actor: 'James Okafor', notes: 'OT/IoT architecture — requires specialist review.', created_at: daysAgo(10) }
  ],
  'IR-2025-004': [
    { action: 'Submitted', from_status: 'Draft', to_status: 'Submitted', actor: 'Aisha Patel', notes: null, created_at: daysAgo(6) },
    { action: 'Status changed to Under Review', from_status: 'Submitted', to_status: 'Under Review', actor: 'James Okafor', notes: 'AI/ML platform — standard review.', created_at: daysAgo(5) }
  ],
  'IR-2025-005': [
    { action: 'Submitted', from_status: 'Draft', to_status: 'Submitted', actor: 'Claire Fontaine', notes: 'PCI DSS in scope — flagged for priority review.', created_at: daysAgo(3) }
  ],
  'IR-2025-006': [
    { action: 'Submitted', from_status: 'Draft', to_status: 'Submitted', actor: 'Roberto Sanchez', notes: 'CISO-sponsored initiative — requesting expedited review.', created_at: daysAgo(1) }
  ],
  'IR-2025-007': [
    { action: 'Submitted', from_status: 'Draft', to_status: 'Submitted', actor: 'Tom Bradley', notes: null, created_at: daysAgo(38) },
    { action: 'Status changed to Under Review', from_status: 'Submitted', to_status: 'Under Review', actor: 'James Okafor', notes: null, created_at: daysAgo(36) },
    { action: 'Rejected', from_status: 'Under Review', to_status: 'Rejected', actor: 'James Okafor', notes: 'Critical security gaps. Does not meet McCain security baseline. Cloud-first strategy deviation not justified.', created_at: daysAgo(30) }
  ],
  'IR-2025-008': [
    { action: 'Submitted', from_status: 'Draft', to_status: 'Submitted', actor: 'Jennifer Park', notes: null, created_at: daysAgo(25) },
    { action: 'Status changed to Under Review', from_status: 'Submitted', to_status: 'Under Review', actor: 'Patricia Kowalski', notes: null, created_at: daysAgo(23) },
    { action: 'Deferred', from_status: 'Under Review', to_status: 'Deferred', actor: 'Patricia Kowalski', notes: 'Deferred pending SAP S/4HANA migration. Recommend re-submission Q3 2025.', created_at: daysAgo(18) }
  ],
  'IR-2024-047': [
    { action: 'Submitted', from_status: 'Draft', to_status: 'Submitted', actor: 'Kenji Watanabe', notes: null, created_at: daysAgo(65) },
    { action: 'Status changed to Under Review', from_status: 'Submitted', to_status: 'Under Review', actor: 'James Okafor', notes: null, created_at: daysAgo(63) },
    { action: 'Approved', from_status: 'Under Review', to_status: 'Approved', actor: 'James Okafor', notes: 'Expedited approval — excellent CAF alignment, low risk.', created_at: daysAgo(60) }
  ],
  'IR-2025-011': [
    { action: 'Submitted', from_status: 'Draft', to_status: 'Submitted', actor: 'Fatima Al-Hassan', notes: null, created_at: daysAgo(9) },
    { action: 'Status changed to Under Review', from_status: 'Submitted', to_status: 'Under Review', actor: 'James Okafor', notes: null, created_at: daysAgo(8) }
  ]
};

// ─── Solution designs ──────────────────────────────────────────────────────────
const solutions = [
  {
    reference_id: 'SD-2025-001',
    title: 'Customer Data Platform — Full Architecture',
    description: 'Complete Solution Design for the Global CDP. Composes API Gateway, Event-Driven Integration, and Data Lake patterns into a unified customer intelligence platform.',
    business_context: 'Enables McCain to build a single unified customer profile across 50+ markets. Foundation for personalised marketing, loyalty programmes, and consumer analytics.',
    pattern_ids: ['AP-001', 'AP-004', 'DT-001'],
    vendor_ids: [],
    deployment_regions: ['Canada Central', 'East US'],
    estimated_cost_band: '$500K–$1M / year',
    complexity: 'High',
    owner: 'Sarah Mitchell',
    business_unit: 'Digital & Consumer',
    status: 'Approved',
    intake_reference: 'IR-2025-001'
  },
  {
    reference_id: 'SD-2025-002',
    title: 'Azure Landing Zone — APAC Expansion',
    description: 'Infrastructure solution design for extending the Azure Landing Zone to Australia East and Southeast Asia. Hub-and-spoke networking, security baseline, and governance policies.',
    business_context: 'Enables APAC markets (Australia, NZ, Southeast Asia) to use Azure services with the same security and compliance posture as North America. Required for AU e-commerce launch.',
    pattern_ids: ['CP-001', 'SC-001'],
    vendor_ids: [],
    deployment_regions: ['Australia East', 'Southeast Asia'],
    estimated_cost_band: '$100K–$250K / year',
    complexity: 'Medium',
    owner: 'Kenji Watanabe',
    business_unit: 'Global Technology',
    status: 'Approved',
    intake_reference: 'IR-2024-047'
  },
  {
    reference_id: 'SD-2025-003',
    title: 'Enterprise MLOps Platform — Architecture Blueprint',
    description: 'Solution Design for the centralised MLOps platform using Azure ML and Databricks. Includes feature store, model registry, CI/CD for models, and A/B testing infrastructure.',
    business_context: 'Enables all data science teams across McCain to deploy production ML models with consistent tooling, governance, and monitoring. Foundation for AI-driven business capabilities.',
    pattern_ids: ['DT-001', 'CP-001'],
    vendor_ids: [],
    deployment_regions: ['Canada Central'],
    estimated_cost_band: '$250K–$500K / year',
    complexity: 'High',
    owner: 'Aisha Patel',
    business_unit: 'Data & Analytics',
    status: 'In Review',
    intake_reference: 'IR-2025-004'
  },
  {
    reference_id: 'SD-2025-004',
    title: 'Supplier Portal — Architecture Design',
    description: 'Draft Solution Design for the Global Supplier Self-Service Portal. Outlines Azure B2C identity, API Management gateway, SAP integration layer, and audit trail for SOX compliance.',
    business_context: 'Serves 2,400+ McCain suppliers with self-service capabilities for POs, invoices, and quality certificates. Reduces procurement administration by 40%.',
    pattern_ids: ['AP-001', 'AP-003', 'SC-001'],
    vendor_ids: [],
    deployment_regions: ['Canada Central', 'Europe West'],
    estimated_cost_band: '$150K–$300K / year',
    complexity: 'Medium',
    owner: 'Fatima Al-Hassan',
    business_unit: 'Operations & Supply Chain',
    status: 'Draft',
    intake_reference: 'IR-2025-011'
  }
];

// ─── Main seed function ────────────────────────────────────────────────────────
async function seed() {
  console.log('🌱 Starting McCain EA Platform demo data seed...\n');

  // Clear existing data
  console.log('🗑  Clearing existing intake, solution, and related data...');
  await pool.query('DELETE FROM intake_history');
  await pool.query('DELETE FROM intake_comments');
  await pool.query('DELETE FROM solution_reviews');
  await pool.query('DELETE FROM solution_designs');
  await pool.query('DELETE FROM intake_requests');
  console.log('   ✓ Cleared\n');

  const refToId = {};

  // Insert intakes
  console.log('📋 Inserting intake requests...');
  for (const ir of intakes) {
    const r = await pool.query(`
      INSERT INTO intake_requests (
        reference_id, title, description, strategic_objective,
        requestor_name, requestor_email, requestor_role, business_unit, programme_domain,
        project_timeline, architecture_type, status,
        components, hosting_model, deployment_target, integration_points, is_public_facing, tech_stack_notes,
        vendor_ids, new_vendors,
        data_classification, data_types, external_data_sharing, data_sharing_details,
        encryption_at_rest, encryption_in_transit, auth_methods, has_mfa, has_waf, has_monitoring,
        is_zero_trust_aligned, compliance_requirements,
        related_pattern_ids, has_legacy_dependencies, legacy_systems, external_dependencies,
        deviates_from_patterns, deviation_justification,
        risk_score, risk_tier, risk_breakdown, risk_flags, risk_recommendations,
        reviewer_name, reviewer_notes, reviewed_at, submitted_at, approved_pattern_id,
        ai_review, created_at, updated_at
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,
        $21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35,$36,$37,$38,
        $39,$40,$41,$42,$43,$44,$45,$46,$47,$48,$49,$50,$51
      ) RETURNING id`,
      [
        ir.reference_id, ir.title, ir.description, ir.strategic_objective,
        ir.requestor_name, ir.requestor_email, ir.requestor_role, ir.business_unit, ir.programme_domain,
        ir.project_timeline, ir.architecture_type, ir.status,
        j(ir.components), ir.hosting_model, ir.deployment_target, ir.integration_points,
        ir.is_public_facing ? 1 : 0, ir.tech_stack_notes,
        j(ir.vendor_ids), j(ir.new_vendors),
        ir.data_classification, j(ir.data_types), ir.external_data_sharing ? 1 : 0, ir.data_sharing_details,
        ir.encryption_at_rest ? 1 : 0, ir.encryption_in_transit ? 1 : 0,
        j(ir.auth_methods), ir.has_mfa ? 1 : 0, ir.has_waf ? 1 : 0, ir.has_monitoring ? 1 : 0,
        ir.is_zero_trust_aligned ? 1 : 0, j(ir.compliance_requirements),
        j(ir.related_pattern_ids), ir.has_legacy_dependencies ? 1 : 0,
        ir.legacy_systems, ir.external_dependencies,
        ir.deviates_from_patterns ? 1 : 0, ir.deviation_justification,
        ir.risk_score, ir.risk_tier, j(ir.risk_breakdown), j(ir.risk_flags), j(ir.risk_recommendations),
        ir.reviewer_name, ir.reviewer_notes, ir.reviewed_at, ir.submitted_at, ir.approved_pattern_id,
        ir.ai_review,
        daysAgo(Math.floor(Math.random() * 5) + (ir.submitted_at ? 5 : 1)),
        new Date().toISOString()
      ]
    );
    const intakeId = r.rows[0].id;
    refToId[ir.reference_id] = intakeId;
    console.log(`   ✓ ${ir.reference_id} — ${ir.title} [${ir.status}] (id=${intakeId})`);
  }

  // Insert comments
  console.log('\n💬 Inserting comments...');
  for (const [ref, comments] of Object.entries(commentsByRef)) {
    const intakeId = refToId[ref];
    if (!intakeId) continue;
    for (const c of comments) {
      await pool.query(
        'INSERT INTO intake_comments (intake_id, author, role, comment, created_at) VALUES ($1,$2,$3,$4,$5)',
        [intakeId, c.author, c.role, c.comment, c.created_at]
      );
    }
    console.log(`   ✓ ${ref}: ${comments.length} comment(s)`);
  }

  // Insert history
  console.log('\n📜 Inserting audit history...');
  for (const [ref, history] of Object.entries(historyByRef)) {
    const intakeId = refToId[ref];
    if (!intakeId) continue;
    for (const h of history) {
      await pool.query(
        'INSERT INTO intake_history (intake_id, action, from_status, to_status, actor, notes, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7)',
        [intakeId, h.action, h.from_status, h.to_status, h.actor, h.notes, h.created_at]
      );
    }
    console.log(`   ✓ ${ref}: ${history.length} history event(s)`);
  }

  // Insert solution designs
  console.log('\n🏗  Inserting solution designs...');
  for (const sd of solutions) {
    const intakeId = refToId[sd.intake_reference] || null;
    await pool.query(`
      INSERT INTO solution_designs (
        reference_id, title, description, business_context,
        pattern_ids, vendor_ids, deployment_regions,
        estimated_cost_band, complexity, owner, business_unit, status,
        intake_id, intake_reference, created_at, updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
      [
        sd.reference_id, sd.title, sd.description, sd.business_context,
        j(sd.pattern_ids), j(sd.vendor_ids), j(sd.deployment_regions),
        sd.estimated_cost_band, sd.complexity, sd.owner, sd.business_unit, sd.status,
        intakeId, sd.intake_reference,
        new Date().toISOString(), new Date().toISOString()
      ]
    );
    console.log(`   ✓ ${sd.reference_id} — ${sd.title} [${sd.status}]`);
  }

  console.log('\n✅ Demo seed complete!');
  console.log('\n📊 Summary:');
  console.log(`   Intake Requests: ${intakes.length} (across all workflow stages)`);
  console.log(`   Solution Designs: ${solutions.length}`);
  console.log(`   Comments: ${Object.values(commentsByRef).flat().length}`);
  console.log(`   History Events: ${Object.values(historyByRef).flat().length}`);
  console.log('\n   Stages covered: Draft, Submitted, Under Review, Approved,');
  console.log('   Approved with Conditions, Rejected, Deferred\n');

  await pool.end();
}

seed().catch(err => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
