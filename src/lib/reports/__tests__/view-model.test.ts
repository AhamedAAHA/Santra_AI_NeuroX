import { describe, expect, it } from "vitest";
import { SAMPLE_REPORT } from "@/lib/reports/sample-report";
import { buildReportViewModel, buildRiskTrendPoints } from "@/lib/reports/view-model";
import { formatWatchAlertEmail } from "@/lib/notifications/format-watch";

describe("report view model", () => {
  it("builds headline, charts and claim stats from a report", () => {
    const vm = buildReportViewModel(SAMPLE_REPORT);
    expect(vm.headline).toContain("Acme");
    expect(vm.severityData.some((row) => row.severity === "critical" && row.count > 0)).toBe(true);
    expect(vm.reliabilityData.length).toBeGreaterThan(0);
    expect(vm.claimStats.backed).toBeGreaterThan(0);
    expect(vm.actionPlan.length).toBeGreaterThan(0);
  });

  it("builds chronological risk trend points", () => {
    const points = buildRiskTrendPoints(
      [
        { id: "a", report: { ...SAMPLE_REPORT, id: "a", riskScore: 40, generatedAt: "2026-07-01T10:00:00Z" } },
        { id: "b", report: { ...SAMPLE_REPORT, id: "b", riskScore: 78, generatedAt: "2026-07-08T10:00:00Z" } },
      ],
      8,
    );
    expect(points).toHaveLength(2);
    expect(points[0].riskScore).toBe(40);
    expect(points[1].riskScore).toBe(78);
  });
});

describe("redesigned watch email", () => {
  it("includes KPI and chart sections in html", () => {
    const formatted = formatWatchAlertEmail({
      report: SAMPLE_REPORT,
      requirement: SAMPLE_REPORT.monitorRequirement,
      matchedCount: 3,
      changeCount: 4,
    });

    expect(formatted.subject).toContain("SANTRA alert");
    expect(formatted.html).toContain("Signal severity mix");
    expect(formatted.html).toContain("Source reliability");
    expect(formatted.html).toContain("Claim verification");
    expect(formatted.html).toContain("Observed changes");
    expect(formatted.html).toContain("Risk (exposure)");
    expect(formatted.text).toContain("Situation");
  });
});
