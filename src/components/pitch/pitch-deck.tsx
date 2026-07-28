"use client";

import { AnimatePresence, animate, motion, type Variants } from "framer-motion";
import {
  ArrowRight,
  Bot,
  Brain,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Database,
  Eye,
  FileCheck2,
  Globe2,
  Layers,
  LineChart,
  Mail,
  Maximize2,
  MessageSquare,
  Mic,
  Minimize2,
  Radar,
  Rocket,
  Server,
  ShieldCheck,
  Sparkles,
  Target,
  Timer,
  TrendingUp,
  Users,
  XCircle,
  Zap,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { PitchBackground, type PitchMood } from "@/components/pitch/pitch-background";
import { AppLoginQr, PITCH_TEAM, TeamMemberCard } from "@/components/pitch/pitch-team-qr";
import {
  HitlGateDiagram,
  ProductPreviewFrame,
} from "@/components/pitch/pitch-visuals";
import { BrandLogo } from "@/components/shared/brand-mark";
import { cn } from "@/lib/utils";

const PitchSlideCtx = createContext(0);

function useSlideNumber() {
  return useContext(PitchSlideCtx);
}

const EASE = [0.22, 1, 0.36, 1] as const;

/** No blur on text — short fade/slide only */
const slideVariants: Variants = {
  enter: (dir: number) => ({
    opacity: 0,
    x: dir > 0 ? 40 : -40,
  }),
  center: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.38, ease: EASE },
  },
  exit: (dir: number) => ({
    opacity: 0,
    x: dir > 0 ? -28 : 28,
    transition: { duration: 0.24, ease: [0.4, 0, 1, 1] as const },
  }),
};

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.06 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE } },
};

const itemLeft: Variants = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0, transition: { duration: 0.42, ease: EASE } },
};

const itemRight: Variants = {
  hidden: { opacity: 0, x: 20 },
  show: { opacity: 1, x: 0, transition: { duration: 0.42, ease: EASE } },
};

const itemZoom: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.42, ease: EASE } },
};

const display = "font-[family-name:var(--font-pitch-display)]";
const mono = "font-[family-name:var(--font-pitch-mono)]";

function CountUp({
  value,
  suffix = "",
  prefix = "",
  duration = 1.35,
}: {
  value: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
}) {
  const [displayValue, setDisplayValue] = useState(0);
  useEffect(() => {
    const controls = animate(0, value, {
      duration,
      ease: EASE,
      onUpdate: (v) => setDisplayValue(Math.round(v)),
    });
    return () => controls.stop();
  }, [value, duration]);
  return (
    <span>
      {prefix}
      {displayValue}
      {suffix}
    </span>
  );
}

/** Thin mission panel — used sparingly, not on every block */
function Panel({
  children,
  className,
  accent = false,
}: {
  children: ReactNode;
  className?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative border border-white/[0.1] bg-[#070d1a]/92 backdrop-blur-md",
        accent && "border-cyan-400/30 bg-cyan-400/[0.08]",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Readable surface over radar — solid enough that sweep never washes text */
function Surface({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("relative border border-white/[0.1] bg-[#06101f]/95 p-5 sm:p-6", className)}>
      {children}
    </div>
  );
}

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className={cn(mono, "text-[0.7rem] font-medium uppercase tracking-[0.28em] text-cyan-300 sm:text-xs")}>
      {children}
    </p>
  );
}

/** Per-slide watermark placements — cycles so numbers don’t sit in one corner */
const SLIDE_NUMBER_PLACES = [
  "right-0 top-0 text-[5.5rem] sm:text-[7.5rem] lg:text-[9.5rem]",
  "left-0 top-0 text-[5rem] sm:text-[7rem] lg:text-[8.5rem]",
  "right-0 bottom-2 text-[5.5rem] sm:text-[7.5rem] lg:text-[9rem]",
  "left-0 bottom-2 text-[5rem] sm:text-[6.5rem] lg:text-[8rem]",
  "-right-2 top-1/2 -translate-y-1/2 text-[6rem] sm:text-[8rem] lg:text-[10rem]",
  "-left-2 top-[18%] text-[5.5rem] sm:text-[7.5rem] lg:text-[9rem]",
  "right-[8%] top-[8%] text-[4.5rem] sm:text-[6.5rem] lg:text-[8rem] -rotate-6",
  "left-[6%] bottom-[12%] text-[5rem] sm:text-[7rem] lg:text-[8.5rem] rotate-3",
  "right-[12%] bottom-[20%] text-[5.5rem] sm:text-[7.5rem] lg:text-[9rem] -rotate-3",
  "left-1/2 top-0 -translate-x-1/2 text-[5rem] sm:text-[7rem] lg:text-[8.5rem]",
] as const;

function SlideShell({
  children,
  className,
  showNumber = true,
}: {
  children: ReactNode;
  className?: string;
  /** Large faint slide index watermark (01, 02, …) */
  showNumber?: boolean;
}) {
  const slideNo = useSlideNumber();
  const label = String(slideNo + 1).padStart(2, "0");
  const place = SLIDE_NUMBER_PLACES[slideNo % SLIDE_NUMBER_PLACES.length]!;

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className={cn(
        "relative mx-auto flex h-full min-h-0 w-full max-w-[1480px] flex-col justify-center overflow-y-auto overscroll-contain",
        "px-6 py-5 sm:px-10 sm:py-6 lg:px-12",
      )}
    >
      {showNumber ? (
        <p
          aria-hidden
          className={cn(
            display,
            "pointer-events-none absolute z-0 select-none font-semibold leading-none text-white/[0.045]",
            place,
          )}
        >
          {label}
        </p>
      ) : null}
      <div className={cn("relative z-[1] flex min-h-0 w-full flex-col", className)}>{children}</div>
    </motion.div>
  );
}

function SlideHeading({
  eyebrow,
  title,
  subtitle,
  align = "left",
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
}) {
  return (
    <motion.div variants={item} className={cn(align === "center" && "text-center")}>
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2
        className={cn(
          display,
          "mt-3 max-w-4xl text-3xl font-semibold tracking-tight text-white sm:text-4xl md:text-5xl lg:text-[3.25rem] lg:leading-[1.12]",
          align === "center" && "mx-auto",
        )}
      >
        {title}
      </h2>
      {subtitle ? (
        <p className={cn("mt-4 max-w-2xl text-lg text-white/78 sm:text-xl", align === "center" && "mx-auto")}>
          {subtitle}
        </p>
      ) : null}
    </motion.div>
  );
}

function StepNo({ n }: { n: string }) {
  return <span className={cn(mono, "text-xs tracking-widest text-cyan-300")}>{n}</span>;
}

