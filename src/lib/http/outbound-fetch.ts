import { Agent, fetch as undiciFetch } from "undici";

/**
 * Outbound HTTPS helpers for webhooks.
 * Uses undici with connect.family=4 so destinations like webhook.site work on
 * networks where IPv6 is advertised but unreachable (Node's default fetch times out).
 */

const ipv4Agent = new Agent({
  connect: {
    family: 4,
    timeout: 10_000,
  },
  bodyTimeout: 12_000,
  headersTimeout: 12_000,
});

export function describeOutboundFetchError(error: unknown, targetUrl: string) {
  let host = "the destination";
  try {
    host = new URL(targetUrl).hostname;
  } catch {
    // keep fallback label
  }

  const nested =
    error && typeof error === "object" && "cause" in error
      ? (error as { cause?: unknown }).cause
      : undefined;

  const code =
    (nested && typeof nested === "object" && "code" in nested
      ? String((nested as { code?: unknown }).code ?? "")
      : "") ||
    (error && typeof error === "object" && "code" in error
      ? String((error as { code?: unknown }).code ?? "")
      : "");

  if (code === "ETIMEDOUT" || code === "UND_ERR_CONNECT_TIMEOUT" || code === "ABORT_ERR") {
    return `Could not reach ${host} (connection timed out). Check the webhook URL, firewall, or network, then try again.`;
  }
  if (code === "ENOTFOUND" || code === "EAI_AGAIN") {
    return `Could not resolve ${host}. Double-check the webhook URL.`;
  }
  if (code === "ENETUNREACH" || code === "EHOSTUNREACH") {
    return `Network unreachable for ${host}. Retry after confirming the URL is reachable from this machine.`;
  }
  if (code === "CERT_HAS_EXPIRED" || code === "UNABLE_TO_VERIFY_LEAF_SIGNATURE") {
    return `TLS certificate error talking to ${host}.`;
  }

  if (error instanceof Error) {
    if (error.name === "TimeoutError" || /aborted|timeout/i.test(error.message)) {
      return `Could not reach ${host} (timed out). Check the webhook URL and try again.`;
    }
    if (error.message === "fetch failed") {
      return `Could not reach ${host}. Outbound HTTPS from this server failed — verify the URL is reachable.`;
    }
    return error.message;
  }

  return `Could not deliver to ${host}.`;
}

export async function postJsonWebhook(
  webhookUrl: string,
  body: unknown,
  headers: Record<string, string>,
  options?: { timeoutMs?: number },
) {
  const timeoutMs = options?.timeoutMs ?? 12_000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await undiciFetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
      dispatcher: ipv4Agent,
    });
    return response;
  } catch (error) {
    throw new Error(describeOutboundFetchError(error, webhookUrl));
  } finally {
    clearTimeout(timer);
  }
}
