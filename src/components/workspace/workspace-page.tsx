import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
};

export function WorkspacePageHeader({
  badge,
  badgeVariant = "cyan",
  title,
  description,
  actions,
  aside,
}: WorkspacePageHeaderProps) {
  return (
    <header
      className={cn(
        "grid gap-4 border-b border-white/[0.08] pb-5",
        aside ? "xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start" : actions ? "md:grid-cols-[minmax(0,1fr)_auto] md:items-end" : undefined,
      )}
    >
      <div className="min-w-0">
        <Badge variant={badgeVariant}>{badge}</Badge>
        <h1 className="mt-2.5 text-2xl font-semibold tracking-tight text-white md:text-3xl">{title}</h1>
        <p className="mt-1.5 max-w-2xl text-sm leading-6 text-white/50">{description}</p>
      </div>
      {aside}
      {!aside && actions && <div className="flex shrink-0 flex-wrap items-center gap-3">{actions}</div>}
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
  return (
    <section id={id} className={cn("grid gap-4", className)}>
      {(title || description) && (
        <div className="min-w-0">
          {title && <h2 className="text-lg font-semibold tracking-tight text-white md:text-xl">{title}</h2>}
          {description && <p className="mt-1 max-w-2xl text-sm leading-6 text-white/45">{description}</p>}
        </div>
      )}
      {children}
    </section>
  );
}