function Caption({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn(mono, "text-[0.7rem] uppercase tracking-[0.16em] text-white/72", className)}>
      {children}
    </p>
  );
}

function FlowArrow({ className }: { className?: string }) {
  return (
    <motion.div
      animate={{ x: [0, 5, 0], opacity: [0.45, 0.9, 0.45] }}
      transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
      className={className}
    >
      <ArrowRight className="h-5 w-5 shrink-0 text-cyan-300/55" />
    </motion.div>
  );
}

/* ─── 01 Hero ─── */
function TitleSlide() {
  return (
    <SlideShell className="items-center text-center">
      <motion.div variants={itemZoom} className="flex justify-center">
        <BrandLogo className="h-[72px] w-[108px] sm:h-[96px] sm:w-[144px] md:h-[112px] md:w-[168px]" />
      </motion.div>
      <motion.div variants={item} className="mt-5 sm:mt-6">
        <Eyebrow>NeuroX 1.0 · Phase 2 · Mission brief</Eyebrow>
      </motion.div>
      <motion.h1
        variants={itemZoom}
        className={cn(
          display,
          "mt-3 text-5xl font-semibold tracking-tight text-white sm:text-6xl md:text-7xl lg:text-8xl",
        )}
      >
        SANTRA{" "}
        <span className="bg-gradient-to-r from-cyan-200 via-sky-200 to-cyan-400 bg-clip-text text-transparent">
          AI
        </span>
      </motion.h1>
      <motion.p variants={item} className="mx-auto mt-4 max-w-2xl text-lg text-white/75 sm:mt-5 sm:text-xl md:text-2xl">
        Autonomous GTM intelligence for B2B revenue and competitive intel teams
      </motion.p>
      <motion.div variants={item} className="mt-7 flex flex-wrap items-center justify-center gap-3 sm:mt-8">
        <Panel className="inline-flex items-center gap-2.5 px-5 py-2.5">
          <Sparkles className="h-4 w-4 text-cyan-300" />
          <span className="text-sm font-medium text-white/85">Prompt Pirates</span>
        </Panel>
        <span className={cn(mono, "text-xs tracking-[0.18em] text-white/55 uppercase")}>
          NeuroX 2026 · B2B Agentic GTM
        </span>
      </motion.div>
      <motion.div variants={item} className="mt-5 flex flex-wrap justify-center gap-2">
        {[
          { icon: Radar, label: "GTM Monitors" },
          { icon: MessageSquare, label: "Strategy Desk" },
          { icon: FileCheck2, label: "Reports + HITL" },
        ].map((chip) => (
          <span
            key={chip.label}
            className="inline-flex items-center gap-2 border border-cyan-400/25 bg-cyan-400/[0.08] px-3 py-1.5 text-[0.7rem] tracking-wide text-cyan-100"
          >
            <chip.icon className="h-3.5 w-3.5" />
            {chip.label}
          </span>
        ))}
      </motion.div>
    </SlideShell>
  );
}

