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
    id: "advisor",
    title: "GTM Advisor",
    tagline: "Ask + Deep brief",
    summary:
      "Ask SANTRA about competitor moves and GTM risk, or open Deep brief for visual competitor intelligence and battlecards.",
    description:
      "One hub for conversational GTM advice (chat, live call) and structured Competitor IQ briefs with maps, signals, and narrated strategy.",
    href: "/chat",
    icon: Bot,
    highlights: ["Ask mode chat", "Deep brief visuals", "Live call", "Executive summaries"],
    steps: [
      "Open GTM Advisor from the sidebar.",
      "Use Ask for fast competitor and pricing questions.",
      "Switch to Deep brief for maps, signals, and battlecard-style analysis.",
      "Continue in Ask when you want follow-up recommendations.",
    ],
  },
  {
    id: "competitor-intelligence",
    title: "Competitor Intelligence",
    tagline: "Deep brief mode",
    summary:
      "Break down competitor strengths, weaknesses, pricing, positioning, market gaps, and attack strategies.",
    description:
      "Run practical competitor analysis with battle cards, differentiation opportunities, and a clear how-to-win playbook inside GTM Advisor.",
    href: "/chat?mode=brief",
    icon: Swords,
    highlights: ["Strengths vs weaknesses", "Pricing model", "Battle card", "How to beat this competitor"],
    steps: [
      "Open GTM Advisor and switch to Deep brief.",
      "Enter your competitor and market question.",
      "Review strengths, weaknesses, and positioning outputs.",
      "Use Continue in Ask to turn findings into GTM moves.",
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
];

export function getServiceById(id: string) {
  return sentraServices.find((service) => service.id === id);
}
