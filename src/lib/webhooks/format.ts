import type { CrmExportPayload } from "@/lib/gtm/crm-payload";
import { buildSantraWebhookEnvelope } from "@/lib/webhooks/payload";
import {
  normalizeClaimStatus,
  type ExecutiveIntelligenceReport,
  type IntelligenceAnalysis,
} from "@/types/intelligence";

export type WebhookDestination = "slack" | "discord" | "generic";

export type ReadableBrief = {
  headline: string;
  text: string;
  summary: string;
  markdown: string;
  detail: string;
  riskScore?: number;
  confidence?: number;
  importanceScore?: number;
  importanceBand?: string;
  monitor?: string;
  actionLines: string[];
  evidenceUrls: string[];
  evidenceLines: string[];
  impact?: string;
  watchItems: string[];
  competitors: string[];
  approvedAction?: string;
  claimStats?: { backed: number; partial: number; unsupported: number };
  observedFacts: string[];
  factCheckLine?: string;
  hallucinationRisk?: string;
  provider?: string;
};

type BriefInput = {
  report?: ExecutiveIntelligenceReport;
  analysis?: IntelligenceAnalysis;
  requirement?: string;
  eventLabel?: string;
  companyName?: string;
  competitors?: string[];
  approvedAction?: string;
  /** Lightweight fields when only a CRM export payload is available. */
  intelligence?: CrmExportPayload["intelligence"];
};

export function detectWebhookDestination(webhookUrl: string): WebhookDestination {
  try {
    const host = new URL(webhookUrl).hostname.toLowerCase();
    if (
      host === "hooks.slack.com" ||
      host.endsWith(".slack.com") ||
      host.includes("slack.com")
    ) {
      return "slack";
    }
    if (host === "discord.com" || host === "discordapp.com" || host.endsWith(".discord.com")) {
      return "discord";
    }
  } catch {
    // Fall through to generic.
  }
  return "generic";
}

