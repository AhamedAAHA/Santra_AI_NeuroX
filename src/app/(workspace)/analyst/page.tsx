"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function AnalystRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const query = searchParams.get("q")?.trim() || searchParams.get("prompt")?.trim();
    const params = new URLSearchParams({ mode: "brief" });
    if (query) params.set("q", query);
    router.replace(`/chat?${params.toString()}`);
  }, [router, searchParams]);

  return <p className="text-sm text-white/50">Opening GTM Advisor Deep brief…</p>;
}

/** Competitor IQ merged into GTM Advisor Deep brief mode. */
export default function AnalystPage() {
  return (
    <Suspense fallback={<p className="text-sm text-white/50">Opening GTM Advisor Deep brief…</p>}>
      <AnalystRedirect />
    </Suspense>
  );
}
