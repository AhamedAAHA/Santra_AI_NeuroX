"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type MongoHealth = {
  configured?: boolean;
  ready?: boolean;
  error?: string;
  host?: string;
};

export function LocalDevBanner() {
  const [mongo, setMongo] = useState<MongoHealth | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/health/mongodb", { cache: "no-store", signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: MongoHealth | null) => {
        if (data) setMongo(data);
      })
      .catch(() => {
        setMongo({ configured: false, ready: false });
      });
    return () => controller.abort();
  }, []);

  if (process.env.NODE_ENV === "production") return null;
  if (mongo?.ready) return null;

  const notConfigured = mongo?.configured === false;
  const connectionFailed = mongo?.configured && !mongo?.ready;

  return (
    <div className="border-b border-amber-300/20 bg-amber-400/10 px-4 py-2 text-center text-xs text-amber-100 md:px-8">
      {notConfigured ? (
        <>
          <span className="font-medium">Local dev mode</span>
          <span className="text-amber-100/80">
            {" "}
            — MongoDB is not configured. Monitors and history stay in this browser only.{" "}
          </span>
        </>
      ) : connectionFailed ? (
        <>
          <span className="font-medium">MongoDB connection failed</span>
          <span className="text-amber-100/80"> — {mongo?.error ?? "Check MONGODB_URI in .env.local."} </span>
        </>
      ) : (
        <>
          <span className="font-medium">Checking database…</span>
        </>
      )}
      <Link href="/settings" className="underline underline-offset-2">
        Settings
      </Link>
    </div>
  );
}
