import type { LucideIcon } from "lucide-react";
import {
  BellRing,
  Bot,
  Radar,
  Swords,
} from "lucide-react";

export type SentraService = {
  id: string;
  title: string;
  tagline: string;
  summary: string;
  description: string;
  href: string;
  icon: LucideIcon;
  highlights: string[];
  steps: string[];
};

export const sentraServices: SentraService[] = [
  {
    id: "monitors",
    title: "GTM Competitive Monitors",
    tagline: "Autonomous agent loop",
    summary:
      "Describe competitive signals in plain language. The agent collects evidence, detects changes, and queues actions for approval.",
    description:
      "Run the full B2B agent workflow: intent parsing, Exa/Bright Data collection, executive reports, and human-in-the-loop automation.",
    href: "/alerts",
    icon: BellRing,
    highlights: ["Agent activity log", "Approval queue", "Change detection", "Webhook gate"],
    steps: [
      "Open GTM Monitors from the sidebar.",
      "Describe what to watch (pricing, hiring, launches).",
      "Tap Check now and review the agent activity log.",
      "Approve actions before CRM or webhook delivery.",
    ],
  },
  {
    id: "competitor-intelligence",
    title: "Competitor Intelligence",
    tagline: "Analyze and differentiate",
    summary:
      "Break down competitor strengths, weaknesses, pricing, positioning, market gaps, and attack strategies.",
    description:
      "Run practical competitor analysis with battle cards, differentiation opportunities, and a clear how-to-win playbook.",
    href: "/analyst",
    icon: Swords,
    highlights: ["Strengths vs weaknesses", "Pricing model", "Battle card", "How to beat this competitor"],
    steps: [
      "Open Competitor IQ from the sidebar.",
      "Enter your competitor and market question.",
      "Review strengths, weaknesses, and positioning outputs.",
      "Use the recommended attack strategy to guide GTM moves.",
    ],
  },
  {
    id: "gtm",
    title: "GTM Command Center",
    tagline: "Revenue strategy",
    summary:
      "Generate ICP, personas, channels, launch plans, pricing strategy, and growth loops for B2B teams.",
    description:
      "Turn competitive intelligence into concrete go-to-market strategy designed for revenue and strategy teams.",
    href: "/dashboard",
    icon: Radar,
    highlights: ["ICP", "Acquisition channels", "Pricing", "Growth loops"],
    steps: [
      "Review latest monitor reports and signals.",
      "Open the GTM Command Center section.",
      "Review persona, ICP, channels, and launch plan.",
      "Apply 7/30/90-day rollout actions.",
    ],
  },
  {
    id: "advisor",
    title: "GTM Advisor",
    tagline: "Ask strategic questions",
    summary:
      "Ask SANTRA about competitor moves, pricing risk, market signals, and recommended GTM responses.",
    description:
      "Interactive advisor for B2B GTM decisions with concise, evidence-backed intelligence for revops and strategy teams.",
    href: "/chat",
    icon: Bot,
    highlights: ["Competitor briefs", "Pricing risk", "Market signals", "Executive summaries"],
    steps: [
      "Open GTM Advisor from the sidebar.",
      "Ask one strategic question or paste a competitor URL.",
      "Review the action-oriented response.",
      "Queue key findings into a monitor or approval workflow.",
    ],
  },
];

export function getServiceById(id: string) {
  return sentraServices.find((service) => service.id === id);
}
