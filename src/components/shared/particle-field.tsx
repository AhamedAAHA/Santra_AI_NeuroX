"use client";

import { useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";
import { useSettings } from "@/settings/settings-context";

function subscribeVisibility(onStoreChange: () => void) {
  document.addEventListener("visibilitychange", onStoreChange);
  return () => document.removeEventListener("visibilitychange", onStoreChange);
}

function getPageHidden() {
  return document.hidden;
}

type ParticleFieldProps = {
  /** Skip animated dots - static background only (workspace pages). */
  lite?: boolean;
};

export function ParticleField({ lite = false }: ParticleFieldProps) {
  const { settings } = useSettings();
  const pageHidden = useSyncExternalStore(subscribeVisibility, getPageHidden, () => false);

  if (!settings.experience.particleBackground) return null;

  return (
    <div
      className={cn("pointer-events-none fixed inset-0 -z-10 overflow-hidden", pageHidden && "opacity-90")}
      aria-hidden
    >
      {/* Base ambient glow */}
      <div className="sentra-ambient-glow pointer-events-none absolute inset-[-10%] transition-opacity duration-500" />

      {/* Aurora layer */}
      <div className={cn("absolute inset-0 bg-aurora opacity-55", lite && "opacity-30")} />

      {/* Intelligence grid overlay — subtle cyan grid lines */}
      {!lite && (
        <div
          className="absolute inset-0 opacity-[0.28]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(83,244,255,0.06) 1px,transparent 1px),linear-gradient(90deg,rgba(83,244,255,0.06) 1px,transparent 1px)",
            backgroundSize: "72px 72px",
          }}
        />
      )}

      {/* Radial vignette — darkens the edges to keep focus on content */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(5,7,18,0.72)_100%)]" />

      {/* Depth gradient top-to-bottom */}
      <div className="sentra-soft-depth absolute inset-0" />

      {/* Animated scan line (landing page only) */}
      {!lite && (
        <div
          className="absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-sentra-cyan/18 to-transparent"
          style={{ animation: "scan-line 12s linear infinite" }}
        />
      )}
    </div>
  );
}
