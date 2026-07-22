"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Globe, ArrowUpRight, GitFork, X, ExternalLink } from "lucide-react";
import { signInFor } from "@/lib/landing/auth-links";
import { BrandLogo } from "@/components/shared/brand-mark";

const workspaceLinks = [
  { label: "GTM Monitors", href: signInFor("/alerts") },
  { label: "Dashboard", href: signInFor("/dashboard") },
  { label: "GTM Advisor", href: signInFor("/chat") },
  { label: "Competitor IQ", href: signInFor("/analyst") },
];

const platformLinks = [
  { label: "Platform", href: "#platform" },
  { label: "How it works", href: "#intelligence" },
  { label: "Our Services", href: "/services" },
  { label: "Trust", href: "#integrations" },
];

const accountLinks = [
  { label: "Sign In", href: "/sign-in" },
  { label: "Sign Up", href: "/sign-up" },
];

const socialLinks = [
  { label: "GitHub", href: "#", icon: GitFork },
  { label: "Twitter / X", href: "#", icon: X },
  { label: "LinkedIn", href: "#", icon: ExternalLink },
  { label: "Website", href: "#", icon: Globe },
];

const footerStats = [
  { value: "3+", label: "External Tools" },
  { value: "24/7", label: "Monitor Cadence" },
  { value: "HITL", label: "Approval Gate" },
  { value: "B2B", label: "GTM Focus" },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};

export function Footer() {
  return (
    <footer className="relative border-t border-white/[0.07] bg-gradient-to-b from-transparent to-sentra-ink/40">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sentra-cyan/40 to-transparent" />

      <div className="border-b border-white/[0.06] bg-white/[0.02]">
        <div className="container">
          <div className="flex items-stretch divide-x divide-white/[0.06] overflow-x-auto scrollbar-none">
            {footerStats.map((stat) => (
              <div
                key={stat.label}
                className="flex shrink-0 flex-col items-center justify-center gap-0.5 px-8 py-4 text-center"
              >
                <span className="font-display text-lg font-bold text-sentra-cyan tabular-nums">{stat.value}</span>
                <span className="type-caption text-white/30">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <motion.div
        className="container py-16"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-40px" }}
      >
        <div className="grid gap-12 md:grid-cols-[1.6fr_1fr_1fr_1fr]">
          <motion.div variants={itemVariants}>
            <Link href="/" aria-label="Santra home" className="inline-block mb-5">
              <BrandLogo className="h-[52px] w-[78px]" />
            </Link>

            <p className="text-sm leading-7 text-white/40 max-w-[30ch] mb-6">
              Autonomous B2B GTM intelligence agent for revenue, competitive intel, and strategy teams —
              with human approval before automation runs.
            </p>

            <div className="flex items-center gap-2 mb-6">
              {socialLinks.map(({ label, href, icon: Icon }) => (
                <Link
                  key={label}
                  href={href}
                  aria-label={label}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-white/40 transition-all hover:border-sentra-cyan/30 hover:bg-sentra-cyan/10 hover:text-sentra-cyan"
                >
                  <Icon className="h-3.5 w-3.5" />
                </Link>
              ))}
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-sentra-cyan/20 bg-[rgba(83,244,255,0.05)] px-3.5 py-1.5">
              <span className="live-dot" />
              <span className="text-xs font-semibold tracking-widest text-sentra-cyan/70">SYSTEMS ONLINE</span>
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <p className="type-caption text-white/30 mb-5">Workspace</p>
            <ul className="grid gap-3">
              {workspaceLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="group flex items-center gap-1.5 text-sm text-white/45 transition-colors hover:text-white"
                  >
                    {link.label}
                    <ArrowUpRight className="h-3 w-3 opacity-0 -translate-y-0.5 translate-x-0 transition-all group-hover:opacity-60 group-hover:translate-x-0.5 group-hover:-translate-y-1" />
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div variants={itemVariants}>
            <p className="type-caption text-white/30 mb-5">Platform</p>
            <ul className="grid gap-3">
              {platformLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="group flex items-center gap-1.5 text-sm text-white/45 transition-colors hover:text-white"
                  >
                    {link.label}
                    <ArrowUpRight className="h-3 w-3 opacity-0 -translate-y-0.5 transition-all group-hover:opacity-60 group-hover:translate-x-0.5 group-hover:-translate-y-1" />
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div variants={itemVariants}>
            <p className="type-caption text-white/30 mb-5">Account</p>
            <ul className="grid gap-3 mb-7">
              {accountLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="group flex items-center gap-1.5 text-sm text-white/45 transition-colors hover:text-white"
                  >
                    {link.label}
                    <ArrowUpRight className="h-3 w-3 opacity-0 -translate-y-0.5 transition-all group-hover:opacity-60 group-hover:translate-x-0.5 group-hover:-translate-y-1" />
                  </Link>
                </li>
              ))}
            </ul>

            <div className="rounded-2xl border border-white/[0.08] bg-[rgba(83,244,255,0.04)] p-4 relative overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sentra-cyan/25 to-transparent" />
              <p className="text-xs font-bold tracking-wider text-white mb-1">SANTRA GTM Agent</p>
              <p className="text-xs text-white/35 leading-5">
                NeuroX 2026 — competitive intelligence with human-in-the-loop automation.
              </p>
              <div className="mt-3 flex items-center gap-1.5">
                <div className="h-1 flex-1 rounded-full bg-white/10 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-sentra-cyan to-sentra-violet"
                    initial={{ width: 0 }}
                    whileInView={{ width: "78%" }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
                <span className="text-[10px] text-white/35 tabular-nums">78%</span>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div
          variants={itemVariants}
          className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/[0.06] pt-8 sm:flex-row"
        >
          <p className="text-xs text-white/25">
            &copy; {new Date().getFullYear()} SANTRA AI. Built for B2B GTM and competitive intelligence teams.
          </p>

          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-xs text-white/20">Powered by AI</span>
            <div className="h-3 w-px bg-white/10 hidden sm:block" />
            <div className="flex items-center gap-2 rounded-full border border-sentra-cyan/20 bg-[rgba(83,244,255,0.05)] px-3.5 py-1.5">
              <span className="live-dot" />
              <span className="text-xs font-medium text-sentra-cyan/70">AI Intelligence Active</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </footer>
  );
}
