"use client";

import { AnimatePresence, motion, type Variants } from "framer-motion";
import {
  ArrowRight,
  Bot,
  Brain,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Database,
  Eye,
  GitBranch,
  Globe2,
  Layers,
  Maximize2,
  Minimize2,
  Radar,
  Server,
  ShieldCheck,
  Sparkles,
  Timer,
  Workflow,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { PitchBackground } from "@/components/pitch/pitch-background";
import { cn } from "@/lib/utils";

const TOTAL = 11;

const EASE = [0.22, 1, 0.36, 1] as const;

const slideVariants: Variants = {
  enter: (dir: number) => ({
    opacity: 0,
    x: dir > 0 ? 72 : -72,
    scale: 0.985,
    filter: "blur(6px)",
  }),
  center: {
    opacity: 1,
    x: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: { duration: 0.45, ease: EASE },
  },
  exit: (dir: number) => ({
    opacity: 0,
    x: dir > 0 ? -56 : 56,
    scale: 0.99,
    filter: "blur(4px)",
    transition: { duration: 0.32, ease: [0.4, 0, 1, 1] as const },
  }),
};

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } },
};

function Glass({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-white/10 bg-white/[0.045] shadow-[0_0_0_1px_rgba(103,232,249,0.04)_inset] backdrop-blur-xl",
        className,
      )}
    >
      {children}
    </div>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-cyan-300/80 sm:text-xs">
      {children}
    </p>
  );
}

function SlideShell({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className={cn(
        "mx-auto flex h-full w-full max-w-[1600px] flex-col justify-center px-8 py-16 sm:px-12 lg:px-16 xl:px-20",
        className,
      )}
    >
      {children}
    </motion.div>
  );
}

function TitleSlide() {
  return (
    <SlideShell className="items-center text-center">
      <motion.div variants={item}>
        <Eyebrow>NeuroX 1.0 · Phase 2</Eyebrow>
      </motion.div>
      <motion.h1
        variants={item}
        className="mt-5 max-w-5xl font-[family-name:var(--font-heading)] text-5xl font-semibold tracking-tight text-white sm:text-6xl md:text-7xl lg:text-8xl"
      >
        SANTRA{" "}
        <span className="bg-gradient-to-r from-cyan-300 via-sky-200 to-violet-300 bg-clip-text text-transparent">
          AI
        </span>
      </motion.h1>
      <motion.p variants={item} className="mt-5 max-w-3xl text-xl text-white/65 sm:text-2xl md:text-3xl">
        Autonomous GTM intelligence for B2B teams
      </motion.p>
      <motion.div variants={item} className="mt-10">
        <Glass className="inline-flex items-center gap-3 px-6 py-3">
          <Sparkles className="h-5 w-5 text-cyan-300" />
          <span className="text-lg font-medium text-white/85">Team · Prompt Pirates</span>
        </Glass>
      </motion.div>
      <motion.p variants={item} className="mt-8 text-sm tracking-[0.2em] text-white/35 uppercase">
        Competitive monitors · Live evidence · Human approval
      </motion.p>
    </SlideShell>
  );
}

function ProblemSlide() {
  const pains = [
    { icon: Timer, title: "Manual research", text: "15–30 hours/week checking rival pages, jobs, and pricing." },
    { icon: Eye, title: "Missed signals", text: "Pricing changes and hiring moves land too late." },
    { icon: Layers, title: "Stale battlecards", text: "Intel dies in Slack threads and spreadsheets." },
    { icon: ShieldCheck, title: "Risky automation", text: "Leaders block CRM workflows without human control." },
  ];
  return (
    <SlideShell>
      <motion.div variants={item}>
        <Eyebrow>The problem</Eyebrow>
        <h2 className="mt-3 font-[family-name:var(--font-heading)] text-4xl font-semibold text-white sm:text-5xl md:text-6xl">
          Competitive intel is slow and unsafe to automate
        </h2>
      </motion.div>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {pains.map((pain) => (
          <motion.div key={pain.title} variants={item}>
            <Glass className="h-full p-6">
              <pain.icon className="h-8 w-8 text-cyan-300" />
              <h3 className="mt-5 text-xl font-semibold text-white">{pain.title}</h3>
              <p className="mt-3 text-base leading-relaxed text-white/55">{pain.text}</p>
            </Glass>
          </motion.div>
        ))}
      </div>
    </SlideShell>
  );
}

