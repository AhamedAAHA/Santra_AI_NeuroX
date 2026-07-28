"use client";

import { useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Bot, Lightbulb } from "lucide-react";
import { ChatInterface } from "@/components/chat/chat-interface";
import { StartupIntelligenceScanner } from "@/components/dashboard/startup-intelligence-scanner";
import { WorkspacePage, WorkspacePageHeader } from "@/components/workspace/workspace-page";
import { cn } from "@/lib/utils";

/** URL modes for /chat — brief redirects to ask (Deep brief removed). */
export type StrategyDeskMode = "ask" | "validate";

function resolveMode(value: string | null, prompt: string | null): StrategyDeskMode {
  if (value === "validate" || value === "idea" || value === "startup" || value === "market") return "validate";
  if (value === "ask" || value === "chat" || value === "brief" || value === "analyst" || value === "competitor") {
    return "ask";
  }
  if (prompt?.trim()) return "ask";
  return "ask";
}

const modes: Array<{
  id: StrategyDeskMode;
  label: string;
  icon: typeof Bot;
  blurb: string;
}> = [
  {
    id: "ask",
    label: "Ask",
    icon: Bot,
    blurb: "Chat, live call, and research agent for competitor and pricing questions.",
  },
  {
    id: "validate",
    label: "Market",
    icon: Lightbulb,
    blurb: "B2B ICP, opportunity scoring, and market validation.",
  },
];

export function StrategyDeskHub() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = resolveMode(searchParams.get("mode"), searchParams.get("prompt"));
  const active = modes.find((item) => item.id === mode) ?? modes[0];

  const setMode = useCallback(
    (next: StrategyDeskMode, options?: { prompt?: string }) => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("prompt");
      params.delete("q");

      if (next === "ask") {
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

  return (
    <WorkspacePage className="h-[var(--santra-mobile-strategy-height)] gap-3 overflow-hidden lg:h-[calc(100svh-7.5rem)] lg:gap-4">
      <WorkspacePageHeader
        compact
        badge="B2B revenue intelligence"
        title="Strategy Desk"
        description={active.blurb}
        actions={
          <div
            role="tablist"
            aria-label="Strategy Desk modes"
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
                  onClick={() => setMode(item.id)}
                  className={cn(
                    "santra-focus inline-flex flex-1 items-center justify-center gap-1.5 rounded-full px-3.5 py-2 text-sm transition sm:flex-none",
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
        }
      />

      <div
        className={cn(
          "min-h-0 min-w-0 flex-1",
          mode === "ask" ? "overflow-hidden" : "overflow-y-auto overscroll-contain",
        )}
      >
        {mode === "ask" ? (
          <div className="flex h-full min-h-0 flex-col">
            <ChatInterface hideChrome />
          </div>
        ) : (
          <StartupIntelligenceScanner embedded />
        )}
      </div>
    </WorkspacePage>
  );
}
