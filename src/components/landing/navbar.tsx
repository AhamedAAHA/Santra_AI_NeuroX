"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, useMotionTemplate, useScroll, useTransform } from "framer-motion";
import { Activity, Menu, X } from "lucide-react";
import { LandingAuthLink } from "@/components/landing/landing-auth-link";
import { BrandLogo } from "@/components/shared/brand-mark";
import { Button } from "@/components/ui/button";
import { SENTRA_HOME } from "@/lib/landing/auth-links";
import { cn } from "@/lib/utils";

const links = [
  { label: "Platform", href: "#platform" },
  { label: "Services", href: "/services" },
  { label: "Intelligence", href: "#intelligence" },
  { label: "Integrations", href: "#integrations" },
];

export function Navbar() {
  const { scrollY } = useScroll();
  const bgOpacity = useTransform(scrollY, [0, 80], [0.45, 0.88]);
  const bgColor = useMotionTemplate`rgba(5,7,18,${bgOpacity})`;
  const borderOpacity = useTransform(scrollY, [0, 80], [0, 1]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [liveTime, setLiveTime] = useState("");

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setLiveTime(now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      <motion.header
        className="fixed inset-x-0 top-0 z-40 backdrop-blur-2xl"
        style={{ backgroundColor: bgColor }}
      >
        <motion.div
          className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-sentra-cyan/40 to-transparent"
          style={{ opacity: borderOpacity }}
        />
        {/* Top micro-bar */}
        <div className="hidden border-b border-white/[0.06] md:block">
          <div className="container flex h-7 items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="live-dot" />
                <span className="type-caption text-white/40">INTELLIGENCE SYSTEMS ACTIVE</span>
              </span>
              <span className="h-3 w-px bg-white/10" />
              <span className="type-caption text-white/28">SANTRA AI · B2B GTM Agent</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="type-caption text-white/28 stat-counter">{liveTime} UTC+5:30</span>
              <span className="h-3 w-px bg-white/10" />
              <span className="flex items-center gap-1.5">
                <Activity className="h-2.5 w-2.5 text-sentra-cyan" />
                <span className="type-caption text-sentra-cyan/70">API ONLINE</span>
              </span>
            </div>
          </div>
        </div>

        {/* Main nav */}
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="group flex items-center" aria-label="Santra home">
            <BrandLogo className="h-[52px] w-[78px]" />
          </Link>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
            {links.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className={cn(
                  "nav-glow-link relative px-4 py-2 text-sm font-medium text-white/55 rounded-full",
                  "hover:text-white hover:bg-white/[0.06] transition-all",
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {/* Live signal badge */}
            <div className="hidden items-center gap-2 rounded-full border border-sentra-cyan/20 bg-sentra-cyan/5 px-3 py-1.5 sm:flex">
              <span className="live-dot" />
              <span className="text-xs font-medium text-sentra-cyan/75">Live</span>
            </div>

            <Button asChild variant="neon" size="sm" className="hidden sm:inline-flex">
              <LandingAuthLink href={SENTRA_HOME}>
                Open GTM Monitors
              </LandingAuthLink>
            </Button>

            {/* Mobile menu toggle */}
            <button
              className="grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-white/[0.05] text-white/70 md:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile drawer */}
      <motion.div
        className="fixed inset-x-0 top-[calc(4rem+1.75rem)] z-30 md:hidden"
        initial={false}
        animate={mobileOpen ? { opacity: 1, y: 0, pointerEvents: "auto" } : { opacity: 0, y: -12, pointerEvents: "none" }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="mx-3 overflow-hidden rounded-3xl border border-white/10 bg-sentra-ink/96 p-4 shadow-2xl shadow-black/50 backdrop-blur-2xl">
          <nav className="grid gap-1">
            {links.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-white/60 transition hover:bg-white/[0.06] hover:text-white"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-sentra-cyan/60" />
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="mt-4 border-t border-white/10 pt-4">
            <Button asChild variant="neon" size="lg" className="w-full">
              <LandingAuthLink href={SENTRA_HOME}>
                Open GTM Monitors
              </LandingAuthLink>
            </Button>
          </div>
        </div>
      </motion.div>
    </>
  );
}