function SolutionSlide() {
  return (
    <SlideShell>
      <motion.div variants={item}>
        <Eyebrow>The solution</Eyebrow>
        <h2 className="mt-3 max-w-4xl font-[family-name:var(--font-heading)] text-4xl font-semibold text-white sm:text-5xl md:text-6xl">
          An agent that researches. A human that decides.
        </h2>
      </motion.div>
      <div className="mt-10 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <motion.div variants={item}>
          <Glass className="h-full p-8 md:p-10">
            <p className="text-2xl leading-relaxed text-white/80 md:text-3xl">
              SANTRA watches competitors, collects{" "}
              <span className="text-cyan-200">live web evidence</span>, writes executive briefs, and queues CRM
              actions — but{" "}
              <span className="text-violet-200">never executes</span> until a person approves.
            </p>
            <p className="mt-8 text-lg text-white/45">
              Built for RevOps and competitive intel teams who need speed without losing control.
            </p>
          </Glass>
        </motion.div>
        <motion.div variants={item} className="grid gap-4">
          {[
            "Plain-language watch goals",
            "Live Exa / Bright Data evidence",
            "HITL approval before automation",
            "Voice live call for strategy Q&A",
          ].map((line) => (
            <Glass key={line} className="flex items-center gap-3 px-5 py-4">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-cyan-300" />
              <span className="text-lg text-white/75">{line}</span>
            </Glass>
          ))}
        </motion.div>
      </div>
    </SlideShell>
  );
}

function FeaturesSlide() {
  const features = [
    { icon: Radar, title: "GTM Monitors", text: "Autonomous watch loops for pricing, hiring, and competitor moves." },
    { icon: Bot, title: "Strategy Desk", text: "Ask mode + Market validation with voice live call." },
    { icon: ShieldCheck, title: "HITL Queue", text: "Edit, approve, or reject before any webhook fires." },
    { icon: Workflow, title: "Decision Trail", text: "Goal → Route → Tools → Decide → Result, fully logged." },
    { icon: Brain, title: "Agent Memory", text: "Prior runs inform the next check for continuity." },
    { icon: Zap, title: "Slack Battlecards", text: "Risk, confidence, claims, and impact delivered on approve." },
  ];
  return (
    <SlideShell>
      <motion.div variants={item}>
        <Eyebrow>Key features</Eyebrow>
        <h2 className="mt-3 font-[family-name:var(--font-heading)] text-4xl font-semibold text-white sm:text-5xl md:text-6xl">
          Built for real GTM workflows
        </h2>
      </motion.div>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {features.map((f) => (
          <motion.div key={f.title} variants={item}>
            <Glass className="h-full p-6 transition hover:border-cyan-300/25 hover:bg-white/[0.06]">
              <f.icon className="h-7 w-7 text-violet-300" />
              <h3 className="mt-4 text-xl font-semibold text-white">{f.title}</h3>
              <p className="mt-2 text-base leading-relaxed text-white/55">{f.text}</p>
            </Glass>
          </motion.div>
        ))}
      </div>
    </SlideShell>
  );
}

function HowItWorksSlide() {
  const steps = [
    { label: "Data Sources", sub: "Web · Exa · Bright Data" },
    { label: "AI Processing", sub: "Route · Collect · Synthesize" },
    { label: "Insights", sub: "Brief · Risk · Confidence" },
    { label: "Human Approval", sub: "HITL edit & approve" },
    { label: "Action", sub: "Webhook · Slack · CRM" },
  ];
  return (
    <SlideShell>
      <motion.div variants={item}>
        <Eyebrow>How it works</Eyebrow>
        <h2 className="mt-3 font-[family-name:var(--font-heading)] text-4xl font-semibold text-white sm:text-5xl md:text-6xl">
          Bounded autonomy loop
        </h2>
      </motion.div>
      <motion.div variants={item} className="mt-12 flex flex-col gap-4 lg:flex-row lg:items-stretch">
        {steps.map((step, index) => (
          <div key={step.label} className="flex flex-1 items-center gap-3 lg:flex-col lg:gap-0">
            <Glass className="relative w-full flex-1 overflow-hidden p-5 text-center lg:p-6">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/50 to-transparent" />
              <p className="text-xs font-semibold tracking-[0.24em] text-cyan-300/70">0{index + 1}</p>
              <h3 className="mt-3 text-lg font-semibold text-white sm:text-xl">{step.label}</h3>
              <p className="mt-2 text-sm text-white/45">{step.sub}</p>
            </Glass>
            {index < steps.length - 1 && (
              <ArrowRight className="hidden h-6 w-6 shrink-0 text-cyan-300/50 lg:mx-1 lg:block xl:mx-2" />
            )}
          </div>
        ))}
      </motion.div>
      <motion.p variants={item} className="mt-10 max-w-3xl text-lg text-white/50">
        The agent drafts. Humans keep the execution gate. No silent CRM writes.
      </motion.p>
    </SlideShell>
  );
}

