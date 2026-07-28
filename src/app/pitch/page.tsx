import type { Metadata } from "next";
import { IBM_Plex_Sans, JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import { PitchDeck } from "@/components/pitch/pitch-deck";

const pitchDisplay = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-pitch-display",
  display: "swap",
});

const pitchBody = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-pitch-body",
  display: "swap",
});

const pitchMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-pitch-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SANTRA AI · Pitch Deck | Prompt Pirates",
  description:
    "Professional NeuroX pitch presentation for SANTRA AI — autonomous B2B GTM intelligence with human-in-the-loop approval.",
};

export default function PitchPage() {
  return (
    <div
      className={`${pitchDisplay.variable} ${pitchBody.variable} ${pitchMono.variable} min-h-[100dvh] font-[family-name:var(--font-pitch-body)] antialiased`}
    >
      <PitchDeck />
    </div>
  );
}
