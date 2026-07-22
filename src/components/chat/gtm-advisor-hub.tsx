"use client";

import { useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Bot, Lightbulb, Radar } from "lucide-react";
import { ChatInterface } from "@/components/chat/chat-interface";
import { StartupIntelligenceScanner } from "@/components/dashboard/startup-intelligence-scanner";
import { WorkspacePage } from "@/components/workspace/workspace-page";
import { WorldEngineStudio } from "@/features/world-engine/world-engine-studio";
import { cn } from "@/lib/utils";

export type GtmAdvisorMode = "ask" | "brief" | "validate";

function resolveMode(value: string | null, prompt: string | null): GtmAdvisorMode {
  if (value === "brief" || value === "analyst" || value === "competitor") return "brief";
  if (value === "validate" || value === "idea" || value === "startup" || value === "market") return "validate";
  if (value === "ask" || value === "chat") return "ask";
  if (prompt?.trim()) return "ask";
  return "ask";
}

const modes: Array<{
  id: GtmAdvisorMode;
  label: string;
  icon: typeof Bot;
  blurb: string;
}> = [
  { id: "ask", label: "Ask", icon: Bot, blurb: "Chat and live call for competitor questions." },
  { id: "brief", label: "Deep brief", icon: Radar, blurb: "Maps, evidence, and narrated strategy." },
  { id: "validate", label: "Market", icon: Lightbulb, blurb: "B2B ICP and opportunity validation." },
];

export function GtmAdvisorHub() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = resolveMode(searchParams.get("mode"), searchParams.get("prompt"));
  const briefQuery = searchParams.get("q")?.trim() || "";
  const active = modes.find((item) => item.id === mode) ?? modes[0];

  const setMode = useCallback(
    (next: GtmAdvisorMode, options?: { q?: string; prompt?: string }) => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("prompt");
      params.delete("q");

      if (next === "brief") {
        params.set("mode", "brief");
        if (options?.q?.trim()) params.set("q", options.q.trim());
        else if (options?.prompt?.trim()) params.set("q", options.prompt.trim());
      } else if (next === "ask") {
        params.set("mode", "ask");
        if (options?.prompt?.trim()) params.set("prompt", options.prompt.trim());
      } else {
        params.set("mode", "validate");
      }

      const query = params.toString();
      router.replace(query ? `/chat?${query}` : "/chat", { scroll: false });
    },
    [router, searchParams],
  );

  const handleDeepBrief = useCallback(
    (query: string) => {
      setMode("brief", { q: query });
    },
    [setMode],
  );

  const handleContinueInChat = useCallback(
    (message: string) => {
      setMode("ask", { prompt: message });
    },
    [setMode],
  );

  return (
    <WorkspacePage className="gap-4">
      <header className="flex flex-col gap-3 border-b border-white/[0.08] pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-sentra-cyan/80">
            B2B GTM intelligence
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white md:text-[1.75rem]">
            GTM Advisor
          </h1>
          <p className="mt-1 text-sm text-white/45">{active.blurb}</p>
        </div>

        <div
          role="tablist"
          aria-label="GTM Advisor modes"
          className="inline-flex w-full shrink-0 rounded-full border border-white/10 bg-white/[0.03] p-1 sm:w-auto"
        >
          {modes.map((item) => {
            const Icon = item.icon;
            const selected = mode === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() =>
                  setMode(item.id, item.id === "brief" && briefQuery ? { q: briefQuery } : undefined)
                }
                className={cn(
                  "sentra-focus inline-flex flex-1 items-center justify-center gap-1.5 rounded-full px-3.5 py-2 text-sm transition sm:flex-none",
                  selected
                    ? "bg-cyan-300/15 text-cyan-50 shadow-[inset_0_0_0_1px_rgba(103,232,249,0.25)]"
                    : "text-white/50 hover:text-white/80",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {item.label}
              </button>
            );
          })}
        </div>
      </header>

      <div className="min-w-0">
        {mode === "ask" ? (
          <ChatInterface hideChrome onRequestDeepBrief={handleDeepBrief} />
        ) : mode === "brief" ? (
          <WorldEngineStudio
            compactHero
            initialQuery={briefQuery || undefined}
            onContinueInChat={handleContinueInChat}
          />
        ) : (
          <StartupIntelligenceScanner embedded />
        )}
      </div>
    </WorkspacePage>
  );
}
