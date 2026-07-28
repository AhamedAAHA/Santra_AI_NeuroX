import { getPlatformEnv } from "@/lib/secrets/platform-secrets";

export type BandAgentProfile = {
  id: string;
  handle: string;
  name: string;
  description?: string;
};

function getBandConfig() {
  return {
    apiKey: getPlatformEnv("BAND_API_KEY") || process.env.BAND_API_KEY?.trim(),
    agentId: getPlatformEnv("BAND_AGENT_ID") || process.env.BAND_AGENT_ID?.trim(),
    handle: getPlatformEnv("BAND_AGENT_HANDLE") || process.env.BAND_AGENT_HANDLE?.trim(),
    baseUrl: getPlatformEnv("BAND_API_BASE_URL") || process.env.BAND_API_BASE_URL?.trim() || "https://app.band.ai",
  };
}

export function isBandConfigured() {
  const { apiKey, agentId } = getBandConfig();
  return Boolean(apiKey && agentId);
}

export async function getBandAgentProfile(): Promise<BandAgentProfile | null> {
  const { apiKey, baseUrl } = getBandConfig();
  if (!apiKey) return null;

  try {
    const response = await fetch(`${baseUrl}/api/v1/agent/me`, {
      headers: { "X-API-Key": apiKey },
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) return null;
    const json = (await response.json()) as { data?: BandAgentProfile };
    return json.data ?? null;
  } catch (error) {
    console.warn("Band agent profile lookup failed", error);
    return null;
  }
}

/** Notify the Band agent mesh about a GTM event (best-effort; requires an existing chat). */
export async function notifyBandGtmEvent(input: {
  title: string;
  summary: string;
  monitorId?: string;
  proposedAction?: string;
}) {
  const { apiKey, baseUrl } = getBandConfig();
  if (!apiKey) return { ok: false as const, reason: "not_configured" };

  try {
    const chatsResponse = await fetch(`${baseUrl}/api/v1/agent/chats`, {
      headers: { "X-API-Key": apiKey },
      signal: AbortSignal.timeout(10_000),
    });
    if (!chatsResponse.ok) {
      return { ok: false as const, reason: `chats_${chatsResponse.status}` };
    }

    const chatsJson = (await chatsResponse.json()) as {
      data?: Array<{ id: string }>;
    };
    const chatId = chatsJson.data?.[0]?.id;
    if (!chatId) {
      return { ok: false as const, reason: "no_chat_room" };
    }

    const content = [
      `**${input.title}**`,
      input.summary,
      input.proposedAction ? `Proposed action: ${input.proposedAction}` : null,
      input.monitorId ? `Monitor: ${input.monitorId}` : null,
    ]
      .filter(Boolean)
      .join("\n\n");

    const messageResponse = await fetch(`${baseUrl}/api/v1/agent/chats/${chatId}/messages`, {
      method: "POST",
      headers: {
        "X-API-Key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!messageResponse.ok) {
      return { ok: false as const, reason: `message_${messageResponse.status}` };
    }

    return { ok: true as const, chatId };
  } catch (error) {
    console.warn("Band GTM notification failed", error);
    return { ok: false as const, reason: "network_error" };
  }
}