function ArchitectureSlide() {
  const layers = [
    { icon: Layers, title: "Frontend", items: ["Next.js 15", "React 19", "Tailwind", "Framer Motion"] },
    { icon: Server, title: "Backend", items: ["API routes", "Agent loop", "HITL gate", "Rate limits"] },
    { icon: Database, title: "Database", items: ["MongoDB", "Chat threads", "Pending actions", "History"] },
    { icon: Brain, title: "AI APIs", items: ["AIML", "Featherless", "Speechmatics", "Intent models"] },
    { icon: Globe2, title: "Integrations", items: ["Exa", "Bright Data", "Webhooks", "Slack / Zapier"] },
  ];
  return (
    <SlideShell>
      <motion.div variants={item}>
        <Eyebrow>Architecture</Eyebrow>
        <h2 className="mt-3 font-[family-name:var(--font-heading)] text-4xl font-semibold text-white sm:text-5xl md:text-6xl">
          Stack that ships autonomy safely
        </h2>
      </motion.div>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {layers.map((layer) => (
          <motion.div key={layer.title} variants={item}>
            <Glass className="h-full p-5">
              <layer.icon className="h-6 w-6 text-cyan-300" />
              <h3 className="mt-4 text-lg font-semibold text-white">{layer.title}</h3>
              <ul className="mt-4 space-y-2">
                {layer.items.map((entry) => (
                  <li key={entry} className="text-sm text-white/55">
                    {entry}
                  </li>
                ))}
              </ul>
            </Glass>
          </motion.div>
        ))}
      </div>
    </SlideShell>
  );
}

function DemoFlowSlide() {
  const journey = [
    { step: "01", title: "Sign in", text: "Email workspace + optional company context." },
    { step: "02", title: "Dashboard", text: "Command center KPIs and live signal feed." },
    { step: "03", title: "Create monitor", text: "Plain-language Sri Lanka / competitor goal." },
    { step: "04", title: "Check now", text: "Watch Goal → Route → Tools → Decide → Result." },
    { step: "05", title: "Approve HITL", text: "Edit battlecard, then approve before webhook." },
    { step: "06", title: "Live call", text: "Strategy Desk voice Q&A for quick decisions." },
  ];
  return (
    <SlideShell>
      <motion.div variants={item}>
        <Eyebrow>Demo flow</Eyebrow>
        <h2 className="mt-3 font-[family-name:var(--font-heading)] text-4xl font-semibold text-white sm:text-5xl md:text-6xl">
          Judge-ready journey
        </h2>
      </motion.div>
      <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {journey.map((j) => (
          <motion.div key={j.step} variants={item}>
            <Glass className="h-full p-6">
              <p className="font-mono text-sm text-violet-300/80">{j.step}</p>
              <h3 className="mt-3 text-2xl font-semibold text-white">{j.title}</h3>
              <p className="mt-3 text-base text-white/55">{j.text}</p>
            </Glass>
          </motion.div>
        ))}
      </div>
    </SlideShell>
  );
}

function ImpactSlide() {
  const impacts = [
    { value: "Hours → minutes", label: "Research cycle", text: "Agent collects and drafts while teams focus on decisions." },
    { value: "Zero silent CRM", label: "Trust boundary", text: "HITL gate blocks unapproved automation at the API." },
    { value: "Live evidence", label: "Decision quality", text: "Briefs grounded in Exa / Bright Data, not chat fluff." },
    { value: "Voice + monitors", label: "Coverage", text: "Fast spoken strategy plus always-on competitive watches." },
  ];
  return (
    <SlideShell>
      <motion.div variants={item}>
        <Eyebrow>Impact</Eyebrow>
        <h2 className="mt-3 font-[family-name:var(--font-heading)] text-4xl font-semibold text-white sm:text-5xl md:text-6xl">
          Business value in one glance
        </h2>
      </motion.div>
      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {impacts.map((impact) => (
          <motion.div key={impact.label} variants={item}>
            <Glass className="h-full p-7">
              <p className="text-3xl font-semibold tracking-tight text-cyan-200 md:text-4xl">{impact.value}</p>
              <p className="mt-2 text-sm uppercase tracking-[0.2em] text-white/40">{impact.label}</p>
              <p className="mt-4 text-lg text-white/60">{impact.text}</p>
            </Glass>
          </motion.div>
        ))}
      </div>
    </SlideShell>
  );
}

