import { getAppOrigin } from "@/lib/auth/oauth-config";
import {
  actionRow,
  changeRow,
  ctaButton,
  EMAIL_COLORS,
  escapeHtml,
  kpiCell,
  percentBar,
  reliabilityBarRow,
  sectionTitle,
  severityBarRow,
} from "@/lib/notifications/email-blocks";
import { buildReportViewModel } from "@/lib/reports/view-model";
import type { ExecutiveIntelligenceReport } from "@/types/intelligence";

const SEVERITY_COLORS: Record<string, string> = {
  critical: EMAIL_COLORS.critical,
  high: EMAIL_COLORS.high,
  medium: EMAIL_COLORS.medium,
  low: EMAIL_COLORS.low,
};

export function formatWatchAlertEmail(input: {
  report: ExecutiveIntelligenceReport;
  requirement: string;
  matchedCount: number;
  changeCount: number;
}) {
  const vm = buildReportViewModel(input.report, { matchedCount: input.matchedCount });
  const appUrl = getAppOrigin();
  const alertsUrl = `${appUrl}/alerts`;
  const dashboardUrl = `${appUrl}/dashboard`;
  const generatedLabel = formatWhen(vm.generatedAt);

  const subject = `SANTRA alert — ${vm.headline}`;

  const text = [
    vm.headline,
    "",
    `Monitor: ${input.requirement || vm.monitorRequirement}`,
    `Risk score: ${vm.riskScore}`,
    `Confidence: ${vm.confidence}%`,
    `Matched signals: ${input.matchedCount}`,
    `Detected changes: ${input.changeCount || vm.changeCount}`,
    "",
    "Situation",
    vm.situation,
    "",
    vm.impact ? ["Impact", vm.impact, ""].join("\n") : null,
    vm.changes.length
      ? [
          "Observed changes",
          ...vm.changes.slice(0, 5).map((row) => `- ${row.text}${row.meta ? ` (${row.meta})` : ""}`),
          "",
        ].join("\n")
      : null,
    vm.actionPlan.length
      ? ["Recommended actions", ...vm.actionPlan.map((line, index) => `${index + 1}. ${line}`), ""].join("\n")
      : null,
    `Claims: ${vm.claimStats.backed} evidence-backed · ${vm.claimStats.partial} partial · ${vm.claimStats.unsupported} unsupported`,
    "",
    `Open alerts: ${alertsUrl}`,
    `Open dashboard: ${dashboardUrl}`,
    "",
    "— SANTRA AI background watch",
  ]
    .filter((line) => line != null)
    .join("\n");

  const maxSeverity = Math.max(1, ...vm.severityData.map((row) => row.count));
  const severityRows = vm.severityData
    .map((row) =>
      severityBarRow(row.severity, row.count, maxSeverity, SEVERITY_COLORS[row.severity] ?? EMAIL_COLORS.medium),
    )
    .join("");

  const reliabilityRows = vm.reliabilityData
    .slice(0, 5)
    .map((row) => reliabilityBarRow(row.name, row.reliability))
    .join("");

  const changeRows = vm.changes
    .slice(0, 5)
    .map((row) => changeRow(row.text, row.meta, row.severity))
    .join("");

  const actionRows = vm.actionPlan
    .slice(0, 5)
    .map((line, index) => actionRow(index + 1, line))
    .join("");

  const competitorChips = vm.competitors.length
    ? `<p style="margin:0 0 18px;">${vm.competitors
        .map(
          (name) =>
            `<span style="display:inline-block;margin:0 6px 6px 0;padding:4px 10px;border-radius:999px;background:${EMAIL_COLORS.cyanSoft};color:${EMAIL_COLORS.cyan};font-size:12px;font-family:Arial,Helvetica,sans-serif;">${escapeHtml(name)}</span>`,
        )
        .join("")}</p>`
    : "";

  const preheader = `${vm.headline} · risk ${vm.riskScore} · confidence ${vm.confidence}%`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:${EMAIL_COLORS.page};color:${EMAIL_COLORS.ink};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
    ${escapeHtml(preheader)}
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${EMAIL_COLORS.page};padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="640" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:640px;background:${EMAIL_COLORS.card};border:1px solid ${EMAIL_COLORS.border};border-radius:18px;overflow:hidden;">
          <tr>
            <td style="padding:22px 24px 8px;border-bottom:1px solid ${EMAIL_COLORS.border};">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="font-family:Arial,Helvetica,sans-serif;">
                    <p style="margin:0;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:${EMAIL_COLORS.cyan};font-weight:700;">SANTRA watch alert</p>
                    <p style="margin:6px 0 0;font-size:12px;color:${EMAIL_COLORS.soft};">${escapeHtml(generatedLabel)}</p>
                  </td>
                  <td align="right" style="font-family:Arial,Helvetica,sans-serif;">
                    <span style="display:inline-block;padding:5px 10px;border-radius:999px;background:${EMAIL_COLORS.riskSoft};color:${EMAIL_COLORS.risk};font-size:12px;font-weight:700;">Risk ${vm.riskScore}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:22px 24px 8px;font-family:Arial,Helvetica,sans-serif;">
              <h1 style="margin:0 0 10px;font-size:22px;line-height:1.3;color:${EMAIL_COLORS.ink};">${escapeHtml(vm.headline)}</h1>
              <p style="margin:0 0 16px;font-size:14px;color:${EMAIL_COLORS.muted};">Monitor · ${escapeHtml(input.requirement || vm.monitorRequirement)}</p>
              ${competitorChips}

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 -8px 18px;">
                <tr>
                  ${kpiCell("Risk", String(vm.riskScore), EMAIL_COLORS.risk)}
                  ${kpiCell("Confidence", `${vm.confidence}%`, EMAIL_COLORS.confidence)}
                  ${kpiCell("Signals", String(Math.max(input.matchedCount, vm.signalCount)), EMAIL_COLORS.cyan)}
                </tr>
              </table>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;">
                <tr>
                  <td style="padding:0 0 14px;">
                    ${sectionTitle("Risk (exposure)")}
                    ${percentBar(vm.riskScore, EMAIL_COLORS.risk)}
                  </td>
                </tr>
                <tr>
                  <td>
                    ${sectionTitle("Confidence (evidence)")}
                    ${percentBar(vm.confidence, EMAIL_COLORS.cyan)}
                  </td>
                </tr>
              </table>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;">
                <tr>
                  <td style="padding:14px;border:1px solid ${EMAIL_COLORS.border};border-radius:12px;background:#fbfcfe;">
                    ${sectionTitle("Situation")}
                    <p style="margin:0;font-size:14px;line-height:1.6;color:${EMAIL_COLORS.ink};">${escapeHtml(vm.situation)}</p>
                  </td>
                </tr>
              </table>

              ${
                vm.impact
                  ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;">
                <tr>
                  <td style="padding:14px;border:1px solid ${EMAIL_COLORS.border};border-radius:12px;background:#fbfcfe;">
                    ${sectionTitle("Impact")}
                    <p style="margin:0;font-size:14px;line-height:1.6;color:${EMAIL_COLORS.ink};">${escapeHtml(vm.impact)}</p>
                  </td>
                </tr>
              </table>`
                  : ""
              }

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;">
                <tr>
                  <td style="padding:14px;border:1px solid ${EMAIL_COLORS.border};border-radius:12px;">
                    ${sectionTitle("Signal severity mix")}
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${severityRows}</table>
                  </td>
                </tr>
              </table>

              ${
                changeRows
                  ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 12px;">
                <tr><td>${sectionTitle("Observed changes")}</td></tr>
              </table>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 12px;">${changeRows}</table>`
                  : ""
              }

              ${
                actionRows
                  ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;">
                <tr>
                  <td style="padding:14px;border:1px solid ${EMAIL_COLORS.border};border-radius:12px;">
                    ${sectionTitle("Recommended actions")}
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${actionRows}</table>
                  </td>
                </tr>
              </table>`
                  : ""
              }

              ${
                reliabilityRows
                  ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;">
                <tr>
                  <td style="padding:14px;border:1px solid ${EMAIL_COLORS.border};border-radius:12px;">
                    ${sectionTitle("Source reliability")}
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${reliabilityRows}</table>
                  </td>
                </tr>
              </table>`
                  : ""
              }

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 22px;">
                <tr>
                  <td style="padding:14px;border:1px solid ${EMAIL_COLORS.border};border-radius:12px;background:#fbfcfe;">
                    ${sectionTitle("Claim verification")}
                    <p style="margin:0;font-size:13px;color:${EMAIL_COLORS.muted};font-family:Arial,Helvetica,sans-serif;">
                      <span style="color:${EMAIL_COLORS.success};font-weight:700;">${vm.claimStats.backed}</span> evidence-backed
                      · <span style="font-weight:700;color:${EMAIL_COLORS.ink};">${vm.claimStats.partial}</span> partial
                      · <span style="color:${EMAIL_COLORS.risk};font-weight:700;">${vm.claimStats.unsupported}</span> unsupported
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px;">
                ${ctaButton("Open alerts", alertsUrl, true)}
                <span style="display:inline-block;width:8px;">&nbsp;</span>
                ${ctaButton("Dashboard", dashboardUrl, false)}
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:16px 24px 22px;border-top:1px solid ${EMAIL_COLORS.border};font-family:Arial,Helvetica,sans-serif;">
              <p style="margin:0;font-size:12px;line-height:1.5;color:${EMAIL_COLORS.soft};">
                You received this because background email watch is enabled for this monitor.
                Manage watch settings in SANTRA → Alerts.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return {
    subject,
    text,
    html,
    brief: {
      headline: vm.headline,
      summary: vm.situation,
      riskScore: vm.riskScore,
      confidence: vm.confidence,
      actionLines: vm.actionPlan,
    },
  };
}

