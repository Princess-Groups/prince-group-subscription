import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function GlassCard({
  children,
  className,
  index = 0,
}: {
  children: ReactNode;
  className?: string;
  index?: number;
}) {
  return (
    <article
      className={cn(
        "liquid-glass reveal-soft relative overflow-hidden rounded-3xl p-5 sm:p-6",
        className,
      )}
      style={{ animationDelay: `${Math.min(index, 12) * 55}ms` }}
    >
      <span className="pointer-events-none absolute -right-16 -top-20 size-40 rounded-full bg-secondary/15 blur-3xl" />
      <div className="relative">{children}</div>
    </article>
  );
}

const toneMap: Record<string, string> = {
  new: "border-secondary/40 bg-secondary/15 text-primary",
  hot: "border-accent/50 bg-accent/20 text-primary",
  available: "border-primary/20 bg-primary/10 text-primary",
  premium: "border-accent/60 bg-accent/25 text-primary",
  locked: "border-primary/15 bg-muted text-foreground/80",
  recent: "border-secondary/30 bg-secondary/10 text-primary",
};

export function StatusPill({ label }: { label: string }) {
  const tone = toneMap[label.toLowerCase()] ?? toneMap["available"];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
        tone,
      )}
    >
      {label}
    </span>
  );
}

export function LockedContact({ children }: { children?: ReactNode }) {
  return (
    <div className="mt-4 rounded-2xl border border-primary/10 bg-primary/[0.04] px-3 py-2.5">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground/80">
        Contact Number
      </p>
      <p className="mt-0.5 font-mono text-sm font-semibold tracking-[0.2em] text-primary">
        🔒 **********
      </p>
      {children}
    </div>
  );
}

export function StatTile({
  value,
  label,
  index = 0,
}: {
  value: string;
  label: string;
  index?: number;
}) {
  return (
    <div
      className="liquid-glass reveal-soft rounded-3xl px-4 py-5 text-center"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <p className="font-display text-2xl font-bold text-primary sm:text-3xl">{value}</p>
      <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-foreground/80">
        {label}
      </p>
    </div>
  );
}
