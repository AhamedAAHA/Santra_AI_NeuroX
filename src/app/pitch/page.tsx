import type { Metadata } from "next";
import { PitchDeck } from "@/components/pitch/pitch-deck";

export const metadata: Metadata = {
  title: "SANTRA AI · Pitch Deck | Prompt Pirates",
  description:
    "Professional NeuroX pitch presentation for SANTRA AI — autonomous B2B GTM intelligence with human-in-the-loop approval.",
};

export default function PitchPage() {
  return <PitchDeck />;
}
