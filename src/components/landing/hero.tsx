"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { ArrowRight, Brain, ChevronRight, Globe, Shield, Zap } from "lucide-react";
import { LandingAuthLink } from "@/components/landing/landing-auth-link";
import { Button } from "@/components/ui/button";
import { SENTRA_HOME } from "@/lib/landing/auth-links";

const HeroVisual = dynamic(
  () => import("@/components/landing/hero-visual").then((m) => m.HeroVisual),
  { ssr: false },
);

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

const stats = [
  { value: 94, suffix: "%", label: "Evidence Accuracy", icon: Shield },
  { value: 30, suffix: "s", label: "Monitor Check", icon: Zap },
  { value: 3, suffix: "+", label: "External Tools", icon: Brain },
  { value: 24, suffix: "/7", label: "Agent Uptime", icon: Globe },
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
      <IntelligenceTicker />

      <div className="container py-14 md:py-20">
        <div className="grid items-center gap-10 lg:grid-cols-[0.95fr_1.1fr] xl:gap-8">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          >
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
                <a href="#platform">Explore Platform</a>
              </Button>
            </div>

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

            <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {stats.map((stat, i) => (
                <StatCard key={stat.label} {...stat} delay={0.4 + i * 0.08} />
              ))}
            </div>
          </motion.div>

          <motion.div
            className="relative mx-auto min-h-[520px] w-full max-w-[760px] sm:min-h-[580px] lg:mx-0 lg:min-h-[640px] lg:max-w-none"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          >
            <HeroVisual />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
