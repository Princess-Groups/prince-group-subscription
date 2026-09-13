import { Link } from "@tanstack/react-router";
import {
  Building2,
  CheckCircle2,
  Crown,
  Flag,
  Handshake,
  Lock,
  MapPin,
  MessageSquare,
  ShieldBan,
  Sparkles,
} from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import type { EnquiryCardData, MemberCardData } from "@/hooks/useNetwork";
import { cn } from "@/lib/utils";

export function NetworkPill({ children, tone = "olive" }: { children: ReactNode; tone?: "olive" | "lime" | "cream" }) {
  const map = {
    olive: "border-primary/20 bg-primary/10 text-primary",
    lime: "border-secondary/40 bg-secondary/15 text-primary",
    cream: "border-accent/50 bg-accent/20 text-primary",
  } as const;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
        map[tone],
      )}
    >
      {children}
    </span>
  );
}

function Avatar({ src, name, logo }: { src: string | null; name: string; logo?: string | null }) {
  const image = src || logo;
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
  return (
    <span className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-2xl bg-primary/10 text-base font-bold text-primary ring-1 ring-primary/15">
      {image ? <img src={image} alt="" className="size-full object-cover" /> : initials || "PG"}
    </span>
  );
}

export function MemberCard({
  member,
  index = 0,
  onMessage,
  onReport,
  onBlock,
}: {
  member: MemberCardData;
  index?: number;
  onMessage?: (id: string) => void;
  onReport?: (id: string) => void;
  onBlock?: (id: string) => void;
}) {
  return (
    <article
      className="liquid-glass reveal-soft group relative flex h-full flex-col overflow-hidden rounded-3xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-soft"
      style={{ animationDelay: `${Math.min(index, 12) * 55}ms` }}
    >
      <span className="pointer-events-none absolute -right-16 -top-20 size-40 rounded-full bg-secondary/15 blur-3xl transition-opacity group-hover:opacity-80" />
      <div className="relative flex items-start gap-3">
        <Avatar src={member.photo_url} logo={member.company_logo_url} name={member.full_name} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-base font-bold text-primary">{member.full_name}</h3>
            {member.featured ? (
              <NetworkPill tone="cream">
                <Crown className="size-3" /> Featured
              </NetworkPill>
            ) : (
              <NetworkPill tone="lime">
                <CheckCircle2 className="size-3" /> Verified
              </NetworkPill>
            )}
          </div>
          <p className="mt-0.5 truncate text-xs font-semibold text-secondary">{member.designation}</p>
          <p className="mt-1 inline-flex items-center gap-1.5 truncate text-xs text-foreground/80">
            <Building2 className="size-3.5 shrink-0" /> {member.company_name || "Independent"}
          </p>
        </div>
      </div>

      <div className="relative mt-3 flex flex-wrap gap-2">
        {member.category ? <NetworkPill>{member.category}</NetworkPill> : null}
        {member.location ? (
          <NetworkPill>
            <MapPin className="size-3" /> {member.location}
          </NetworkPill>
        ) : null}
      </div>

      {member.about_company ? (
        <p className="relative mt-3 line-clamp-3 text-xs leading-relaxed text-foreground/80">
          {member.about_company}
        </p>
      ) : null}

      <div className="relative mt-3 grid gap-2 text-xs sm:grid-cols-2">
        <div className="rounded-2xl border border-secondary/25 bg-secondary/[0.08] p-2.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-secondary">What I Offer</p>
          <p className="mt-0.5 line-clamp-2 text-foreground/80">{member.what_we_offer || "—"}</p>
        </div>
        <div className="rounded-2xl border border-primary/15 bg-primary/[0.05] p-2.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-primary/70">What I Need</p>
          <p className="mt-0.5 line-clamp-2 text-foreground/80">{member.what_we_need || "—"}</p>
        </div>
      </div>

      {member.products_services ? (
        <p className="relative mt-3 line-clamp-1 text-[11px] text-foreground/80">
          <span className="font-semibold text-primary">Products / Services:</span> {member.products_services}
        </p>
      ) : null}

      <div className="relative mt-auto pt-4">
        {member.locked || !member.user_id ? (
          <div className="flex items-center justify-between gap-2 rounded-2xl border border-primary/15 bg-muted px-3 py-2.5">
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-foreground/80">
              <Lock className="size-3.5" /> Subscriber-only profile
            </span>
            <Button asChild size="sm" variant="lime">
              <Link to="/payment">Upgrade</Link>
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild size="sm" variant="lime" className="flex-1">
              <Link to="/enquiry/members/$id" params={{ id: member.user_id }}>
                View Profile
              </Link>
            </Button>
            <Button size="sm" variant="outline" onClick={() => onMessage?.(member.user_id!)}>
              <MessageSquare className="size-3.5" /> Message
            </Button>
            {onReport ? (
              <Button size="icon" variant="ghost" title="Report" onClick={() => onReport(member.user_id!)}>
                <Flag className="size-3.5" />
              </Button>
            ) : null}
            {onBlock ? (
              <Button size="icon" variant="ghost" title="Block" onClick={() => onBlock(member.user_id!)}>
                <ShieldBan className="size-3.5" />
              </Button>
            ) : null}
          </div>
        )}
      </div>
    </article>
  );
}

