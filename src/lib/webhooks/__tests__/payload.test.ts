import { describe, expect, it } from "vitest";
import { buildSantraWebhookEnvelope } from "@/lib/webhooks/payload";
import { describeWebhookDestination, WEBHOOK_DESTINATION_SUGGESTIONS } from "@/lib/webhooks/destinations";
import { formatAlertWebhookPayload } from "@/lib/webhooks/format";
import type { ExecutiveIntelligenceReport } from "@/types/intelligence";

const report: ExecutiveIntelligenceReport = {
  id: "rep-full",
  monitorRequirement: "Watch ApexAnalytics pricing",
  generatedAt: "2026-07-30T00:00:00.000Z",
  provider: "bright-data",
  verdict: "ApexAnalytics Pro rose from $99 to $129",
  riskScore: 77,
  confidence: 81,
  importanceScore: 72,
  importanceBand: "medium",
  situation: "Competitor mid-market pricing jumped 30%.",
  impact: "Renewal pressure on mid-market accounts.",
  actionPlan: ["Update battlecard"],
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
      excerpt: "Pro plan $129 / mo",
    },
  ],
  verifiedClaims: [
    {
      id: "c1",
      claim: "Pro rose to $129",
      status: "evidence-backed",
      confidence: 88,
      sourceIds: ["source-1"],
      sourceRecords: [
        {
          sourceId: "source-1",
          url: "https://apexanalytics.io/pricing",
          excerpt: "Pro $129",
          collectedAt: "2026-07-30T00:00:00.000Z",
          verificationStatus: "evidence-backed",
        },
      ],
    },
  ],
  observedFacts: ["Pro $99 → $129"],
  forecasts: [],
  hallucinationRisk: "low",
  detectedChanges: [
    {
      id: "ch1",
      field: "Pro plan",
      oldValue: "$99",
      newValue: "$129",
      sourceUrl: "https://apexanalytics.io/pricing",
      detectedAt: "2026-07-30T00:00:00.000Z",
      impact: "renewal pressure",
      severity: "high",
      category: "pricing",
    },
  ],
  factCheck: {
    synthesizer: "aiml",
    verifier: "featherless",
    corroborated: 1,
    contested: 0,
    dropped: 0,
    claims: [],
    ranAt: "2026-07-30T00:00:00.000Z",
  },
};

describe("santra webhook envelope v2", () => {
  it("includes full report fields for report-page / automation consumers", () => {
    const envelope = buildSantraWebhookEnvelope(report);
    expect(envelope.schemaVersion).toBe("santra.webhook.v2");
    expect(envelope.deepLink).toContain("/reports?reportId=rep-full");
    expect(envelope.importanceScore).toBe(72);
    expect(envelope.detectedChanges?.[0]?.newValue).toBe("$129");
    expect(envelope.factCheck?.verifier).toBe("featherless");
    expect(envelope.claimStats.backed).toBe(1);
  });

  it("attaches santra envelope to slack and generic alert payloads", () => {
    const slack = formatAlertWebhookPayload("https://hooks.slack.com/services/T/B/x", report);
    expect(slack.destination).toBe("slack");
    expect(slack.body).toMatchObject({
      santra: expect.objectContaining({ schemaVersion: "santra.webhook.v2", riskScore: 77 }),
    });

    const generic = formatAlertWebhookPayload("https://webhook.site/abc", report);
    expect(generic.body).toMatchObject({
      santra: expect.objectContaining({ importanceScore: 72, deepLink: expect.any(String) }),
      summary: expect.stringContaining("importance 72"),
    });
  });
});

describe("webhook destination suggestions", () => {
  it("exposes setup chips for common destinations", () => {
    expect(WEBHOOK_DESTINATION_SUGGESTIONS.map((item) => item.id)).toEqual(
      expect.arrayContaining(["webhook-site", "slack", "discord", "zapier", "make", "n8n"]),
    );
  });

  it("labels pasted URLs for the UI badge", () => {
    expect(describeWebhookDestination("https://hooks.slack.com/services/T/B/x")).toMatchObject({
      destination: "slack",
      label: "Slack",
      ready: true,
    });
    expect(describeWebhookDestination("https://webhook.site/abc")).toMatchObject({
      label: "webhook.site",
      ready: true,
    });
    expect(describeWebhookDestination("not-a-url").ready).toBe(false);
  });
});
