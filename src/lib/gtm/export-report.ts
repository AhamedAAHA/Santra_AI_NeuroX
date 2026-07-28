import {
  buildNamedVerdict,
  isGenericVerdict,
} from "@/lib/gtm/report-headline";
import { coerceTextListItem } from "@/lib/gtm/text-list";
import {
  claimStatusLabel,
  normalizeClaimStatus,
  type ExecutiveIntelligenceReport,
  type IntelligenceAnalysis,
} from "@/types/intelligence";

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, 48)
    .replace(/^-|-$/g, "");
}

function triggerDownload(filename: string, content: string, mime: string) {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([content], { type: mime }));
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

function reportHeadline(report: ExecutiveIntelligenceReport) {
  if (isGenericVerdict(report.verdict)) {
    return buildNamedVerdict({
      matchedSignals: [],
      detectedChanges: report.detectedChanges,
      requirement: report.monitorRequirement,
    });
  }
  return report.verdict;
}

export function buildMonitorReportMarkdown(report: ExecutiveIntelligenceReport) {
  const headline = reportHeadline(report);
  const lines = [
    `# ${headline}`,
    "",
    `**Monitor:** ${report.monitorRequirement}`,
    `**Generated:** ${new Date(report.generatedAt).toLocaleString()}`,
    `**Provider:** ${report.provider}`,
    `**Risk score:** ${report.riskScore}% | **Confidence:** ${report.confidence}% | **Hallucination risk:** ${report.hallucinationRisk}`,
    "",
    "## Situation",
    report.situation,
    "",
    "## Impact",
    report.impact,
    "",
    "## Action plan",
    ...(report.actionPlan.length
      ? report.actionPlan.map((item) => `- ${coerceTextListItem(item)}`).filter((line) => line !== "- ")
      : ["- None listed"]),
    "",
    "## Watch items",
    ...(report.watchItems.length
      ? report.watchItems.map((item) => `- ${coerceTextListItem(item)}`).filter((line) => line !== "- ")
      : ["- None listed"]),
    "",
    "## Observed facts",
    ...(report.observedFacts.length
      ? report.observedFacts.map((item) => `- ${coerceTextListItem(item)}`).filter((line) => line !== "- ")
      : ["- None listed"]),
    "",
    "## Forecasts",
    ...(report.forecasts.length
      ? report.forecasts.map((item) => `- ${coerceTextListItem(item)}`).filter((line) => line !== "- ")
      : ["- None listed"]),
  ];

  if (report.detectedChanges?.length) {
    lines.push(
      "",
      "## Detected changes",
      ...report.detectedChanges.map(
        (change) =>
          `- **${change.field}** (${change.severity}): ${change.oldValue} → ${change.newValue}${
            change.sourceUrl ? ` — ${change.sourceUrl}` : ""
          }`,
      ),
    );
  }

  if (report.verifiedClaims.length) {
    lines.push(
      "",
      "## Verified claims",
      ...report.verifiedClaims.map(
        (claim) =>
          `- **${claimStatusLabel(normalizeClaimStatus(claim.status))}** (${claim.confidence}%): ${claim.claim}`,
      ),
    );
  }

  lines.push(
    "",
    "## Evidence sources",
    ...(report.evidenceSources.length
      ? report.evidenceSources.map((source) => {
          const link = source.url ? `[${source.title}](${source.url})` : source.title;
          return `- ${link} — ${source.publisher} (reliability ${source.reliability}%)`;
        })
      : ["- No evidence sources attached"]),
  );

  return lines.join("\n");
}

export function downloadMonitorReport(
  report: ExecutiveIntelligenceReport,
  format: "json" | "markdown" = "markdown",
) {
  const content =
    format === "json" ? JSON.stringify(report, null, 2) : buildMonitorReportMarkdown(report);
  const mime = format === "json" ? "application/json" : "text/markdown;charset=utf-8";
  const extension = format === "json" ? "json" : "md";
  const slug = slugify(reportHeadline(report) || report.monitorRequirement || report.id);

  triggerDownload(`sentra-intel-report-${slug || report.id}.${extension}`, content, mime);
}

export function buildGtmBriefingMarkdown(query: string, analysis: IntelligenceAnalysis, provider?: string) {
  const lines = [
    `# GTM briefing`,
    "",
    `**Query:** ${query}`,
    ...(provider ? [`**Provider:** ${provider}`] : []),
    `**Confidence:** ${analysis.confidenceScore}%`,
    "",
    "## Summary",
    analysis.summary,
    "",
    "## Risks",
    ...(analysis.risks.length
      ? analysis.risks.map((item) => `- ${coerceTextListItem(item)}`).filter((line) => line !== "- ")
      : ["- None listed"]),
    "",
    "## Opportunities",
    ...(analysis.opportunities.length
      ? analysis.opportunities.map((item) => `- ${coerceTextListItem(item)}`).filter((line) => line !== "- ")
      : ["- None listed"]),
    "",
    "## Recommendations",
    ...(analysis.recommendations.length
      ? analysis.recommendations.map((item) => `- ${coerceTextListItem(item)}`).filter((line) => line !== "- ")
      : ["- None listed"]),
  ];

  if (analysis.signals.length) {
    lines.push(
      "",
      "## Signals",
      ...analysis.signals.map(
        (signal) =>
          `- **${signal.title}** (${signal.severity}, ${signal.confidence}%): ${signal.summary}`,
      ),
    );
  }

  return lines.join("\n");
}

export function downloadGtmBriefing(
  query: string,
  analysis: IntelligenceAnalysis,
  options?: { provider?: string; format?: "json" | "markdown" },
) {
  const format = options?.format ?? "markdown";
  const content =
    format === "json"
      ? JSON.stringify({ query, provider: options?.provider, analysis }, null, 2)
      : buildGtmBriefingMarkdown(query, analysis, options?.provider);
  const mime = format === "json" ? "application/json" : "text/markdown;charset=utf-8";
  const extension = format === "json" ? "json" : "md";
  const slug = slugify(query);

  triggerDownload(`sentra-gtm-briefing-${slug || "report"}.${extension}`, content, mime);
}