export function EnquiryCard({
  enquiry,
  index = 0,
  onMessage,
  onConnect,
  onView,
  onReport,
}: {
  enquiry: EnquiryCardData;
  index?: number;
  onMessage?: (id: string) => void;
  onConnect?: (id: string) => void;
  onView?: (enquiry: EnquiryCardData) => void;
  onReport?: (id: string) => void;
}) {
  return (
    <article
      className="liquid-glass reveal-soft group relative flex h-full flex-col overflow-hidden rounded-3xl p-5 transition-all duration-300 hover:-translate-y-1"
      style={{ animationDelay: `${Math.min(index, 12) * 55}ms` }}
    >
      <span className="pointer-events-none absolute -left-16 -bottom-20 size-40 rounded-full bg-accent/20 blur-3xl" />
      <div className="relative flex flex-wrap items-center gap-2">
        <NetworkPill tone="lime">
          <Sparkles className="size-3" /> {enquiry.enquiry_type}
        </NetworkPill>
        {enquiry.category ? <NetworkPill>{enquiry.category}</NetworkPill> : null}
        {enquiry.featured ? (
          <NetworkPill tone="cream">
            <Crown className="size-3" /> Featured
          </NetworkPill>
        ) : null}
      </div>
      <h3 className="relative mt-3 text-base font-bold leading-snug text-primary">{enquiry.title}</h3>
      <p className="relative mt-2 line-clamp-3 text-xs leading-relaxed text-foreground/80">
        {enquiry.description}
      </p>
      <div className="relative mt-3 flex flex-wrap items-center gap-3 text-[11px] text-foreground/80">
        <span className="inline-flex items-center gap-1.5">
          <Building2 className="size-3.5" /> {enquiry.author_name}
          {enquiry.author_company ? ` · ${enquiry.author_company}` : ""}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <MapPin className="size-3.5" /> {enquiry.location}
        </span>
      </div>

      <div className="relative mt-auto pt-4">
        {enquiry.locked ? (
          <div className="flex items-center justify-between gap-2 rounded-2xl border border-primary/15 bg-muted px-3 py-2.5">
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-foreground/80">
              <Lock className="size-3.5" /> Subscribers only
            </span>
            <Button asChild size="sm" variant="lime">
              <Link to="/payment">Upgrade</Link>
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => onView?.(enquiry)}>
              View Details
            </Button>
            <Button size="sm" variant="lime" onClick={() => enquiry.author_id && onConnect?.(enquiry.author_id)}>
              <Handshake className="size-3.5" /> Connect
            </Button>
            <Button size="sm" variant="ghost" onClick={() => enquiry.author_id && onMessage?.(enquiry.author_id)}>
              <MessageSquare className="size-3.5" /> Message
            </Button>
            {onReport ? (
              <Button size="icon" variant="ghost" title="Report" onClick={() => onReport(enquiry.id)}>
                <Flag className="size-3.5" />
              </Button>
            ) : null}
          </div>
        )}
      </div>
    </article>
  );
}

export function UpgradeGate({
  title = "Become a Prince Group Subscriber to connect with verified business members.",
  note,
}: {
  title?: string;
  note?: string;
}) {
  return (
    <div className="liquid-glass relative overflow-hidden rounded-3xl border border-accent/30 p-6 sm:p-8">
      <span className="pointer-events-none absolute -right-20 -top-24 size-56 rounded-full bg-accent/20 blur-3xl" />
      <div className="relative flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <NetworkPill tone="cream">
            <Lock className="size-3" /> Members only
          </NetworkPill>
          <h3 className="mt-3 max-w-2xl text-lg font-bold text-primary sm:text-xl">{title}</h3>
          <p className="mt-2 max-w-2xl text-sm text-foreground/80">
            {note ??
              "Messaging, calling, enquiry posting and full member details unlock with an active subscription."}
          </p>
        </div>
        <Button asChild size="lg" variant="lime" className="shrink-0">
          <Link to="/payment">Upgrade Plan</Link>
        </Button>
      </div>
    </div>
  );
}