function truncate(value: string, max: number) {
  const trimmed = value.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, Math.max(0, max - 1)).trimEnd()}…`;
}

function uniqueNonEmpty(items: Array<string | undefined | null>) {
  return Array.from(new Set(items.map((item) => item?.trim()).filter(Boolean) as string[]));
}

function claimStatsFromReport(report?: ExecutiveIntelligenceReport) {
  if (!report?.verifiedClaims?.length) return undefined;
  const stats = { backed: 0, partial: 0, unsupported: 0 };
  for (const claim of report.verifiedClaims) {
    const status = normalizeClaimStatus(claim.status);
    if (status === "evidence-backed") stats.backed += 1;
    else if (status === "partial") stats.partial += 1;
    else stats.unsupported += 1;
  }
  return stats;
}

export function buildReadableBrief(input: BriefInput): ReadableBrief {
  const { report, analysis, requirement, eventLabel, companyName, intelligence } = input;
  const riskScore = report?.riskScore ?? intelligence?.riskScore;
  const confidence =
    report?.confidence ??
    intelligence?.confidence ??
    (typeof analysis?.confidenceScore === "number"
      ? Math.round(analysis.confidenceScore * 100)
      : undefined);
  const verdict =
    report?.verdict?.trim() ||
    intelligence?.verdict?.trim() ||
    analysis?.summary?.trim() ||
    intelligence?.summary?.trim() ||
    "SANTRA intelligence update";
  const situation =
    report?.situation?.trim() ||
    intelligence?.situation?.trim() ||
    analysis?.summary?.trim() ||
    intelligence?.summary?.trim() ||
    report?.impact?.trim() ||
    intelligence?.impact?.trim() ||
    "No situation summary was attached.";
  const impact = report?.impact?.trim() || intelligence?.impact?.trim() || undefined;
  const monitor =
    report?.monitorRequirement?.trim() ||
    intelligence?.requirement?.trim() ||
    requirement?.trim();
  const approvedAction = input.approvedAction?.trim() || undefined;
  const actionLines = uniqueNonEmpty([
    approvedAction,
    ...(report?.actionPlan ?? []),
    ...(intelligence?.actionPlan ?? []),
    ...(analysis?.recommendations ?? []),
    ...(intelligence?.recommendations ?? []),
  ]).slice(0, 5);
  const watchItems = uniqueNonEmpty([
    ...(report?.watchItems ?? []),
    ...(intelligence?.watchItems ?? []),
  ]).slice(0, 4);
  const competitors = uniqueNonEmpty([...(input.competitors ?? [])]).slice(0, 5);
  const evidenceUrls = uniqueNonEmpty([
    ...(report?.evidenceSources?.map((source) => source.url) ?? []),
    ...(intelligence?.evidenceUrls ?? []),
  ]).slice(0, 4);
  const evidenceLines = uniqueNonEmpty([
    ...(report?.evidenceSources?.map((source) => {
      const title = source.title?.trim() || source.publisher?.trim() || "Source";
      return source.url ? `${title} — ${source.url}` : title;
    }) ?? []),
    ...(intelligence?.evidenceUrls ?? []),
  ]).slice(0, 4);
  const claimStats = claimStatsFromReport(report);
  const importanceScore = report?.importanceScore;
  const importanceBand = report?.importanceBand;
  const observedFacts = uniqueNonEmpty([...(report?.observedFacts ?? [])]).slice(0, 4);
  const factCheckLine = report?.factCheck
    ? `${report.factCheck.corroborated} corroborated · ${report.factCheck.contested} contested · ${report.factCheck.dropped} dropped (${report.factCheck.synthesizer} ↔ ${report.factCheck.verifier})`
    : undefined;

  const scoreBits = [
    typeof riskScore === "number" ? `risk ${riskScore}` : null,
    typeof confidence === "number" ? `confidence ${confidence}` : null,
    typeof importanceScore === "number" ? `importance ${importanceScore}` : null,
  ].filter(Boolean);
  const scoreSuffix = scoreBits.length ? ` (${scoreBits.join(" · ")})` : "";
  const accountPrefix = companyName?.trim() ? `${companyName.trim()}: ` : "";
  const headline = truncate(`${accountPrefix}${verdict}${scoreSuffix}`, 180);

  const text = [
    eventLabel ? `SANTRA ${eventLabel}` : "SANTRA alert",
    headline,
    monitor ? `Monitor: ${monitor}` : null,
  ]
    .filter(Boolean)
    .join(" — ");

  const claimLine = claimStats
    ? `Claims: ${claimStats.backed} evidence-backed · ${claimStats.partial} partial · ${claimStats.unsupported} unsupported`
    : null;

  const summary = [
    headline,
    monitor ? `Monitor: ${monitor}` : null,
    claimLine,
    "",
    situation,
    impact ? ["", "Impact:", impact].join("\n") : null,
    approvedAction ? ["", "Approved action:", approvedAction].join("\n") : null,
    actionLines.length
      ? ["", "Next actions:", ...actionLines.map((line, index) => `${index + 1}. ${line}`)].join("\n")
      : null,
    watchItems.length
      ? ["", "Watch:", ...watchItems.map((item) => `- ${item}`)].join("\n")
      : null,
    evidenceUrls.length ? ["", "Evidence:", ...evidenceUrls.map((url) => `- ${url}`)].join("\n") : null,
  ]
    .filter((block) => block !== null)
    .join("\n")
    .trim();

  const markdown = [
    `**${headline}**`,
    monitor ? `_Monitor:_ ${monitor}` : null,
    claimLine ? `_${claimLine}_` : null,
    "",
    situation,
    impact ? ["", "**Impact**", impact].join("\n") : null,
    approvedAction ? ["", "**Approved action**", approvedAction].join("\n") : null,
    actionLines.length
      ? ["", "**Next actions**", ...actionLines.map((line) => `- ${line}`)].join("\n")
      : null,
    watchItems.length
      ? ["", "**Watch**", ...watchItems.map((item) => `- ${item}`)].join("\n")
      : null,
    evidenceUrls.length
      ? ["", "**Evidence**", ...evidenceUrls.map((url) => `- ${url}`)].join("\n")
      : null,
  ]
    .filter((block) => block !== null)
    .join("\n")
    .trim();

  return {
    headline,
    text: truncate(text, 300),
    summary,
    markdown,
    detail: situation,
    riskScore,
    confidence,
    importanceScore,
    importanceBand,
    monitor: monitor || undefined,
    actionLines,
    evidenceUrls,
    evidenceLines,
    impact,
    watchItems,
    competitors,
    approvedAction,
    claimStats,
    observedFacts,
    factCheckLine,
    hallucinationRisk: report?.hallucinationRisk,
    provider: report?.provider,
  };
}

/** Public chart image URL Discord can embed (QuickChart). */
export function buildDiscordScoreChartUrl(brief: ReadableBrief) {
  const labels: string[] = [];
  const values: number[] = [];
  const colors: string[] = [];

  if (typeof brief.riskScore === "number") {
    labels.push("Risk");
    values.push(brief.riskScore);
    colors.push("rgb(244,63,94)");
  }
  if (typeof brief.confidence === "number") {
    labels.push("Confidence");
    values.push(brief.confidence);
    colors.push("rgb(34,211,238)");
  }
  if (typeof brief.importanceScore === "number") {
    labels.push("Importance");
    values.push(brief.importanceScore);
    colors.push("rgb(245,158,11)");
  }

  if (!labels.length) return undefined;

  const chart = {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Score",
          data: values,
          backgroundColor: colors,
          borderWidth: 0,
        },
      ],
    },
    options: {
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: "SANTRA · Risk · Confidence · Importance",
          font: { size: 13 },
        },
      },
      scales: {
        y: { beginAtZero: true, max: 100, ticks: { stepSize: 25 } },
      },
    },
  };

  return `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(chart))}&w=560&h=300&bkg=%23ffffff&f=png`;
}

function slackColor(riskScore?: number) {
  if (typeof riskScore !== "number") return "#6272ff";
  if (riskScore >= 80) return "#f43f5e";
  if (riskScore >= 65) return "#f59e0b";
  return "#22d3ee";
}

function discordColor(riskScore?: number) {
  if (typeof riskScore !== "number") return 0x6272ff;
  if (riskScore >= 80) return 0xf43f5e;
  if (riskScore >= 65) return 0xf59e0b;
  return 0x22d3ee;
}

export function formatSlackWebhookBody(brief: ReadableBrief) {
  const fields = [
    typeof brief.riskScore === "number"
      ? { type: "mrkdwn" as const, text: `*Risk*\n${brief.riskScore}` }
      : null,
    typeof brief.confidence === "number"
      ? { type: "mrkdwn" as const, text: `*Confidence*\n${brief.confidence}` }
      : null,
    brief.claimStats
      ? {
          type: "mrkdwn" as const,
          text: `*Claims*\n${brief.claimStats.backed} backed · ${brief.claimStats.partial} partial · ${brief.claimStats.unsupported} open`,
        }
      : null,
    brief.provider
      ? { type: "mrkdwn" as const, text: `*Evidence*\n${brief.provider}` }
      : null,
  ].filter(Boolean);

  const actionText = brief.actionLines.length
    ? brief.actionLines.map((line, index) => `${index + 1}. ${line}`).join("\n")
    : "No action items yet.";

  return {
    text: brief.text,
    blocks: [
      {
        type: "header",
        text: { type: "plain_text", text: truncate(brief.headline, 140), emoji: true },
      },
      {
        type: "section",
        text: { type: "mrkdwn", text: truncate(brief.detail, 2800) },
      },
      ...(brief.impact
        ? [
            {
              type: "section",
              text: { type: "mrkdwn", text: `*Impact*\n${truncate(brief.impact, 1500)}` },
            },
          ]
        : []),
      ...(fields.length
        ? [
            {
              type: "section",
              fields,
            },
          ]
        : []),
      ...(brief.approvedAction
        ? [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `*Approved action (HITL)*\n${truncate(brief.approvedAction, 1500)}`,
              },
            },
          ]
        : []),
      {
        type: "section",
        text: { type: "mrkdwn", text: `*Battlecard / next actions*\n${truncate(actionText, 2800)}` },
      },
      ...(brief.watchItems.length
        ? [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `*Watch*\n${truncate(brief.watchItems.map((item) => `• ${item}`).join("\n"), 1500)}`,
              },
            },
          ]
        : []),
      ...(brief.competitors.length
        ? [
            {
              type: "context",
              elements: [
                {
                  type: "mrkdwn" as const,
                  text: `Competitors in scope: ${brief.competitors.join(", ")}`,
                },
              ],
            },
          ]
        : []),
      ...(brief.evidenceUrls.length
        ? [
            {
              type: "context",
              elements: brief.evidenceUrls.slice(0, 3).map((url) => ({
                type: "mrkdwn" as const,
                text: `<${url}|Evidence source>`,
              })),
            },
          ]
        : []),
    ],
    attachments: [
      {
        color: slackColor(brief.riskScore),
        fallback: brief.text,
      },
    ],
  };
}

export function formatDiscordWebhookBody(
  brief: ReadableBrief,
  options?: { deepLink?: string },
) {
  const deepLink = options?.deepLink?.trim() || undefined;
  const chartUrl = buildDiscordScoreChartUrl(brief);

  const scoreLine = [
    typeof brief.riskScore === "number" ? `Risk **${brief.riskScore}**/100` : null,
    typeof brief.confidence === "number" ? `Confidence **${brief.confidence}**/100` : null,
    typeof brief.importanceScore === "number"
      ? `Importance **${brief.importanceScore}**/100${brief.importanceBand ? ` (${brief.importanceBand})` : ""}`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const description = truncate(
    [
      brief.monitor ? `**Monitor**\n${brief.monitor}` : null,
      "",
      "**What happened**",
      brief.detail,
      brief.impact ? ["", "**Why it matters**", brief.impact].join("\n") : null,
      brief.observedFacts.length
        ? ["", "**Key facts**", ...brief.observedFacts.map((fact) => `• ${fact}`)].join("\n")
        : null,
      scoreLine ? ["", "**Scores**", scoreLine].join("\n") : null,
      deepLink ? ["", `[Open full charts & evidence in SANTRA](${deepLink})`].join("\n") : null,
    ]
      .filter((block) => block !== null)
      .join("\n")
      .trim(),
    3500,
  );

  const fields = [
    brief.claimStats
      ? {
          name: "Claim check",
          value: truncate(
            `${brief.claimStats.backed} backed · ${brief.claimStats.partial} partial · ${brief.claimStats.unsupported} open`,
            1024,
          ),
          inline: true,
        }
      : null,
    brief.hallucinationRisk
      ? {
          name: "Hallucination risk",
          value: brief.hallucinationRisk,
          inline: true,
        }
      : null,
    brief.provider
      ? {
          name: "Evidence provider",
          value: brief.provider,
          inline: true,
        }
      : null,
    brief.factCheckLine
      ? {
          name: "Fact-check",
          value: truncate(brief.factCheckLine, 1024),
          inline: false,
        }
      : null,
    brief.approvedAction
      ? {
          name: "Approved action",
          value: truncate(brief.approvedAction, 1024),
          inline: false,
        }
      : null,
    brief.actionLines.length
      ? {
          name: "Next actions",
          value: truncate(
            brief.actionLines.map((line, index) => `${index + 1}. ${line}`).join("\n"),
            1024,
          ),
          inline: false,
        }
      : null,
    brief.watchItems.length
      ? {
          name: "Watch next",
          value: truncate(brief.watchItems.map((item) => `• ${item}`).join("\n"), 1024),
          inline: false,
        }
      : null,
    brief.evidenceLines.length
      ? {
          name: "Evidence",
          value: truncate(brief.evidenceLines.map((line) => `• ${line}`).join("\n"), 1024),
          inline: false,
        }
      : null,
  ].filter(Boolean);

  const plainScores = scoreLine.replace(/\*\*/g, "");
  const contentBits = ["SANTRA alert — HITL approved", brief.headline, plainScores || null].filter(
    Boolean,
  );

  const titleBase = brief.headline.replace(/\s*\([^)]*\)\s*$/, "").trim() || brief.headline;

  return {
    content: truncate(contentBits.join("\n"), 2000),
    embeds: [
      {
        title: truncate(titleBase, 240),
        description,
        color: discordColor(brief.riskScore),
        fields,
        footer: {
          text: deepLink
            ? "SANTRA AI · Open the link above for interactive charts"
            : "SANTRA AI · GTM intelligence · HITL approved",
        },
        timestamp: new Date().toISOString(),
        ...(deepLink ? { url: deepLink } : brief.evidenceUrls[0] ? { url: brief.evidenceUrls[0] } : {}),
        ...(chartUrl ? { image: { url: chartUrl } } : {}),
      },
    ],
  };
}

export function formatGenericWebhookBody(options: {
  brief: ReadableBrief;
  destination: WebhookDestination;
  event: string;
  structured: Record<string, unknown>;
}) {
  const { brief, destination, event, structured } = options;
  return {
    ...structured,
    text: brief.text,
    summary: brief.summary,
    markdown: brief.markdown,
    destination,
    event,
  };
}

export function formatAlertWebhookPayload(webhookUrl: string, report: ExecutiveIntelligenceReport) {
  const destination = detectWebhookDestination(webhookUrl);
  const brief = buildReadableBrief({
    report,
    requirement: report.monitorRequirement,
    eventLabel: "alert",
  });
  const santra = buildSantraWebhookEnvelope(report);

  if (destination === "slack") {
    return {
      destination,
      body: {
        ...formatSlackWebhookBody(brief),
        santra,
      },
    };
  }
  if (destination === "discord") {
    return {
      destination,
      body: {
        ...formatDiscordWebhookBody(brief, { deepLink: santra.deepLink }),
        santra,
      },
    };
  }

  return {
    destination,
    body: formatGenericWebhookBody({
      brief,
      destination,
      event: "monitor_alert",
      structured: { santra },
    }),
  };
}

export function formatAutomationWebhookPayload(options: {
  webhookUrl: string;
  event: string;
  crm: CrmExportPayload;
  monitorId?: string;
  approvedAction?: string;
  report?: ExecutiveIntelligenceReport;
  automation: {
    source: string;
    action: string;
    description: string;
  };
}) {
  const destination = detectWebhookDestination(options.webhookUrl);
  const brief = buildReadableBrief({
    report: options.report,
    intelligence: options.crm.intelligence,
    requirement: options.crm.intelligence.requirement,
    eventLabel: options.event === "crm_export" ? "CRM export" : "monitor trigger",
    companyName: options.crm.account.companyName,
    competitors: options.crm.account.competitors,
    approvedAction: options.approvedAction,
  });

  const santra = options.report ? buildSantraWebhookEnvelope(options.report) : undefined;

  if (destination === "slack") {
    return {
      destination,
      body: {
        ...formatSlackWebhookBody(brief),
        ...(santra ? { santra } : {}),
      },
    };
  }
  if (destination === "discord") {
    return {
      destination,
      body: {
        ...formatDiscordWebhookBody(brief, { deepLink: santra?.deepLink }),
        ...(santra ? { santra } : {}),
      },
    };
  }

  return {
    destination,
    body: formatGenericWebhookBody({
      brief,
      destination,
      event: options.event,
      structured: {
        ...options.crm,
        event: options.event,
        monitorId: options.monitorId,
        approvedAction: options.approvedAction,
        automation: options.automation,
        ...(santra ? { santra } : {}),
      },
    }),
  };
}
