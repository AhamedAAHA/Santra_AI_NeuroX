/**
 * Destination helpers — make webhook setup easy for Slack / Discord / Zapier / Make / webhook.site.
 */

import { detectWebhookDestination, type WebhookDestination } from "@/lib/webhooks/format";

export type WebhookDestinationSuggestion = {
  id: string;
  label: string;
  hint: string;
  docsUrl: string;
  examplePlaceholder: string;
  detectedAs: WebhookDestination;
};

export const WEBHOOK_DESTINATION_SUGGESTIONS: WebhookDestinationSuggestion[] = [
  {
    id: "webhook-site",
    label: "webhook.site",
    hint: "Fastest demo — open site, copy Your unique URL",
    docsUrl: "https://webhook.site/",
    examplePlaceholder: "https://webhook.site/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    detectedAs: "generic",
  },
  {
    id: "slack",
    label: "Slack",
    hint: "Incoming Webhooks app → copy webhook URL",
    docsUrl: "https://api.slack.com/messaging/webhooks",
    examplePlaceholder: "https://hooks.slack.com/services/T…/B…/…",
    detectedAs: "slack",
  },
  {
    id: "discord",
    label: "Discord",
    hint: "Channel → Integrations → Webhooks → New Webhook",
    docsUrl: "https://support.discord.com/hc/en-us/articles/228383668-Intro-to-Webhooks",
    examplePlaceholder: "https://discord.com/api/webhooks/…/…",
    detectedAs: "discord",
  },
  {
    id: "zapier",
    label: "Zapier",
    hint: "Zap → Webhooks by Zapier → Catch Hook → copy URL",
    docsUrl: "https://zapier.com/apps/webhook/help",
    examplePlaceholder: "https://hooks.zapier.com/hooks/catch/…/…",
    detectedAs: "generic",
  },
  {
    id: "make",
    label: "Make",
    hint: "Custom webhook module → copy address",
    docsUrl: "https://www.make.com/en/help/tools/webhooks",
    examplePlaceholder: "https://hook.eu1.make.com/…",
    detectedAs: "generic",
  },
  {
    id: "n8n",
    label: "n8n",
    hint: "Webhook node → Production URL",
    docsUrl: "https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/",
    examplePlaceholder: "https://n8n.example.com/webhook/…",
    detectedAs: "generic",
  },
];

export function describeWebhookDestination(url: string): {
  destination: WebhookDestination;
  label: string;
  ready: boolean;
} {
  const trimmed = url.trim();
  if (!trimmed) {
    return { destination: "generic", label: "Not set", ready: false };
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "https:" && parsed.hostname !== "localhost") {
      return { destination: "generic", label: "HTTPS required", ready: false };
    }
  } catch {
    return { destination: "generic", label: "Invalid URL", ready: false };
  }

  const destination = detectWebhookDestination(trimmed);
  const match = WEBHOOK_DESTINATION_SUGGESTIONS.find((item) => {
    try {
      const host = new URL(trimmed).hostname.toLowerCase();
      if (item.id === "slack") return host.includes("slack.com");
      if (item.id === "discord") return host.includes("discord");
      if (item.id === "zapier") return host.includes("zapier.com");
      if (item.id === "make") return host.includes("make.com") || host.includes("integromat.com");
      if (item.id === "n8n") return host.includes("n8n");
      if (item.id === "webhook-site") return host.includes("webhook.site");
    } catch {
      return false;
    }
    return false;
  });

  return {
    destination,
    label: match?.label ?? (destination === "generic" ? "Generic HTTPS" : destination),
    ready: true,
  };
}
