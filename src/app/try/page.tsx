"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Star, Users } from "lucide-react";
import { BrandLogo } from "@/components/shared/brand-mark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

function TryReviewForm() {
  const searchParams = useSearchParams();
  const source = searchParams.get("from") || "pitch";

  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const appHref = useMemo(() => {
    const next = encodeURIComponent("/alerts");
    return `/sign-in?next=${next}&from=${encodeURIComponent(source)}`;
  }, [source]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const startRes = await fetch("/api/pitch/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, role: "audience", source }),
      });
      const startData = (await startRes.json().catch(() => null)) as {
        error?: string;
        session?: { id: string; name: string };
      } | null;
      if (!startRes.ok || !startData?.session) {
        throw new Error(startData?.error || "Could not start.");
      }

      const reviewRes = await fetch("/api/pitch/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: startData.session.id,
          name: startData.session.name,
          role: "audience",
          rating,
          comment,
        }),
      });
      const reviewData = (await reviewRes.json().catch(() => null)) as { error?: string } | null;
      if (!reviewRes.ok) {
        throw new Error(reviewData?.error || "Could not save review.");
      }

      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="mt-8 space-y-5 text-center">
        <p className="text-lg font-medium text-cyan-100">Thanks — review sent.</p>
        <p className="text-sm text-white/60">It should pop up on the pitch closing slide.</p>
        <Button asChild size="lg" className="w-full">
          <Link href={appHref}>
            Open SANTRA app <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-5">
      <div>
        <label htmlFor="try-name" className="text-xs uppercase tracking-[0.18em] text-white/45">
          Name
        </label>
        <Input
          id="try-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Your name"
          className="mt-2"
          autoComplete="name"
          required
          minLength={2}
        />
      </div>

      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-white/45">Stars</p>
        <div className="mt-2 flex gap-1.5">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRating(value)}
              className="p-1"
              aria-label={`${value} stars`}
            >
              <Star
                className={cn(
                  "h-7 w-7",
                  value <= rating ? "fill-cyan-300 text-cyan-300" : "text-white/25",
                )}
              />
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="try-review" className="text-xs uppercase tracking-[0.18em] text-white/45">
          Review
        </label>
        <Textarea
          id="try-review"
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder="What stood out?"
          className="mt-2 min-h-[110px]"
          required
          minLength={3}
        />
      </div>

      {error ? <p className="text-sm text-rose-200">{error}</p> : null}

      <Button type="submit" size="lg" className="w-full" disabled={loading}>
        {loading ? "Sending…" : "Send review"}
        <ArrowRight className="h-4 w-4" />
      </Button>
    </form>
  );
}

export default function TryPage() {
  return (
    <main className="relative min-h-[100dvh] overflow-hidden bg-[#030712] text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(34,211,238,0.12),transparent_55%)]"
      />
      <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-md flex-col justify-center px-5 py-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="border border-white/10 bg-[#070d1a]/90 p-6 sm:p-8"
        >
          <BrandLogo className="h-12 w-[72px]" />
          <div className="mt-5 flex items-center gap-2 text-cyan-300">
            <Sparkles className="h-4 w-4" />
            <span className="text-xs uppercase tracking-[0.2em]">NeuroX · Live try</span>
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">Leave a quick review</h1>
          <p className="mt-2 text-sm leading-relaxed text-white/65">
            Name, stars, and a short note — it appears live on the pitch slide.
          </p>

          <Suspense fallback={<div className="mt-8 h-40 animate-pulse bg-white/5" />}>
            <TryReviewForm />
          </Suspense>
        </motion.div>

        <p className="mt-6 flex items-center justify-center gap-2 text-xs text-white/35">
          <Users className="h-3.5 w-3.5" />
          Team live board:{" "}
          <Link href="/pitch/live" className="text-cyan-300/80 underline-offset-2 hover:underline">
            /pitch/live
          </Link>
        </p>
      </div>
    </main>
  );
}
