import type { ReactNode } from "react";

import { PlanPromoPopup } from "@/components/site/PlanPromoPopup";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";

export function PublicPage({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      <PlanPromoPopup />
    </div>
  );
}

export function PageHero({
  eyebrow,
  title,
  highlight,
  subtitle,
  actions,
  visual,
  bgImage,
}: {
  eyebrow?: string;
  title: string;
  highlight?: string;
  subtitle?: string;
  actions?: ReactNode;
  visual?: ReactNode;
  bgImage?: string;
}) {
  return (
    <section className="relative overflow-hidden bg-gradient-olive px-4 py-18 text-cream sm:px-6 sm:py-24">
      {bgImage ? (
        <>
          <img
            src={bgImage}
            alt=""
            aria-hidden
            className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-primary via-primary/90 to-primary/70" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/20 to-primary/50" />
        </>
      ) : null}
      <div className="grid-lines pointer-events-none absolute inset-0 opacity-50" />
      <div className="hero-orb -right-20 -top-24 size-96 bg-accent/20" />
      <div className="hero-orb -left-32 -bottom-10 size-80 bg-secondary/25" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="reveal">
          {eyebrow ? <span className="pill-badge">{eyebrow}</span> : null}
          <h1 className="mt-5 max-w-3xl text-3xl font-bold leading-[1.1] sm:text-5xl">
            {title}
            {highlight ? <span className="mt-1 block text-gradient-olive">{highlight}</span> : null}
          </h1>
          {subtitle ? (
            <p className="mt-5 max-w-2xl text-sm leading-relaxed text-cream/70 sm:text-base">
              {subtitle}
            </p>
          ) : null}
          {actions ? <div className="mt-8 flex flex-wrap gap-3">{actions}</div> : null}
        </div>
        {visual ? <div className="relative">{visual}</div> : null}
      </div>
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  highlight,
  subtitle,
  tone = "light",
}: {
  eyebrow?: string;
  title: string;
  highlight?: string;
  subtitle?: string;
  tone?: "light" | "dark";
}) {
  const dark = tone === "dark";
  return (
    <div className="max-w-2xl">
      {eyebrow ? (
        <span
          className={
            dark
              ? "pill-badge"
              : "text-xs font-bold uppercase tracking-[0.25em] text-secondary"
          }
        >
          {eyebrow}
        </span>
      ) : null}
      <h2
        className={`mt-4 text-3xl font-bold sm:text-4xl ${dark ? "text-cream" : "text-primary"}`}
      >
        {title} {highlight ? <span className="text-gradient-olive">{highlight}</span> : null}
      </h2>
      {subtitle ? (
        <p className={`mt-4 text-sm sm:text-base ${dark ? "text-cream/70" : "text-muted-foreground"}`}>
          {subtitle}
        </p>
      ) : null}
    </div>
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
