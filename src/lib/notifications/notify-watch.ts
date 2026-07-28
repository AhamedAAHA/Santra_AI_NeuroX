import { findUserById } from "@/lib/auth/users";
import { getMonitor, updateMonitorLastNotified } from "@/lib/db/monitors";
import { appendTimelineEventDb } from "@/lib/db/monitor-workspace";
import { isWatchEmailConfigured, sendWatchAlertEmail } from "@/lib/notifications/email";
import { formatWatchAlertEmail } from "@/lib/notifications/format-watch";
import type { ExecutiveIntelligenceReport } from "@/types/intelligence";

function emailMinGapMs() {
  const raw = Number(process.env.SANTRA_EMAIL_MIN_GAP_MS?.trim());
  if (Number.isFinite(raw) && raw >= 0) return raw;
  return 30 * 60 * 1000;
}

export type WatchEmailOutcome = {
  sent: boolean;
  reason?: string;
  detail?: string;
  hint?: string;
  to?: string;
  messageId?: string;
};

export type MaybeSendWatchEmailInput = {
  userId: string;
  monitorId: string;
  requirement: string;
  report: ExecutiveIntelligenceReport;
  matchedCount: number;
  changeCount: number;
};

/**
 * Send a background-watch email when the monitor opted in.
 * Never throws — failures are reported so Check now / cron stay intact.
 */
export async function maybeSendWatchEmail(input: MaybeSendWatchEmailInput): Promise<WatchEmailOutcome> {
  try {
    const monitor = await getMonitor(input.userId, input.monitorId);
    if (!monitor?.watch_enabled || !monitor.watch_email_enabled) {
      return { sent: false, reason: "watch_disabled" };
    }

    if (!isWatchEmailConfigured()) {
      console.warn("Watch email skipped: Resend is not configured.");
      return {
        sent: false,
        reason: "not_configured",
        detail: "Email provider is not configured.",
        hint: "Set RESEND_API_KEY and SANTRA_EMAIL_FROM in .env.local, then restart the dev server.",
      };
    }

    const hasFindings = input.matchedCount > 0 || input.changeCount > 0;
    // A quiet run still emails once, so users can confirm the watch is wired up.
    if (!hasFindings && monitor.last_notified_at) {
      return {
        sent: false,
        reason: "no_findings",
        detail: "No new signals or changes in this check.",
      };
    }

    const gapMs = emailMinGapMs();
    if (monitor.last_notified_at && gapMs > 0) {
      const elapsed = Date.now() - new Date(monitor.last_notified_at).getTime();
      if (elapsed < gapMs) {
        const waitMinutes = Math.ceil((gapMs - elapsed) / 60_000);
        console.warn(`Watch email throttled for monitor ${input.monitorId}; ${waitMinutes}m remaining.`);
        return {
          sent: false,
          reason: "throttled",
          detail: `Another alert was sent recently. Next email allowed in ~${waitMinutes} min.`,
          hint: "Lower SANTRA_EMAIL_MIN_GAP_MS to test more frequently.",
        };
      }
    }

    const user = await findUserById(input.userId);
    const to = user?.email?.trim();
    if (!to) {
      console.warn("Watch email skipped: user has no email.", input.userId);
      return {
        sent: false,
        reason: "no_email",
        detail: "No email address is stored for this account.",
      };
    }

    const formatted = formatWatchAlertEmail({
      report: input.report,
      requirement: input.requirement,
      matchedCount: input.matchedCount,
      changeCount: input.changeCount,
    });

    const result = await sendWatchAlertEmail({
      to,
      subject: formatted.subject,
      text: formatted.text,
      html: formatted.html,
    });

    if (!result.ok) {
      if ("skipped" in result && result.skipped) {
        console.warn("Watch email skipped:", result.reason);
        return { sent: false, reason: "skipped", detail: result.reason, hint: result.hint, to };
      }
      console.warn("Watch email failed:", result.error);
      return { sent: false, reason: "send_failed", detail: result.error, hint: result.hint, to };
    }

    await updateMonitorLastNotified(input.userId, input.monitorId);

    try {
      await appendTimelineEventDb(input.userId, {
        type: "notification_sent",
        monitorId: input.monitorId,
        monitorRequirement: input.requirement,
        reportId: input.report.id,
        summary: `Email alert sent to ${to}`,
        severity: input.report.riskScore >= 80 ? "critical" : input.report.riskScore >= 65 ? "high" : "medium",
        metadata: {
          channel: "email",
          recipient: to,
          ...(result.id ? { providerMessageId: result.id } : {}),
        },
      });
    } catch (error) {
      console.warn("Timeline notification event skipped", error);
    }

    console.info(`Watch email sent to ${to} for monitor ${input.monitorId}`);
    return { sent: true, to, messageId: result.id };
  } catch (error) {
    console.warn("Watch email skipped", error);
    return {
      sent: false,
      reason: "exception",
      detail: error instanceof Error ? error.message : "Unexpected error while sending email.",
    };
  }
}
