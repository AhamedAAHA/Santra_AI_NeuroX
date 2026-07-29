"use client";

import { AnimatePresence, animate, motion, type Variants } from "framer-motion";
import {
  Bot,
  Brain,
  CheckCircle2,
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
import { AppLoginQr, PITCH_TEAM, PITCH_TRY_URL, TeamMemberCard } from "@/components/pitch/pitch-team-qr";
import { PitchReviewBubbles } from "@/components/pitch/pitch-live-feed";
import {
  AutoIntentVisual,
  HitlGateDiagram,
  OAuthLoginVisual,
} from "@/components/pitch/pitch-visuals";
import { BrandLogo } from "@/components/shared/brand-mark";
import { cn } from "@/lib/utils";

const PitchSlideCtx = createContext(0);
const PitchExportCtx = createContext(false);

function useSlideNumber() {
  return useContext(PitchSlideCtx);
}

function usePitchExport() {
  return useContext(PitchExportCtx);
}

function readExportBoot() {
  if (typeof window === "undefined") return { exportMode: false, slide: 0 };
  const sp = new URLSearchParams(window.location.search);
  const exportMode = sp.get("export") === "1";
  const raw = Number(sp.get("slide") ?? "0");
  const slide = Number.isFinite(raw) ? Math.max(0, Math.floor(raw)) : 0;
  return { exportMode, slide };
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
  const isExport = usePitchExport();
  const [displayValue, setDisplayValue] = useState(isExport ? value : 0);
  useEffect(() => {
    if (isExport) return;
    const controls = animate(0, value, {
      duration,
      ease: EASE,
      onUpdate: (v) => setDisplayValue(Math.round(v)),
    });
    return () => controls.stop();
  }, [value, duration, isExport]);
  const shown = isExport ? value : displayValue;
  return (
    <span>
      {prefix}
      {shown}
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
  const isExport = usePitchExport();
  const label = String(slideNo + 1).padStart(2, "0");
  const place = SLIDE_NUMBER_PLACES[slideNo % SLIDE_NUMBER_PLACES.length]!;

  return (
    <motion.div
      variants={stagger}
      initial={isExport ? "show" : "hidden"}
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

/* ─── 01 Hero ─── */
function TitleSlide() {
  const chips = [
    { icon: Radar, label: "GTM Monitors" },
    { icon: MessageSquare, label: "Strategy Desk" },
    { icon: FileCheck2, label: "Reports + HITL" },
  ];

  return (
    <SlideShell className="items-center text-center" showNumber={false}>
      <motion.div variants={itemZoom} className="relative flex flex-col items-center">
        <motion.div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400/10 blur-3xl sm:h-64 sm:w-64"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: EASE }}
        />
        <BrandLogo className="relative h-[80px] w-[120px] sm:h-[104px] sm:w-[156px] md:h-[120px] md:w-[180px]" />
      </motion.div>

      <motion.div variants={item} className="mt-8 sm:mt-10">
        <Eyebrow>NeuroX 1.0 · Phase 2</Eyebrow>
      </motion.div>

      <motion.h1
        variants={itemZoom}
        className={cn(
          display,
          "mt-4 text-6xl font-semibold tracking-tight text-white sm:text-7xl md:text-8xl lg:text-[7.5rem] lg:leading-[0.95]",
        )}
      >
        SANTRA
        <span className="bg-gradient-to-r from-cyan-200 via-sky-200 to-cyan-400 bg-clip-text text-transparent">
          {" "}
          AI
        </span>
      </motion.h1>

      <motion.div
        variants={item}
        className="mx-auto mt-5 h-px w-24 bg-gradient-to-r from-transparent via-cyan-300/70 to-transparent sm:w-32"
      />

      <motion.p
        variants={item}
        className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-white/72 sm:text-xl md:text-2xl"
      >
        Autonomous GTM intelligence for B2B revenue teams
      </motion.p>

      <motion.div
        variants={item}
        className="mt-8 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 sm:mt-10"
      >
        <span className="inline-flex items-center gap-2 text-sm text-white/80">
          <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
          Prompt Pirates
        </span>
        <span className="hidden h-3 w-px bg-white/20 sm:block" aria-hidden />
        <span className={cn(mono, "text-[0.7rem] uppercase tracking-[0.22em] text-white/45")}>
          NeuroX 2026 · B2B Agentic GTM
        </span>
      </motion.div>

      <motion.div variants={item} className="mt-10 flex flex-wrap justify-center gap-3">
        {chips.map((chip, i) => (
          <motion.span
            key={chip.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 + i * 0.1, duration: 0.45, ease: EASE }}
            className="inline-flex items-center gap-2 border border-white/[0.1] bg-white/[0.03] px-3.5 py-2 text-[0.7rem] tracking-wide text-white/70"
          >
            <chip.icon className="h-3.5 w-3.5 text-cyan-300/90" />
            {chip.label}
          </motion.span>
        ))}
      </motion.div>
    </SlideShell>
  );
}

/* ─── 03 Problem — clean manifesto ─── */
function ProblemSlide() {
  const points = [
    { icon: Timer, line: "Competitor moves surface days late" },
    { icon: Layers, line: "Intel scattered across Slack and sheets" },
    { icon: ShieldCheck, line: "No trust layer between AI and the CRM" },
  ];
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setActive((prev) => (prev + 1) % points.length);
    }, 2400);
    return () => window.clearInterval(id);
  }, [points.length]);

  return (
    <SlideShell>
      <div className="grid items-center gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:gap-16">
        <motion.div variants={itemLeft} className="relative min-w-0">
          <Eyebrow>The problem</Eyebrow>
          <h2
            className={cn(
              display,
              "mt-5 max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl md:text-6xl md:leading-[1.06]",
            )}
          >
            Competitive intel is slow —
            <span className="mt-2 block text-white/50">and unsafe to automate</span>
          </h2>

          <motion.div
            variants={item}
            className="mt-6 h-px w-20 bg-gradient-to-r from-cyan-300/80 to-transparent"
          />

          <p className="mt-7 max-w-xl text-lg leading-relaxed text-white/72 sm:text-xl">
            GTM teams make <span className="text-cyan-200">high-stakes decisions</span> on stale intel —
            while AI that could help is{" "}
            <span className="text-sky-200">too risky to plug into the CRM</span> unattended.
          </p>

          <p className={cn(mono, "mt-8 text-[0.65rem] uppercase tracking-[0.22em] text-white/40")}>
            Until HITL exists, automation stays banned
          </p>
        </motion.div>

        <motion.div variants={itemRight} className="relative">
          <div className="space-y-3">
            {points.map((row, i) => {
              const isActive = active === i;
              return (
                <motion.div
                  key={row.line}
                  animate={{
                    borderColor: isActive ? "rgba(34,211,238,0.4)" : "rgba(255,255,255,0.08)",
                    backgroundColor: isActive ? "rgba(34,211,238,0.08)" : "rgba(7,13,26,0.6)",
                    x: isActive ? 6 : 0,
                  }}
                  transition={{ duration: 0.4, ease: EASE }}
                  className="border border-l-2 px-5 py-4"
                  style={{
                    borderLeftColor: isActive ? "rgb(103,232,249)" : "rgba(255,255,255,0.12)",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span className={cn(mono, "text-[0.65rem] tracking-[0.24em] text-cyan-300/70")}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <row.icon className={cn("h-4 w-4", isActive ? "text-cyan-300" : "text-white/35")} />
                  </div>
                  <p
                    className={cn(
                      "mt-2 text-base leading-snug sm:text-lg",
                      isActive ? "text-white" : "text-white/70",
                    )}
                  >
                    {row.line}
                  </p>
                </motion.div>
              );
            })}
          </div>
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

/* ─── Solution — animated loop + pillars ─── */
function SolutionSlide() {
  const flow = [
    { label: "Monitor", icon: Radar },
    { label: "Evidence", icon: Globe2 },
    { label: "Brief", icon: FileCheck2 },
    { label: "Approve", icon: ShieldCheck },
  ];
  const pillars = [
    {
      icon: Radar,
      title: "GTM Competitive Monitors",
      text: "Describe what to watch in plain language. Santra auto-reads category and severity, collects evidence, and queues actions.",
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
      text: "Approve or dismiss proposed webhook / CRM-export automation — nothing executes unattended.",
    },
  ];
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setActive((prev) => (prev + 1) % flow.length);
    }, 1500);
    return () => window.clearInterval(id);
  }, [flow.length]);

  return (
    <SlideShell>
      <SlideHeading
        eyebrow="The solution"
        title="Monitor → evidence → brief → approve"
        subtitle="SANTRA is not another passive chatbot. It runs the competitive loop with humans at the gate."
      />

      <motion.div variants={item} className="mt-8 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
        {flow.map((step, i) => {
          const isActive = active === i;
          return (
            <div key={step.label} className="flex items-center gap-2 sm:gap-3">
              <motion.div
                animate={{
                  borderColor: isActive ? "rgba(34,211,238,0.6)" : "rgba(255,255,255,0.1)",
                  backgroundColor: isActive ? "rgba(34,211,238,0.14)" : "rgba(7,13,26,0.9)",
                  scale: isActive ? 1.06 : 1,
                }}
                transition={{ duration: 0.35, ease: EASE }}
                className="relative flex min-w-[7.5rem] flex-col items-center border px-4 py-3"
              >
                {isActive ? (
                  <motion.span
                    className="absolute inset-0 border border-cyan-300/40"
                    animate={{ opacity: [0.2, 0.7, 0.2] }}
                    transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
                  />
                ) : null}
                <step.icon className={cn("relative h-5 w-5", isActive ? "text-cyan-300" : "text-white/45")} />
                <span className={cn(display, "relative mt-2 text-sm font-semibold text-white")}>
                  {step.label}
                </span>
              </motion.div>
              {i < flow.length - 1 ? (
                <motion.div
                  className="hidden h-px w-6 bg-gradient-to-r from-cyan-400/60 to-cyan-400/10 sm:block sm:w-10"
                  animate={{ opacity: active >= i ? [0.4, 1, 0.4] : 0.25 }}
                  transition={{ repeat: Infinity, duration: 1.2 }}
                />
              ) : null}
            </div>
          );
        })}
      </motion.div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {pillars.map((p, i) => (
          <motion.div
            key={p.title}
            variants={item}
            whileHover={{ y: -3 }}
            transition={{ duration: 0.25 }}
          >
            <Surface
              className={cn(
                "h-full !p-5 sm:!p-6 transition-colors",
                active === i && "border-cyan-400/35 bg-cyan-400/[0.06]",
              )}
            >
              <motion.div
                animate={active === i ? { scale: [1, 1.12, 1] } : { scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <p.icon className="h-6 w-6 text-cyan-300" />
              </motion.div>
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
    { icon: FileCheck2, route: "/reports", title: "Reports", text: "Executive briefs with risk %, confidence, importance, evidence, and claims." },
    { icon: Server, route: "/settings", title: "Settings", text: "Voice, display, privacy, and integration health checks." },
    { icon: Mail, route: "Email watch", title: "Background email", text: "Resend digests on watch intervals — host cron must poll (Vercel daily by default)." },
  ];
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setActive((prev) => (prev + 1) % modules.length);
    }, 1800);
    return () => window.clearInterval(id);
  }, [modules.length]);

  return (
    <SlideShell>
      <SlideHeading
        eyebrow="Product surface"
        title="Six surfaces. One agent loop."
        subtitle="Exactly what ships in the live workspace — not a feature laundry list."
      />
      <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {modules.map((m, i) => {
          const isActive = active === i;
          return (
            <motion.div
              key={m.title}
              variants={item}
              animate={{
                y: isActive ? -4 : 0,
                borderColor: isActive ? "rgba(34,211,238,0.45)" : "rgba(255,255,255,0.1)",
              }}
              transition={{ duration: 0.35, ease: EASE }}
              className="border border-transparent"
            >
              <Surface
                className={cn(
                  "relative h-full overflow-hidden !p-5",
                  isActive && "border-cyan-400/40 bg-cyan-400/[0.07]",
                )}
              >
                {isActive ? (
                  <motion.span
                    className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-300 to-transparent"
                    animate={{ opacity: [0.3, 1, 0.3], x: ["-20%", "20%", "-20%"] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                  />
                ) : null}
                <div className="flex items-center justify-between gap-3">
                  <motion.div
                    animate={isActive ? { rotate: [0, -8, 8, 0] } : { rotate: 0 }}
                    transition={{ duration: 0.6 }}
                  >
                    <m.icon className={cn("h-5 w-5", isActive ? "text-cyan-200" : "text-cyan-300")} />
                  </motion.div>
                  <span className={cn(mono, "text-[0.6rem] tracking-wider text-white/40")}>{m.route}</span>
                </div>
                <h3 className={cn(display, "mt-3 text-base font-semibold text-white")}>{m.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-white/70">{m.text}</p>
              </Surface>
            </motion.div>
          );
        })}
      </div>
    </SlideShell>
  );
}

/* ─── Auth — Google / GitHub OAuth ─── */
function AuthAccessSlide() {
  const points = [
    { title: "GitHub OAuth", text: "One-click for builders and judges." },
    { title: "Google OAuth", text: "Work accounts into the workspace." },
    { title: "Email fallback", text: "Optional path without OAuth." },
  ];
  const [activePoint, setActivePoint] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setActivePoint((prev) => (prev + 1) % points.length);
    }, 2200);
    return () => window.clearInterval(id);
  }, [points.length]);

  return (
    <SlideShell>
      <div className="text-center">
        <Eyebrow>Access</Eyebrow>
        <motion.h2
          variants={itemZoom}
          className={cn(
            display,
            "mx-auto mt-3 max-w-3xl text-3xl font-semibold text-white sm:text-4xl md:text-5xl",
          )}
        >
          Google & GitHub login —{" "}
          <span className="text-cyan-300">shipped</span>
        </motion.h2>
        <motion.p variants={item} className="mx-auto mt-4 max-w-2xl text-base text-white/70 sm:text-lg">
          Real OAuth on /sign-in — continue with Google or GitHub, then open Command Center.
        </motion.p>
      </div>

      <motion.div variants={itemZoom} className="relative mx-auto mt-8 w-full max-w-xl">
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -inset-8 rounded-full bg-cyan-400/10 blur-3xl"
          animate={{ opacity: [0.35, 0.65, 0.35] }}
          transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
        />
        <OAuthLoginVisual className="relative min-h-[300px] sm:min-h-[320px]" />
      </motion.div>

      <div className="mx-auto mt-8 grid w-full max-w-3xl gap-3 sm:grid-cols-3">
        {points.map((p, i) => {
          const isActive = activePoint === i;
          return (
            <motion.div
              key={p.title}
              variants={item}
              animate={{
                borderColor: isActive ? "rgba(34,211,238,0.45)" : "rgba(255,255,255,0.1)",
                backgroundColor: isActive ? "rgba(34,211,238,0.08)" : "transparent",
              }}
              transition={{ duration: 0.35, ease: EASE }}
              className="border border-t-2 px-4 py-4 text-center"
              style={{ borderTopColor: isActive ? "rgb(103,232,249)" : "rgba(255,255,255,0.12)" }}
            >
              <h3 className={cn(display, "text-base font-semibold text-white")}>{p.title}</h3>
              <p className="mt-1.5 text-sm text-white/65">{p.text}</p>
            </motion.div>
          );
        })}
      </div>
    </SlideShell>
  );
}

