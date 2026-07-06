"use client";

import { motion, useInView } from "framer-motion";
import {
  ArrowRight,
  Bot,
  Brain,
  CheckCircle2,
  Globe,
  Lightbulb,
  MapPin,
  Rocket,
  Shield,
  Sparkles,
  Target,
  TrendingUp,
  Workflow,
  Zap,
} from "lucide-react";
import { useRef } from "react";
import { LandingAuthLink } from "@/components/landing/landing-auth-link";
import { MotionSection } from "@/components/shared/motion-section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { sentraServices } from "@/data/our-services";
import { SENTRA_HOME } from "@/lib/landing/auth-links";
import { cn } from "@/lib/utils";

// Animated score bar
function ScoreBar({ value, color = "cyan", delay = 0 }: { value: number; color?: "cyan" | "violet" | "pink"; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const colorMap = {
    cyan: "from-sentra-cyan to-sentra-violet",
    violet: "from-sentra-violet to-sentra-pink",
    pink: "from-sentra-pink to-sentra-violet",
  };
  return (
    <div ref={ref} className="h-1.5 overflow-hidden rounded-full bg-white/10">
      <motion.div
        className={cn("h-full rounded-full bg-gradient-to-r", colorMap[color])}
        initial={{ width: 0 }}
        animate={inView ? { width: `${value}%` } : { width: 0 }}
        transition={{ delay, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  );
}

// Stagger list item
function StaggerItem({ children, index }: { children: React.ReactNode; index: number }) {
  return (
    <motion.li
      initial={{ opacity: 0, x: -12 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.07, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="flex items-start gap-3 text-sm leading-6 text-white/62"
    >
      <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-sentra-cyan" />
      {children}
    </motion.li>
  );
}

// Feature bento card
function BentoCard({
  icon: Icon, title, body, badge, className, glow = false, accent = "cyan",
}: {
  icon: React.FC<React.SVGProps<SVGSVGElement>>; title: string; body: string; badge?: string; className?: string; glow?: boolean; accent?: "cyan" | "violet" | "pink";
}) {
  const accentMap = { cyan: "text-sentra-cyan", violet: "text-sentra-violet", pink: "text-pink-300" };
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
    >
      <Card className={cn("cyber-card group h-full p-6 transition", className)} glow={glow}>
        <div className="mb-4 inline-grid h-11 w-11 place-items-center rounded-2xl bg-white/[0.07] border border-white/10">
          <Icon className={cn("h-5 w-5 transition-transform group-hover:scale-110", accentMap[accent])} />
        </div>
        {badge && (
          <span className="mb-3 inline-block rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-0.5 text-[10px] uppercase tracking-[0.18em] text-white/40">
            {badge}
          </span>
        )}
        <h3 className="text-lg font-semibold text-white leading-snug">{title}</h3>
        <p className="mt-2.5 text-sm leading-6 text-white/52">{body}</p>
      </Card>
    </motion.div>
  );
}

// Section divider with label
function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-4 py-2">
      <div className="h-px flex-1 bg-white/[0.07]" />
      <span className="type-caption text-white/25">{label}</span>
      <div className="h-px flex-1 bg-white/[0.07]" />
    </div>
  );
}

// Workflow step card
function WorkflowStep({ step, index }: { step: string; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="group flex items-center gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.035] px-4 py-3.5 transition hover:border-sentra-cyan/25 hover:bg-white/[0.06]"
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sentra-cyan/10 border border-sentra-cyan/20">
        <Workflow className="h-4 w-4 text-sentra-cyan" />
      </span>
      <span className="min-w-0 flex-1 text-sm font-medium text-white">{step}</span>
      <span className="shrink-0 text-xs font-bold text-white/20">0{index + 1}</span>
    </motion.div>
  );
}

const features = [
  {
    icon: Lightbulb, title: "GTM Competitive Monitors",
    body: "Describe what to watch in plain language. The agent interprets intent, collects evidence, and queues actions for approval.",
    badge: "Agent Core", accent: "cyan" as const,
  },
  {
    icon: Target, title: "Competitor Intelligence",
    body: "Battlecards, pricing shifts, hiring signals, and differentiation playbooks for B2B GTM teams.",
    badge: "Analyst", accent: "violet" as const,
  },
  {
    icon: TrendingUp, title: "Change Detection",
    body: "Detect material pricing, packaging, and positioning changes before they hit live deals.",
    badge: "Signals", accent: "cyan" as const,
  },
  {
    icon: Sparkles, title: "Human-in-the-Loop",
    body: "Approve or dismiss proposed CRM and automation actions before anything executes downstream.",
    badge: "HITL", accent: "pink" as const,
  },
];

const workflowSteps = [
  "Describe a B2B competitive signal to monitor",
  "Agent routes tools and collects live web evidence",
  "Executive report with risks, changes, and actions",
  "Human approves proposed automation in the queue",
  "Approved webhook or CRM export fires",
];

const scoreMetrics = [
  { label: "Competitor Risk", value: 74, color: "cyan" as const },
  { label: "Evidence Confidence", value: 88, color: "cyan" as const },
  { label: "Pricing Exposure", value: 65, color: "violet" as const },
  { label: "Renewal Pressure", value: 55, color: "violet" as const },
];

const agentCapabilities = [
  "Dynamic tool routing (Exa, Bright Data, MCP)",
  "Monitor intent parsing and severity thresholds",
  "Executive briefs with verified claims",
  "Approval queue before webhooks",
  "Scheduled autonomous monitor checks",
  "Band.io agent mesh notifications",
  "Supabase persistence and audit trail",
];

const stackItems = [
  { icon: Shield, name: "Secure Authentication", detail: "Supabase auth with protected API routes and session checks." },
  { icon: Zap, name: "Rate-Limited APIs", detail: "Request throttling and server-side validation for safer production traffic." },
  { icon: Brain, name: "Workspace Persistence", detail: "Saved reports, watchlists, and history with cloud-ready storage patterns." },
  { icon: CheckCircle2, name: "Audit-Friendly Flows", detail: "Structured reports, monitor timelines, and consistent action tracking." },
];

const technologyStack = [
  { name: "Exa", color: "text-sentra-cyan", detail: "Live web search and URL evidence when competitive signals change." },
  { name: "Supabase", color: "text-violet-300", detail: "Auth, monitor persistence, approval queue, and report storage." },
  { name: "LLM Gateway", color: "text-white", detail: "Executive analysis, intent parsing, and structured GTM briefs." },
  { name: "Band.io", color: "text-sentra-cyan", detail: "Agent mesh notifications for human-in-the-loop workflows." },
];

const actionPlan = {
  next7: ["Configure competitor monitors", "Approve first automation action", "Connect CRM webhook"],
  next30: ["Expand monitor coverage", "Tune severity thresholds", "Train revops on approval queue"],
  next90: ["Scale across product lines", "Add Slack approval cards", "Integrate renewal playbooks"],
};

export function LandingSections() {
  return (
    <>
      {/* PLATFORM SECTION */}
      <MotionSection id="platform" className="container py-24">
        <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <Badge variant="violet">GTM Agent</Badge>
            <h2 className="type-display-lg mt-4 max-w-3xl heading-gradient-sweep">
              A command center for B2B competitive intelligence.
            </h2>
          </div>
          <p className="max-w-sm text-base leading-7 text-white/48">
            SANTRA AI runs autonomous GTM monitors, collects live evidence, and queues automation for human approval.
          </p>
        </div>

        {/* Bento grid layout */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {features.map((feature) => (
            <BentoCard key={feature.title} {...feature} glow />
          ))}
        </div>

        {/* Stats bento row */}
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <Card className="cyber-card p-6 md:col-span-2" glow>
            <div className="flex items-center gap-3 mb-4">
              <Globe className="h-5 w-5 text-sentra-cyan" />
              <p className="text-sm font-semibold text-white">Global Intelligence Coverage</p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Markets Analyzed", value: "48+" },
                { label: "Industries Covered", value: "12+" },
                { label: "Ideas Processed", value: "500+" },
              ].map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4 text-center">
                  <p className="text-2xl font-bold text-white heading-gradient-sweep">{stat.value}</p>
                  <p className="mt-1 text-xs text-white/40">{stat.label}</p>
                </div>
              ))}
            </div>
          </Card>
          <Card className="cyber-card p-6" glow>
            <div className="flex items-center gap-3 mb-4">
              <Zap className="h-5 w-5 text-sentra-cyan" />
              <p className="text-sm font-semibold text-white">Performance</p>
            </div>
            <div className="space-y-4">
              {[
                { label: "Analysis Speed", value: 92 },
                { label: "Accuracy Rate", value: 94 },
                { label: "User Satisfaction", value: 88 },
              ].map((item, i) => (
                <div key={item.label}>
                  <div className="mb-1.5 flex justify-between text-xs">
                    <span className="text-white/50">{item.label}</span>
                    <span className="font-semibold text-white">{item.value}%</span>
                  </div>
                  <ScoreBar value={item.value} delay={i * 0.15} />
                </div>
              ))}
            </div>
          </Card>
        </div>
      </MotionSection>

      <SectionDivider label="WORKFLOW" />

      {/* INTELLIGENCE WORKFLOW */}
      <MotionSection id="intelligence" className="container py-24">
        <Card className="overflow-hidden p-8 md:p-10" glow>
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <Badge variant="cyan">Autonomous Workflow</Badge>
              <h2 className="type-heading-lg mt-4 text-white">From monitor goal to approved action.</h2>
              <p className="mt-4 text-base leading-7 text-white/50">
                Describe a competitive signal, let the agent collect evidence and draft a brief, then approve before CRM or webhook automation runs.
              </p>
              <Button asChild variant="neon" size="lg" className="mt-7 group">
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
        </Card>
      </MotionSection>

      <SectionDivider label="RISK SIGNALS" />

      {/* Risk signals + rollout plan */}
      <MotionSection id="opportunity" className="container py-24">
        <div className="grid gap-5 xl:grid-cols-2">
          <div>
            <div className="mb-8">
              <Badge variant="cyan">Executive Risk Index</Badge>
              <h2 className="type-heading-lg mt-4 text-white">Quantify competitive exposure.</h2>
              <p className="mt-3 text-white/50">Risk scores combine live evidence, detected changes, and matched signals for GTM and revops teams.</p>
            </div>
            <Card className="cyber-card p-6" glow>
              <div className="grid gap-4 sm:grid-cols-2 mb-5">
                {scoreMetrics.map((metric, i) => (
                  <div key={metric.label} className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-sm text-white/60">{metric.label}</span>
                      <span className="text-base font-bold text-white">{metric.value}</span>
                    </div>
                    <ScoreBar value={metric.value} color={metric.color} delay={i * 0.15} />
                  </div>
                ))}
              </div>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="rounded-2xl border border-sentra-cyan/25 bg-gradient-to-br from-sentra-cyan/10 to-sentra-violet/10 px-5 py-5 text-center"
              >
                <p className="type-caption text-sentra-cyan/60">RISK INDEX</p>
                <p className="mt-2 text-5xl font-black text-white heading-gradient-sweep">74<span className="text-xl text-white/30">%</span></p>
                <p className="mt-2 text-sm text-white/45">Competitor pricing change — review recommended</p>
              </motion.div>
            </Card>
          </div>

          {/* Action plan */}
          <div>
            <div className="mb-8">
              <Badge variant="violet">GTM Rollout Plan</Badge>
              <h2 className="type-heading-lg mt-4 text-white">From pilot to production.</h2>
              <p className="mt-3 text-white/50">Recommended rollout for deploying the agent across your competitive intelligence workflow.</p>
            </div>
            <div className="grid gap-4">
              {[
                { period: "Next 7 Days", items: actionPlan.next7, color: "border-sentra-cyan/20 bg-sentra-cyan/5" },
                { period: "Next 30 Days", items: actionPlan.next30, color: "border-violet-300/20 bg-violet-300/5" },
                { period: "Next 90 Days", items: actionPlan.next90, color: "border-pink-300/20 bg-pink-300/5" },
              ].map(({ period, items, color }, pIdx) => (
                <motion.div
                  key={period}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: pIdx * 0.1, duration: 0.55 }}
                  className={cn("rounded-2xl border p-4", color)}
                >
                  <p className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-white/40">{period}</p>
                  <ul className="grid gap-1.5">
                    {items.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm text-white/65">
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-sentra-cyan/60" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </MotionSection>

      <SectionDivider label="MONITORS + ANALYST" />

      <MotionSection id="scanner" className="container py-24">
        <div className="grid gap-5 xl:grid-cols-2">
          <div>
            <Badge variant="cyan">GTM Competitive Monitors</Badge>
            <h2 className="type-heading-lg mt-4 max-w-2xl text-white">Watch competitors in plain language.</h2>
            <p className="mt-3 mb-6 text-white/50">Describe pricing, hiring, or launch signals. The agent configures intent, collects evidence, and queues actions.</p>
            <Card className="cyber-card p-6" glow>
              <p className="type-caption text-white/35 mb-3">Example monitors</p>
              <div className="grid gap-2 mb-4">
                {["Watch Acme Corp pricing page for tier changes", "Track rival hiring in enterprise sales", "Monitor competitor product launch announcements"].map((input) => (
                  <div key={input} className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-white/65">
                    <span className="h-1.5 w-1.5 rounded-full bg-sentra-cyan/50 shrink-0" />
                    {input}
                  </div>
                ))}
              </div>
              <div className="mb-4 rounded-xl border border-sentra-cyan/20 bg-[rgba(83,244,255,0.07)] px-4 py-2.5 text-sm text-sentra-cyan/80 flex items-center gap-2">
                <span className="live-dot" />
                Human approval required before automation
              </div>
              <p className="type-caption text-white/30 mb-3">Agent outputs</p>
              <ul className="grid gap-1.5">
                {["Executive brief with verified claims", "Detected pricing and field changes", "Risk and opportunity signals", "Approval queue item", "CRM / webhook payload"].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-white/60">
                    <Sparkles className="h-3 w-3 text-sentra-cyan/60 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          {/* GTM */}
          <div>
            <Badge variant="violet">Competitor Intelligence</Badge>
            <h2 className="type-heading-lg mt-4 max-w-2xl text-white">Battlecards and positioning intel.</h2>
            <p className="mt-3 mb-6 text-white/50">Deep-dive competitor analysis with strengths, weaknesses, pricing, and how-to-win guidance for B2B teams.</p>
            <Card className="cyber-card p-6 flex flex-col" glow>
              <p className="type-caption text-white/30 mb-4">GTM Outputs Generated</p>
              <ul className="grid gap-3">
                {[
                  { label: "Customer Persona", detail: "Detailed ICP with demographics and pain points" },
                  { label: "Acquisition Channels", detail: "Ranked channels with estimated CAC and reach" },
                  { label: "Launch Plan", detail: "Phase-by-phase go-to-market execution playbook" },
                  { label: "Pricing Suggestions", detail: "Competitive pricing strategy and tier structure" },
                  { label: "Positioning Statement", detail: "Unique value proposition and differentiation" },
                ].map((item, i) => (
                  <motion.li
                    key={item.label}
                    initial={{ opacity: 0, x: 12 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08 }}
                    className="flex gap-3 rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-3"
                  >
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400/60" />
                    <div>
                      <p className="text-sm font-medium text-white">{item.label}</p>
                      <p className="text-xs text-white/40 mt-0.5">{item.detail}</p>
                    </div>
                  </motion.li>
                ))}
              </ul>
            </Card>
          </div>
        </div>
      </MotionSection>

      <SectionDivider label="AGENT STACK" />

      <MotionSection id="sri-lanka" className="container py-24">
        <Card className="overflow-hidden p-8 md:p-12" glow>
          <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <Badge variant="cyan">Agent Architecture</Badge>
              <h2 className="type-heading-lg mt-4 max-w-2xl text-white">
                Modular, failure-tolerant, tool-routed.
              </h2>
              <p className="mt-4 max-w-xl text-base leading-7 text-white/52">
                SANTRA dynamically selects external tools, recovers from collection failures, and keeps humans in control of high-impact actions.
              </p>
              <ul className="mt-7 grid gap-2 sm:grid-cols-2">
                {agentCapabilities.map((item, i) => (
                  <StaggerItem key={item} index={i}>{item}</StaggerItem>
                ))}
              </ul>
            </div>
            <div className="flex flex-col items-center justify-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="relative"
              >
                <div className="absolute inset-0 rounded-full bg-sentra-cyan/15 blur-3xl" />
                <MapPin className="relative h-24 w-24 text-sentra-cyan" />
              </motion.div>
              <p className="mt-6 text-center text-sm text-white/40">
                SANTRA AI is built for the global stage,<br />with deep local intelligence for Sri Lanka.
              </p>
            </div>
          </div>
        </Card>
      </MotionSection>

      <SectionDivider label="OUR SERVICES" />

      {/* SERVICES PREVIEW */}
      <MotionSection id="services-preview" className="container py-24">
        <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <Badge variant="cyan">Our Services</Badge>
            <h2 className="type-heading-lg mt-4 max-w-3xl text-white">
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
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.6 }}
            >
              <Card className="cyber-card h-full p-6" glow>
                <span className="mb-5 inline-grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-sentra-cyan/15 to-sentra-violet/10 border border-sentra-cyan/20">
                  <service.icon className="h-5 w-5 text-sentra-cyan" />
                </span>
                <p className="mb-1 text-[10px] uppercase tracking-[0.22em] text-white/30">{service.tagline}</p>
                <h3 className="text-lg font-semibold leading-snug text-white">{service.title}</h3>
                <p className="mt-2.5 text-sm leading-6 text-white/50">{service.summary}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </MotionSection>

      <SectionDivider label="TECHNOLOGY" />

      {/* TECH STACK */}
      <MotionSection className="container py-24">
        <div className="mb-10 text-center">
          <Badge variant="default">Technology Stack</Badge>
          <h2 className="type-heading-lg mt-4 text-white">Built with world-class technology.</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {technologyStack.map((item, i) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.55 }}
            >
              <Card className="cyber-card p-6 text-center" glow>
                <p className={cn("text-2xl font-black", item.color)}>{item.name}</p>
                <p className="mt-3 text-sm leading-6 text-white/45">{item.detail}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </MotionSection>

      <SectionDivider label="TRUST & SECURITY" />

      {/* INTEGRATIONS / TRUST */}
      <MotionSection id="integrations" className="container py-24">
        <div className="grid gap-5 lg:grid-cols-[1.4fr_0.6fr]">
          <Card className="p-8 md:p-10" glow>
            <Bot className="h-10 w-10 text-sentra-cyan mb-6" />
            <Badge variant="cyan" className="mb-5">Built for B2B GTM Teams</Badge>
            <h2 className="type-heading-lg text-white">Competitive intelligence with agentic automation.</h2>
            <p className="mt-5 text-lg leading-8 text-white/52">
              SANTRA AI helps revenue and strategy teams monitor competitors, collect live evidence,
              draft executive briefs, and approve automation before it reaches your CRM stack.
            </p>
            <p className="mt-5 text-sm text-white/38">
              Sign in, open GTM Monitors, and run your first agent check in minutes.
            </p>
            <div className="mt-7 flex gap-3">
              <Button asChild variant="neon" size="lg" className="group">
                <LandingAuthLink href={SENTRA_HOME}>
                  Start Free
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </LandingAuthLink>
              </Button>
              <Button asChild variant="ghost" size="lg">
                <a href="/services">Explore Services</a>
              </Button>
            </div>
          </Card>
          <Card className="p-6" glow>
            <p className="type-caption text-white/35 mb-6">Trust &amp; Security</p>
            <div className="grid gap-3">
              {stackItems.map((item, i) => (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, x: 12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.09 }}
                  className="flex gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3"
                >
                  <item.icon className="mt-0.5 h-4 w-4 shrink-0 text-sentra-cyan/70" />
                  <div>
                    <p className="text-sm font-medium text-white">{item.name}</p>
                    <p className="mt-0.5 text-xs leading-5 text-white/38">{item.detail}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        </div>
      </MotionSection>

      {/* FINAL CTA */}
      <MotionSection className="container pb-24 pt-10">
        <Card className="relative overflow-hidden p-10 text-center md:p-20" glow>
          {/* Animated background gradient */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(83,244,255,0.07),transparent_50%),radial-gradient(ellipse_at_bottom,rgba(168,85,247,0.07),transparent_50%)] animate-border-flow" />
          <div className="intelligence-grid absolute inset-0 opacity-20" />
          <div className="relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-sentra-cyan/25 bg-sentra-cyan/10"
            >
              <Rocket className="h-7 w-7 text-sentra-cyan" />
            </motion.div>
            <Badge variant="cyan">NeuroX 2026 · B2B Agent</Badge>
            <h2 className="type-display-lg mx-auto mt-5 max-w-3xl heading-gradient-sweep">
              Deploy autonomous GTM intelligence with human control.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-white/48">
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
            <div className="mt-10 flex flex-wrap justify-center gap-6 text-xs text-white/28">
              {["Free to start", "Human-in-the-loop", "Exa live evidence", "B2B competitive intel"].map((item) => (
                <span key={item} className="flex items-center gap-1.5">
                  <span className="h-1 w-1 rounded-full bg-sentra-cyan/50" />
                  {item}
                </span>
              ))}
            </div>
          </div>
        </Card>
      </MotionSection>
    </>
  );
}
