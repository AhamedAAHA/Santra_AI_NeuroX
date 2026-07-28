"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  BellRing,
  FileCheck2,
  HelpCircle,
  LayoutDashboard,
  Radar,
  Settings,
} from "lucide-react";
import { CommandPalette } from "@/components/shared/command-palette";
import { BrandLogo } from "@/components/shared/brand-mark";
import { LocalDevBanner } from "@/components/shared/local-dev-banner";
import { ParticleField } from "@/components/shared/particle-field";
import { NewUserGuideModal } from "@/components/dashboard/new-user-guide-modal";
import { UserMenu } from "@/components/dashboard/user-menu";
import { getLocalSession, repairLocalSessionFromCookie, repairLocalStorageQuota, syncLocalSessionToCookie } from "@/lib/local-auth";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard", label: "Command center", icon: LayoutDashboard },
  { href: "/chat", label: "Strategy Desk", icon: Radar },
  { href: "/alerts", label: "GTM Monitors", icon: BellRing },
  { href: "/reports", label: "Reports", icon: FileCheck2 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [locationHash, setLocationHash] = useState("");
  const prefetchedRoutesRef = useRef(new Set<string>());

  const prefetchRoute = useCallback(
    (href: string) => {
      if (href.includes("#") || prefetchedRoutesRef.current.has(href)) return;
      prefetchedRoutesRef.current.add(href);
      router.prefetch(href);
    },
    [router],
  );

  useEffect(() => {
    repairLocalStorageQuota();
    repairLocalSessionFromCookie();
    syncLocalSessionToCookie();
  }, []);

  useEffect(() => {
    const preloadWorkspaceRoutes = () => nav.forEach((item) => prefetchRoute(item.href));
    const idleCallback =
      "requestIdleCallback" in window
        ? window.requestIdleCallback(preloadWorkspaceRoutes, { timeout: 1200 })
        : globalThis.setTimeout(preloadWorkspaceRoutes, 250);

    return () => {
      if ("cancelIdleCallback" in window && typeof idleCallback === "number") {
        window.cancelIdleCallback(idleCallback);
      } else {
        globalThis.clearTimeout(idleCallback);
      }
    };
  }, [prefetchRoute]);

  useEffect(() => {
    const syncHash = () => setLocationHash(window.location.hash);
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, [pathname]);

  const isActive = (href: string) => {
    const [path, hash] = href.split("#");
    if (hash && path === pathname) {
      return locationHash === `#${hash}`;
    }
    return pathname === path;
  };

  useEffect(() => {
    repairLocalSessionFromCookie();
    syncLocalSessionToCookie();
    if (getLocalSession()) return;

    const next = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
    router.replace(`/sign-in?next=${encodeURIComponent(next)}`);
  }, [pathname, router, searchParams]);

  return (
    <main className="min-h-[100dvh]">
      <ParticleField lite />
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col border-r border-white/10 bg-sentra-ink/92 p-5 lg:flex">
        <Link href="/" className="group flex shrink-0 justify-center px-2 pb-5 pt-2 text-white" aria-label="SANTRA AI home">
          <BrandLogo className="h-[112px] w-[168px]" />
        </Link>
        <nav className="mt-8 grid min-h-0 flex-1 content-start gap-2 overflow-y-auto overscroll-contain pr-1">
          {nav.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              prefetch
              onFocus={() => prefetchRoute(item.href)}
              onPointerEnter={() => prefetchRoute(item.href)}
              onTouchStart={() => prefetchRoute(item.href)}
              className={cn(
                "nav-glow-link flex min-w-0 items-center gap-3 rounded-2xl px-4 py-3 text-sm text-white/58 transition",
                isActive(item.href) && "bg-white/[0.08] text-white",
              )}
            >
              <item.icon className="h-4 w-4 shrink-0 text-sentra-cyan" />
              <span className="min-w-0 truncate">{item.label}</span>
            </Link>
          ))}
        </nav>
        <button
          type="button"
          onClick={() => window.dispatchEvent(new Event("sentra:open-guide"))}
          className="sentra-focus nav-glow-link mt-5 flex shrink-0 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.05] p-4 text-left text-sm text-white/72 transition"
        >
          <HelpCircle className="h-4 w-4 shrink-0 text-sentra-cyan" />
          <span>Open guide</span>
        </button>
      </aside>
      <section className="lg:pl-72">
        <div className="pb-[var(--sentra-mobile-nav-clearance)] lg:pb-0">
          <LocalDevBanner />
          <header className="sticky top-0 z-30 border-b border-white/10 bg-sentra-ink/92 px-3 py-3 backdrop-blur-xl md:px-8 md:py-4">
            <div className="flex min-w-0 items-center gap-2 md:gap-4">
              <CommandPalette className="min-w-0 flex-1" />
              <Link
                href="/alerts"
                className="nav-glow-link hidden shrink-0 rounded-2xl border border-white/10 bg-white/[0.06] p-3 text-white/60 transition md:block"
                aria-label="Open alerts"
              >
                <BellRing className="h-5 w-5" />
              </Link>
              <button
                type="button"
                onClick={() => window.dispatchEvent(new Event("sentra:open-guide"))}
                className="nav-glow-link hidden shrink-0 rounded-2xl border border-white/10 bg-white/[0.06] p-3 text-white/60 transition sm:block"
                aria-label="Open guide"
              >
                <HelpCircle className="h-5 w-5" />
              </button>
              <UserMenu />
            </div>
          </header>
          <div className="sentra-workspace-shell mx-auto w-full max-w-7xl px-3 py-4 md:px-8 md:py-8">
            {children}
          </div>
        </div>
      </section>
      <nav
        className="fixed inset-x-2 z-40 rounded-3xl border border-white/10 bg-sentra-ink/95 p-1.5 shadow-2xl shadow-black/40 backdrop-blur-xl lg:hidden"
        style={{ bottom: "max(0.5rem, env(safe-area-inset-bottom, 0px))" }}
      >
        <div className="flex gap-0.5 overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {nav.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              prefetch
              onFocus={() => prefetchRoute(item.href)}
              onPointerEnter={() => prefetchRoute(item.href)}
              onTouchStart={() => prefetchRoute(item.href)}
              className={cn(
                "sentra-focus nav-glow-link flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl px-1 py-2 text-[10px] font-medium text-white/55 transition",
                isActive(item.href) && "bg-white/[0.08] text-white",
              )}
            >
              <item.icon className="h-4 w-4 shrink-0 text-sentra-cyan" />
              <span className="max-w-full truncate">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
      <NewUserGuideModal />
    </main>
  );
}
