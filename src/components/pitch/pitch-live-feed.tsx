"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

const display = "font-[family-name:var(--font-pitch-display)]";
const mono = "font-[family-name:var(--font-pitch-mono)]";

type PitchReview = {
  id: string;
  name: string;
  rating: number;
  comment: string;
  favorite?: string;
  createdAt: string;
};

type PitchStart = {
  id: string;
  name: string;
  role: string;
  startedAt: string;
};

type LivePayload = {
  starts: PitchStart[];
  reviews: PitchReview[];
  startCount: number;
  reviewCount: number;
};

type Bubble = {
  key: string;
  kind: "review" | "start";
  name: string;
  text: string;
  rating?: number;
  slot: number;
};

/** Edge-only slots — keep the centered Thank you / QR clear */
const SLOTS = [
  "left-[1%] top-[10%] max-w-[260px]",
  "right-[1%] top-[12%] max-w-[270px]",
  "left-[1%] bottom-[14%] max-w-[250px]",
  "right-[1%] bottom-[12%] max-w-[260px]",
  "left-[1%] top-[40%] max-w-[250px]",
  "right-[1%] top-[44%] max-w-[260px]",
] as const;

const HOLD_MS = 5500;

/** Small pop-ups that appear then fade as new feedback arrives */
export function PitchReviewBubbles({ className }: { className?: string }) {
  const [active, setActive] = useState<Bubble[]>([]);
  const seenReviews = useRef(new Set<string>());
  const seenStarts = useRef(new Set<string>());
  const queue = useRef<Bubble[]>([]);
  const slot = useRef(0);
  const showing = useRef(false);

  useEffect(() => {
    let cancelled = false;
    let dismissTimer: number | undefined;
    let primed = false;

    function nextSlot() {
      const i = slot.current % SLOTS.length;
      slot.current += 1;
      return i;
    }

    function showNext() {
      if (cancelled || showing.current) return;
      const item = queue.current.shift();
      if (!item) return;
      showing.current = true;
      setActive((prev) => [...prev.slice(-2), item]);

      dismissTimer = window.setTimeout(() => {
        if (cancelled) return;
        setActive((prev) => prev.filter((b) => b.key !== item.key));
        showing.current = false;
        showNext();
      }, HOLD_MS);
    }

    function enqueue(bubble: Bubble) {
      queue.current.push(bubble);
      showNext();
    }

    async function load() {
      try {
        const response = await fetch("/api/pitch/live", { cache: "no-store" });
        const json = (await response.json()) as LivePayload & { error?: string };
        if (!response.ok || cancelled) return;

        const reviews = json.reviews ?? [];
        const starts = json.starts ?? [];

        // First poll: mark existing as seen so only *new* events pop.
        if (!primed) {
          for (const row of reviews) seenReviews.current.add(row.id);
          for (const row of starts) seenStarts.current.add(row.id);
          primed = true;
          const newest = reviews[0];
          if (newest) {
            enqueue({
              key: `r-${newest.id}-prime`,
              kind: "review",
              name: newest.name,
              text: newest.comment,
              rating: newest.rating,
              slot: nextSlot(),
            });
          }
          return;
        }

        for (const row of [...reviews].reverse()) {
          if (seenReviews.current.has(row.id)) continue;
          seenReviews.current.add(row.id);
          enqueue({
            key: `r-${row.id}`,
            kind: "review",
            name: row.name,
            text: row.comment,
            rating: row.rating,
            slot: nextSlot(),
          });
        }

        for (const row of [...starts].reverse()) {
          if (seenStarts.current.has(row.id)) continue;
          seenStarts.current.add(row.id);
          enqueue({
            key: `s-${row.id}`,
            kind: "start",
            name: row.name,
            text: "just started SANTRA",
            slot: nextSlot(),
          });
        }
      } catch {
        // keep quiet on the pitch slide
      }
    }

    void load();
    const poll = window.setInterval(() => void load(), 2500);

    return () => {
      cancelled = true;
      window.clearInterval(poll);
      if (dismissTimer) window.clearTimeout(dismissTimer);
    };
  }, []);

  return (
    <div
      className={cn("pointer-events-none absolute inset-0 z-[5] overflow-hidden", className)}
      aria-live="polite"
    >
      <AnimatePresence>
        {active.map((bubble) => (
          <motion.div
            key={bubble.key}
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className={cn("absolute", SLOTS[bubble.slot % SLOTS.length])}
          >
            <div className="rounded-sm border border-white/10 bg-black/50 px-3.5 py-2.5 shadow-[0_8px_28px_rgba(0,0,0,0.4)] backdrop-blur-md sm:px-4 sm:py-3">
              {bubble.kind === "review" ? (
                <>
                  <p
                    className={cn(
                      display,
                      "text-sm font-medium leading-snug text-white/92 sm:text-base",
                    )}
                  >
                    “{bubble.text}”
                  </p>
                  <p
                    className={cn(
                      mono,
                      "mt-2 text-[0.6rem] uppercase tracking-[0.18em] text-cyan-200/90",
                    )}
                  >
                    — {bubble.name}
                    {bubble.rating ? ` · ${"★".repeat(bubble.rating)}` : ""}
                  </p>
                </>
              ) : (
                <p className="text-sm text-white/80">
                  <span className="font-medium text-cyan-200">{bubble.name}</span>{" "}
                  <span className="text-white/70">{bubble.text}</span>
                </p>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
