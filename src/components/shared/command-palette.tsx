"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { Bot, Globe2, Radar, Rocket, Search, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const actions = [
  {
    icon: Radar,
    label: "Monitor competitor pricing changes",
    hint: "GTM Monitors",
    href: "/alerts",
  },
  {
    icon: Bot,
    label: "Analyze a competitor URL with live evidence",
    hint: "GTM Advisor",
    href: "/chat?prompt=Analyze%20competitor%20pricing%20and%20positioning",
  },
  {
    icon: Rocket,
    label: "Draft an executive competitive brief",
    hint: "GTM Advisor",
    href: "/chat?prompt=Draft%20an%20executive%20competitive%20brief",
  },
  { icon: Radar, label: "Review approval queue", hint: "Monitors", href: "/alerts" },
  { icon: Globe2, label: "Run competitor battlecard analysis", hint: "Deep brief", href: "/chat?mode=brief" },
  { icon: Rocket, label: "Validate a B2B market opportunity", hint: "Market validation", href: "/chat?mode=validate" },
  {
    icon: Sparkles,
    label: "Open GTM Monitors",
    hint: "Agent",
    href: "/alerts",
  },
];

export function CommandPalette({ className }: { className?: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      <button
        className={cn(
          "sentra-focus flex w-full min-w-0 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white/60 backdrop-blur-xl transition",
          className,
        )}
        onClick={() => setOpen(true)}
      >
        <Search className="h-4 w-4 shrink-0" />
        <span className="min-w-0 truncate text-left">Search monitors, competitors, GTM signals...</span>
        <kbd className="ml-auto hidden shrink-0 rounded-lg border border-white/10 bg-white/10 px-2 py-1 text-[10px] text-white/50 sm:inline-block">
          Ctrl K
        </kbd>
      </button>
      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-50 grid place-items-start bg-sentra-ink/70 px-4 pt-24 backdrop-blur-md"
            onClick={() => setOpen(false)}
          >
            <Command
              className="mx-auto w-full max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-sentra-panel shadow-2xl shadow-black/30"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center gap-3 border-b border-white/10 px-5">
                <Search className="h-4 w-4 shrink-0 text-sentra-cyan" />
                <Command.Input
                  autoFocus
                  placeholder="Command SANTRA AI..."
                  className="h-14 min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/40"
                />
              </div>
              <Command.List className="max-h-96 overflow-y-auto p-3">
                <Command.Empty className="p-4 text-sm text-white/50">No match found.</Command.Empty>
                <Command.Group heading="GTM Agent" className="text-xs text-white/40">
                  {actions.map((action) => (
                    <Command.Item
                      key={action.label}
                      className="flex cursor-pointer items-center gap-3 rounded-2xl px-3 py-3 text-sm text-white/80 data-[selected=true]:bg-white/10 data-[selected=true]:text-white"
                      onSelect={() => {
                        setOpen(false);
                        router.push(action.href);
                      }}
                    >
                      <action.icon className="h-4 w-4 shrink-0 text-sentra-cyan" />
                      <span className="min-w-0 flex-1 truncate">{action.label}</span>
                      <span className="ml-auto shrink-0 text-xs text-white/40">{action.hint}</span>
                    </Command.Item>
                  ))}
                </Command.Group>
              </Command.List>
            </Command>
          </div>,
          document.body,
        )}
    </>
  );
}