/* ─── 03 Editorial manifesto + spine ─── */
function ProblemSlide() {
  const points = [
    { icon: Timer, line: "Competitor moves surface days late" },
    { icon: Layers, line: "Intel scattered across Slack and sheets" },
    { icon: ShieldCheck, line: "No trust layer between AI and the CRM" },
  ];
  return (
    <SlideShell>
      <div className="grid gap-10 lg:grid-cols-[1.25fr_0.75fr] lg:gap-14">
        <motion.div variants={itemLeft} className="relative">
          <Eyebrow>The problem</Eyebrow>
          <h2
            className={cn(
              display,
              "mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl md:text-6xl md:leading-[1.08]",
            )}
          >
            Competitive intel is slow —
            <span className="mt-1 block text-white/55">and unsafe to automate</span>
          </h2>
          <p className="mt-8 max-w-2xl border-l border-cyan-400/50 pl-5 text-xl leading-snug text-white/80 md:text-2xl">
            GTM teams make <span className="text-cyan-200">high-stakes decisions</span> on stale intel —
            while AI that could help is{" "}
            <span className="text-sky-200">too risky to plug into the CRM</span> unattended.
          </p>
          <p className={cn(mono, "mt-10 text-[0.7rem] uppercase tracking-[0.22em] text-white/45")}>
            Rivals move first · Battlecards rot · Automation stays banned — until HITL exists
          </p>
        </motion.div>

        <motion.div variants={itemRight} className="relative pl-6 sm:pl-8">
          <div className="absolute bottom-3 left-0 top-3 w-px bg-gradient-to-b from-cyan-400/70 via-cyan-400/25 to-transparent" />
          <ul className="space-y-8">
            {points.map((row, i) => (
              <li key={row.line} className="relative">
                <span className="absolute -left-[1.55rem] top-1.5 h-2.5 w-2.5 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,0.7)] sm:-left-[1.8rem]" />
                <p className={cn(mono, "text-[0.65rem] tracking-[0.28em] text-cyan-300/80")}>
                  {String(i + 1).padStart(2, "0")}
                </p>
                <div className="mt-2 flex items-start gap-3">
                  <row.icon className="mt-0.5 h-4 w-4 shrink-0 text-white/40" />
                  <p className="text-lg leading-snug text-white/90 sm:text-xl">{row.line}</p>
                </div>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </SlideShell>
  );
}

/* ─── 03 Open telemetry strip (no card grid) ─── */
function CurrentPainSlide() {
  const stats = [
    { value: 30, suffix: "h", label: "Wasted / week" },
    { value: 68, suffix: "%", label: "Changes too late" },
    { value: 4, suffix: "d", label: "Sales lag" },
  ];
  const pains = [
    { icon: Timer, title: "Manual research", text: "15–30 hrs/week on rival pages, jobs, pricing." },
    { icon: Eye, title: "Missed signals", text: "Pricing and hiring moves land too late." },
    { icon: Layers, title: "Stale battlecards", text: "Intel dies in Slack and sheets." },
    { icon: ShieldCheck, title: "Risky automation", text: "CRM workflows blocked without control." },
  ];
  return (
    <SlideShell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow>Current pain</Eyebrow>
          <h2 className={cn(display, "mt-3 text-3xl font-semibold text-white sm:text-4xl md:text-5xl")}>
            What teams live with today
          </h2>
        </div>
        <motion.p variants={item} className={cn(mono, "text-[0.65rem] uppercase tracking-[0.2em] text-white/40")}>
          Illustrative · before SANTRA
        </motion.p>
      </div>

      {/* Giant open metrics — no boxes */}
      <div className="mt-10 grid gap-8 border-y border-white/[0.08] py-8 sm:grid-cols-3 sm:gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            variants={itemZoom}
            className={cn(i > 0 && "sm:border-l sm:border-white/[0.08] sm:pl-8")}
          >
            <p className={cn(display, "text-5xl font-semibold tracking-tight text-white md:text-6xl")}>
              <CountUp value={stat.value} suffix={stat.suffix} />
            </p>
            <Caption className="mt-3 text-white/55">{stat.label}</Caption>
          </motion.div>
        ))}
      </div>

      {/* Inline before/after bars — open, not boxed */}
      <motion.div variants={item} className="mt-10">
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <p className={cn(mono, "text-[0.7rem] uppercase tracking-[0.16em] text-white/55")}>
            Hours / week on competitive research
          </p>
          <p className="text-sm text-cyan-200/90">~7× less with SANTRA</p>
        </div>
        <div className="space-y-4">
          {[
            { label: "Manual", value: 28, max: 30, tone: "bg-white/30" },
            { label: "SANTRA", value: 4, max: 30, tone: "bg-cyan-400" },
          ].map((row) => (
            <div key={row.label} className="grid grid-cols-[4.5rem_1fr_2.5rem] items-center gap-3">
              <span className="text-sm text-white/65">{row.label}</span>
              <div className="h-2 overflow-hidden bg-white/[0.06]">
                <motion.div
                  className={cn("h-full", row.tone)}
                  initial={{ width: 0 }}
                  animate={{ width: `${(row.value / row.max) * 100}%` }}
                  transition={{ duration: 1.1, ease: EASE, delay: 0.12 }}
                />
              </div>
              <span className={cn(display, "text-right text-sm font-semibold text-cyan-200")}>{row.value}h</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Icon rail */}
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {pains.map((pain) => (
          <motion.div key={pain.title} variants={item} className="border-t border-cyan-400/25 pt-4">
            <pain.icon className="h-5 w-5 text-cyan-300" />
            <h3 className={cn(display, "mt-3 text-base font-semibold text-white")}>{pain.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-white/65">{pain.text}</p>
          </motion.div>
        ))}
      </div>
    </SlideShell>
  );
}

/* ─── Solution — four landing platform pillars ─── */
function SolutionSlide() {
  const pillars = [
    {
      icon: Radar,
      title: "GTM Competitive Monitors",
      text: "Describe what to watch in plain language. The agent interprets intent, collects evidence, and queues actions.",
    },
    {
      icon: Target,
      title: "Competitor Intelligence",
      text: "Battlecards, pricing shifts, hiring signals, and differentiation playbooks for B2B GTM teams.",
    },
    {
      icon: Eye,
      title: "Change Detection",
      text: "Snapshot diffs catch material pricing, packaging, and positioning changes before they hit live deals.",
    },
    {
      icon: ShieldCheck,
      title: "Human-in-the-Loop",
      text: "Approve or dismiss proposed CRM / webhook automation — nothing executes unattended.",
    },
  ];
  return (
    <SlideShell>
      <SlideHeading
        eyebrow="The solution"
        title="Monitor → evidence → brief → approve"
        subtitle="SANTRA is not another passive chatbot. It runs the competitive loop with humans at the gate."
      />
      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {pillars.map((p) => (
          <motion.div key={p.title} variants={item}>
            <Surface className="h-full !p-5 sm:!p-6">
              <p.icon className="h-6 w-6 text-cyan-300" />
              <h3 className={cn(display, "mt-4 text-lg font-semibold text-white")}>{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/72">{p.text}</p>
            </Surface>
          </motion.div>
        ))}
      </div>
    </SlideShell>
  );
}

/* ─── Audience — hero rotation audiences ─── */
function TargetUsersSlide() {
  const users = [
    { icon: LineChart, title: "RevOps", need: "/dashboard", text: "Command Center for signals and approvals before automation fires." },
    { icon: Target, title: "Competitive intel", need: "/alerts", text: "GTM Monitors with live web evidence and change detection." },
    { icon: Rocket, title: "Sales ops / SaaS GTM", need: "/chat", text: "Strategy Desk Ask + Market modes for competitor and ICP questions." },
    { icon: Users, title: "Enablement leads", need: "/reports", text: "Risk-scored briefs and battlecards after human sign-off." },
  ];
  return (
    <SlideShell>
      <SlideHeading
        eyebrow="Target users"
        title="Who opens SANTRA every day"
        subtitle="One workspace — Command Center, Monitors, Strategy Desk, Reports."
      />
      <div className="mt-12 grid gap-px overflow-hidden border border-white/[0.08] bg-white/[0.07] sm:grid-cols-2 xl:grid-cols-4">
        {users.map((user) => (
          <motion.div key={user.title} variants={item} className="bg-[#070d1a] p-6 sm:p-7">
            <user.icon className="h-7 w-7 text-cyan-300" />
            <h3 className={cn(display, "mt-5 text-xl font-semibold text-white")}>{user.title}</h3>
            <p className={cn(mono, "mt-2 text-[0.65rem] uppercase tracking-[0.2em] text-cyan-300/70")}>
              {user.need}
            </p>
            <p className="mt-4 text-sm leading-relaxed text-white/72">{user.text}</p>
          </motion.div>
        ))}
      </div>
    </SlideShell>
  );
}

/* ─── Workspace modules (from product surface) ─── */
function CoreFeaturesSlide() {
  const modules = [
    { icon: Layers, route: "/dashboard", title: "Command Center", text: "Workspace home — monitor status, risk snapshot, what needs approval." },
    { icon: MessageSquare, route: "/chat", title: "Strategy Desk", text: "Ask and Market modes: chat, research agent, and optional live voice." },
    { icon: Radar, route: "/alerts", title: "GTM Monitors", text: "Plain-language watches, Check now, timeline diffs, approval inbox." },
    { icon: FileCheck2, route: "/reports", title: "Reports", text: "Executive briefs with risk %, confidence, evidence, and claims." },
    { icon: Server, route: "/settings", title: "Settings", text: "Voice, display, privacy, and integration health checks." },
    { icon: Mail, route: "Email watch", title: "Background email", text: "Scheduled re-checks via Resend — 30m to daily intervals." },
  ];
  return (
    <SlideShell>
      <SlideHeading
        eyebrow="Product surface"
        title="Five modules. One agent loop."
        subtitle="Exactly what ships in the live workspace — not a feature laundry list."
      />
      <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {modules.map((m) => (
          <motion.div key={m.title} variants={item}>
            <Surface className="h-full !p-5">
              <div className="flex items-center justify-between gap-3">
                <m.icon className="h-5 w-5 text-cyan-300" />
                <span className={cn(mono, "text-[0.6rem] tracking-wider text-white/40")}>{m.route}</span>
              </div>
              <h3 className={cn(display, "mt-3 text-base font-semibold text-white")}>{m.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-white/70">{m.text}</p>
            </Surface>
          </motion.div>
        ))}
      </div>
    </SlideShell>
  );
}

/* ─── Monitor lifecycle deep dive (unique to this slide) ─── */
function FeatureDeepDiveSlide() {
  const stages = [
    { icon: Radar, title: "Create watch", text: "Describe a B2B competitive signal in plain language on /alerts." },
    { icon: Globe2, title: "Check now", text: "Agent routes Bright Data / Exa tools and logs stages in Activity." },
    { icon: Eye, title: "Timeline + diffs", text: "Snapshot history shows what changed between checks." },
    { icon: Mail, title: "Email watch", text: "Optional background cadence emails digests via Resend + cron." },
    { icon: FileCheck2, title: "Approval inbox", text: "Edit the brief, then approve webhook / Slack delivery." },
    { icon: Mic, title: "Strategy Desk", text: "Follow up in Ask/Market — or start a live voice call." },
  ];
  return (
    <SlideShell>
      <SlideHeading
        eyebrow="Monitor deep dive"
        title="From watch goal to approved send"
        subtitle="The GTM Monitors path — one slide, one workflow."
      />
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stages.map((s, i) => (
          <motion.div key={s.title} variants={item}>
            <div className="border-t border-cyan-400/30 pt-4">
              <StepNo n={String(i + 1).padStart(2, "0")} />
              <div className="mt-3 flex items-center gap-2">
                <s.icon className="h-4 w-4 text-cyan-300" />
                <h3 className={cn(display, "text-base font-semibold text-white")}>{s.title}</h3>
              </div>
              <p className="mt-2 text-sm text-white/70">{s.text}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </SlideShell>
  );
}

/* ─── Agent loop from README ─── */
function HowItWorksSlide() {
  const steps = [
    { label: "Goal intake", sub: "Plain-language monitor" },
    { label: "Intent", sub: "Category · severity · query" },
    { label: "Tool routing", sub: "Bright Data · Exa" },
    { label: "Change detect", sub: "Snapshot diffs" },
    { label: "Synthesis", sub: "Brief · risks · plan" },
    { label: "HITL", sub: "Approve before webhook" },
  ];
  return (
    <SlideShell>
      <SlideHeading
        eyebrow="Agent loop"
        title="How SANTRA runs a check"
        subtitle="The same six stages documented in the product README — from goal to human approval."
      />
      <motion.div variants={item} className="mt-12">
        <div className="hidden items-stretch lg:flex">
          {steps.map((step, index) => (
            <div key={step.label} className="flex flex-1 items-center">
              <div className="w-full border border-white/[0.1] bg-[#070d1a]/95 px-3 py-5 text-center">
                <StepNo n={String(index + 1).padStart(2, "0")} />
                <h3 className={cn(display, "mt-2 text-sm font-semibold text-white xl:text-base")}>
                  {step.label}
                </h3>
                <p className="mt-1 text-xs text-white/75 xl:text-sm">{step.sub}</p>
              </div>
              {index < steps.length - 1 && <FlowArrow className="mx-1 shrink-0" />}
            </div>
          ))}
        </div>
        <div className="space-y-3 lg:hidden">
          {steps.map((step, index) => (
            <div key={step.label} className="flex items-center gap-4 border border-white/[0.1] bg-[#070d1a]/95 px-4 py-3">
              <StepNo n={String(index + 1).padStart(2, "0")} />
              <div>
                <h3 className={cn(display, "font-semibold text-white")}>{step.label}</h3>
                <p className="text-xs text-white/75">{step.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </SlideShell>
  );
}

/* ─── Use case — real product routes ─── */
function UseCaseSlide() {
  const journey = [
    { step: "01", title: "Create monitor", text: "On /alerts: “Watch competitor pricing page for packaging changes.”" },
    { step: "02", title: "Check now", text: "Tools collect live pages; Activity log shows routing stages." },
    { step: "03", title: "Report lands", text: "/reports shows risk %, confidence, evidence, and claims." },
    { step: "04", title: "Human approves", text: "Edit the brief in the approval panel — then send webhook." },
    { step: "05", title: "Ask on Strategy Desk", text: "/chat Ask mode: “How should sales counter this move?”" },
    { step: "06", title: "Optional live call", text: "Speechmatics voice path when the room needs spoken Q&A." },
  ];
  return (
    <SlideShell>
      <SlideHeading
        eyebrow="Use case"
        title="Pricing change → approved battlecard"
        subtitle="A path you can demo on the live app — every step maps to a real screen."
      />
      <div className="mt-8 relative">
        <div className="absolute bottom-2 left-[11px] top-2 w-px bg-gradient-to-b from-cyan-400/50 via-cyan-400/20 to-transparent sm:left-[15px]" />
        <div className="grid gap-4 lg:grid-cols-2">
          {journey.map((j, i) => (
            <motion.div key={j.step} variants={i % 2 === 0 ? itemLeft : itemRight} className="flex gap-5 sm:gap-7">
              <div className="relative z-10 mt-1.5 h-3 w-3 shrink-0 rounded-full border-2 border-cyan-300 bg-[#030712] sm:mt-2 sm:h-4 sm:w-4" />
              <div className="min-w-0 flex-1 border-b border-white/[0.08] pb-4">
                <div className="flex flex-wrap items-baseline gap-3">
                  <StepNo n={j.step} />
                  <h3 className={cn(display, "text-lg font-semibold text-white")}>{j.title}</h3>
                </div>
                <p className="mt-1.5 text-sm text-white/72">{j.text}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </SlideShell>
  );
}

/* ─── Intelligence providers (product-named) ─── */
function AIIntelligenceSlide() {
  const layers = [
    { icon: Bot, title: "AIML / OpenAI-compatible", text: "Frontier models draft briefs, score risk, and synthesize actions." },
    { icon: Brain, title: "Featherless routing", text: "Intent models classify watch goals and choose tool paths." },
    { icon: Mic, title: "Speechmatics", text: "Realtime STT + TTS for Strategy Desk live call." },
    { icon: Globe2, title: "Exa + Bright Data", text: "Live web evidence — SERP, unlocker, and search grounding." },
    { icon: Mail, title: "Resend", text: "Background email watch digests on cron schedules." },
    { icon: Database, title: "MongoDB Atlas", text: "Monitors, reports, chats, and approval history persist here." },
  ];
  return (
    <SlideShell>
      <SlideHeading
        eyebrow="Intelligence stack"
        title="Providers wired into the agent"
        subtitle="Named integrations from Settings health and the product README."
      />
      <div className="mt-8 grid gap-3 md:grid-cols-2">
        {layers.map((layer) => (
          <motion.div key={layer.title} variants={itemZoom}>
            <Surface className="flex gap-4 !py-4">
              <layer.icon className="mt-0.5 h-6 w-6 shrink-0 text-cyan-300" />
              <div>
                <h3 className={cn(display, "text-lg font-semibold text-white")}>{layer.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-white/72">{layer.text}</p>
              </div>
            </Surface>
          </motion.div>
        ))}
      </div>
    </SlideShell>
  );
}

/* ─── Architecture ─── */
function ArchitectureSlide() {
  const layers = [
    { icon: Layers, title: "Frontend", items: "Next.js 15 · React 19 · Tailwind · Framer Motion · R3F" },
    { icon: Server, title: "API & agent", items: "Route handlers · Monitor check · HITL gate · Rate limits" },
    { icon: Database, title: "Data", items: "MongoDB Atlas · Reports · Pending actions · Threads" },
    { icon: Brain, title: "Models & voice", items: "AIML · Featherless · Speechmatics" },
    { icon: Globe2, title: "Evidence & alerts", items: "Exa · Bright Data · Resend · HTTPS webhooks" },
  ];
  return (
    <SlideShell>
      <SlideHeading eyebrow="Architecture" title="What the production stack looks like" />
      <div className="mt-10 mx-auto w-full max-w-3xl space-y-2">
        {layers.map((layer, i) => (
          <motion.div
            key={layer.title}
            variants={item}
            className="flex items-center gap-5 border border-white/[0.08] bg-[#0a1224]/75 px-5 py-4"
            style={{ marginLeft: `${i * 8}px`, marginRight: `${(layers.length - 1 - i) * 8}px` }}
          >
            <layer.icon className="h-5 w-5 shrink-0 text-cyan-300" />
            <div className="min-w-0 flex-1 sm:flex sm:items-baseline sm:justify-between sm:gap-4">
              <h3 className={cn(display, "text-base font-semibold text-white")}>{layer.title}</h3>
              <p className={cn(mono, "mt-1 text-xs text-white/65 sm:mt-0 sm:text-right")}>{layer.items}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </SlideShell>
  );
}

/* ─── Unique — product wedge only ─── */
function UniquePointSlide() {
  const impacts = [
    { value: "Not a chatbot", label: "Positioning", text: "Runs monitors end-to-end — not Q&A only.", side: "left" as const },
    { value: "Edit → approve", label: "HITL inbox", text: "Reports stay drafts until a human ships them.", side: "left" as const },
    { value: "Live web proof", label: "Evidence", text: "Exa + Bright Data ground every brief.", side: "right" as const },
    { value: "Ask · Market · Voice", label: "Strategy Desk", text: "Chat, ICP validation, and Speechmatics call.", side: "right" as const },
  ];
  const left = impacts.filter((i) => i.side === "left");
  const right = impacts.filter((i) => i.side === "right");

  return (
    <SlideShell>
      <div className="text-center">
        <Eyebrow>Unique point</Eyebrow>
        <h2 className={cn(display, "mx-auto mt-3 max-w-4xl text-3xl font-semibold text-white sm:text-4xl md:text-5xl")}>
          Autonomous research. <span className="text-cyan-300">Human execution gate.</span>
        </h2>
      </div>

      <div className="mt-10 grid items-center gap-6 lg:grid-cols-[1fr_minmax(220px,280px)_1fr] lg:gap-4">
        <div className="space-y-8 lg:space-y-10 lg:pr-4 lg:text-right">
          {left.map((impact) => (
            <motion.div key={impact.label} variants={itemLeft}>
              <p className={cn(display, "text-xl font-semibold text-cyan-200 sm:text-2xl")}>{impact.value}</p>
              <p className={cn(mono, "mt-1 text-[0.65rem] uppercase tracking-[0.2em] text-white/45")}>
                {impact.label}
              </p>
              <p className="mt-1.5 text-sm text-white/70">{impact.text}</p>
            </motion.div>
          ))}
        </div>

        <motion.div variants={itemZoom} className="relative mx-auto w-full max-w-[280px]">
          <div className="absolute inset-[-12%] rounded-full border border-cyan-400/15" />
          <div className="absolute inset-[-24%] rounded-full border border-dashed border-white/[0.06]" />
          <HitlGateDiagram className="relative border-cyan-400/25 bg-[#070d1a]/80" />
        </motion.div>

        <div className="space-y-8 lg:space-y-10 lg:pl-4">
          {right.map((impact) => (
            <motion.div key={impact.label} variants={itemRight}>
              <p className={cn(display, "text-xl font-semibold text-cyan-200 sm:text-2xl")}>{impact.value}</p>
              <p className={cn(mono, "mt-1 text-[0.65rem] uppercase tracking-[0.2em] text-white/45")}>
                {impact.label}
              </p>
              <p className="mt-1.5 text-sm text-white/70">{impact.text}</p>
            </motion.div>
          ))}
        </div>
      </div>

      <motion.p
        variants={item}
        className="mx-auto mt-10 max-w-3xl text-center text-base leading-relaxed text-white/70 sm:text-lg"
      >
        Deploy GTM intelligence with human control — without another passive chatbot.
      </motion.p>
    </SlideShell>
  );
}

/* ─── Compare ─── */
function CompetitiveEdgeSlide() {
  const rows = [
    {
      label: "ChatGPT-style copilots",
      icon: MessageSquare,
      points: ["Answers in chat only", "No monitor cadence", "No approval inbox"],
      ours: false,
    },
    {
      label: "Zapier-style automation",
      icon: Zap,
      points: ["Can write systems silently", "Weak evidence trail", "Hard to trust for GTM"],
      ours: false,
    },
    {
      label: "SANTRA AI",
      icon: ShieldCheck,
      points: ["Monitors + live web evidence", "HITL before webhook/CRM", "Strategy Desk + reports"],
      ours: true,
    },
  ];
  return (
    <SlideShell>
      <SlideHeading eyebrow="Competitive edge" title="Why not ChatGPT or Zapier alone?" />
      <div className="mt-10 grid gap-4 lg:grid-cols-3">
        {rows.map((row) => (
          <motion.div key={row.label} variants={item}>
            <Panel accent={row.ours} className="h-full p-6 sm:p-7">
              <div className="flex items-center gap-3">
                <row.icon className={cn("h-6 w-6", row.ours ? "text-cyan-300" : "text-white/35")} />
                <h3 className={cn(display, "text-lg font-semibold text-white")}>{row.label}</h3>
              </div>
              <ul className="mt-6 space-y-3">
                {row.points.map((c) => (
                  <li key={c} className="flex items-center gap-2 text-sm text-white/75">
                    {row.ours ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-cyan-300" />
                    ) : (
                      <XCircle className="h-4 w-4 shrink-0 text-white/25" />
                    )}
                    {c}
                  </li>
                ))}
              </ul>
            </Panel>
          </motion.div>
        ))}
      </div>
    </SlideShell>
  );
}

/* ─── Product capability metrics (from landing) ─── */
function MarketSlide() {
  const markets = [
    { value: 94, suffix: "%", label: "Evidence accuracy (landing claim)" },
    { value: 30, suffix: "s", label: "Typical monitor check target" },
    { value: 3, suffix: "+", label: "External evidence tools" },
    { value: 24, suffix: "/7", label: "Monitor cadence positioning" },
  ];
  return (
    <SlideShell>
      <SlideHeading
        eyebrow="Product signals"
        title="What we put on the live site"
        subtitle="Marketing metrics from santra-ai-neurox.vercel.app — not third-party market research."
      />
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {markets.map((m) => (
          <motion.div key={m.label} variants={itemZoom} className="border-t border-cyan-400/40 pt-5">
            <p className={cn(display, "text-4xl font-semibold tracking-tight text-cyan-200 md:text-5xl")}>
              <CountUp value={m.value} suffix={m.suffix} />
            </p>
            <Caption className="mt-3">{m.label}</Caption>
          </motion.div>
        ))}
      </div>
      <motion.p variants={item} className="mt-10 flex items-start gap-3 text-lg text-white/78">
        <TrendingUp className="mt-1 h-5 w-5 shrink-0 text-cyan-300" />
        <span>
          Category thesis: revenue teams need <span className="text-cyan-200">autonomous research</span> with{" "}
          <span className="text-sky-200">HITL control</span> — that is the SANTRA wedge.
        </span>
      </motion.p>
    </SlideShell>
  );
}

/* ─── 15 Why now — numbered manifesto ─── */
function WhyNowSlide() {
  const reasons = [
    { title: "GTM teams are shrinking", text: "Cover more competitors with fewer analysts." },
    { title: "Agents finally work", text: "Tool-using models research and draft reliably — trust was missing." },
    { title: "Trust is the moat", text: "Whoever solves safe execution first owns the workflow. HITL is that answer." },
  ];
  return (
    <SlideShell>
      <SlideHeading eyebrow="Why now" title="The window for trusted agents is open" />
      <div className="mt-12 space-y-0">
        {reasons.map((reason, i) => (
          <motion.div
            key={reason.title}
            variants={item}
            className="grid gap-4 border-t border-white/[0.08] py-7 sm:grid-cols-[100px_1fr] sm:gap-10"
          >
            <span className={cn(display, "text-4xl font-semibold text-cyan-300/55")}>
              {String(i + 1).padStart(2, "0")}
            </span>
            <div>
              <h3 className={cn(display, "text-2xl font-semibold text-white")}>{reason.title}</h3>
              <p className="mt-2 max-w-2xl text-base text-white/72">{reason.text}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </SlideShell>
  );
}

/* ─── Demo path — real app routes ─── */
function DemoJourneySlide() {
  const journey = [
    { step: "01", title: "Sign in", text: "/sign-in — email or GitHub / Google OAuth." },
    { step: "02", title: "Command Center", text: "/dashboard — signal overview and what needs approval." },
    { step: "03", title: "Create monitor", text: "/alerts — plain-language competitive watch." },
    { step: "04", title: "Check + report", text: "Run Check now → open /reports for risk & evidence." },
    { step: "05", title: "Approve send", text: "Edit brief in HITL panel → fire webhook / Slack." },
    { step: "06", title: "Strategy Desk", text: "/chat Ask or Market — optional Speechmatics live call." },
  ];
  return (
    <SlideShell>
      <SlideHeading
        eyebrow="Demo path"
        title="Walk the live product"
        subtitle="Every step is a real route on santra-ai-neurox.vercel.app."
      />
      <div className="mt-10 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {journey.map((j) => (
          <motion.div
            key={j.step}
            variants={item}
            className="group relative overflow-hidden border border-white/[0.08] bg-[#0a1224]/60 p-6"
          >
            <div className="absolute inset-y-0 left-0 w-0.5 bg-cyan-400/0 transition group-hover:bg-cyan-400/60" />
            <StepNo n={j.step} />
            <h3 className={cn(display, "mt-3 text-xl font-semibold text-white")}>{j.title}</h3>
            <p className="mt-2 text-sm text-white/72">{j.text}</p>
          </motion.div>
        ))}
      </div>
    </SlideShell>
  );
}

/* ─── Tech from README ─── */
function TechStackSlide() {
  const groups = [
    { title: "App", items: ["Next.js 15", "React 19", "TypeScript", "Tailwind", "Framer Motion", "Recharts"] },
    { title: "Intelligence", items: ["AIML", "Featherless", "Speechmatics", "Exa", "Bright Data"] },
    { title: "Platform", items: ["MongoDB Atlas", "Resend", "HTTPS webhooks", "GitHub / Google OAuth", "Vercel"] },
  ];
  return (
    <SlideShell>
      <SlideHeading
        eyebrow="Tech stack"
        title="What we ship on"
        subtitle="Canonical stack from the product README — Mongo primary, Vercel deploy."
      />
      <div className="mt-10 space-y-8">
        {groups.map((group) => (
          <motion.div key={group.title} variants={item} className="grid gap-4 sm:grid-cols-[140px_1fr] sm:items-start">
            <h3 className={cn(mono, "text-xs uppercase tracking-[0.24em] text-cyan-300/70")}>{group.title}</h3>
            <div className="flex flex-wrap gap-2">
              {group.items.map((tech) => (
                <span
                  key={tech}
                  className={cn(
                    mono,
                    "border border-white/[0.1] bg-white/[0.03] px-3 py-1.5 text-xs tracking-wide text-white/75",
                  )}
                >
                  {tech}
                </span>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </SlideShell>
  );
}

/* ─── Roadmap — shipped vs next ─── */
function FutureScopeSlide() {
  const roadmap = [
    {
      phase: "Shipped now",
      tone: "border-cyan-400/50",
      items: [
        "GTM Monitors + Check now",
        "HITL approval inbox / report panel",
        "Strategy Desk Ask + Market",
        "Speechmatics live call",
        "Background email watches (Resend)",
        "Reports with risk / confidence / evidence",
      ],
    },
    {
      phase: "Next",
      tone: "border-sky-400/40",
      items: [
        "Native Slack approve buttons",
        "Deeper HubSpot field mapping",
        "Multi-monitor campaigns",
        "Shared team workspaces",
        "Trend alert thresholds",
        "Streaming voice UX polish",
      ],
    },
    {
      phase: "Later",
      tone: "border-white/20",
      items: [
        "Salesforce field sync",
        "Team approval roles",
        "Enterprise SSO",
        "Eval harness & scorecards",
        "Mobile alert companion",
        "Watch template marketplace",
      ],
    },
  ];
  return (
    <SlideShell>
      <SlideHeading
        eyebrow="Roadmap"
        title="What is live vs what is next"
        subtitle="HubSpot / Salesforce / SSO stay in Next/Later — not claimed as shipping today."
      />
      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        {roadmap.map((block) => (
          <motion.div key={block.phase} variants={item} className={cn("border-t-2 pt-5", block.tone)}>
            <p className={cn(mono, "text-xs uppercase tracking-[0.24em] text-white/60")}>{block.phase}</p>
            <ul className="mt-5 space-y-2.5">
              {block.items.map((entry) => (
                <li key={entry} className="flex items-start gap-2 text-sm text-white/75">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-cyan-300" />
                  {entry}
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>
    </SlideShell>
  );
}

/* ─── 19 Team hero ─── */
function TeamSlide() {
  return (
    <SlideShell>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-10">
        <div className="min-w-0 flex-1">
          <SlideHeading eyebrow="The team" title="Prompt Pirates" subtitle="Building trusted GTM agents for NeuroX 1.0 — Phase 2." />
          <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {PITCH_TEAM.map((member) => (
              <motion.div key={member.name} variants={itemZoom}>
                <TeamMemberCard member={member} />
              </motion.div>
            ))}
          </div>
        </div>
        <motion.div
          variants={itemRight}
          className="mx-auto w-full max-w-[220px] shrink-0 border border-white/[0.1] bg-[#070d1a]/90 px-4 py-5 lg:mx-0 lg:mt-10"
        >
          <AppLoginQr size={148} label="Scan to open app" />
        </motion.div>
      </div>
    </SlideShell>
  );
}

/* ─── Live demo — production app ─── */
function LiveDemoSlide() {
  return (
    <SlideShell>
      <div className="grid items-center gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:gap-10">
        <motion.div variants={itemLeft}>
          <BrandLogo className="h-[56px] w-[84px] sm:h-[72px] sm:w-[108px]" />
          <div className="mt-5">
            <Eyebrow>Live product</Eyebrow>
          </div>
          <h2
            className={cn(
              display,
              "mt-3 text-4xl font-semibold tracking-tight text-white sm:text-5xl md:text-6xl",
            )}
          >
            Open the real app
          </h2>
          <p className="mt-4 max-w-md text-lg text-white/75">
            /alerts → /reports → /chat on the production deploy — not localhost.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a
              href="https://santra-ai-neurox.vercel.app/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-3 border border-cyan-300/40 bg-cyan-400/15 px-6 py-3.5 text-sm font-medium text-cyan-50 transition hover:bg-cyan-400/25"
            >
              <Radar className="h-5 w-5 text-cyan-300" />
              santra-ai-neurox.vercel.app
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {[
              { icon: Radar, label: "GTM Monitors" },
              { icon: FileCheck2, label: "Reports" },
              { icon: MessageSquare, label: "Strategy Desk" },
              { icon: Layers, label: "Command Center" },
            ].map((chip) => {
              const Icon = chip.icon;
              return (
                <span
                  key={chip.label}
                  className={cn(
                    mono,
                    "inline-flex items-center gap-2 border border-cyan-400/25 bg-cyan-400/[0.08] px-3 py-1.5 text-[0.7rem] tracking-wide text-cyan-100",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {chip.label}
                </span>
              );
            })}
          </div>
        </motion.div>
        <motion.div variants={itemRight}>
          <ProductPreviewFrame className="h-[320px] sm:h-[360px]" />
        </motion.div>
      </div>
    </SlideShell>
  );
}

/* ─── Close — large left / right closing frame ─── */
function ConclusionSlide() {
  return (
    <SlideShell>
      <div className="mx-auto grid w-full max-w-6xl items-center gap-8 lg:grid-cols-[1.2fr_auto] lg:gap-12">
        <div className="min-w-0">
          <motion.div variants={itemLeft}>
            <Eyebrow>Mission complete</Eyebrow>
          </motion.div>
          <motion.h2
            variants={itemZoom}
            className={cn(
              display,
              "mt-3 text-6xl font-semibold tracking-tight text-white sm:text-7xl md:text-8xl md:leading-[0.95]",
            )}
          >
            Thank you
          </motion.h2>
          <motion.p variants={item} className="mt-4 text-3xl font-semibold sm:text-4xl">
            <span className="text-white">SANTRA</span>{" "}
            <span className="bg-gradient-to-r from-cyan-200 to-sky-400 bg-clip-text text-transparent">AI</span>
          </motion.p>
          <motion.p variants={item} className="mt-4 max-w-xl text-lg text-white/65 sm:text-xl">
            Prompt Pirates · NeuroX 1.0 — autonomous GTM intelligence with humans in the loop.
          </motion.p>

          <motion.div variants={item} className="mt-8 flex items-center gap-4">
            <div className="flex -space-x-3">
              {PITCH_TEAM.map((m) => (
                <div
                  key={m.name}
                  title={m.name}
                  className={cn(
                    "relative flex h-14 w-14 items-center justify-center overflow-hidden border-2 border-[#030712] text-sm font-semibold text-cyan-50 sm:h-16 sm:w-16",
                    !m.photo && `bg-gradient-to-br ${m.accent}`,
                  )}
                >
                  {m.photo ? (
                    <Image
                      src={m.photo}
                      alt={m.name}
                      fill
                      className="object-cover object-[center_20%]"
                      sizes="64px"
                    />
                  ) : (
                    m.initials
                  )}
                </div>
              ))}
            </div>
            <p className={cn(mono, "text-xs uppercase tracking-[0.2em] text-white/50 sm:text-sm")}>
              Prompt Pirates
            </p>
          </motion.div>

          <motion.div variants={item} className="mt-10 flex flex-wrap gap-4">
            <a
              href="https://santra-ai-neurox.vercel.app/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2.5 border border-cyan-300/45 bg-cyan-400/20 px-8 py-4 text-base font-medium text-cyan-50 transition hover:bg-cyan-400/30"
            >
              Open live app <ArrowRight className="h-5 w-5" />
            </a>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 border border-white/20 bg-transparent px-8 py-4 text-base text-white/80 transition hover:bg-white/[0.06]"
            >
              Dashboard
            </Link>
          </motion.div>
        </div>

        <motion.div variants={itemRight} className="relative mx-auto w-full max-w-[300px] lg:mx-0">
          <div className="absolute -inset-10 rounded-full bg-cyan-400/[0.08] blur-3xl" aria-hidden />
          <div className="relative border border-cyan-300/35 bg-[#050b16]/95 px-7 py-8">
            <AppLoginQr size={220} label="Scan to open live app" />
          </div>
        </motion.div>
      </div>
    </SlideShell>
  );
}

const SLIDES = [
  TitleSlide,
  TeamSlide,
  ProblemSlide,
  CurrentPainSlide,
  SolutionSlide,
  TargetUsersSlide,
  CoreFeaturesSlide,
  FeatureDeepDiveSlide,
  HowItWorksSlide,
  UseCaseSlide,
  AIIntelligenceSlide,
  ArchitectureSlide,
  UniquePointSlide,
  CompetitiveEdgeSlide,
  MarketSlide,
  WhyNowSlide,
  DemoJourneySlide,
  TechStackSlide,
  FutureScopeSlide,
  LiveDemoSlide,
  ConclusionSlide,
];

const LABELS = [
  "Title",
  "Team",
  "Problem",
  "Current Pain",
  "Solution",
  "Target Users",
  "Core Features",
  "Monitors",
  "Agent Loop",
  "Use Case",
  "AI Layer",
  "Architecture",
  "Unique Point",
  "Edge",
  "Signals",
  "Why Now",
  "Demo Path",
  "Tech Stack",
  "Roadmap",
  "Live Demo",
  "Conclusion",
];

const MOODS: PitchMood[] = [
  "celebrate", // Title
  "celebrate", // Team
  "signal", // Problem
  "signal", // Current Pain (stats)
  "calm", // Solution
  "calm", // Target Users
  "calm", // Core Features
  "calm", // Deep Dive
  "signal", // How It Works
  "signal", // Use Case
  "calm", // AI Layer
  "calm", // Architecture
  "signal", // Unique Point
  "calm", // Edge
  "signal", // Market
  "signal", // Why Now
  "signal", // Demo Path
  "calm", // Tech Stack
  "calm", // Future Scope
  "celebrate", // Live Demo
  "celebrate", // Conclusion
];

const TOTAL = SLIDES.length;

export function PitchDeck() {
  const [[index, direction], setPage] = useState([0, 0]);
  const [fullscreen, setFullscreen] = useState(false);

  const go = useCallback((nextIndex: number, dir: number) => {
    setPage([Math.max(0, Math.min(TOTAL - 1, nextIndex)), dir]);
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
  const mood = MOODS[index] ?? "calm";

  if (process.env.NODE_ENV !== "production") {
    if (SLIDES.length !== LABELS.length || SLIDES.length !== MOODS.length) {
      console.error(
        `[pitch] length mismatch: slides=${SLIDES.length} labels=${LABELS.length} moods=${MOODS.length}`,
      );
    }
  }

  return (
    <div className="relative h-[100dvh] max-h-[100dvh] w-full overflow-hidden bg-[#030712] text-white">
      <PitchBackground mood={mood} />

      <div className="relative z-10 mx-auto flex h-full w-full max-w-[1920px] flex-col">
        <header className="flex h-12 shrink-0 items-center justify-between px-4 sm:h-14 sm:px-8 lg:px-10">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <BrandLogo className="h-[32px] w-[48px] sm:h-[40px] sm:w-[60px]" />
            <span className={cn(mono, "text-[0.65rem] tracking-[0.24em] text-white/45 uppercase")}>
              SANTRA AI · Pitch
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn(mono, "hidden text-[0.7rem] text-white/40 sm:inline")}>
              {String(index + 1).padStart(2, "0")} / {String(TOTAL).padStart(2, "0")} · {LABELS[index]}
            </span>
            <button
              type="button"
              onClick={() => {
                if (!document.fullscreenElement) void document.documentElement.requestFullscreen?.();
                else void document.exitFullscreen?.();
              }}
              className="border border-white/10 bg-white/[0.03] p-2 text-white/72 transition hover:bg-white/[0.07] hover:text-white"
              aria-label={fullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
          </div>
        </header>

        {/* Full remaining viewport — no aspect-video letterboxing on laptops */}
        <main className="relative min-h-0 flex-1">
          <div className="absolute inset-0">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.section
                key={index}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="absolute inset-0 overflow-hidden"
                aria-label={LABELS[index]}
              >
                <PitchSlideCtx.Provider value={index}>
                  <Slide />
                </PitchSlideCtx.Provider>
              </motion.section>
            </AnimatePresence>
          </div>
        </main>

        <footer className="relative z-20 flex h-14 shrink-0 flex-col justify-center gap-1 px-4 pb-2 pt-1 sm:h-16 sm:px-8 lg:px-10">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={prev}
              disabled={index === 0}
              className="inline-flex items-center gap-1.5 border border-white/10 bg-white/[0.03] px-3 py-1.5 text-sm text-white/75 transition enabled:hover:bg-white/[0.07] disabled:opacity-30 sm:px-4 sm:py-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Prev
            </button>

            <div className="flex max-w-[50vw] flex-1 flex-wrap items-center justify-center gap-1 sm:max-w-[55vw] sm:gap-1.5">
              {LABELS.map((label, i) => (
                <button
                  key={`${label}-${i}`}
                  type="button"
                  aria-label={`Go to ${label}`}
                  title={label}
                  onClick={() => go(i, i > index ? 1 : -1)}
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    i === index ? "w-5 bg-cyan-300 sm:w-6" : "w-1.5 bg-white/20 hover:bg-white/40 sm:w-2",
                  )}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={next}
              disabled={index === TOTAL - 1}
              className="inline-flex items-center gap-1.5 border border-cyan-300/30 bg-cyan-300/10 px-3 py-1.5 text-sm text-cyan-50 transition enabled:hover:bg-cyan-300/15 disabled:opacity-30 sm:px-4 sm:py-2"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <p className={cn(mono, "hidden text-center text-[10px] tracking-wide text-white/25 sm:block")}>
            ← → or Space · F fullscreen
          </p>
        </footer>
      </div>
    </div>
  );
}
