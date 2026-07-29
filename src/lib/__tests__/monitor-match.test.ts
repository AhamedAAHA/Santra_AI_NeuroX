import { describe, expect, it } from "vitest";
import { filterSignalsForMonitor, matchesMonitor } from "@/lib/monitor-match";
import type { IntelligenceSignal } from "@/types/intelligence";

const pricingSignal: IntelligenceSignal = {
  id: "1",
  title: "ApexAnalytics Pro pricing increased",
  source: "https://apexanalytics.io/pricing",
  summary: "Pro plan moved from $99 to $129",
  category: "pricing",
  severity: "high",
  confidence: 0.91,
  timestamp: "now",
};

const hiringSignal: IntelligenceSignal = {
  id: "2",
  title: "Hiring spike in Singapore",
  source: "careers",
  summary: "32 new roles posted",
  category: "hiring",
  severity: "medium",
  confidence: 0.8,
  timestamp: "now",
};

describe("monitor match", () => {
  it("matches pricing monitors on keywords", () => {
    expect(
      matchesMonitor(
        {
          requirement: "Watch competitor pricing page for packaging changes",
          category: "pricing",
          minimumSeverity: "medium",
          keywords: ["apexanalytics", "pricing"],
        },
        pricingSignal,
      ),
    ).toBe(true);
  });

  it("rejects category mismatches", () => {
    expect(
      matchesMonitor(
        {
          requirement: "Watch competitor pricing",
          category: "pricing",
          minimumSeverity: "low",
        },
        hiringSignal,
      ),
    ).toBe(false);
  });

  it("returns empty instead of soft-falling back to unrelated top signals", () => {
    const filtered = filterSignalsForMonitor(
      {
        requirement: "Watch acme packaging SKUs only",
        category: "pricing",
        minimumSeverity: "high",
        keywords: ["acme", "packaging", "sku"],
      },
      [hiringSignal],
    );
    expect(filtered).toEqual([]);
  });
});
