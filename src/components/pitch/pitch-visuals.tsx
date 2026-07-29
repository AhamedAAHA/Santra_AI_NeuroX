"use client";

import { motion } from "framer-motion";
import {
  Bell,
  Bot,
  CheckCircle2,
  Copy,
  GitFork,
  Hash,
  Link2,
  Mail,
  Mic,
  Radar,
  ShieldCheck,
  Sparkles,
  UserCheck,
} from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/lib/utils";

const display = "font-[family-name:var(--font-pitch-display)]";
const mono = "font-[family-name:var(--font-pitch-mono)]";
const EASE = [0.22, 1, 0.36, 1] as const;

function subscribeReducedMotion(onStoreChange: () => void) {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", onStoreChange);
  return () => media.removeEventListener("change", onStoreChange);
}

function getReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

const MARKET_DATA = [
  { year: "2024", value: 18 },
  { year: "2025", value: 24 },
  { year: "2026", value: 30 },
  { year: "2027", value: 36 },
  { year: "2028", value: 42 },
  { year: "2030", value: 48 },
];

/** Animated Recharts market area — illustrative category growth */
export function LiveMarketChart({ className }: { className?: string }) {
  const reducedMotion = useSyncExternalStore(subscribeReducedMotion, getReducedMotion, () => true);

  return (
    <div
      className={cn(
        "flex h-full min-h-[280px] flex-col border border-white/[0.1] bg-[#070d1a]/90 p-5 sm:p-6",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <p className={cn(mono, "text-[0.7rem] uppercase tracking-[0.16em] text-white/72")}>
          Sales intelligence market ($B)
        </p>
        <span className={cn(mono, "text-[0.65rem] text-white/45")}>Illustrative · animated</span>
      </div>
      <div className="mt-3 min-h-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={MARKET_DATA} margin={{ top: 12, right: 8, left: -12, bottom: 0 }}>
            <defs>
              <linearGradient id="pitchLiveMarketFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgb(34,211,238)" stopOpacity={0.4} />
                <stop offset="100%" stopColor="rgb(34,211,238)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis
              dataKey="year"
              tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, 55]}
              tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `$${v}B`}
            />
            <Tooltip
              cursor={{ stroke: "rgba(255,255,255,0.12)" }}
              contentStyle={{
                background: "#0c0f1a",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(value) => [`$${value}B`, "Market"]}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="rgb(103,232,249)"
              strokeWidth={2.5}
              fill="url(#pitchLiveMarketFill)"
              isAnimationActive={!reducedMotion}
              animationDuration={1400}
              animationEasing="ease-out"
              dot={{ r: 3, fill: "#a5f3fc", strokeWidth: 0 }}
              activeDot={{ r: 5 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-3 text-sm text-white/75">Growing category — trusted agents capture the wedge.</p>
    </div>
  );
}

/** Taller research-hours comparison for full-height columns */
export function ResearchHoursBars({ className }: { className?: string }) {
  const rows = [
    { label: "Manual research", value: 28, tone: "bg-white/25" },
    { label: "With SANTRA", value: 4, tone: "bg-cyan-400" },
  ];
  const max = 30;

  return (
    <div
      className={cn(
        "flex h-full min-h-[260px] flex-col justify-center border border-white/[0.1] bg-[#070d1a]/90 p-5 sm:p-7",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <p className={cn(mono, "text-[0.7rem] uppercase tracking-[0.16em] text-white/72")}>
          Hours / week on competitive research
        </p>
        <span className={cn(mono, "text-[0.65rem] text-white/45")}>Illustrative</span>
      </div>
      <div className="mt-8 space-y-7">
        {rows.map((row) => (
          <div key={row.label}>
            <div className="mb-2 flex items-baseline justify-between gap-3">
              <span className="text-sm text-white/80 sm:text-base">{row.label}</span>
              <span className={cn(display, "text-base font-semibold text-cyan-200")}>{row.value}h</span>
            </div>
            <div className="h-3.5 overflow-hidden rounded-full bg-white/[0.08] sm:h-4">
              <motion.div
                className={cn("h-full rounded-full", row.tone)}
                initial={{ width: 0 }}
                animate={{ width: `${(row.value / max) * 100}%` }}
                transition={{ duration: 1.1, ease: EASE, delay: 0.15 }}
              />
            </div>
          </div>
        ))}
      </div>
      <p className="mt-8 text-sm text-white/75 sm:text-base">
        ~7× less research time — agent drafts, humans decide.
      </p>
    </div>
  );
}

/** CSS product UI mock — monitors + live call / email watch */
export function ProductPreviewFrame({ className }: { className?: string }) {
  const monitors = [
    { name: "Competitor pricing page", status: "Change", tone: "text-amber-200" },
    { name: "Rival careers / hiring", status: "Watching", tone: "text-cyan-200" },
    { name: "Launch blog RSS", status: "Quiet", tone: "text-white/50" },
  ];

  return (
    <div
      className={cn(
        "relative flex h-full min-h-[280px] flex-col overflow-hidden rounded-sm border border-cyan-400/20 bg-[#050b16]/95",
        className,
      )}
    >
      <div className="flex items-center gap-2 border-b border-white/[0.08] bg-white/[0.03] px-4 py-2.5">
        <span className="h-2 w-2 rounded-full bg-white/25" />
        <span className="h-2 w-2 rounded-full bg-white/25" />
        <span className="h-2 w-2 rounded-full bg-white/25" />
        <span className={cn(mono, "ml-3 text-[0.65rem] tracking-wider text-white/45")}>
          santra-ai-neurox.vercel.app / alerts
        </span>
      </div>

      <div className="grid min-h-0 flex-1 sm:grid-cols-[0.95fr_1.05fr]">
        <div className="border-b border-white/[0.08] p-4 sm:border-b-0 sm:border-r">
          <div className="flex items-center gap-2 text-cyan-300">
            <Radar className="h-4 w-4" />
            <span className={cn(mono, "text-[0.65rem] uppercase tracking-[0.18em]")}>Monitors</span>
          </div>
          <ul className="mt-3 space-y-2">
            {monitors.map((m) => (
              <li
                key={m.name}
                className="flex items-center justify-between gap-2 border border-white/[0.06] bg-white/[0.02] px-3 py-2"
              >
                <span className="truncate text-sm text-white/80">{m.name}</span>
                <span className={cn(mono, "shrink-0 text-[0.6rem] uppercase tracking-wider", m.tone)}>
                  {m.status}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-2.5 p-4">
          <div className="flex items-center gap-2 text-sky-300">
            <Bell className="h-4 w-4" />
            <span className={cn(mono, "text-[0.65rem] uppercase tracking-[0.18em]")}>Live alerts</span>
          </div>

          <motion.div
            animate={{ opacity: [0.85, 1, 0.85] }}
            transition={{ repeat: Infinity, duration: 2.8, ease: "easeInOut" }}
            className="border border-cyan-400/30 bg-cyan-400/[0.08] p-3"
          >
            <div className="flex items-center gap-2">
              <Mic className="h-4 w-4 text-cyan-300" />
              <span className="text-sm font-medium text-cyan-100">Live call ready</span>
            </div>
            <p className="mt-1 text-xs text-white/60">Strategy Desk — pricing delta</p>
          </motion.div>

          <div className="border border-sky-400/20 bg-sky-400/[0.06] p-3">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-sky-300" />
              <span className="text-sm font-medium text-sky-100">Email watch</span>
            </div>
            <p className="mt-1 text-xs text-white/60">Change brief queued for approval</p>
          </div>

          <div className="border border-white/[0.08] bg-white/[0.02] p-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-300/90" />
              <span className="text-sm font-medium text-white/85">HITL gate</span>
            </div>
            <p className="mt-1 text-xs text-white/55">CRM write blocked until approve</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Animated Agent → Draft → Human gate → CRM pipeline */
export function HitlGateDiagram({ className }: { className?: string }) {
  const reducedMotion = useSyncExternalStore(subscribeReducedMotion, getReducedMotion, () => true);
  const stages = [
    { icon: Bot, label: "Agent", sub: "Research" },
    { icon: Radar, label: "Draft", sub: "Evidence" },
    { icon: UserCheck, label: "Human", sub: "Approve", gate: true },
    { icon: CheckCircle2, label: "CRM", sub: "Write" },
  ] as const;
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (reducedMotion) return;
    const id = window.setInterval(() => {
      setActive((prev) => (prev + 1) % stages.length);
    }, 1600);
    return () => window.clearInterval(id);
  }, [reducedMotion, stages.length]);

  const step = reducedMotion ? 2 : active;
  const unlocked = reducedMotion || step === 3;

  return (
    <div
      className={cn(
        "relative flex h-full min-h-[260px] flex-col justify-center overflow-hidden border border-cyan-400/25 bg-[#070d1a]/95 p-5 sm:p-7",
        className,
      )}
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-cyan-400/10 blur-3xl"
        animate={reducedMotion ? undefined : { opacity: [0.25, 0.55, 0.25], scale: [1, 1.15, 1] }}
        transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut" }}
      />

      <div className="relative flex items-center justify-between gap-3">
        <div>
          <p className={cn(mono, "text-[0.7rem] uppercase tracking-[0.16em] text-cyan-300")}>
            Bounded autonomy
          </p>
          <p className={cn(display, "mt-2 text-lg font-semibold text-white sm:text-xl")}>
            Draft fast. Gate writes.
          </p>
        </div>
        <motion.span
          key={unlocked ? "open" : "locked"}
          initial={reducedMotion ? false : { opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            mono,
            "shrink-0 border px-2.5 py-1 text-[0.6rem] uppercase tracking-[0.18em]",
            unlocked
              ? "border-emerald-300/40 bg-emerald-400/10 text-emerald-100"
              : "border-amber-300/35 bg-amber-400/10 text-amber-100",
          )}
        >
          {unlocked ? "Gate open" : "Gate locked"}
        </motion.span>
      </div>

      <div className="relative mt-8 flex items-stretch gap-0">
        {stages.map((stage, i) => {
          const isActive = step === i;
          const isPast = step > i;
          const isGate = Boolean("gate" in stage && stage.gate);
          const isCrm = i === stages.length - 1;
          const crmBlocked = isCrm && !unlocked && !reducedMotion;

          return (
            <div key={stage.label} className="flex min-w-0 flex-1 items-center">
              <motion.div
                animate={
                  reducedMotion
                    ? undefined
                    : {
                        borderColor: isActive
                          ? isGate
                            ? "rgba(34,211,238,0.65)"
                            : "rgba(34,211,238,0.45)"
                          : isPast
                            ? "rgba(34,211,238,0.22)"
                            : "rgba(255,255,255,0.1)",
                        backgroundColor: isActive
                          ? "rgba(34,211,238,0.14)"
                          : crmBlocked
                            ? "rgba(255,255,255,0.02)"
                            : "rgba(255,255,255,0.03)",
                        scale: isActive ? 1.04 : 1,
                        opacity: crmBlocked ? 0.45 : 1,
                      }
                }
                transition={{ duration: 0.4, ease: EASE }}
                className={cn(
                  "relative flex w-full flex-col items-center border px-2 py-3.5 text-center sm:px-3",
                  isGate && "border-cyan-400/40 bg-cyan-400/[0.1]",
                )}
              >
                {isActive && !reducedMotion ? (
                  <motion.span
                    className="absolute inset-0 border border-cyan-300/50"
                    animate={{ opacity: [0.15, 0.75, 0.15] }}
                    transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
                  />
                ) : null}
                <stage.icon
                  className={cn(
                    "relative h-5 w-5",
                    isActive || isGate ? "text-cyan-300" : crmBlocked ? "text-white/30" : "text-white/55",
                  )}
                />
                <span className={cn(display, "relative mt-2 text-sm font-semibold text-white")}>
                  {stage.label}
                </span>
                <span
                  className={cn(
                    mono,
                    "relative mt-0.5 text-[0.55rem] uppercase tracking-wider",
                    isGate ? "text-cyan-200/80" : "text-white/45",
                  )}
                >
                  {stage.sub}
                </span>
              </motion.div>

              {i < stages.length - 1 ? (
                <div className="relative mx-0.5 hidden h-px w-5 shrink-0 overflow-hidden sm:mx-1 sm:block sm:w-7">
                  <div className="absolute inset-0 bg-white/[0.08]" />
                  <motion.div
                    className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-cyan-300 to-transparent"
                    animate={
                      reducedMotion
                        ? { x: "50%" }
                        : step > i
                          ? { x: ["-100%", "200%"] }
                          : step === i
                            ? { x: ["-100%", "80%"], opacity: [0.3, 1, 0.3] }
                            : { x: "-100%", opacity: 0.2 }
                    }
                    transition={
                      reducedMotion
                        ? undefined
                        : step >= i
                          ? { repeat: Infinity, duration: 1.1, ease: "linear" }
                          : { duration: 0.3 }
                    }
                  />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <motion.p
        key={unlocked ? "open-copy" : "lock-copy"}
        initial={reducedMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative mt-6 text-sm text-white/70"
      >
        {unlocked
          ? "Human approved — webhook / CRM write is allowed."
          : "Approval is enforced in the API — drafts never write CRM alone."}
      </motion.p>
    </div>
  );
}

/** Animated /sign-in mock — GitHub + Google OAuth */
export function OAuthLoginVisual({ className }: { className?: string }) {
  const reducedMotion = useSyncExternalStore(subscribeReducedMotion, getReducedMotion, () => true);
  const [active, setActive] = useState<"github" | "google">("github");

  useEffect(() => {
    if (reducedMotion) return;
    const id = window.setInterval(() => {
      setActive((prev) => (prev === "github" ? "google" : "github"));
    }, 2200);
    return () => window.clearInterval(id);
  }, [reducedMotion]);

  return (
    <div
      className={cn(
        "relative flex h-full min-h-[280px] flex-col overflow-hidden border border-cyan-400/25 bg-[#050b16]/95 shadow-[0_0_40px_rgba(34,211,238,0.06)]",
        className,
      )}
    >
      <div className="flex items-center gap-2 border-b border-white/[0.08] bg-white/[0.03] px-4 py-2.5">
        <span className="h-2 w-2 rounded-full bg-white/25" />
        <span className="h-2 w-2 rounded-full bg-white/25" />
        <span className="h-2 w-2 rounded-full bg-white/25" />
        <span className={cn(mono, "ml-3 text-[0.65rem] tracking-wider text-white/45")}>
          santra-ai-neurox.vercel.app/sign-in
        </span>
      </div>

      <div className="flex flex-1 flex-col justify-center px-6 py-7 sm:px-8">
        <p className={cn(mono, "text-[0.65rem] uppercase tracking-[0.2em] text-cyan-300")}>
          Secure access
        </p>
        <p className={cn(display, "mt-2 text-xl font-semibold text-white sm:text-2xl")}>
          Continue with GitHub or Google
        </p>
        <p className="mt-2 text-sm text-white/60">One click into the live workspace — no demo password.</p>

        <div className="mt-6 space-y-3">
          {(
            [
              { id: "github" as const, label: "Continue with GitHub", icon: GitFork },
              { id: "google" as const, label: "Continue with Google", icon: null },
            ] as const
          ).map((provider) => {
            const isActive = active === provider.id;
            return (
              <motion.div
                key={provider.id}
                animate={
                  reducedMotion
                    ? undefined
                    : {
                        borderColor: isActive
                          ? "rgba(34,211,238,0.6)"
                          : "rgba(255,255,255,0.1)",
                        backgroundColor: isActive
                          ? "rgba(34,211,238,0.14)"
                          : "rgba(255,255,255,0.03)",
                        scale: isActive ? 1.01 : 1,
                      }
                }
                transition={{ duration: 0.4, ease: EASE }}
                className="relative flex items-center gap-3 border border-white/[0.1] px-4 py-3.5"
              >
                {!reducedMotion && isActive ? (
                  <motion.span
                    className="absolute inset-0 border border-cyan-300/40"
                    animate={{ opacity: [0.2, 0.7, 0.2] }}
                    transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
                  />
                ) : null}
                {provider.icon ? (
                  <provider.icon className="relative h-4 w-4 shrink-0 text-white/90" />
                ) : (
                  <span className="relative flex h-4 w-4 shrink-0 items-center justify-center text-sm font-semibold text-white/90">
                    G
                  </span>
                )}
                <span className={cn(display, "relative flex-1 text-sm font-semibold text-white")}>
                  {provider.label}
                </span>
                {isActive ? (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={cn(mono, "relative text-[0.55rem] uppercase tracking-[0.16em] text-cyan-300")}
                  >
                    Active
                  </motion.span>
                ) : null}
              </motion.div>
            );
          })}
        </div>

        <div className="mt-5 flex items-center gap-3 text-[0.65rem] uppercase tracking-[0.16em] text-white/35">
          <span className="h-px flex-1 bg-white/10" />
          <span>or work email</span>
          <span className="h-px flex-1 bg-white/10" />
        </div>
      </div>
    </div>
  );
}

const INTENT_PROMPTS = [
  {
    text: "Watch competitor pricing page for packaging changes",
    category: "pricing",
    severity: "medium",
  },
  {
    text: "Alert me when rivals post urgent hiring spikes",
    category: "hiring",
    severity: "high",
  },
  {
    text: "Notify on critical security outage mentions",
    category: "risk",
    severity: "critical",
  },
] as const;

const SEVERITY_TONE: Record<string, string> = {
  low: "border-white/20 bg-white/[0.06] text-white/70",
  medium: "border-amber-300/35 bg-amber-400/10 text-amber-100",
  high: "border-orange-300/40 bg-orange-400/15 text-orange-100",
  critical: "border-rose-300/45 bg-rose-400/15 text-rose-100",
};

/** Animated prompt → auto category + severity classification */
export function AutoIntentVisual({ className }: { className?: string }) {
  const reducedMotion = useSyncExternalStore(subscribeReducedMotion, getReducedMotion, () => true);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<"typing" | "classified">("classified");
  const [typed, setTyped] = useState<string>(INTENT_PROMPTS[0].text);

  useEffect(() => {
    if (reducedMotion) return;

    let cancelled = false;
    let typeTimer: number | undefined;
    let holdTimer: number | undefined;

    const run = (promptIndex: number) => {
      const prompt = INTENT_PROMPTS[promptIndex]!;
      setPhase("typing");
      setTyped("");
      let i = 0;

      const tick = () => {
        if (cancelled) return;
        i += 1;
        setTyped(prompt.text.slice(0, i));
        if (i < prompt.text.length) {
          typeTimer = window.setTimeout(tick, 22);
          return;
        }
        setPhase("classified");
        holdTimer = window.setTimeout(() => {
          if (cancelled) return;
          const next = (promptIndex + 1) % INTENT_PROMPTS.length;
          setIndex(next);
          run(next);
        }, 2400);
      };

      typeTimer = window.setTimeout(tick, 280);
    };

    run(0);
    return () => {
      cancelled = true;
      if (typeTimer) window.clearTimeout(typeTimer);
      if (holdTimer) window.clearTimeout(holdTimer);
    };
  }, [reducedMotion]);

  const current = INTENT_PROMPTS[reducedMotion ? 0 : index]!;
  const shownText = reducedMotion ? current.text : typed;
  const shownPhase = reducedMotion ? "classified" : phase;

  return (
    <div
      className={cn(
        "relative flex h-full min-h-[280px] flex-col overflow-hidden border border-cyan-400/20 bg-[#050b16]/95",
        className,
      )}
    >
      <div className="flex items-center gap-2 border-b border-white/[0.08] bg-white/[0.03] px-4 py-2.5">
        <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
        <span className={cn(mono, "text-[0.65rem] tracking-wider text-white/45")}>
          Auto intent · from your prompt
        </span>
      </div>

      <div className="flex flex-1 flex-col px-5 py-5 sm:px-6">
        <p className={cn(mono, "text-[0.65rem] uppercase tracking-[0.18em] text-white/50")}>
          You type
        </p>
        <div className="mt-2 min-h-[4.5rem] border border-white/[0.1] bg-white/[0.03] px-3 py-3">
          <p className="text-sm leading-relaxed text-white/85">
            {shownText}
            {!reducedMotion && shownPhase === "typing" ? (
              <motion.span
                className="ml-0.5 inline-block h-4 w-0.5 bg-cyan-300 align-middle"
                animate={{ opacity: [1, 0, 1] }}
                transition={{ repeat: Infinity, duration: 0.8 }}
              />
            ) : null}
          </p>
        </div>

        <motion.div
          key={`${current.category}-${shownPhase}`}
          initial={reducedMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: shownPhase === "classified" ? 1 : 0.35, y: 0 }}
          transition={{ duration: 0.35, ease: EASE }}
          className="mt-5"
        >
          <p className={cn(mono, "text-[0.65rem] uppercase tracking-[0.18em] text-cyan-300")}>
            Santra understands
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="border border-cyan-300/35 bg-cyan-400/10 px-3 py-1.5 text-sm text-cyan-100">
              Category · {current.category}
            </span>
            <span
              className={cn(
                "border px-3 py-1.5 text-sm capitalize",
                SEVERITY_TONE[current.severity] ?? SEVERITY_TONE.medium,
              )}
            >
              Severity · {current.severity}
            </span>
          </div>
          <p className="mt-4 text-sm text-white/65">
            Plain-language watches classify automatically — adjust anytime.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

const DISCORD_STEPS = [
  {
    title: "Open channel settings",
    detail: "Discord → channel → Edit Channel",
  },
  {
    title: "Create a webhook",
    detail: "Integrations → Webhooks → New Webhook",
  },
  {
    title: "Copy the URL",
    detail: "discord.com/api/webhooks/…",
  },
  {
    title: "Paste in SANTRA",
    detail: "Monitors → Options → Alert webhook URL",
  },
  {
    title: "Approve & send",
    detail: "HITL gate → Discord embed lands",
  },
] as const;

/** Animated Discord webhook how-to for the pitch deck */
export function DiscordWebhookVisual({ className }: { className?: string }) {
  const reducedMotion = useSyncExternalStore(subscribeReducedMotion, getReducedMotion, () => true);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (reducedMotion) return;
    const id = window.setInterval(() => {
      setStep((prev) => (prev + 1) % DISCORD_STEPS.length);
    }, 2000);
    return () => window.clearInterval(id);
  }, [reducedMotion]);

  const active = reducedMotion ? DISCORD_STEPS.length - 1 : step;
  const pasted = active >= 3;
  const sent = active >= 4;

  return (
    <div
      className={cn(
        "relative grid h-full min-h-[300px] overflow-hidden border border-cyan-400/25 bg-[#050b16]/95 lg:grid-cols-2",
        className,
      )}
    >
      {/* Discord side */}
      <div className="flex flex-col border-b border-white/[0.08] lg:border-b-0 lg:border-r">
        <div className="flex items-center gap-2 border-b border-white/[0.08] bg-[#5865F2]/15 px-4 py-2.5">
          <Hash className="h-3.5 w-3.5 text-[#a5b4fc]" />
          <span className={cn(mono, "text-[0.65rem] tracking-wider text-[#c7d2fe]")}>
            #gtm-alerts · Discord
          </span>
        </div>
        <ul className="flex flex-1 flex-col justify-center gap-2 px-4 py-4 sm:px-5">
          {DISCORD_STEPS.slice(0, 3).map((item, i) => {
            const isActive = active === i;
            const isPast = active > i;
            return (
              <motion.li
                key={item.title}
                animate={{
                  borderColor: isActive
                    ? "rgba(129,140,248,0.55)"
                    : isPast
                      ? "rgba(34,211,238,0.25)"
                      : "rgba(255,255,255,0.08)",
                  backgroundColor: isActive ? "rgba(88,101,242,0.18)" : "rgba(255,255,255,0.02)",
                }}
                transition={{ duration: 0.35, ease: EASE }}
                className="border px-3 py-2.5"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      mono,
                      "flex h-5 w-5 items-center justify-center text-[0.6rem]",
                      isActive || isPast ? "text-cyan-200" : "text-white/35",
                    )}
                  >
                    0{i + 1}
                  </span>
                  <p className={cn(display, "text-sm font-semibold text-white")}>{item.title}</p>
                  {isPast ? <CheckCircle2 className="ml-auto h-3.5 w-3.5 text-cyan-300" /> : null}
                </div>
                <p className="mt-1 pl-7 text-xs text-white/55">{item.detail}</p>
              </motion.li>
            );
          })}
        </ul>
        {sent ? (
          <motion.div
            initial={reducedMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-4 mb-4 border border-indigo-300/30 bg-indigo-500/10 px-3 py-2.5 sm:mx-5"
          >
            <p className="text-xs font-medium text-indigo-100">SANTRA · Pricing watch</p>
            <p className="mt-1 text-[0.7rem] leading-snug text-white/70">
              Material packaging change detected · Risk 62 · awaiting team read.
            </p>
          </motion.div>
        ) : null}
      </div>

      {/* SANTRA side */}
      <div className="flex flex-col">
        <div className="flex items-center gap-2 border-b border-white/[0.08] bg-white/[0.03] px-4 py-2.5">
          <Link2 className="h-3.5 w-3.5 text-cyan-300" />
          <span className={cn(mono, "text-[0.65rem] tracking-wider text-white/45")}>
            /alerts · webhook URL
          </span>
        </div>
        <div className="flex flex-1 flex-col justify-center px-4 py-4 sm:px-5">
          <p className={cn(mono, "text-[0.65rem] uppercase tracking-[0.18em] text-cyan-300")}>
            Alert webhook URL
          </p>
          <div className="mt-2 flex items-center gap-2 border border-white/15 bg-white/[0.04] px-3 py-2.5">
            <motion.p
              key={pasted ? "filled" : "empty"}
              initial={reducedMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              className={cn(
                "min-w-0 flex-1 truncate font-mono text-[0.7rem]",
                pasted ? "text-cyan-100" : "text-white/30",
              )}
            >
              {pasted
                ? "https://discord.com/api/webhooks/…/…"
                : "Paste Discord webhook URL…"}
            </motion.p>
            <Copy className={cn("h-3.5 w-3.5 shrink-0", pasted ? "text-cyan-300" : "text-white/25")} />
          </div>

          <ul className="mt-4 space-y-2">
            {DISCORD_STEPS.slice(3).map((item, offset) => {
              const i = offset + 3;
              const isActive = active === i;
              const isPast = active > i;
              return (
                <motion.li
                  key={item.title}
                  animate={{
                    borderColor: isActive
                      ? "rgba(34,211,238,0.5)"
                      : isPast
                        ? "rgba(34,211,238,0.22)"
                        : "rgba(255,255,255,0.08)",
                    backgroundColor: isActive ? "rgba(34,211,238,0.12)" : "rgba(255,255,255,0.02)",
                  }}
                  className="border px-3 py-2.5"
                >
                  <div className="flex items-center gap-2">
                    <span className={cn(mono, "text-[0.6rem] text-cyan-200/80")}>0{i + 1}</span>
                    <p className={cn(display, "text-sm font-semibold text-white")}>{item.title}</p>
                    {(isPast || (sent && i === 4)) && (
                      <CheckCircle2 className="ml-auto h-3.5 w-3.5 text-emerald-300" />
                    )}
                  </div>
                  <p className="mt-1 pl-7 text-xs text-white/55">{item.detail}</p>
                </motion.li>
              );
            })}
          </ul>

          <motion.div
            animate={{
              opacity: sent ? 1 : 0.4,
              borderColor: sent ? "rgba(52,211,153,0.45)" : "rgba(255,255,255,0.12)",
            }}
            className="mt-4 border px-3 py-2.5 text-center"
          >
            <p className={cn(mono, "text-[0.65rem] uppercase tracking-[0.16em]", sent ? "text-emerald-200" : "text-white/45")}>
              {sent ? "Delivered to Discord" : "Waiting for HITL approve"}
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
