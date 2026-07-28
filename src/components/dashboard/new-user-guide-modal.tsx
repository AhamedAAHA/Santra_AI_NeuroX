"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, BellRing, Bot, CheckCircle2, FileCheck2, LayoutDashboard, Settings, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  closeNewUserGuide,
  completeNewUserGuide,
  shouldShowNewUserGuide,
  skipNewUserGuide,
  wasNewUserGuideClosedThisSession,
} from "@/lib/local-auth";

const guideSteps = [
  {
    icon: LayoutDashboard,
    title: "Dashboard",
    description: "Start here to see the latest signals, risks, and shortcuts.",
    detail: "Use Dashboard as your simple home screen. If something needs attention, open Monitors or History from here.",
    href: "/dashboard",
  },
  {
    icon: Bot,
    title: "Strategy Desk",
    description: "Ask questions or validate market opportunities.",
    detail: "Switch between Ask and Market. Use Research agent for live evidence collection.",
    href: "/chat",
  },
  {
    icon: BellRing,
    title: "Monitors",
    description: "Tell SANTRA what to watch, then run a check when you want fresh results.",
    detail: "Create monitors in plain language, like 'watch competitor pricing changes'. Review results before taking action.",
    href: "/alerts",
  },
  {
    icon: FileCheck2,
    title: "History",
    description: "Find saved reports and previous monitor runs.",
    detail: "Open History when you want to review past evidence, summaries, and action plans.",
    href: "/reports",
  },
  {
    icon: Settings,
    title: "Settings",
    description: "Control voice, microphone, display, and privacy preferences.",
    detail: "Use Settings to turn features on or off, test voice, clear local history, or export your data.",
    href: "/settings",
  },
];

export function NewUserGuideModal() {
  const [open, setOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const currentStep = guideSteps[stepIndex];
  const isLastStep = stepIndex === guideSteps.length - 1;

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setOpen(shouldShowNewUserGuide() && !wasNewUserGuideClosedThisSession());
    }, 250);

    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const openGuide = () => {
      setStepIndex(0);
      setOpen(true);
    };
    window.addEventListener("sentra:open-guide", openGuide);
    return () => window.removeEventListener("sentra:open-guide", openGuide);
  }, []);

  function closeGuide() {
    closeNewUserGuide();
    setOpen(false);
  }

  function skipGuide() {
    skipNewUserGuide();
    setOpen(false);
  }

  function finishGuide() {
    completeNewUserGuide();
    setOpen(false);
  }

  function nextStep() {
    if (isLastStep) return;
    setStepIndex((current) => Math.min(current + 1, guideSteps.length - 1));
  }

  function previousStep() {
    setStepIndex((current) => Math.max(current - 1, 0));
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] grid place-items-center overflow-y-auto bg-sentra-ink/82 px-3 py-4 backdrop-blur-xl sm:px-4 sm:py-8"
      style={{
        paddingBottom: "max(1rem, var(--sentra-mobile-nav-clearance))",
      }}
    >
      <Card className="my-auto w-full max-w-4xl overflow-hidden p-0" glow>
        <div className="flex items-start justify-between gap-4 border-b border-white/10 p-5 md:p-6">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-medium text-cyan-100">
              <LayoutDashboard className="h-3.5 w-3.5" />
              Quick guide
            </div>
            <h2 className="mt-3 text-2xl font-semibold text-white sm:mt-4 sm:text-3xl md:text-4xl">How to use SANTRA AI</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">
              A simple walkthrough of every main feature. You can skip or close it anytime.
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={closeGuide} aria-label="Close guide">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex gap-2 overflow-x-auto overscroll-x-contain border-b border-white/10 px-4 py-3 [-ms-overflow-style:none] [scrollbar-width:none] md:grid md:grid-cols-5 md:gap-4 md:overflow-visible md:px-6 md:py-4 [&::-webkit-scrollbar]:hidden">
          {guideSteps.map((step, index) => (
            <button
              key={step.title}
              type="button"
              onClick={() => setStepIndex(index)}
              className={cn(
                "sentra-focus flex min-w-[9.5rem] shrink-0 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-3 text-left transition md:min-w-0",
                stepIndex === index && "border-cyan-200/30 bg-cyan-300/10",
              )}
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-2xl bg-cyan-300/10 text-sentra-cyan">
                <step.icon className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-[10px] uppercase tracking-[0.18em] text-white/35">Step {index + 1}</span>
                <span className="block truncate text-sm font-medium text-white">{step.title}</span>
              </span>
            </button>
          ))}
        </div>

        <div className="p-5 md:p-6">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <div className="flex flex-col gap-5 md:flex-row md:items-start">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-3xl bg-cyan-300/10 text-sentra-cyan">
                <currentStep.icon className="h-7 w-7" />
              </span>
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.22em] text-white/35">
                  Step {stepIndex + 1} of {guideSteps.length}
                </p>
                <h3 className="mt-3 text-2xl font-semibold text-white">{currentStep.title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/62">{currentStep.description}</p>
                <p className="mt-4 text-sm leading-7 text-white/50">{currentStep.detail}</p>
              </div>
            </div>
          </div>

          {isLastStep && (
            <div className="mt-4 rounded-3xl border border-white/10 bg-white/[0.04] p-4">
              <div className="flex gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
                <div>
                  <p className="font-medium text-white">You are ready</p>
                  <p className="mt-1 text-sm leading-6 text-white/55">
                    Use Dashboard for overview, Strategy for questions and market validation, Monitors for tracking, History for saved work, and Settings for preferences.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button variant="ghost" onClick={skipGuide}>
              Skip guide
            </Button>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={previousStep} disabled={stepIndex === 0}>
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              {isLastStep ? (
                <Button variant="neon" asChild>
                  <Link href="/dashboard" onClick={finishGuide}>
                    Start
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              ) : (
                <Button variant="neon" onClick={nextStep}>
                  Next
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
