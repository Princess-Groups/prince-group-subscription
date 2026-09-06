import type { ReactNode } from "react";

import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";

export function PublicPage({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}

export function PageHero({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <section className="relative overflow-hidden bg-gradient-olive px-4 py-16 text-primary-foreground sm:px-6 sm:py-20">
      <div className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-accent/20 blur-3xl" />
      <div className="mx-auto max-w-7xl">
        {eyebrow ? (
          <span className="inline-flex rounded-full border border-accent/40 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-accent">
            {eyebrow}
          </span>
        ) : null}
        <h1 className="mt-4 max-w-3xl text-3xl font-bold sm:text-5xl">{title}</h1>
        {subtitle ? (
          <p className="mt-4 max-w-2xl text-sm text-primary-foreground/75 sm:text-base">{subtitle}</p>
        ) : null}
      </div>
    </section>
  );
}

export function DemoBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border border-accent/50 bg-accent/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary ${className}`}
    >
      Demo data – sample records only
    </span>
  );
}

export function AdminManagedNote({ children }: { children: ReactNode }) {
  return (
    <p className="mt-3 text-xs text-muted-foreground">
      <span className="font-semibold text-secondary">Admin-managed:</span> {children}
    </p>
  );
}
