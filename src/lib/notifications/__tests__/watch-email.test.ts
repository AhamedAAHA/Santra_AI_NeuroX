import { afterEach, describe, expect, it } from "vitest";
import { isAllowedWatchInterval, WATCH_INTERVAL_OPTIONS_MS } from "@/lib/db/monitors";
import { getWatchEmailConfigStatus, isWatchEmailConfigured } from "@/lib/notifications/email";
import { formatWatchAlertEmail, formatWatchTestEmail } from "@/lib/notifications/format-watch";
import type { ExecutiveIntelligenceReport } from "@/types/intelligence";

describe("watch intervals", () => {
  it("accepts only whitelisted intervals", () => {
    for (const ms of WATCH_INTERVAL_OPTIONS_MS) {
      expect(isAllowedWatchInterval(ms)).toBe(true);
    }
    expect(isAllowedWatchInterval(15 * 60 * 1000)).toBe(false);
    expect(isAllowedWatchInterval("3600000")).toBe(false);
  });
});

describe("formatWatchAlertEmail", () => {
  it("builds subject and body from a report", () => {
    const report = {
      id: "r1",
      monitorRequirement: "Watch Acme pricing",
      verdict: "Acme cut Pro plan price",
      situation: "Public pricing page shows a lower Pro tier.",
      impact: "Margin pressure on mid-market deals.",
      riskScore: 72,
      confidence: 81,
      actionPlan: ["Review discount floor", "Alert sales"],
      watchItems: ["Acme pricing page"],
      evidenceSources: [],
      verifiedClaims: [],
      observedFacts: [],
      forecasts: [],
      hallucinationRisk: "low",
      provider: "exa",
      generatedAt: new Date().toISOString(),
    } as ExecutiveIntelligenceReport;

    const formatted = formatWatchAlertEmail({
      report,
      requirement: "Watch Acme pricing",
      matchedCount: 2,
      changeCount: 1,
    });

    expect(formatted.subject).toContain("SANTRA alert");
    expect(formatted.text).toContain("Watch Acme pricing");
    expect(formatted.html).toContain("Open alerts");
    expect(formatted.html).toContain("Signal severity mix");
  });

  it("builds a test email addressed to the recipient", () => {
    const formatted = formatWatchTestEmail("owner@example.com");
    expect(formatted.subject).toContain("test alert");
    expect(formatted.text).toContain("owner@example.com");
    expect(formatted.html).toContain("owner@example.com");
  });
});

describe("email configuration status", () => {
  const original = {
    key: process.env.RESEND_API_KEY,
    from: process.env.SANTRA_EMAIL_FROM,
    sandboxTo: process.env.SANTRA_EMAIL_SANDBOX_TO,
  };

  afterEach(() => {
    process.env.RESEND_API_KEY = original.key;
    process.env.SANTRA_EMAIL_FROM = original.from;
    process.env.SANTRA_EMAIL_SANDBOX_TO = original.sandboxTo;
  });

  it("reports unconfigured when the api key is missing", () => {
    delete process.env.RESEND_API_KEY;
    process.env.SANTRA_EMAIL_FROM = "alerts@example.com";
    expect(isWatchEmailConfigured()).toBe(false);
    expect(getWatchEmailConfigStatus()).toMatchObject({ configured: false, hasApiKey: false });
  });

  it("flags the shared Resend test sender", () => {
    process.env.RESEND_API_KEY = "re_test";
    process.env.SANTRA_EMAIL_FROM = "SANTRA Alerts <onboarding@resend.dev>";
    delete process.env.SANTRA_EMAIL_SANDBOX_TO;
    expect(getWatchEmailConfigStatus()).toMatchObject({
      configured: true,
      sandbox: true,
      sandboxNeedsOwner: true,
    });

    process.env.SANTRA_EMAIL_FROM = "alerts@example.com";
    expect(getWatchEmailConfigStatus().sandbox).toBe(false);
  });

  it("redirects sandbox recipients to SANTRA_EMAIL_SANDBOX_TO", async () => {
    const { resolveWatchEmailRecipient } = await import("@/lib/notifications/email");
    process.env.SANTRA_EMAIL_FROM = "SANTRA Alerts <onboarding@resend.dev>";
    process.env.SANTRA_EMAIL_SANDBOX_TO = "owner@resend-account.com";
    expect(resolveWatchEmailRecipient("other@example.com")).toEqual({
      to: "owner@resend-account.com",
      redirected: true,
      accountEmail: "other@example.com",
    });
  });
});
