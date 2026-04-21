#!/usr/bin/env node

/**
 * CLI runner for the triage pipeline.
 *
 * Usage:
 *   node run-triage.js <path-to-intake-request.json>
 *   node run-triage.js --example     # runs with a built-in sample request
 *   node run-triage.js --stage completeness <path>   # run a single stage
 *
 * Requires ANTHROPIC_API_KEY environment variable.
 */

import { runTriagePipeline } from "./triage-pipeline.js";
import fs from "fs";

const EXAMPLE_REQUEST = {
  requestType: "new_application",
  title: "SAP S/4HANA Integration Gateway for Order Management",
  description:
    "We need to build a centralized integration gateway that connects our new SAP S/4HANA ERP system with existing order management, logistics (TMS), and CRM (Salesforce) systems. The gateway will handle real-time order creation, inventory sync, and shipment status updates. Expected 500+ API calls/minute at peak. Must support both REST and IDoc/RFC protocols for SAP connectivity.",
  businessJustification: {
    problemStatement:
      "Current point-to-point integrations between SAP ECC and downstream systems are brittle, undocumented, and cannot support the transaction volumes required by the S/4HANA migration. Each integration failure causes order processing delays affecting customer SLAs.",
    expectedOutcome:
      "Centralized, resilient integration layer reducing integration failures by 80% and supporting 3x current transaction volumes for the S/4HANA go-live.",
    sponsorName: "Sarah Chen, VP Digital Transformation",
    programme: "SAP S/4HANA Migration Programme",
    budgetCode: "DT-2026-SAP",
  },
  requestor: {
    name: "James Rodriguez",
    email: "james.rodriguez@mccain.com",
    department: "Enterprise Integration",
    role: "Integration Architect",
  },
  priority: "high",
  targetDomain: "application_integration",
  technicalContext: {
    currentState:
      "Existing SAP ECC with 12 point-to-point BAPI/RFC integrations to TMS, WMS, and Salesforce. No centralized API gateway. Using BizTalk for some EDI flows.",
    proposedTechnologies: [
      "Azure API Management",
      "Azure Event Hubs",
      "SAP Integration Suite",
      "Azure Functions",
    ],
    integrationPoints: [
      { system: "SAP S/4HANA", direction: "bidirectional", protocol: "OData/RFC", dataClassification: "confidential" },
      { system: "Salesforce CRM", direction: "outbound", protocol: "REST", dataClassification: "confidential" },
      { system: "TMS (BluJay)", direction: "bidirectional", protocol: "REST/SFTP", dataClassification: "internal" },
      { system: "WMS (Manhattan)", direction: "outbound", protocol: "REST", dataClassification: "internal" },
      { system: "EDI Partners", direction: "bidirectional", protocol: "AS2/SFTP", dataClassification: "confidential" },
    ],
    dataRequirements: {
      dataClassification: "confidential",
      piiInvolved: true,
      dataResidency: "Canada / North America",
      retentionPeriod: "7 years (SOX)",
      volumeEstimate: "500K transactions/day",
    },
    hostingPreference: "azure_cloud",
    scalabilityRequirements: {
      expectedUsers: 200,
      peakTransactionsPerSecond: 50,
      availabilitySLA: "99.9",
      rpoMinutes: 15,
      rtoMinutes: 60,
    },
    environmentsNeeded: ["dev", "test", "uat", "production", "dr"],
  },
  complianceContext: {
    regulatoryRequirements: ["SOX", "PIPEDA"],
    internalPolicies: ["Data Classification Policy", "API Security Standard"],
    securityTier: "elevated",
  },
  timeline: {
    requestedStartDate: "2026-05-01",
    requestedGoLiveDate: "2026-09-15",
    hardDeadline: true,
    deadlineReason: "SAP S/4HANA go-live date is fixed at 2026-10-01",
  },
};

// --- Main ---

async function main() {
  const args = process.argv.slice(2);

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("Error: ANTHROPIC_API_KEY environment variable is required.");
    console.error("  export ANTHROPIC_API_KEY=sk-ant-...");
    process.exit(1);
  }

  let request;

  if (args.includes("--example")) {
    console.log("Using built-in example request: SAP S/4HANA Integration Gateway\n");
    request = EXAMPLE_REQUEST;
  } else if (args[0] && !args[0].startsWith("--")) {
    const filePath = args[0];
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      process.exit(1);
    }
    request = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } else {
    console.log("Usage:");
    console.log("  node run-triage.js <intake-request.json>");
    console.log("  node run-triage.js --example");
    console.log("");
    console.log("Requires: export ANTHROPIC_API_KEY=sk-ant-...");
    process.exit(0);
  }

  console.log("╔══════════════════════════════════════════════════════╗");
  console.log("║     Architecture Intake Triage Pipeline             ║");
  console.log("║     LangChain + Claude — 7-Stage Sequential Chain   ║");
  console.log("╚══════════════════════════════════════════════════════╝\n");
  console.log(`Request: ${request.title}`);
  console.log(`Type: ${request.requestType} | Priority: ${request.priority} | Domain: ${request.targetDomain}\n`);
  console.log("─".repeat(60));

  const result = await runTriagePipeline(request, {
    onStageStart: (name) => {
      process.stdout.write(`⏳ ${name}...`);
    },
    onStageComplete: (name, stageResult) => {
      if (stageResult?.error) {
        console.log(` ❌ Error: ${stageResult.error}`);
      } else {
        console.log(` ✅`);
      }
    },
  });

  console.log("─".repeat(60));
  console.log(`\nPipeline Status: ${result.status}`);
  console.log(`Confidence Score: ${result.confidenceScore}`);
  console.log(`\nTimings:`);
  if (result.timings) {
    for (const [stage, ms] of Object.entries(result.timings)) {
      console.log(`  ${stage}: ${(ms / 1000).toFixed(1)}s`);
    }
  }

  // Print key outputs
  if (result.status === "needs_info") {
    console.log("\n⚠️  HALTED — Request needs more information:");
    for (const field of result.missing_fields || []) {
      console.log(`  [${field.severity}] ${field.field}: ${field.reason}`);
    }
  } else {
    if (result.routing_result) {
      console.log(`\n🛤️  Routing: ${result.routing_result.routing_lane} lane`);
      console.log(`   Reviews: ${result.routing_result.required_reviews?.join(", ") || "none"}`);
      console.log(`   SLA: ${result.routing_result.estimated_sla_hours}h`);
    }

    if (result.risk_scoring_result?.risk_scores) {
      const rs = result.risk_scoring_result.risk_scores;
      console.log(`\n📊 Risk Scores (overall: ${rs.overall}, weighted: ${rs.weighted_total}/10):`);
      console.log(`   Security: ${rs.security} | Compliance: ${rs.compliance} | Architectural: ${rs.architectural}`);
      console.log(`   Operational: ${rs.operational} | Vendor: ${rs.vendor}`);
    }

    if (result.summary_result?.recommendations) {
      console.log(`\n📋 Recommendations:`);
      for (const rec of result.summary_result.recommendations) {
        const icon = { action: "→", warning: "⚠", suggestion: "💡", blocker: "🛑" }[rec.type] || "•";
        console.log(`   ${icon} [${rec.type}] ${rec.message}`);
      }
    }
  }

  // Write full results to file
  const outputPath = `triage-result-${Date.now()}.json`;
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
  console.log(`\n📁 Full results written to: ${outputPath}`);
}

main().catch((err) => {
  console.error("Pipeline failed:", err);
  process.exit(1);
});
