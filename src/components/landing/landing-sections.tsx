"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  Brain,
  CheckCircle2,
  Lightbulb,
  Shield,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";
import { LandingAuthLink } from "@/components/landing/landing-auth-link";
import { MotionSection } from "@/components/shared/motion-section";
import { Button } from "@/components/ui/button";
import { sentraServices } from "@/data/our-services";
import { SENTRA_HOME } from "@/lib/landing/auth-links";
import { cn } from "@/lib/utils";

function FeatureCard({
  icon: Icon,
  title,
  body,
  accent = "cyan",
}: {
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  title: string;
  body: string;
  accent?: "cyan" | "violet" | "pink";
}) {
  const accentMap = {
    cyan: "text-sentra-cyan",
    violet: "text-sentra-violet",
    pink: "text-pink-300",
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="h-full rounded-2xl border border-white/[0.1] bg-white/[0.03] p-6"
    >
      <span className="mb-4 inline-grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.05]">
        <Icon className={cn("h-4 w-4", accentMap[accent])} />
      </span>
      <h3 className="text-lg font-semibold leading-snug text-white">{title}</h3>
      <p className="mt-2.5 text-sm leading-6 text-white/55">{body}</p>
    </motion.div>
  );
}

function WorkflowStep({ step, index }: { step: string; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.06, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="flex items-baseline gap-4 rounded-2xl border border-white/[0.1] bg-white/[0.03] px-4 py-3.5"
    >
      <span className="w-7 shrink-0 text-xs font-medium tabular-nums text-sentra-cyan/70">
        {String(index + 1).padStart(2, "0")}
      </span>
      <span className="text-sm leading-6 text-white/75">{step}</span>
    </motion.div>
  );
}

const features = [
  {
    icon: Lightbulb,
    title: "GTM Competitive Monitors",
    body: "Describe what to watch in plain language. The agent interprets intent, collects evidence, and queues actions for approval.",
    accent: "cyan" as const,
  },
  {
    icon: Target,
    title: "Competitor Intelligence",
    body: "Battlecards, pricing shifts, hiring signals, and differentiation playbooks for B2B GTM teams.",
    accent: "violet" as const,
  },
  {
    icon: TrendingUp,
    title: "Change Detection",
    body: "Detect material pricing, packaging, and positioning changes before they hit live deals.",
    accent: "cyan" as const,
  },
  {
    icon: Sparkles,
    title: "Human-in-the-Loop",
    body: "Approve or dismiss proposed CRM and automation actions before anything executes downstream.",
    accent: "pink" as const,
  },
];

const workflowSteps = [
  "Describe a B2B competitive signal to monitor",
  "Agent routes tools and collects live web evidence",
  "Executive report with risks, changes, and actions",
  "Human approves proposed automation in the queue",
  "Approved webhook or CRM export fires",
];

const trustItems = [
  { icon: Shield, name: "Secure Authentication", detail: "Supabase auth with protected API routes and session checks." },
  { icon: Zap, name: "Rate-Limited APIs", detail: "Request throttling and server-side validation for safer production traffic." },
  { icon: Brain, name: "Workspace Persistence", detail: "Saved reports, watchlists, and history with cloud-ready storage." },
  { icon: CheckCircle2, name: "Audit-Friendly Flows", detail: "Structured reports, monitor timelines, and consistent action tracking." },
];

export function LandingSections() {
  return (
    <>
      <MotionSection id="platform" className="container py-24">
        <div className="mb-14">
          <h2 className="type-heading-lg text-white md:whitespace-nowrap">
            Built for B2B competitive intelligence.
          </h2>
          <p className="mt-4 text-base leading-7 text-white/50 md:whitespace-nowrap">
            SANTRA AI runs autonomous GTM monitors, collects live evidence, and queues automation for human approval.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {features.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </MotionSection>

      <MotionSection id="intelligence" className="container py-24">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <h2 className="type-heading-lg text-white md:whitespace-nowrap">From monitor goal to approved action.</h2>
            <p className="mt-4 text-base leading-7 text-white/50">
              Describe a competitive signal, let the agent collect evidence and draft a brief, then approve before CRM or webhook automation runs.
            </p>
            <Button asChild variant="neon" size="lg" className="mt-8 group">
              <LandingAuthLink href={SENTRA_HOME}>
                Open GTM Monitors
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </LandingAuthLink>
            </Button>
          </div>
          <div className="grid gap-3">
            {workflowSteps.map((step, index) => (
              <WorkflowStep key={step} step={step} index={index} />
            ))}
          </div>
        </div>
      </MotionSection>

      <MotionSection id="services-preview" className="container py-24">
        <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <h2 className="type-heading-lg text-white md:whitespace-nowrap">
              B2B GTM intelligence services in one workspace.
            </h2>
          </div>
          <Button asChild variant="ghost" className="shrink-0">
            <a href="/services">
              View all services
              <ArrowRight className="h-4 w-4" />
            </a>
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {sentraServices.slice(0, 4).map((service, i) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 0.5 }}
              className="rounded-2xl border border-white/[0.1] bg-white/[0.03] p-6"
            >
              <span className="mb-4 inline-grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.05]">
                <service.icon className="h-4 w-4 text-sentra-cyan" />
              </span>
              <p className="mb-1 text-[10px] uppercase tracking-[0.22em] text-white/35">{service.tagline}</p>
              <h3 className="text-lg font-semibold leading-snug text-white">{service.title}</h3>
              <p className="mt-2.5 text-sm leading-6 text-white/55">{service.summary}</p>
            </motion.div>
          ))}
        </div>
      </MotionSection>

      <MotionSection id="integrations" className="container py-24">
        <div className="mb-10">
          <h2 className="type-heading-lg text-white md:whitespace-nowrap">Trust &amp; security.</h2>
          <p className="mt-3 text-base leading-7 text-white/50 md:whitespace-nowrap">
            Built for teams that need durable auth, audit trails, and controlled automation.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {trustItems.map((item, i) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 0.45 }}
              className="rounded-2xl border border-white/[0.1] bg-white/[0.03] p-6"
            >
              <span className="mb-4 inline-grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.05]">
                <item.icon className="h-4 w-4 text-sentra-cyan" />
              </span>
              <p className="text-sm font-medium text-white">{item.name}</p>
              <p className="mt-1.5 text-xs leading-5 text-white/40">{item.detail}</p>
            </motion.div>
          ))}
        </div>
      </MotionSection>

      <MotionSection className="container pb-24 pt-8">
        <div className="relative overflow-hidden border-y border-white/[0.08] py-16 text-center md:py-20">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(83,244,255,0.06),transparent_55%)]" />
          <div className="relative">
            <h2 className="type-heading-lg mx-auto text-white md:whitespace-nowrap">
              Deploy GTM intelligence with human control.
            </h2>
            <p className="mx-auto mt-5 text-lg leading-8 text-white/48 md:whitespace-nowrap">
              Monitor competitors, detect material changes, and approve CRM actions — without another passive chatbot.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Button asChild size="lg" variant="neon" className="group">
                <LandingAuthLink href={SENTRA_HOME}>
                  Open GTM Monitors
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </LandingAuthLink>
              </Button>
              <Button asChild size="lg" variant="ghost">
                <a href="/services">View All Services</a>
              </Button>
            </div>
          </div>
        </div>
      </MotionSection>
    </>
  );
}
