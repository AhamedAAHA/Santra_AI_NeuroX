import { describe, expect, it } from "vitest";
import type { CrmExportPayload } from "@/lib/gtm/crm-payload";
import {
  buildReadableBrief,
  detectWebhookDestination,
  formatAlertWebhookPayload,
  formatAutomationWebhookPayload,
} from "@/lib/webhooks/format";
import type { ExecutiveIntelligenceReport } from "@/types/intelligence";

const report: ExecutiveIntelligenceReport = {
  id: "rep-1",
  monitorRequirement: "Watch ApexAnalytics pricing",
  generatedAt: new Date().toISOString(),
  provider: "openai",
  verdict: "ApexAnalytics Pro rose from $99 to $129",
  riskScore: 77,
  confidence: 61,
  situation: "Competitor mid-market pricing jumped 30% with bundled CRM export messaging.",
  impact: "Renewal pressure on mid-market accounts comparing Apex.",
  actionPlan: ["Update battlecard", "Brief AE team on pricing defense"],
  watchItems: ["Track Enterprise tier"],
  evidenceSources: [
    {
      id: "source-1",
      title: "Apex pricing page",
      publisher: "apexanalytics.io",
      freshness: "just now",
      reliability: 88,
      claimSupported: "Pro $129",
      url: "https://apexanalytics.io/pricing",
    },
  ],
  verifiedClaims: [
    {
      id: "c1",
      claim: "Pro rose to $129",
      status: "evidence-backed",
      confidence: 88,
      sourceIds: ["source-1"],
      sourceRecords: [],
    },
    {
      id: "c2",
      claim: "Enterprise also moved",
      status: "partial",
      confidence: 54,
      sourceIds: [],
      sourceRecords: [],
    },
  ],
  observedFacts: ["Pro $99 → $129"],
  forecasts: [],
  hallucinationRisk: "low",
};

const crm: CrmExportPayload = {
  source: "santra-ai",
  event: "gtm_intelligence_export",
  exportedAt: new Date().toISOString(),
  account: { companyName: "Meridian Health" },
  intelligence: {
    requirement: report.monitorRequirement,
    verdict: report.verdict,
    riskScore: report.riskScore,
    confidence: report.confidence,
    situation: report.situation,
    impact: report.impact,
    actionPlan: report.actionPlan,
    evidenceUrls: ["https://apexanalytics.io/pricing"],
  },
};

describe("webhook destination formatting", () => {
  it("detects Slack, Discord, and generic hosts", () => {
    expect(detectWebhookDestination("https://hooks.slack.com/services/T/B/x")).toBe("slack");
    expect(detectWebhookDestination("https://discord.com/api/webhooks/1/token")).toBe("discord");
    expect(detectWebhookDestination("https://webhook.site/abc")).toBe("generic");
    expect(detectWebhookDestination("https://hooks.zapier.com/hooks/catch/1/2")).toBe("generic");
  });

  it("builds a human-readable brief with scores and actions", () => {
    const brief = buildReadableBrief({ report, eventLabel: "alert" });
    expect(brief.headline).toContain("risk 77");
    expect(brief.headline).toContain("confidence 61");
    expect(brief.summary).toContain("Next actions:");
    expect(brief.summary).toContain("Update battlecard");
    expect(brief.markdown).toContain("**Next actions**");
    expect(brief.detail).toContain("mid-market pricing");
    expect(brief.claimStats).toEqual({ backed: 1, partial: 1, unsupported: 0 });
    expect(brief.impact).toContain("Renewal pressure");
  });

  it("formats Slack alerts with battlecard blocks and claim fields", () => {
    const { destination, body } = formatAlertWebhookPayload(
      "https://hooks.slack.com/services/T/B/x",
      report,
    );
    expect(destination).toBe("slack");
    expect(body).toMatchObject({
      text: expect.stringContaining("SANTRA alert"),
      blocks: expect.any(Array),
    });
    const serialized = JSON.stringify(body);
    expect(serialized).toContain("Battlecard");
    expect(serialized).toContain("backed");
  });

  it("formats Discord alerts with embeds", () => {
    const { destination, body } = formatAlertWebhookPayload(
      "https://discord.com/api/webhooks/1/token",
      report,
    );
    expect(destination).toBe("discord");
    expect(body).toMatchObject({
      content: expect.stringContaining("SANTRA alert"),
      embeds: [expect.objectContaining({ title: expect.stringContaining("ApexAnalytics") })],
    });
  });

  it("adds summary + markdown for webhook.site style destinations", () => {
    const { destination, body } = formatAlertWebhookPayload("https://webhook.site/abc-123", report);
    expect(destination).toBe("generic");
    expect(body).toMatchObject({
      text: expect.any(String),
      summary: expect.stringContaining("Next actions:"),
      markdown: expect.stringContaining("**"),
      destination: "generic",
      santra: expect.objectContaining({ riskScore: 77, verdict: report.verdict }),
    });
  });

  it("keeps CRM structure on generic automation while adding readable fields", () => {
    const { destination, body } = formatAutomationWebhookPayload({
      webhookUrl: "https://webhook.site/abc-123",
      event: "crm_export",
      crm,
      monitorId: "mon-1",
      automation: {
        source: "santra-ai",
        action: "crm_export",
        description: "Structured GTM intel exported from SANTRA",
      },
    });

    expect(destination).toBe("generic");
    expect(body).toMatchObject({
      source: "santra-ai",
      event: "crm_export",
      monitorId: "mon-1",
      summary: expect.stringContaining("Meridian Health"),
      account: { companyName: "Meridian Health" },
      automation: expect.objectContaining({ action: "crm_export" }),
    });
  });
});
