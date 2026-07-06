import { requireApiUser } from "@/lib/auth/session";
import { isAimlConfigured, isLlmConfigured } from "@/lib/llm/client";
import { checkRateLimit } from "@/lib/rate-limit";
import { ensurePlatformSecrets } from "@/lib/secrets/platform-secrets";
import { encodeSse, RealtimeLogService } from "@/services/realtime-log";
import { generateWorldEngineReport } from "@/services/world-engine";
import type { ActivityStreamEvent } from "@/types/activity-console";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sourceIdentity(url: string, title: string) {
  const hostname = new URL(url).hostname.toLowerCase();
  if (hostname.includes("reuters")) return { id: "reuters", name: "Reuters" };
  if (hostname.includes("linkedin")) return { id: "linkedin", name: "LinkedIn" };
  if (hostname.includes("techcrunch")) return { id: "techcrunch", name: "TechCrunch" };
  if (hostname.includes("reddit")) return { id: "reddit", name: "Reddit" };
  if (hostname.includes("github")) return { id: "github", name: "GitHub" };
  if (hostname.includes("sec.gov")) return { id: "sec", name: "SEC filings" };
  if (hostname.includes("twitter") || hostname === "x.com") return { id: "x", name: "X / Twitter" };
  return { id: `source-${hostname}`, name: title };
}

