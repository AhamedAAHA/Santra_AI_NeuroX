"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function AnalystRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const query = searchParams.get("q")?.trim() || searchParams.get("prompt")?.trim();
    const params = new URLSearchParams({ mode: "ask" });
    if (query) params.set("prompt", query);
    router.replace(`/chat?${params.toString()}`);
  }, [router, searchParams]);

  return <p className="text-sm text-white/50">Opening Strategy Desk…</p>;
}

/** Legacy analyst route opens Strategy Desk Ask mode. */
export default function AnalystPage() {
  return (
    <Suspense fallback={<p className="text-sm text-white/50">Opening Strategy Desk…</p>}>
      <AnalystRedirect />
    </Suspense>
  );
}
