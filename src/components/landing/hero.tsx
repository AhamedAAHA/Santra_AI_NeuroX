"use client";

import dynamic from "next/dynamic";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { useEffect, useState } from "react";
import { ArrowRight, Brain, ChevronRight, Globe, Rocket, Shield, TrendingUp, Zap } from "lucide-react";
import { LandingAuthLink } from "@/components/landing/landing-auth-link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SENTRA_HOME } from "@/lib/landing/auth-links";
import { cn } from "@/lib/utils";

const HeroVisual = dynamic(
  () => import("@/components/landing/hero-visual").then((m) => m.HeroVisual),
  { ssr: false },
);

// Animated number counter — delay-based so above-fold stats always animate
function CountUp({ to, suffix = "", prefix = "", startDelay = 900 }: { to: number; suffix?: string; prefix?: string; startDelay?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const duration = 1600;
      const steps = 55;
      const increment = to / steps;
      let current = 0;
      const timer = setInterval(() => {
        current = Math.min(current + increment, to);
        setCount(Math.floor(current));
        if (current >= to) clearInterval(timer);
      }, duration / steps);
      return () => clearInterval(timer);
    }, startDelay);
    return () => clearTimeout(timeout);
  }, [to, startDelay]);

  return <span className="stat-counter">{prefix}{count.toLocaleString()}{suffix}</span>;
}

// Ticker item
const tickerItems = [
  "Competitive Intelligence",
  "GTM Monitors",
  "Pricing Change Detection",
  "Executive Briefs",
  "Human-in-the-Loop",
  "Agent Tool Routing",
  "Exa Web Evidence",
  "CRM Automation",
  "Risk Assessment",
  "RevOps Workflows",
  "Competitor Battlecards",
  "Approval Queue",
];

