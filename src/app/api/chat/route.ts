import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/session";
import { appendChatMessage, createChatThread } from "@/lib/db/chat";
import { isMongoConfigured } from "@/lib/mongo/config";
import { recordProviderUsage } from "@/lib/provider-usage";
import { checkRateLimit } from "@/lib/rate-limit";
import { ensurePlatformSecrets } from "@/lib/secrets/platform-secrets";
import { isAimlConfigured, isLlmConfigured } from "@/lib/llm/client";
import { isFeatherlessConfigured } from "@/lib/llm/featherless";
import { formatInferenceError, isLlmAuthError } from "@/lib/llm/inference";
import { generateChatResponse, resolveDocumentChatProvider } from "@/services/openai";
import { runGtmAgentCollection } from "@/services/gtm-agent";
import type { ChatDocumentEvidence, ChatMessage, ChatProvider } from "@/types/intelligence";

export const runtime = "nodejs";

const MAX_MESSAGE_LENGTH = 4000;
const competitorIntent =
  /\b(competitor|competitive|pricing|price|hiring|jobs|careers|https?:\/\/)/i;

function shouldCollectWebEvidence(message: string) {
  return competitorIntent.test(message);
}

function getHistory(value: unknown): Pick<ChatMessage, "role" | "content">[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter(
      (item): item is Pick<ChatMessage, "role" | "content"> =>
        typeof item === "object" &&
        item !== null &&
        (item.role === "user" || item.role === "assistant") &&
        typeof item.content === "string",
    )
    .slice(-8);
}

export async function POST(request: Request) {
  try {
    await ensurePlatformSecrets();
    const auth = await requireApiUser();
    if ("error" in auth) return auth.error;

    const limited = await checkRateLimit(auth.user.id, "chat");
    if (!limited.allowed) {
      return NextResponse.json({ error: limited.message }, { status: 429 });
    }

    const body = (await request.json()) as {
      message?: string;
      history?: unknown;
      threadId?: string;
      document?: ChatDocumentEvidence;
      workspace?: import("@/lib/gtm/workspace-context").WorkspaceContext;
    };

    const documentEvidence =
      body.document?.text?.trim() && body.document.fileName
        ? {
            fileName: body.document.fileName,
            text: body.document.text.trim(),
            truncated: body.document.truncated,
          }
        : undefined;

    const message = (body.message?.trim() || (documentEvidence ? "Analyze the uploaded document." : "")).trim();

    if (!message) {
      return NextResponse.json({ error: "Message or document is required." }, { status: 400 });
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json({ error: "Message is too long." }, { status: 400 });
    }

    if (!isLlmConfigured()) {
      return NextResponse.json(
        {
          error: "Live AI requires AIML_API_KEY or FEATHERLESS_API_KEY in .env.local.",
        },
        { status: 503 },
      );
    }

    if (!documentEvidence && !isAimlConfigured() && !isFeatherlessConfigured()) {
      return NextResponse.json(
        {
          error: "Live web chat requires AIML_API_KEY or FEATHERLESS_API_KEY.",
        },
        { status: 503 },
      );
    }

    const provider: ChatProvider = documentEvidence ? resolveDocumentChatProvider(false) : "aiml-search";

    let brightDataEvidence: string | undefined;
    if (!documentEvidence && shouldCollectWebEvidence(message)) {
      try {
        const collection = await runGtmAgentCollection({ searchQuery: message });
        if (collection.evidence.trim()) {
          brightDataEvidence = collection.evidence;
        }
      } catch (error) {
        console.warn("Chat GTM collection skipped", error);
      }
    }

    if (provider.includes("featherless")) {
      void recordProviderUsage("featherless");
    } else if (provider.includes("aiml")) {
      void recordProviderUsage("aiml");
    }

    const response = await generateChatResponse(message, {
      history: getHistory(body.history),
      documentEvidence,
      brightDataEvidence,
      workspaceContext: body.workspace,
    });

    let threadId = body.threadId;
    if (isMongoConfigured()) {
      if (!threadId) {
        const thread = await createChatThread(auth.user.id);
        threadId = thread.id;
      }

      if (threadId) {
        const userContent = documentEvidence
          ? `[Document: ${documentEvidence.fileName}]\n${message}`
          : message;
        await appendChatMessage(auth.user.id, threadId, {
          role: "user",
          content: userContent,
        });
        await appendChatMessage(auth.user.id, threadId, {
          role: "assistant",
          content: response,
          provider,
        });
      }
    }

    return NextResponse.json({
      message: response,
      provider,
      threadId: threadId ?? undefined,
    });
  } catch (error) {
    console.error("Chat route failed", error);
    const message = formatInferenceError(error);
    const status = isLlmAuthError(error) ? 502 : 500;
    return NextResponse.json(
      {
        error: message,
        hint: isLlmAuthError(error)
          ? "Your SANTRA login is fine - the OpenAI API key needs to be updated."
          : undefined,
      },
      { status },
    );
  }
}
