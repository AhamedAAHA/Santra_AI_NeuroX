import { describe, expect, it } from "vitest";
import {
  buildNamedVerdict,
  isGenericVerdict,
  resolveActionHeadline,
} from "@/lib/gtm/report-headline";
import type { ExecutiveIntelligenceReport } from "@/types/intelligence";

describe("report headlines", () => {
  it("builds a named verdict from a pricing change", () => {
    const verdict = buildNamedVerdict({
      matchedSignals: [],
      detectedChanges: [
        {
          id: "c1",
          field: "ApexAnalytics Pro",
          oldValue: "$99",
          newValue: "$129",
          sourceUrl: "https://apexanalytics.io/pricing",
          detectedAt: new Date().toISOString(),
          impact: "Renewal pressure",
          severity: "high",
          category: "pricing",
        },
      ],
      requirement: "a competitor changes pricing on their public plans page",
    });
    expect(verdict).toContain("ApexAnalytics");
    expect(verdict).toContain("$99");
    expect(verdict).toContain("$129");
    expect(isGenericVerdict(verdict)).toBe(false);
  });

  it("detects generic verdicts", () => {
    expect(isGenericVerdict("1 monitored signal require review")).toBe(true);
    expect(isGenericVerdict("6 monitored signals require review")).toBe(true);
  });

  it("resolves action headlines from observed facts when verdict is generic", () => {
    const report = {
      verdict: "1 monitored signal require review",
      monitorRequirement: "a competitor changes pricing on their public plans page",
      observedFacts: ["Samsung Galaxy AI glasses launch timing shifted"],
      situation: 'The strongest matching signal is "Samsung Galaxy AI glasses".',
    } as ExecutiveIntelligenceReport;

    const headline = resolveActionHeadline({
      proposedAction: report.verdict,
      monitorRequirement: report.monitorRequirement,
      report,
    });
    expect(headline).toContain("Samsung");
    expect(headline).not.toMatch(/monitored signal/i);
  });
});
