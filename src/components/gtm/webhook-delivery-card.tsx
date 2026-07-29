"use client";

import { useMemo, useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  WEBHOOK_DESTINATION_SUGGESTIONS,
  describeWebhookDestination,
} from "@/lib/webhooks/destinations";
import { formatAlertWebhookPayload } from "@/lib/webhooks/format";
import { isAllowedWebhook } from "@/lib/webhooks";
import { cn } from "@/lib/utils";
import type { ExecutiveIntelligenceReport } from "@/types/intelligence";

type TabId = "slack" | "json" | "curl";

type WebhookDeliveryCardProps = {
  report: ExecutiveIntelligenceReport;
  webhookUrl: string;
  onWebhookUrlChange?: (url: string) => void;
  className?: string;
  /** When false, input is read-only preview only. */
  editable?: boolean;
};

export function WebhookDeliveryCard({
  report,
  webhookUrl,
  onWebhookUrlChange,
  className,
  editable = true,
}: WebhookDeliveryCardProps) {
  const [tab, setTab] = useState<TabId>("json");
  const [copied, setCopied] = useState(false);

  const detection = describeWebhookDestination(webhookUrl);
  const previewUrl = webhookUrl.trim() || "https://webhook.site/your-unique-url";

  const payload = useMemo(() => {
    try {
      return formatAlertWebhookPayload(previewUrl, report);
    } catch {
      return formatAlertWebhookPayload("https://webhook.site/preview", report);
    }
  }, [previewUrl, report]);

  const jsonText = useMemo(() => JSON.stringify(payload.body, null, 2), [payload.body]);
  const curlText = useMemo(() => {
    const url = detection.ready ? webhookUrl.trim() : "https://webhook.site/YOUR_ID";
    return `curl -X POST '${url}' \\\n  -H 'Content-Type: application/json' \\\n  -d '${JSON.stringify(payload.body)}'`;
  }, [detection.ready, payload.body, webhookUrl]);

  const slackPreview =
    "santra" in (payload.body as object) && payload.destination === "slack"
      ? String((payload.body as { text?: string }).text ?? "")
      : payload.destination === "slack"
        ? String((payload.body as { text?: string }).text ?? "")
        : `SANTRA alert — ${report.verdict} (risk ${report.riskScore} · confidence ${report.confidence})`;

  async function copy(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success("Copied to clipboard");
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Could not copy");
    }
  }

  return (
    <section className={cn("rounded-2xl border border-white/10 bg-white/[0.03] p-4", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-white/35">Webhook delivery</p>
          <p className="mt-1 text-sm text-white/70">
            Full report payload (v2) — same truth as this brief, ready for Slack / Zapier / webhook.site
          </p>
        </div>
        <Badge variant={detection.ready ? "success" : "default"}>
          {detection.ready ? `Detected · ${detection.label}` : detection.label}
        </Badge>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {WEBHOOK_DESTINATION_SUGGESTIONS.map((item) => (
          <a
            key={item.id}
            href={item.docsUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-2.5 py-1 text-[10px] text-cyan-50 transition hover:border-cyan-300/40"
            title={item.hint}
            onClick={(event) => {
              event.preventDefault();
              if (editable && onWebhookUrlChange && !webhookUrl.trim()) {
                onWebhookUrlChange(item.examplePlaceholder);
              }
              window.open(item.docsUrl, "_blank", "noopener,noreferrer");
            }}
          >
            {item.label}
            <ExternalLink className="h-2.5 w-2.5 opacity-70" />
          </a>
        ))}
      </div>

      {editable && onWebhookUrlChange ? (
        <div className="mt-3 space-y-1.5">
          <Input
            value={webhookUrl}
            onChange={(event) => onWebhookUrlChange(event.target.value)}
            placeholder="https://hooks.slack.com/… or https://webhook.site/…"
            className="h-10"
            aria-label="Webhook URL"
          />
          <p className="text-[11px] text-white/40">
            Paste any HTTPS webhook. Nothing is sent until HITL approve.{" "}
            {webhookUrl.trim() && !isAllowedWebhook(webhookUrl.trim())
              ? "URL must be https:// (or localhost)."
              : null}
          </p>
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-1.5">
        {(
          [
            { id: "json" as const, label: "Full JSON" },
            { id: "slack" as const, label: "Alert line" },
            { id: "curl" as const, label: "curl" },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={cn(
              "rounded-full border px-2.5 py-1 text-[10px] tracking-wide",
              tab === item.id
                ? "border-cyan-300/35 bg-cyan-300/15 text-cyan-50"
                : "border-white/10 bg-white/[0.03] text-white/45",
            )}
          >
            {item.label}
          </button>
        ))}
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="ml-auto h-7 text-[11px]"
          onClick={() => void copy(tab === "curl" ? curlText : tab === "slack" ? slackPreview : jsonText)}
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          Copy
        </Button>
      </div>

      <pre className="mt-2 max-h-64 overflow-auto rounded-xl border border-white/10 bg-black/35 p-3 text-[11px] leading-5 text-white/70">
        {tab === "json" ? jsonText : tab === "curl" ? curlText : slackPreview}
      </pre>

      {report.factCheck ? (
        <p className="mt-2 text-[11px] text-emerald-100/75">
          Fact-check · {report.factCheck.synthesizer} ↔ {report.factCheck.verifier} ·{" "}
          {report.factCheck.corroborated} corroborated · {report.factCheck.contested} contested ·{" "}
          {report.factCheck.dropped} dropped
        </p>
      ) : null}
    </section>
  );
}