function IntelligenceTicker() {
  const doubled = [...tickerItems, ...tickerItems];
  return (
    <div className="relative overflow-hidden border-y border-white/[0.07] py-2.5" aria-hidden>
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-sentra-ink to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-sentra-ink to-transparent" />
      <div className="flex animate-ticker-slide gap-0">
        {doubled.map((item, i) => (
          <div key={i} className="flex shrink-0 items-center gap-3 px-6">
            <span className="h-1 w-1 rounded-full bg-sentra-cyan/60" />
            <span className="whitespace-nowrap text-xs font-medium uppercase tracking-[0.22em] text-white/30">
              {item}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Animated stat card
function StatCard({ value, label, suffix = "", icon: Icon, delay = 0 }: {
  value: number; label: string; suffix?: string; icon: React.FC<React.SVGProps<SVGSVGElement>>; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="glass-panel cyber-card rounded-2xl p-4"
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-3.5 w-3.5 text-sentra-cyan" />
        <span className="type-caption text-white/35">{label}</span>
      </div>
      <p className="text-2xl font-bold text-white heading-gradient-sweep">
        <CountUp to={value} suffix={suffix} />
      </p>
    </motion.div>
  );
}

// Live signal pulse
function LiveSignal({ label, value, color = "cyan" }: { label: string; value: string; color?: "cyan" | "violet" | "pink" }) {
  const colorMap = {
    cyan: "text-sentra-cyan border-sentra-cyan/25 bg-[rgba(83,244,255,0.08)]",
    violet: "text-violet-300 border-violet-300/25 bg-[rgba(168,85,247,0.08)]",
    pink: "text-pink-300 border-pink-300/25 bg-[rgba(255,79,216,0.08)]",
  };
  return (
    <div className={cn("flex items-center justify-between rounded-2xl border px-3.5 py-2.5", colorMap[color])}>
      <span className="text-xs text-white/50">{label}</span>
      <span className="text-xs font-semibold">{value}</span>
    </div>
  );
}

// Cursor follow glow (desktop only)
function CursorGlow() {
  const x = useMotionValue(-400);
  const y = useMotionValue(-400);
  const sx = useSpring(x, { stiffness: 100, damping: 22 });
  const sy = useSpring(y, { stiffness: 100, damping: 22 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => { x.set(e.clientX); y.set(e.clientY); };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [x, y]);

  return (
    <motion.div
      className="pointer-events-none fixed z-0 hidden h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.07] blur-[120px] lg:block"
      style={{ left: sx, top: sy, background: "radial-gradient(circle, #53f4ff 0%, transparent 60%)" }}
    />
  );
}

const stats = [
  { value: 94, suffix: "%", label: "Evidence Accuracy", icon: Shield },
  { value: 30, suffix: "s", label: "Monitor Check", icon: Zap },
  { value: 3, suffix: "+", label: "External Tools", icon: Brain },
  { value: 24, suffix: "/7", label: "Agent Uptime", icon: Globe },
];

const liveSignals = [
  { label: "Competitor Risk", value: "HIGH", color: "cyan" as const },
  { label: "Pricing Signal", value: "DETECTED", color: "violet" as const },
  { label: "HITL Status", value: "PENDING", color: "cyan" as const },
  { label: "Evidence Source", value: "EXA LIVE", color: "pink" as const },
];

export function Hero() {
  const [activeWord, setActiveWord] = useState(0);
  const words = ["RevOps", "GTM Teams", "SaaS", "Competitive Intel", "Sales Ops"];

  useEffect(() => {
    const id = setInterval(() => {
      setActiveWord((prev) => (prev + 1) % words.length);
    }, 2200);
    return () => clearInterval(id);
  }, [words.length]);

  return (
    <section className="relative pb-16 pt-28 md:pt-36">
      <CursorGlow />

      {/* Intelligence ticker */}
      <IntelligenceTicker />

      <div className="container py-14 md:py-20">
        <div className="grid items-start gap-14 lg:grid-cols-[1fr_0.9fr] xl:gap-20">

          {/* Left column */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
            className="order-1"
          >
            {/* Pre-heading pill */}
            <motion.div
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-sentra-cyan/20 bg-sentra-cyan/5 px-4 py-1.5"
            >
              <span className="live-dot" />
              <span className="type-caption text-sentra-cyan/80">NEUROX 2026 · B2B AGENTIC GTM</span>
              <ChevronRight className="h-3 w-3 text-sentra-cyan/50" />
            </motion.div>

            {/* Main heading — 2-line layout: title + "Intelligence for [audience]" */}
            <h1 className="font-display font-bold tracking-[-0.04em]">
              <span className="heading-gradient-sweep block whitespace-nowrap text-[clamp(2.6rem,5vw,5.2rem)] leading-[1.05]">
                Autonomous GTM
              </span>
              <span className="mt-1 block text-[clamp(2rem,3.8vw,4rem)] leading-[1.12]">
                <span className="heading-gradient-sweep">Intelligence </span>
                <span className="text-[0.38em] font-medium tracking-normal text-white/35">for </span>
                <span className="relative inline-block min-w-[18ch] overflow-hidden align-baseline">
                  <motion.span
                    key={activeWord}
                    initial={{ y: 32, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -32, opacity: 0 }}
                    transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
                    className="text-sweep inline-block whitespace-nowrap"
                  >
                    {words[activeWord]}
                  </motion.span>
                </span>
              </span>
            </h1>

            <p className="mt-6 max-w-[48ch] text-base leading-7 text-white/55 md:text-lg md:leading-8">
              Monitor competitors, collect live web evidence, detect material changes, and queue CRM
              automation — with human approval before anything executes.
            </p>

            {/* CTA buttons */}
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild size="lg" variant="neon" className="group relative overflow-hidden">
                <LandingAuthLink href={SENTRA_HOME}>
                  <span className="relative z-10 flex items-center gap-2">
                    Open GTM Monitors
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </LandingAuthLink>
              </Button>
              <Button asChild size="lg" variant="ghost">
                <a href="#platform">
                  Explore Platform
                </a>
              </Button>
            </div>

            {/* Trust indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-8 flex flex-wrap items-center gap-5 text-xs text-white/32"
            >
              {["Autonomous Agent Loop", "Human-in-the-Loop", "Exa + LLM Evidence", "B2B Competitive Intel"].map((item) => (
                <span key={item} className="flex items-center gap-1.5">
                  <span className="h-1 w-1 rounded-full bg-sentra-cyan/50" />
                  {item}
                </span>
              ))}
            </motion.div>

            {/* Stats grid */}
            <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {stats.map((stat, i) => (
                <StatCard key={stat.label} {...stat} delay={0.4 + i * 0.08} />
              ))}
            </div>
          </motion.div>

          {/* Right column — 3D visual + overlaid cards */}
          <motion.div
            className="relative order-2 mx-auto w-full max-w-[620px] lg:mx-0"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.1, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* 3D canvas container */}
            <div className="relative min-h-[420px] overflow-hidden rounded-[2rem] border border-white/10 bg-sentra-ink/60 shadow-2xl shadow-black/50 sm:min-h-[500px] lg:min-h-[560px]">
              <div className="scan-line-overlay" />
              {/* 3D canvas — explicitly z-0 so overlay cards sit above */}
              <div className="absolute inset-0 z-0">
                <HeroVisual />
              </div>

              {/* Intelligence overlay cards — z-10 ensures they are above the WebGL canvas */}
              <Card
                className="absolute left-3 top-8 z-10 w-[min(200px,48vw)] p-4 md:left-5"
                data-float
                glow
              >
                <p className="type-caption text-sentra-cyan/60 mb-2">RISK INDEX</p>
                <p className="text-3xl font-bold text-white">74<span className="text-base text-white/40">%</span></p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-sentra-cyan to-sentra-violet"
                    initial={{ width: 0 }}
                    animate={{ width: "74%" }}
                    transition={{ delay: 1.2, duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
                <p className="mt-1.5 text-[10px] text-white/35">Competitor pricing change detected</p>
              </Card>

              <Card
                className="absolute right-3 top-12 z-10 w-[min(190px,46vw)] p-4 md:right-5"
                data-float
              >
                <p className="type-caption text-violet-300/60 mb-2">AGENT STATUS</p>
                <div className="grid gap-1.5">
                  {liveSignals.slice(0, 2).map((sig) => (
                    <LiveSignal key={sig.label} {...sig} />
                  ))}
                </div>
              </Card>

              <Card
                className="absolute bottom-5 left-3 right-3 z-10 p-4 md:bottom-7 md:left-5 md:right-5"
                data-float
                glow
              >
                <div className="flex items-center justify-between gap-3 mb-3">
                  <p className="type-caption text-white/35">AGENT ACTIVITY</p>
                  <span className="live-dot" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {liveSignals.map((sig) => (
                    <LiveSignal key={sig.label} {...sig} />
                  ))}
                </div>
              </Card>
            </div>

            {/* Below visual — feature highlights */}
            <div className="mt-4 grid grid-cols-3 gap-3">
              {[
                { icon: TrendingUp, label: "Change Detection", detail: "Pricing & hiring" },
                { icon: Brain, label: "Agent Reasoning", detail: "Tool routing" },
                { icon: Rocket, label: "Approved Actions", detail: "CRM & webhooks" },
              ].map((card) => (
                <Card key={card.label} className="cyber-card p-3 text-center" glow>
                  <card.icon className="mx-auto mb-2 h-4 w-4 text-sentra-cyan" />
                  <p className="text-xs font-semibold text-white">{card.label}</p>
                  <p className="mt-0.5 text-[10px] text-white/40">{card.detail}</p>
                </Card>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
