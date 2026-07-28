import type { LucideIcon } from "lucide-react";
import {
  BellRing,
  Bot,
  Radar,
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
    title: "Monitors",
    tagline: "Watch important changes",
    summary:
      "Tell SANTRA what to watch. It checks for competitor, pricing, hiring, or launch changes.",
    description:
      "Create a monitor in plain language, run a check, and review the result before taking action.",
    href: "/alerts",
    icon: BellRing,
    highlights: ["Plain language setup", "Change detection", "Reports", "Approval queue"],
    steps: [
      "Open GTM Monitors from the sidebar.",
      "Describe what to watch (pricing, hiring, launches).",
      "Tap Check now and review the agent activity log.",
      "Approve actions before CRM or webhook delivery.",
    ],
  },
  {
    id: "advisor",
    title: "Strategy Desk",
    tagline: "Ask · Market",
    summary:
      "Ask competitor questions or validate B2B market opportunities.",
    description:
      "One workspace for chat and live call, plus market validation for ICP and opportunity scoring.",
    href: "/chat",
    icon: Bot,
    highlights: ["Ask", "Market", "Research agent", "Voice"],
    steps: [
      "Open Strategy from the sidebar.",
      "Use Ask for chat or Market for ICP validation.",
      "Attach a document in Ask if you want SANTRA to read it.",
      "Turn on Research agent when you need live web collection.",
    ],
  },
  {
    id: "gtm",
    title: "Dashboard",
    tagline: "Quick overview",
    summary:
      "See the latest signals and understand what needs attention.",
    description:
      "Use the dashboard as the simple home screen for monitors, signals, and recent activity.",
    href: "/dashboard",
    icon: Radar,
    highlights: ["Signals", "Risks", "Shortcuts", "Status"],
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
