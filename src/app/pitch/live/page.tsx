"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MessageSquare, Radar, Star, Users } from "lucide-react";
import { BrandLogo } from "@/components/shared/brand-mark";
import { cn } from "@/lib/utils";

type PitchStart = {
  id: string;
  name: string;
  role: string;
  source: string;
  startedAt: string;
};

type PitchReview = {
  id: string;
  name: string;
  role: string;
  rating: number;
  comment: string;
  favorite?: string;
  createdAt: string;
};

type LivePayload = {
  starts: PitchStart[];
  reviews: PitchReview[];
  startCount: number;
  reviewCount: number;
  avgRating: number | null;
  updatedAt?: string;
  error?: string;
};

function formatWhen(iso: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default function PitchLivePage() {
  const [data, setData] = useState<LivePayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch("/api/pitch/live", { cache: "no-store" });
        const json = (await response.json()) as LivePayload;
        if (!response.ok) throw new Error(json.error || "Failed to load");
        if (!cancelled) {
          setData(json);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load");
      }
    }

    void load();
    const id = window.setInterval(() => void load(), 3000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  return (
    <main className="min-h-[100dvh] bg-[#030712] text-white">
      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <BrandLogo className="h-10 w-[60px]" />
            <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Pitch live board</h1>
            <p className="mt-2 text-sm text-white/55">
              Who scanned, started, and reviewed — refreshes every 3s.
            </p>
          </div>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-cyan-300/70">
            {data?.updatedAt ? `Updated ${formatWhen(data.updatedAt)}` : "Connecting…"}
          </p>
        </header>

        {error ? <p className="mt-6 text-sm text-rose-200">{error}</p> : null}

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            { icon: Users, label: "Started", value: data?.startCount ?? "—" },
            { icon: MessageSquare, label: "Reviews", value: data?.reviewCount ?? "—" },
            {
              icon: Star,
              label: "Avg rating",
              value: data?.avgRating != null ? data.avgRating.toFixed(1) : "—",
            },
          ].map((stat) => (
            <div key={stat.label} className="border border-white/10 bg-[#070d1a]/80 p-5">
              <div className="flex items-center gap-2 text-cyan-300">
                <stat.icon className="h-4 w-4" />
                <span className="font-mono text-[0.65rem] uppercase tracking-[0.18em]">{stat.label}</span>
              </div>
              <p className="mt-3 text-4xl font-semibold text-white">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <section className="border border-white/10 bg-[#070d1a]/70 p-5">
            <div className="flex items-center gap-2 text-cyan-300">
              <Radar className="h-4 w-4" />
              <h2 className="text-lg font-semibold text-white">Who started</h2>
            </div>
            <ul className="mt-4 max-h-[55vh] space-y-2 overflow-y-auto pr-1">
              {(data?.starts ?? []).length === 0 ? (
                <li className="text-sm text-white/45">Waiting for scans…</li>
              ) : (
                data?.starts.map((row, index) => (
                  <motion.li
                    key={row.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: Math.min(index, 8) * 0.03 }}
                    className="flex items-center justify-between gap-3 border border-white/[0.06] bg-white/[0.02] px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-white">{row.name}</p>
                      <p className="text-xs capitalize text-white/45">
                        {row.role} · {row.source}
                      </p>
                    </div>
                    <span className="shrink-0 font-mono text-[0.65rem] text-cyan-200/70">
                      {formatWhen(row.startedAt)}
                    </span>
                  </motion.li>
                ))
              )}
            </ul>
          </section>

          <section className="border border-white/10 bg-[#070d1a]/70 p-5">
            <div className="flex items-center gap-2 text-cyan-300">
              <Star className="h-4 w-4" />
              <h2 className="text-lg font-semibold text-white">Reviews</h2>
            </div>
            <ul className="mt-4 max-h-[55vh] space-y-3 overflow-y-auto pr-1">
              {(data?.reviews ?? []).length === 0 ? (
                <li className="text-sm text-white/45">No reviews yet.</li>
              ) : (
                data?.reviews.map((row) => (
                  <li key={row.id} className="border border-white/[0.06] bg-white/[0.02] px-3 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-white">{row.name}</p>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={cn(
                              "h-3.5 w-3.5",
                              i < row.rating ? "fill-cyan-300 text-cyan-300" : "text-white/20",
                            )}
                          />
                        ))}
                      </div>
                    </div>
                    {row.favorite ? (
                      <p className="mt-1 text-xs text-cyan-200/70">Favorite: {row.favorite}</p>
                    ) : null}
                    <p className="mt-2 text-sm leading-relaxed text-white/70">{row.comment}</p>
                    <p className="mt-2 font-mono text-[0.6rem] text-white/35">{formatWhen(row.createdAt)}</p>
                  </li>
                ))
              )}
            </ul>
          </section>
        </div>
      </div>
    </main>
  );
}