export async function POST(request: Request) {
  await ensurePlatformSecrets();
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const limited = await checkRateLimit(auth.user.id, "intelligence");
  if (!limited.allowed) {
    return new Response(limited.message ?? "Rate limit exceeded.", { status: 429 });
  }

  const body = (await request.json().catch(() => null)) as { query?: string } | null;
  const query = body?.query?.trim().slice(0, 1500);
  if (!query) return new Response("An intelligence question is required.", { status: 400 });

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let streamClosed = false;
      const emit = (event: ActivityStreamEvent) => {
        if (streamClosed) return;
        try {
          controller.enqueue(encoder.encode(encodeSse(event)));
        } catch {
          streamClosed = true;
        }
      };
      const logs = new RealtimeLogService(emit);
      const heartbeat = setInterval(() => logs.health(), 1000);
      const llmConfigured = isLlmConfigured();
      const aimlConfigured = isAimlConfigured();
      const llmSource = !llmConfigured ? "Demo" : aimlConfigured ? "OpenAI" : "Featherless";
      const llmSearchLabel = `${llmSource} search`;
      const observedSourceIds = new Set<string>();

      try {
        logs.log({
          category: "INTAKE",
          stage: "Request intake",
          message: `Received directive: "${query}"`,
        });
        logs.log({
          category: "ROUTER",
          stage: "Pipeline routing",
          message: `Selecting intelligence pipeline: ${llmConfigured ? `${llmSource} search model` : "illustrative demo model"}.`,
        });

        if (llmConfigured) {
          logs.source({
            id: aimlConfigured ? "openai-live-search" : "openai-live-search",
            name: llmSearchLabel,
            channel: "api",
            status: "connecting",
            detail: "Submitting intelligence model request",
          });
          logs.log({
            category: "AI",
            source: llmSource,
            stage: "Model invocation",
            message: "Synthesizing world-intelligence report via OpenAI search-capable model.",
          });
        } else {
          logs.log({
            category: "AI",
            stage: "Model invocation",
            message: "LLM is not configured; returning a clearly labelled demo intelligence model.",
            level: "warning",
          });
        }

        const aiStartedAt = performance.now();
        const report = await generateWorldEngineReport(
          { query, evidence: "" },
          llmConfigured
            ? {
                onResponseCreated: () => {
                  logs.log({
                    category: "AI",
                    source: llmSource,
                    stage: "Model invocation",
                    message: "Model response stream established.",
                    level: "success",
                  });
                },
                onWebSearchStarted: () => {
                  logs.source({
                    id: "openai-live-search",
                    name: llmSearchLabel,
                    channel: "api",
                    status: "active",
                    detail: "Web-search tool call active",
                  });
                  logs.log({
                    category: "SERP",
                    source: llmSource,
                    stage: "Source discovery",
                    message: "Live web-search tool call initiated.",
                  });
                },
                onWebSearchSearching: () => {
                  logs.log({
                    category: "SOURCE",
                    source: llmSource,
                    stage: "Source discovery",
                    message: "Searching for corroborating current sources.",
                  });
                },
                onWebSearchCompleted: (latencyMs) => {
                  logs.source({
                    id: "openai-live-search",
                    name: llmSearchLabel,
                    channel: "api",
                    status: "success",
                    detail: "Web-search tool call completed",
                    latencyMs,
                  });
                  logs.log({
                    category: "SOURCE",
                    source: llmSource,
                    stage: "Source discovery",
                    message: "Live source discovery completed.",
                    level: "success",
                    latencyMs,
                  });
                },
                onSynthesisStarted: () => {
                  logs.log({
                    category: "AI",
                    source: llmSource,
                    stage: "Intelligence synthesis",
                    message: "Synthesizing structured intelligence model.",
                  });
                },
                onSourceDiscovered: (source) => {
                  const identity = sourceIdentity(source.url, source.title);
                  if (observedSourceIds.has(identity.id)) return;
                  observedSourceIds.add(identity.id);
                  logs.source({
                    id: identity.id,
                    name: identity.name,
                    channel: "web",
                    status: "success",
                    detail: "Discovered during active live search",
                    url: source.url,
                  });
                  logs.log({
                    category: "SOURCE",
                    source: source.title,
                    stage: "Verification",
                    message: `Verified source reference discovered: ${source.url}`,
                    level: "success",
                  });
                },
              }
            : undefined,
        );

        const aiLatency = Math.round(performance.now() - aiStartedAt);
        report.reasoning.forEach((thought) => {
          emit({ type: "thought", thought });
          logs.log({
            category: "AI",
            stage: "Reasoning summary",
            message: thought.finding,
            confidence: thought.confidence,
          });
        });
        logs.log({
          category: "SIGNAL",
          stage: "Signal classification",
          message: `Classified ${report.signals.length} regional signals across ${new Set(report.signals.map((signal) => signal.domain)).size} intelligence domains.`,
          confidence: report.confidence,
        });
        logs.log({
          category: "RISK",
          stage: "Risk scoring",
          message: `Calculated intelligence risk index at ${report.riskIndex}%.`,
          confidence: report.confidence,
        });
        report.visualizations.forEach((visualization) => {
          logs.log({
            category: visualization === "globe" ? "MAP" : "CHART",
            stage: "Visualization generation",
            message: `Generated ${visualization} visualization specification.`,
            level: "success",
          });
        });
        if (report.sources.length) emit({ type: "verified_sources", sources: report.sources });
        logs.log({
          category: "COMPLETE",
          stage: "Complete",
          message: "Intelligence synthesis finished.",
          level: "success",
          confidence: report.confidence,
          latencyMs: aiLatency,
        });
        logs.setStatus(report.provider === "demo" ? "degraded" : "complete", "Complete");
        emit({ type: "report", report });
        emit({ type: "complete" });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Streamed intelligence request failed.";
        if (llmConfigured) {
          logs.source({
            id: "openai-live-search",
            name: llmSearchLabel,
            channel: "api",
            status: "error",
            detail: "Intelligence model request failed",
          });
        }
        logs.log({ category: "SYSTEM", stage: "Failure", message, level: "error" });
        logs.setStatus("failed", "Failure");
        emit({ type: "error", message });
      } finally {
        clearInterval(heartbeat);
        if (!streamClosed) {
          streamClosed = true;
          try {
            controller.close();
          } catch {
            // The browser may have already closed the SSE connection.
          }
        }
      }
    },
    cancel() {
      // Client navigation or reload can close the stream while async work is still winding down.
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
