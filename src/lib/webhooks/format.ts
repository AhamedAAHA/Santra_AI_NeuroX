import type { CrmExportPayload } from "@/lib/gtm/crm-payload";
import {
  claimStatusLabel,
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
  actionLines: string[];
  evidenceUrls: string[];
  impact?: string;
  watchItems: string[];
  competitors: string[];
  approvedAction?: string;
  claimStats?: { backed: number; partial: number; unsupported: number };
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
  const claimStats = claimStatsFromReport(report);

  const scoreBits = [
    typeof riskScore === "number" ? `risk ${riskScore}` : null,
    typeof confidence === "number" ? `confidence ${confidence}` : null,
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
    actionLines,
    evidenceUrls,
    impact,
    watchItems,
    competitors,
    approvedAction,
    claimStats,
    provider: report?.provider,
  };
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

export function formatDiscordWebhookBody(brief: ReadableBrief) {
  const fields = [
    typeof brief.riskScore === "number"
      ? { name: "Risk", value: String(brief.riskScore), inline: true }
      : null,
    typeof brief.confidence === "number"
      ? { name: "Confidence", value: String(brief.confidence), inline: true }
      : null,
    brief.claimStats
      ? {
          name: "Claims",
          value: `${brief.claimStats.backed} backed · ${brief.claimStats.partial} partial · ${brief.claimStats.unsupported} open`,
          inline: true,
        }
      : null,
    brief.approvedAction
      ? {
          name: "Approved action",
          value: truncate(brief.approvedAction, 1000),
          inline: false,
        }
      : null,
    brief.actionLines.length
      ? {
          name: "Battlecard / next actions",
          value: truncate(brief.actionLines.map((line, index) => `${index + 1}. ${line}`).join("\n"), 1000),
          inline: false,
        }
      : null,
  ].filter(Boolean);

  return {
    content: truncate(brief.text, 2000),
    embeds: [
      {
        title: truncate(brief.headline, 240),
        description: truncate(
          [brief.detail, brief.impact ? `Impact: ${brief.impact}` : null].filter(Boolean).join("\n\n"),
          3500,
        ),
        color: discordColor(brief.riskScore),
        fields,
        footer: { text: "SANTRA AI · GTM intelligence · HITL approved" },
        timestamp: new Date().toISOString(),
        ...(brief.evidenceUrls[0] ? { url: brief.evidenceUrls[0] } : {}),
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

  if (destination === "slack") return { destination, body: formatSlackWebhookBody(brief) };
  if (destination === "discord") return { destination, body: formatDiscordWebhookBody(brief) };

  return {
    destination,
    body: formatGenericWebhookBody({
      brief,
      destination,
      event: "monitor_alert",
      structured: {
        santra: {
          requirement: report.monitorRequirement,
          riskScore: report.riskScore,
          confidence: report.confidence,
          verdict: report.verdict,
          situation: report.situation,
          impact: report.impact,
          actionPlan: report.actionPlan,
          watchItems: report.watchItems,
          evidenceSources: report.evidenceSources,
          verifiedClaims: report.verifiedClaims.map((claim) => ({
            claim: claim.claim,
            status: claimStatusLabel(claim.status),
            confidence: claim.confidence,
          })),
          provider: report.provider,
        },
      },
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

  if (destination === "slack") return { destination, body: formatSlackWebhookBody(brief) };
  if (destination === "discord") return { destination, body: formatDiscordWebhookBody(brief) };

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
      },
    }),
  };
}