function TechStackSlide() {
  const groups = [
    { title: "App", items: ["Next.js", "TypeScript", "Tailwind", "Framer Motion", "Three.js"] },
    { title: "Intelligence", items: ["AIML", "Featherless", "Speechmatics", "Exa", "Bright Data"] },
    { title: "Platform", items: ["MongoDB", "Webhooks", "Band.io", "Zapier / Slack", "Cloudflare"] },
  ];
  return (
    <SlideShell>
      <motion.div variants={item}>
        <Eyebrow>Tech stack</Eyebrow>
        <h2 className="mt-3 font-[family-name:var(--font-heading)] text-4xl font-semibold text-white sm:text-5xl md:text-6xl">
          Tools behind the agent
        </h2>
      </motion.div>
      <div className="mt-10 grid gap-5 lg:grid-cols-3">
        {groups.map((group) => (
          <motion.div key={group.title} variants={item}>
            <Glass className="h-full p-7">
              <h3 className="text-xl font-semibold text-white">{group.title}</h3>
              <div className="mt-6 flex flex-wrap gap-2">
                {group.items.map((tech) => (
                  <span
                    key={tech}
                    className="rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-sm text-white/70"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </Glass>
          </motion.div>
        ))}
      </div>
    </SlideShell>
  );
}

function FutureSlide() {
  const roadmap = [
    { phase: "Now", items: ["Edit-before-execute", "Agent memory", "Slack battlecards", "Live call fast path"] },
    { phase: "Next", items: ["Slack native approve", "Deeper HubSpot mapping", "Multi-monitor campaigns", "Streaming voice"] },
    { phase: "Later", items: ["Salesforce field sync", "Team approval roles", "Eval harness", "Enterprise SSO"] },
  ];
  return (
    <SlideShell>
      <motion.div variants={item}>
        <Eyebrow>Future</Eyebrow>
        <h2 className="mt-3 font-[family-name:var(--font-heading)] text-4xl font-semibold text-white sm:text-5xl md:text-6xl">
          Roadmap
        </h2>
      </motion.div>
      <div className="mt-10 grid gap-5 lg:grid-cols-3">
        {roadmap.map((block, index) => (
          <motion.div key={block.phase} variants={item}>
            <Glass className="relative h-full overflow-hidden p-7">
              <div
                className={cn(
                  "absolute inset-x-0 top-0 h-1",
                  index === 0 && "bg-cyan-400/70",
                  index === 1 && "bg-violet-400/70",
                  index === 2 && "bg-fuchsia-400/40",
                )}
              />
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/40">{block.phase}</p>
              <ul className="mt-6 space-y-3">
                {block.items.map((entry) => (
                  <li key={entry} className="flex items-start gap-2 text-lg text-white/75">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-300" />
                    {entry}
                  </li>
                ))}
              </ul>
            </Glass>
          </motion.div>
        ))}
      </div>
    </SlideShell>
  );
}

function ClosingSlide() {
  return (
    <SlideShell className="items-center text-center">
      <motion.div variants={item}>
        <Eyebrow>Thank you</Eyebrow>
      </motion.div>
      <motion.h2
        variants={item}
        className="mt-4 font-[family-name:var(--font-heading)] text-5xl font-semibold text-white sm:text-6xl md:text-7xl"
      >
        SANTRA AI
      </motion.h2>
      <motion.p variants={item} className="mt-4 text-2xl text-white/60">
        Prompt Pirates · NeuroX 1.0
      </motion.p>
      <motion.div variants={item} className="mt-10 flex flex-wrap items-center justify-center gap-4">
        <Glass className="px-6 py-4">
          <p className="text-xs uppercase tracking-[0.2em] text-white/40">Live demo</p>
          <p className="mt-1 text-lg text-cyan-200">localhost:3001</p>
        </Glass>
        <Glass className="px-6 py-4">
          <p className="text-xs uppercase tracking-[0.2em] text-white/40">Pitch deck</p>
          <p className="mt-1 text-lg text-violet-200">/pitch</p>
        </Glass>
        <Glass className="flex items-center gap-3 px-6 py-4">
          <GitBranch className="h-5 w-5 text-white/70" />
          <div className="text-left">
            <p className="text-xs uppercase tracking-[0.2em] text-white/40">GitHub</p>
            <p className="mt-1 text-lg text-white/80">Add your repo URL</p>
          </div>
        </Glass>
      </motion.div>
      <motion.div variants={item} className="mt-10 flex flex-wrap justify-center gap-3">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-5 py-2.5 text-sm font-medium text-cyan-100 transition hover:bg-cyan-300/15"
        >
          Open product
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          href="/alerts"
          className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-5 py-2.5 text-sm font-medium text-white/70 transition hover:bg-white/[0.07]"
        >
          GTM Monitors
        </Link>
      </motion.div>
      <motion.p variants={item} className="mt-12 text-sm tracking-[0.22em] text-white/30 uppercase">
        Autonomous GTM · Human approval built in
      </motion.p>
    </SlideShell>
  );
}

const SLIDES = [
  TitleSlide,
  ProblemSlide,
  SolutionSlide,
  FeaturesSlide,
  HowItWorksSlide,
  ArchitectureSlide,
  DemoFlowSlide,
  ImpactSlide,
  TechStackSlide,
  FutureSlide,
  ClosingSlide,
];

const LABELS = [
  "Title",
  "Problem",
  "Solution",
  "Features",
  "How it works",
  "Architecture",
  "Demo",
  "Impact",
  "Stack",
  "Future",
  "Close",
];

export function PitchDeck() {
  const [[index, direction], setPage] = useState([0, 0]);
  const [fullscreen, setFullscreen] = useState(false);

  const go = useCallback((next: number, dir: number) => {
    setPage([Math.max(0, Math.min(TOTAL - 1, next)), dir]);
  }, []);

  const next = useCallback(() => go(index + 1, 1), [go, index]);
  const prev = useCallback(() => go(index - 1, -1), [go, index]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight" || event.key === " " || event.key === "PageDown") {
        event.preventDefault();
        next();
      } else if (event.key === "ArrowLeft" || event.key === "PageUp") {
        event.preventDefault();
        prev();
      } else if (event.key === "Home") {
        event.preventDefault();
        go(0, -1);
      } else if (event.key === "End") {
        event.preventDefault();
        go(TOTAL - 1, 1);
      } else if (event.key === "f" || event.key === "F") {
        const root = document.documentElement;
        if (!document.fullscreenElement) void root.requestFullscreen?.();
        else void document.exitFullscreen?.();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, next, prev]);

  useEffect(() => {
    const onFs = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  const Slide = SLIDES[index]!;

  return (
    <div className="relative min-h-[100dvh] w-full overflow-hidden bg-[#050816] text-white">
      <PitchBackground intensity={index === 0 ? 1.15 : 0.85} />

      <div className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-[1920px] flex-col">
        <header className="flex shrink-0 items-center justify-between px-6 py-4 sm:px-10">
          <div className="flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,0.8)]" />
            <span className="text-xs font-medium tracking-[0.22em] text-white/45 uppercase">
              SANTRA AI · Pitch
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-white/35 sm:inline">
              {String(index + 1).padStart(2, "0")} / {String(TOTAL).padStart(2, "0")} · {LABELS[index]}
            </span>
            <button
              type="button"
              onClick={() => {
                if (!document.fullscreenElement) void document.documentElement.requestFullscreen?.();
                else void document.exitFullscreen?.();
              }}
              className="rounded-xl border border-white/10 bg-white/[0.04] p-2 text-white/60 transition hover:bg-white/[0.08] hover:text-white"
              aria-label={fullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
          </div>
        </header>

        <main className="relative min-h-0 flex-1 aspect-auto md:min-h-[calc(100dvh-7.5rem)]">
          <div className="absolute inset-0 mx-auto w-full max-w-[1920px] md:aspect-video md:max-h-full">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.section
                key={index}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="absolute inset-0 min-h-full"
                aria-label={LABELS[index]}
              >
                <Slide />
              </motion.section>
            </AnimatePresence>
          </div>
        </main>

        <footer className="relative z-20 flex shrink-0 flex-col gap-3 px-6 pb-5 pt-2 sm:px-10">
          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={prev}
              disabled={index === 0}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/65 transition enabled:hover:bg-white/[0.08] disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
              Prev
            </button>

            <div className="flex flex-1 items-center justify-center gap-1.5 sm:gap-2">
              {LABELS.map((label, i) => (
                <button
                  key={label}
                  type="button"
                  aria-label={`Go to ${label}`}
                  onClick={() => go(i, i > index ? 1 : -1)}
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    i === index
                      ? "w-8 bg-gradient-to-r from-cyan-300 to-violet-400"
                      : "w-2.5 bg-white/20 hover:bg-white/40",
                  )}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={next}
              disabled={index === TOTAL - 1}
              className="inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-4 py-2 text-sm text-cyan-50 transition enabled:hover:bg-cyan-300/15 disabled:opacity-30"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <p className="text-center text-[11px] text-white/25">
            ← → or Space to navigate · F for fullscreen
          </p>
        </footer>
      </div>
    </div>
  );
}