export function formatWatchTestEmail(recipient: string) {
  const appUrl = getAppOrigin();
  const subject = "SANTRA test alert — email delivery works";
  const text = [
    "This is a SANTRA test alert.",
    "",
    `If you received this at ${recipient}, background watch emails are configured correctly.`,
    "",
    `Open SANTRA: ${appUrl}/dashboard`,
    "",
    "— SANTRA AI background watch",
  ].join("\n");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:${EMAIL_COLORS.page};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${EMAIL_COLORS.page};padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="640" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:640px;background:${EMAIL_COLORS.card};border:1px solid ${EMAIL_COLORS.border};border-radius:18px;">
          <tr>
            <td style="padding:28px 24px;font-family:Arial,Helvetica,sans-serif;">
              <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:${EMAIL_COLORS.cyan};font-weight:700;">SANTRA test alert</p>
              <h1 style="margin:0 0 12px;font-size:22px;color:${EMAIL_COLORS.ink};">Email delivery works</h1>
              <p style="margin:0 0 18px;color:${EMAIL_COLORS.muted};font-size:15px;line-height:1.6;">
                You received this at ${escapeHtml(recipient)}, so background watch alerts will reach you.
              </p>
              <p style="margin:0;">${ctaButton("Open SANTRA", `${appUrl}/dashboard`, true)}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, text, html };
}

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}
