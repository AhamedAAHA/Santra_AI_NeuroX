"use client";

import { motion } from "framer-motion";
import {
  Bell,
  Bot,
  CheckCircle2,
  Mail,
  Mic,
  Radar,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { useSyncExternalStore } from "react";
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
  const stages = [
    { icon: Bot, label: "Agent", sub: "Research" },
    { icon: Radar, label: "Draft", sub: "Evidence" },
    { icon: UserCheck, label: "Human", sub: "Approve", pulse: true },
    { icon: CheckCircle2, label: "CRM", sub: "Write" },
  ];

  return (
    <div
      className={cn(
        "flex h-full min-h-[220px] flex-col justify-center border border-white/[0.1] bg-[#070d1a]/90 p-5 sm:p-6",
        className,
      )}
    >
      <p className={cn(mono, "text-[0.7rem] uppercase tracking-[0.16em] text-cyan-300")}>
        Bounded autonomy
      </p>
      <p className={cn(display, "mt-2 text-lg font-semibold text-white sm:text-xl")}>
        Draft fast. Gate writes.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-2 sm:gap-1">
        {stages.map((stage, i) => (
          <div key={stage.label} className="flex flex-1 items-center min-w-[4.5rem]">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.12, duration: 0.4, ease: EASE }}
              className={cn(
                "relative flex w-full flex-col items-center border px-2 py-3 text-center",
                stage.pulse
                  ? "border-cyan-400/40 bg-cyan-400/[0.1]"
                  : "border-white/[0.1] bg-white/[0.02]",
              )}
            >
              {stage.pulse ? (
                <motion.span
                  className="absolute inset-0 border border-cyan-300/40"
                  animate={{ opacity: [0.2, 0.7, 0.2] }}
                  transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
                />
              ) : null}
              <stage.icon
                className={cn("relative h-5 w-5", stage.pulse ? "text-cyan-300" : "text-white/55")}
              />
              <span className={cn(display, "relative mt-2 text-sm font-semibold text-white")}>
                {stage.label}
              </span>
              <span className={cn(mono, "relative mt-0.5 text-[0.55rem] uppercase tracking-wider text-white/45")}>
                {stage.sub}
              </span>
            </motion.div>
            {i < stages.length - 1 ? (
              <motion.div
                className="mx-1 hidden h-px w-4 shrink-0 bg-gradient-to-r from-cyan-400/50 to-cyan-400/10 sm:block sm:w-6"
                animate={{ opacity: [0.35, 1, 0.35] }}
                transition={{ repeat: Infinity, duration: 1.6, delay: i * 0.2 }}
              />
            ) : null}
          </div>
        ))}
      </div>

      <p className="mt-6 text-sm text-white/70">
        Approval is enforced in the API — drafts never write CRM alone.
      </p>
    </div>
  );
}
