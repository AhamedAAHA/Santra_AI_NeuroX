"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const ease = [0.22, 1, 0.36, 1] as const;

type WorkspacePageProps = {
  children: ReactNode;
  className?: string;
};

/** Consistent max-width and vertical rhythm for workspace routes. */
export function WorkspacePage({ children, className }: WorkspacePageProps) {
  return <div className={cn("flex w-full flex-col gap-6", className)}>{children}</div>;
}

type WorkspacePageHeaderProps = {
  badge: string;
  badgeVariant?: "cyan" | "violet" | "risk" | "default";
  title: string;
  description: string;
  actions?: ReactNode;
  aside?: ReactNode;
  /** Tighter type for height-constrained pages (e.g. Strategy Desk). */
  compact?: boolean;
};

export function WorkspacePageHeader({
  badge,
  badgeVariant = "cyan",
  title,
  description,
  actions,
  aside,
  compact = false,
}: WorkspacePageHeaderProps) {
  const reduceMotion = useReducedMotion();
  const words = title.trim().split(/\s+/).filter(Boolean);

  return (
    <header
      className={cn(
        "grid gap-3 border-b border-white/[0.08]",
        compact ? "pb-3 sm:pb-4" : "gap-4 pb-6",
        aside
          ? "xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start"
          : actions
            ? "md:grid-cols-[minmax(0,1fr)_auto] md:items-end"
            : undefined,
      )}
    >
      <div className="min-w-0">
        <motion.div
          key={`badge-${badge}`}
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease, delay: 0 }}
        >
          <Badge variant={badgeVariant}>{badge}</Badge>
        </motion.div>

        <h1
          className={cn(
            "mt-2 font-display font-bold leading-[1.12] tracking-[-0.03em]",
            compact
              ? "text-[clamp(2.15rem,4.2vw,3.15rem)] sm:mt-2.5"
              : "mt-3 text-[clamp(2.15rem,4.2vw,3.25rem)]",
          )}
        >
          <span className="sr-only">{title}</span>
          <span aria-hidden className="flex flex-wrap gap-x-[0.28em]">
            {words.map((word, index) => (
              <motion.span
                key={`${title}-${word}-${index}`}
                initial={reduceMotion ? false : { opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease, delay: reduceMotion ? 0 : 0.06 + index * 0.07 }}
                className="heading-gradient-sweep inline-block"
              >
                {word}
              </motion.span>
            ))}
          </span>
        </h1>

        <motion.p
          key={`desc-${description.slice(0, 48)}`}
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease, delay: reduceMotion ? 0 : 0.18 + words.length * 0.05 }}
          className={cn(
            "max-w-2xl text-sm leading-6 text-white/55",
            compact ? "mt-1.5 hidden sm:block" : "mt-2.5 max-sm:line-clamp-2 md:text-[15px] md:leading-7",
          )}
        >
          {description}
        </motion.p>
      </div>
      {aside}
      {!aside && actions && (
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease, delay: reduceMotion ? 0 : 0.28 }}
          className="flex shrink-0 flex-wrap items-center gap-3"
        >
          {actions}
        </motion.div>
      )}
    </header>
  );
}

type WorkspaceSectionProps = {
  id?: string;
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

export function WorkspaceSection({ id, title, description, children, className }: WorkspaceSectionProps) {
  const reduceMotion = useReducedMotion();

  return (
    <section id={id} className={cn("grid gap-4", className)}>
      {(title || description) && (
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.45, ease }}
          className="min-w-0"
        >
          {title && (
            <h2 className="font-display text-lg font-semibold tracking-tight text-white md:text-xl">
              <span className="heading-gradient-sweep">{title}</span>
            </h2>
          )}
          {description && <p className="mt-1 max-w-2xl text-sm leading-6 text-white/45">{description}</p>}
        </motion.div>
      )}
      {children}
    </section>
  );
}
