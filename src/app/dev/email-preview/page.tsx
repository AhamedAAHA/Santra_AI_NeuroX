"use client";

import { useEffect, useState } from "react";

/** Local preview of the redesigned watch alert email (requires signed-in session). */
export default function EmailPreviewPage() {
  const [html, setHtml] = useState<string>("Loading preview…");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void (async () => {
        try {
          const response = await fetch("/api/notifications/preview", { credentials: "include" });
          if (!response.ok) {
            const data = (await response.json().catch(() => null)) as { error?: string } | null;
            setError(data?.error || `Preview failed (${response.status})`);
            return;
          }
          setHtml(await response.text());
        } catch (err) {
          setError(err instanceof Error ? err.message : "Preview failed");
        }
      })();
    }, 0);
    return () => window.clearTimeout(timeout);
  }, []);

  if (error) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#0b1020] p-8 text-white">
        <div className="max-w-lg rounded-2xl border border-rose-300/30 bg-rose-400/10 p-6">
          <p className="text-sm uppercase tracking-[0.2em] text-rose-100/70">Email preview</p>
          <p className="mt-3 text-lg">{error}</p>
          <p className="mt-2 text-sm text-white/50">Sign in, then open /dev/email-preview again.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#eef1f7]">
      <div className="border-b border-black/10 bg-white px-4 py-3 text-sm text-black/60">
        SANTRA email preview · sample Acme report ·{" "}
        <a className="text-cyan-700 underline" href="/api/notifications/preview?format=text">
          plain text
        </a>
      </div>
      <iframe title="Watch alert email preview" srcDoc={html} className="h-[calc(100vh-48px)] w-full border-0" />
    </main>
  );
}