/* ─── Monitor lifecycle deep dive (unique to this slide) ─── */
function FeatureDeepDiveSlide() {
  const stages = [
    {
      icon: Radar,
      title: "Create watch",
      text: "Plain-language goal on /alerts — Santra auto-tags category and severity.",
    },
    { icon: Globe2, title: "Check now", text: "Agent routes Bright Data / Exa tools and logs stages in Activity." },
    { icon: Eye, title: "Timeline + diffs", text: "Snapshot history shows what changed between checks." },
    { icon: Mail, title: "Email watch", text: "Optional Resend digests — intervals in UI; production cron is daily on Vercel." },
    { icon: FileCheck2, title: "Approval inbox", text: "Edit the brief, then approve → Slack Incoming Webhook / Zapier / Make." },
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

/* ─── Agent loop + auto intent ─── */
function HowItWorksSlide() {
  const steps = [
    { label: "Plan", sub: "Auto category · severity" },
    { label: "Route", sub: "Bright Data · Exa · MCP" },
    { label: "Collect", sub: "Live web evidence" },
    { label: "Observe", sub: "Diff + noise filter" },
    { label: "Reason", sub: "Risk · conf · importance" },
    { label: "HITL", sub: "Approve before execute" },
  ];
  return (
    <SlideShell>
      <SlideHeading
        eyebrow="Agent graph"
        title="How SANTRA runs a check"
        subtitle="Prompt once — Santra classifies category and severity (medium, high, critical…), then runs the graph."
      />
      <div className="mt-8 grid items-stretch gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <motion.div variants={item} className="flex flex-col justify-center">
          <div className="hidden items-stretch lg:flex lg:flex-col lg:gap-2">
            {steps.map((step, index) => (
              <div
                key={step.label}
                className="flex items-center gap-4 border border-white/[0.1] bg-[#070d1a]/95 px-4 py-3"
              >
                <StepNo n={String(index + 1).padStart(2, "0")} />
                <div className="min-w-0 flex-1 sm:flex sm:items-baseline sm:justify-between sm:gap-3">
                  <h3 className={cn(display, "text-sm font-semibold text-white xl:text-base")}>
                    {step.label}
                  </h3>
                  <p className="text-xs text-white/75 xl:text-sm">{step.sub}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-3 lg:hidden">
            {steps.map((step, index) => (
              <div
                key={step.label}
                className="flex items-center gap-4 border border-white/[0.1] bg-[#070d1a]/95 px-4 py-3"
              >
                <StepNo n={String(index + 1).padStart(2, "0")} />
                <div>
                  <h3 className={cn(display, "font-semibold text-white")}>{step.label}</h3>
                  <p className="text-xs text-white/75">{step.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
        <motion.div variants={itemZoom}>
          <AutoIntentVisual className="h-full min-h-[300px]" />
        </motion.div>
      </div>
    </SlideShell>
  );
}

/* ─── Use case — featured step story ─── */
function UseCaseSlide() {
  const journey = [
    {
      step: "01",
      icon: Radar,
      title: "Create monitor",
      text: "On /alerts: “Watch competitor pricing…” — Santra auto-sets category & severity.",
    },
    {
      step: "02",
      icon: Globe2,
      title: "Check now",
      text: "Tools collect live pages; Activity log shows routing stages.",
    },
    {
      step: "03",
      icon: FileCheck2,
      title: "Report lands",
      text: "/reports shows risk %, confidence, importance, evidence, and claims.",
    },
    {
      step: "04",
      icon: ShieldCheck,
      title: "Human approves",
      text: "Edit the brief — then send webhook / CRM export.",
    },
    {
      step: "05",
      icon: MessageSquare,
      title: "Ask on Strategy Desk",
      text: "/chat Ask mode: “How should sales counter this move?”",
    },
    {
      step: "06",
      icon: Mic,
      title: "Optional live call",
      text: "Speechmatics voice path when the room needs spoken Q&A.",
    },
  ];
  const [active, setActive] = useState(0);
  const current = journey[active]!;

  useEffect(() => {
    const id = window.setInterval(() => {
      setActive((prev) => (prev + 1) % journey.length);
    }, 2200);
    return () => window.clearInterval(id);
  }, [journey.length]);

  return (
    <SlideShell>
      <div>
        <Eyebrow>Use case</Eyebrow>
        <motion.h2
          variants={itemZoom}
          className={cn(display, "mt-3 text-3xl font-semibold text-white sm:text-4xl md:text-5xl")}
        >
          Pricing change → <span className="text-cyan-300">approved battlecard</span>
        </motion.h2>
        <motion.p variants={item} className="mt-3 max-w-2xl text-base text-white/70 sm:text-lg">
          Demo path on the live app — every step is a real screen.
        </motion.p>
      </div>

      <div className="mt-8 grid items-stretch gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <motion.div
          key={current.step}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE }}
          className="relative flex flex-col justify-center overflow-hidden border border-cyan-400/35 bg-cyan-400/[0.07] p-7 sm:p-9"
        >
          <motion.span
            className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-300 to-transparent"
            animate={{ opacity: [0.35, 1, 0.35] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
          />
          <div className="flex items-center gap-3">
            <current.icon className="h-6 w-6 text-cyan-300" />
            <StepNo n={current.step} />
            <span className={cn(mono, "text-[0.6rem] uppercase tracking-[0.18em] text-cyan-300/80")}>
              Now
            </span>
          </div>
          <h3 className={cn(display, "mt-5 text-3xl font-semibold text-white sm:text-4xl")}>
            {current.title}
          </h3>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-white/75 sm:text-lg">
            {current.text}
          </p>
          <div className="mt-8 h-1 overflow-hidden bg-white/[0.08]">
            <motion.div
              className="h-full bg-cyan-300/80"
              animate={{ width: `${((active + 1) / journey.length) * 100}%` }}
              transition={{ duration: 0.4, ease: EASE }}
            />
          </div>
        </motion.div>

        <div className="flex flex-col gap-2">
          {journey.map((j, i) => {
            const isActive = active === i;
            const isPast = active > i;
            return (
              <motion.button
                key={j.step}
                type="button"
                onClick={() => setActive(i)}
                animate={{
                  borderColor: isActive ? "rgba(34,211,238,0.45)" : "rgba(255,255,255,0.08)",
                  backgroundColor: isActive ? "rgba(34,211,238,0.1)" : "rgba(7,13,26,0.5)",
                }}
                transition={{ duration: 0.3, ease: EASE }}
                className="flex items-center gap-3 border px-4 py-3 text-left"
              >
                <j.icon className={cn("h-4 w-4 shrink-0", isActive ? "text-cyan-200" : "text-white/35")} />
                <span className={cn(mono, "w-6 shrink-0 text-[0.65rem] text-cyan-300/70")}>{j.step}</span>
                <span
                  className={cn(
                    display,
                    "min-w-0 flex-1 truncate text-sm font-semibold",
                    isActive ? "text-white" : "text-white/65",
                  )}
                >
                  {j.title}
                </span>
                {isPast && !isActive ? (
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-cyan-300/50" />
                ) : null}
              </motion.button>
            );
          })}
        </div>
      </div>
    </SlideShell>
  );
}

/* ─── Intelligence providers (product-named) ─── */
function AIIntelligenceSlide() {
  const layers = [
    { icon: Bot, title: "AIML / OpenAI-compatible", text: "Primary models for intent, briefs, risk scoring, and action synthesis." },
    { icon: Brain, title: "Featherless", text: "Open-model fallback / optional primary when SANTRA_AGENT_PROVIDER is set." },
    { icon: Mic, title: "Speechmatics", text: "Realtime STT + TTS for Strategy Desk live call." },
    { icon: Globe2, title: "Exa + Bright Data", text: "Live web evidence — SERP, unlocker, and search grounding." },
    { icon: Mail, title: "Resend", text: "Background email watch digests when cron polls due monitors." },
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
    { icon: Server, title: "Agent graph", items: "Plan → collect → observe → reason → HITL → execute → audit" },
    { icon: Brain, title: "Scoring", items: "Risk ≠ confidence ≠ importance · noise filter · claim verify" },
    { icon: Database, title: "Data", items: "MongoDB Atlas · Reports · Pending actions · Timeline audit" },
    { icon: Globe2, title: "Evidence & alerts", items: "Exa · Bright Data · Speechmatics · Resend · HITL webhooks" },
  ];
  return (
    <SlideShell>
      <SlideHeading
        eyebrow="Architecture"
        title="What the production stack looks like"
        subtitle="Live on Vercel — decision graph, independent scores, and hard HITL before execute."
      />
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
    {
      icon: Layers,
      value: "Named agent graph",
      label: "Architecture",
      text: "Plan → collect → observe → reason → HITL → execute → audit.",
    },
    {
      icon: ShieldCheck,
      value: "Edit → approve",
      label: "HITL inbox",
      text: "Nothing ships to webhook / CRM export until a human approves.",
    },
    {
      icon: Brain,
      value: "3 independent scores",
      label: "Scoring",
      text: "Risk ≠ confidence ≠ importance — plus noise filter.",
    },
    {
      icon: Mic,
      value: "Ask · Market · Voice",
      label: "Strategy Desk",
      text: "Chat, ICP validation, and Speechmatics live call.",
    },
  ];

  return (
    <SlideShell>
      <div className="text-center">
        <Eyebrow>Unique point</Eyebrow>
        <motion.h2
          variants={itemZoom}
          className={cn(
            display,
            "mx-auto mt-3 max-w-4xl text-3xl font-semibold text-white sm:text-4xl md:text-5xl",
          )}
        >
          Autonomous research.{" "}
          <motion.span
            className="inline-block text-cyan-300"
            animate={{ opacity: [0.75, 1, 0.75] }}
            transition={{ repeat: Infinity, duration: 2.8, ease: "easeInOut" }}
          >
            Human execution gate.
          </motion.span>
        </motion.h2>
      </div>

      <motion.div variants={itemZoom} className="relative mx-auto mt-8 w-full max-w-3xl">
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -inset-6 rounded-full border border-cyan-400/10"
          animate={{ rotate: [0, 360] }}
          transition={{ repeat: Infinity, duration: 48, ease: "linear" }}
        />
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -inset-12 rounded-full border border-dashed border-white/[0.05]"
          animate={{ rotate: [360, 0] }}
          transition={{ repeat: Infinity, duration: 72, ease: "linear" }}
        />
        <HitlGateDiagram className="relative border-cyan-400/30 bg-[#070d1a]/90" />
      </motion.div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {impacts.map((impact, i) => (
          <motion.div
            key={impact.label}
            variants={item}
            custom={i}
            className="border-t border-cyan-400/30 pt-4"
          >
            <impact.icon className="h-4 w-4 text-cyan-300" />
            <p className={cn(display, "mt-3 text-base font-semibold text-cyan-100 sm:text-lg")}>
              {impact.value}
            </p>
            <p className={cn(mono, "mt-1 text-[0.6rem] uppercase tracking-[0.2em] text-white/45")}>
              {impact.label}
            </p>
            <p className="mt-1.5 text-sm text-white/70">{impact.text}</p>
          </motion.div>
        ))}
      </div>

      <motion.p
        variants={item}
        className="mx-auto mt-8 max-w-3xl text-center text-base leading-relaxed text-white/70 sm:text-lg"
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

/* ─── Demo path — animated walkthrough ─── */
function DemoJourneySlide() {
  const journey = [
    {
      step: "01",
      title: "Sign in",
      text: "/sign-in — Continue with Google or GitHub OAuth (or email).",
    },
    { step: "02", title: "Command Center", text: "/dashboard — signal overview and what needs approval." },
    {
      step: "03",
      title: "Create monitor",
      text: "/alerts — type a goal; Santra auto-reads category & severity.",
    },
    { step: "04", title: "Check + report", text: "Run Check now → open /reports for risk, confidence & importance." },
    { step: "05", title: "Approve send", text: "Edit brief in HITL panel → Slack Incoming Webhook / Zapier / Make." },
    { step: "06", title: "Strategy Desk", text: "/chat Ask or Market — optional Speechmatics live call." },
  ];
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setActive((prev) => (prev + 1) % journey.length);
    }, 1700);
    return () => window.clearInterval(id);
  }, [journey.length]);

  return (
    <SlideShell>
      <SlideHeading
        eyebrow="Demo path"
        title="Walk the live product"
        subtitle="Every step is a real route on santra-ai-neurox.vercel.app."
      />

      <motion.div variants={item} className="mt-6 mb-2 flex items-center gap-2">
        <div className="h-1 flex-1 overflow-hidden bg-white/[0.06]">
          <motion.div
            className="h-full bg-gradient-to-r from-cyan-400/80 to-sky-400/60"
            animate={{ width: `${((active + 1) / journey.length) * 100}%` }}
            transition={{ duration: 0.4, ease: EASE }}
          />
        </div>
        <span className={cn(mono, "shrink-0 text-[0.65rem] tracking-wider text-cyan-300/80")}>
          Step {String(active + 1).padStart(2, "0")} / {String(journey.length).padStart(2, "0")}
        </span>
      </motion.div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {journey.map((j, i) => {
          const isActive = active === i;
          const isPast = active > i;
          return (
            <motion.div
              key={j.step}
              variants={item}
              animate={{
                borderColor: isActive
                  ? "rgba(34,211,238,0.5)"
                  : isPast
                    ? "rgba(34,211,238,0.2)"
                    : "rgba(255,255,255,0.08)",
                backgroundColor: isActive ? "rgba(34,211,238,0.1)" : "rgba(10,18,36,0.6)",
                scale: isActive ? 1.02 : 1,
              }}
              transition={{ duration: 0.35, ease: EASE }}
              className="group relative overflow-hidden border p-6"
            >
              {isActive ? (
                <motion.div
                  className="absolute inset-y-0 left-0 w-0.5 bg-cyan-300"
                  layoutId="demo-path-active"
                  transition={{ duration: 0.35, ease: EASE }}
                />
              ) : (
                <div className="absolute inset-y-0 left-0 w-0.5 bg-cyan-400/0" />
              )}
              <div className="flex items-center justify-between gap-2">
                <StepNo n={j.step} />
                {isActive ? (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={cn(mono, "text-[0.55rem] uppercase tracking-[0.18em] text-cyan-300")}
                  >
                    Now
                  </motion.span>
                ) : isPast ? (
                  <CheckCircle2 className="h-4 w-4 text-cyan-300/70" />
                ) : null}
              </div>
              <h3 className={cn(display, "mt-3 text-xl font-semibold text-white")}>{j.title}</h3>
              <p className="mt-2 text-sm text-white/72">{j.text}</p>
            </motion.div>
          );
        })}
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
        "Reports with risk / confidence / importance",
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
        "Faster email-watch cron cadence",
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
          <AppLoginQr size={148} label="Scan · Start · Review" />
        </motion.div>
      </div>
    </SlideShell>
  );
}

/* ─── Close — centered thank you + QR; edge pop-up reviews ─── */
function ConclusionSlide() {
  return (
    <SlideShell>
      <div className="relative mx-auto w-full max-w-6xl">
        <PitchReviewBubbles />

        <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center text-center">
          <motion.div variants={itemZoom} className="w-full">
            <Eyebrow>Mission complete</Eyebrow>
            <h2
              className={cn(
                display,
                "mt-4 whitespace-nowrap text-[clamp(2.75rem,9vw,7.5rem)] font-semibold tracking-tight text-white leading-[0.95]",
              )}
            >
              Thank you
            </h2>
            <p className="mt-5 text-2xl font-semibold sm:text-3xl">
              <span className="text-white">SANTRA</span>{" "}
              <span className="bg-gradient-to-r from-cyan-200 to-sky-400 bg-clip-text text-transparent">
                AI
              </span>
            </p>
            <p className="mt-3 text-base text-white/65 sm:text-lg">Prompt Pirates · NeuroX 1.0</p>
          </motion.div>

          <motion.div variants={item} className="mt-10 w-full max-w-[240px]">
            <div className="border border-cyan-300/35 bg-[#050b16]/95 px-5 py-5">
              <AppLoginQr size={168} label="Scan · Start · Review" href={PITCH_TRY_URL} />
            </div>
          </motion.div>
        </div>
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
  AuthAccessSlide,
  FeatureDeepDiveSlide,
  HowItWorksSlide,
  UseCaseSlide,
  AIIntelligenceSlide,
  ArchitectureSlide,
  UniquePointSlide,
  CompetitiveEdgeSlide,
  MarketSlide,
  DemoJourneySlide,
  FutureScopeSlide,
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
  "Login",
  "Monitors",
  "Agent Loop",
  "Use Case",
  "AI Layer",
  "Architecture",
  "Unique Point",
  "Edge",
  "Signals",
  "Demo Path",
  "Roadmap",
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
  "signal", // Auth / Login
  "calm", // Deep Dive
  "signal", // How It Works
  "signal", // Use Case
  "calm", // AI Layer
  "calm", // Architecture
  "signal", // Unique Point
  "calm", // Edge
  "signal", // Market
  "signal", // Demo Path
  "calm", // Future Scope / Roadmap
  "celebrate", // Conclusion
];

const TOTAL = SLIDES.length;

export function PitchDeck() {
  const boot = readExportBoot();
  const [exportMode] = useState(boot.exportMode);
  const [[index, direction], setPage] = useState(() =>
    boot.exportMode ? ([Math.min(TOTAL - 1, boot.slide), 0] as [number, number]) : ([0, 0] as [number, number]),
  );
  const [fullscreen, setFullscreen] = useState(false);
  const [exportReady, setExportReady] = useState(!boot.exportMode);

  useEffect(() => {
    if (!exportMode) return;
    const t = window.setTimeout(() => setExportReady(true), 1000);
    return () => window.clearTimeout(t);
  }, [exportMode]);

  const go = useCallback((nextIndex: number, dir: number) => {
    setPage([Math.max(0, Math.min(TOTAL - 1, nextIndex)), dir]);
  }, []);

  const next = useCallback(() => go(index + 1, 1), [go, index]);
  const prev = useCallback(() => go(index - 1, -1), [go, index]);

  useEffect(() => {
    if (exportMode) return;
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
  }, [exportMode, go, next, prev]);

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
    <PitchExportCtx.Provider value={exportMode}>
      <div
        className="relative h-[100dvh] max-h-[100dvh] w-full overflow-hidden bg-[#030712] text-white"
        data-pitch-export={exportMode ? "1" : "0"}
        data-pitch-slide={index}
        data-pitch-ready={exportReady ? "1" : "0"}
      >
        <PitchBackground mood={mood} />

        <div className="relative z-10 mx-auto flex h-full w-full max-w-[1920px] flex-col">
          {!exportMode ? (
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
          ) : null}

          {/* Full remaining viewport — no aspect-video letterboxing on laptops */}
          <main className="relative min-h-0 flex-1">
            <div className="absolute inset-0">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.section
                  key={index}
                  custom={direction}
                  variants={slideVariants}
                  initial={exportMode ? false : "enter"}
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

          {!exportMode ? (
            <footer className="relative z-20 flex h-14 shrink-0 flex-col justify-center gap-1 px-4 pb-2 pt-1 sm:h-16 sm:px-8 lg:px-10">
              <div className="flex items-center justify-center gap-3">
                <div className="flex max-w-[80vw] flex-wrap items-center justify-center gap-1 sm:max-w-[70vw] sm:gap-1.5">
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
              </div>
              <p className={cn(mono, "hidden text-center text-[10px] tracking-wide text-white/25 sm:block")}>
                ← → or Space · F fullscreen
              </p>
            </footer>
          ) : null}
        </div>
      </div>
    </PitchExportCtx.Provider>
  );
}
