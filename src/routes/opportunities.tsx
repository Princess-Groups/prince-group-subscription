import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Bookmark,
  BookmarkCheck,
  Briefcase,
  MapPin,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Unlock,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { GlassCard, LockedContact, StatTile, StatusPill } from "@/components/site/GlassBits";
import { AdminManagedNote, PageHero, PublicPage } from "@/components/site/PublicPage";
import opportunitiesHeroBg from "@/assets/page-themes/opportunities-section-background.png.asset.json";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useBusinesses,
  useOpportunities,
  useUnlockBusinessContact,
  useUnlockLeadContact,
  type Opportunity,
} from "@/hooks/useDirectory";
import { phoneDisplay, shortDate } from "@/lib/format";

const title = "Business Opportunities – Explore & Unlock | PRINCE GROUP";
const description =
  "Discover loan candidate, B2B, customer, service, recruitment and partnership opportunities across Kanyakumari. Contact details unlock with your subscription.";

export const Route = createFileRoute("/opportunities")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OpportunitiesPage,
});

const CATEGORY_CHIPS = [
  "Loan Candidate",
  "B2B",
  "Customer",
  "Service",
  "Recruitment",
  "Partnership",
];

type Sort = "latest" | "relevant" | "popular" | "az";
type Flag = "all" | "new" | "premium" | "available";

const NEW_WINDOW = 7 * 86400000;

function OpportunitiesPage() {
  const { data, isLoading } = useOpportunities();
  const { data: businesses } = useBusinesses();

  const [q, setQ] = useState("");
  const [category, setCategory] = useState("all");
  const [location, setLocation] = useState("all");
  const [type, setType] = useState("all");
  const [flag, setFlag] = useState<Flag>("all");
  const [sort, setSort] = useState<Sort>("latest");
  const [showFilters, setShowFilters] = useState(false);
  const [active, setActive] = useState<Opportunity | null>(null);
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [revealed, setRevealed] = useState<Record<string, string>>({});

  const navigate = useNavigate();
  const goToPayment = () => navigate({ to: "/payment" });
  const unlockBusiness = useUnlockBusinessContact(
    (id, phone) => setRevealed((r) => ({ ...r, [`b:${id}`]: phone })),
    goToPayment,
  );
  const unlockLead = useUnlockLeadContact(
    (id, phone) => setRevealed((r) => ({ ...r, [`l:${id}`]: phone })),
    goToPayment,
  );

  const rows = useMemo(() => data ?? [], [data]);
  const businessById = useMemo(
    () => new Map((businesses ?? []).map((b) => [b.id, b])),
    [businesses],
  );

  const options = useMemo(() => {
    const cats = new Set<string>();
    const locs = new Set<string>();
    const types = new Set<string>();
    for (const o of rows) {
      cats.add(o.category);
      locs.add(o.location);
      types.add(o.opportunity_type);
    }
    const sorted = (s: Set<string>) => [...s].sort((a, b) => a.localeCompare(b));
    return { categories: sorted(cats), locations: sorted(locs), types: sorted(types) };
  }, [rows]);

  const counts = useMemo(() => {
    const by = (c: string) => rows.filter((o) => o.category === c).length;
    return {
      total: rows.length,
      fresh: rows.filter((o) => Date.now() - new Date(o.created_at).getTime() < NEW_WINDOW).length,
      b2b: by("B2B"),
      loan: by("Loan Candidate"),
      customer: by("Customer"),
      service: by("Service"),
      partnership: by("Partnership") + by("Recruitment"),
    };
  }, [rows]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    let list = rows.filter((o) => {
      if (category !== "all" && o.category !== category) return false;
      if (location !== "all" && o.location !== location) return false;
      if (type !== "all" && o.opportunity_type !== type) return false;
      if (flag === "premium" && !o.premium_only) return false;
      if (flag === "available" && o.status !== "available") return false;
      if (flag === "new" && Date.now() - new Date(o.created_at).getTime() > NEW_WINDOW) return false;
      if (!term) return true;
      return [o.title, o.category, o.opportunity_type, o.location, o.description].some((v) =>
        String(v).toLowerCase().includes(term),
      );
    });
    list = [...list].sort((a, b) => {
      if (sort === "az") return a.title.localeCompare(b.title);
      if (sort === "popular") return Number(b.premium_only) - Number(a.premium_only);
      if (sort === "relevant")
        return (
          Number(b.status === "available") - Number(a.status === "available") ||
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    return list;
  }, [rows, q, category, location, type, flag, sort]);

  function unlockFor(o: Opportunity) {
    if (o.lead_id) return unlockLead.mutate(o.lead_id);
    if (o.business_id) return unlockBusiness.mutate(o.business_id);
    toast.info("This opportunity is handled by our team — subscribe and contact support to claim it.");
  }

  function revealedFor(o: Opportunity) {
    if (o.lead_id) return revealed[`l:${o.lead_id}`];
    if (o.business_id) return revealed[`b:${o.business_id}`];
    return undefined;
  }

  const pending = unlockBusiness.isPending || unlockLead.isPending;

  return (
    <PublicPage>
      <PageHero
        bgImage={opportunitiesHeroBg.url}
        eyebrow="Opportunities Hub"
        title="Business Opportunities"
        highlight="Explore & Unlock"
        subtitle="What can you unlock with your subscription? Loan candidate data, B2B connections, customer leads, service requirements, recruitment leads and partnership offers — all across Kanyakumari district."
      />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
          <StatTile value={`${counts.total}`} label="Total Opportunities" index={0} />
          <StatTile value={`${counts.fresh}`} label="New This Week" index={1} />
          <StatTile value={`${counts.b2b}`} label="B2B Opportunities" index={2} />
          <StatTile value={`${counts.loan}`} label="Loan Opportunities" index={3} />
          <StatTile value={`${counts.customer}`} label="Customer Opportunities" index={4} />
          <StatTile value={`${counts.service}`} label="Service Opportunities" index={5} />
        </div>

        <div className="liquid-glass mt-8 rounded-3xl p-4 sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-foreground/80" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search opportunities, categories or locations..."
                className="h-11 rounded-2xl border-primary/15 bg-white/70 pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <Select value={sort} onValueChange={(v) => setSort(v as Sort)}>
                <SelectTrigger className="h-11 w-full rounded-2xl border-primary/15 bg-white/70 sm:w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="latest">Sort: Latest</SelectItem>
                  <SelectItem value="relevant">Sort: Most Relevant</SelectItem>
                  <SelectItem value="popular">Sort: Popular</SelectItem>
                  <SelectItem value="az">Sort: A–Z</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                className="h-11 shrink-0 rounded-2xl lg:hidden"
                onClick={() => setShowFilters((s) => !s)}
              >
                <SlidersHorizontal className="size-4" /> Filters
              </Button>
            </div>
          </div>

          <div className={`${showFilters ? "grid" : "hidden"} mt-3 gap-3 sm:grid-cols-2 lg:grid lg:grid-cols-4`}>
            <FilterSelect
              value={category}
              onChange={setCategory}
              placeholder="All categories"
              options={options.categories}
            />
            <FilterSelect
              value={location}
              onChange={setLocation}
              placeholder="All locations"
              options={options.locations}
            />
            <FilterSelect
              value={type}
              onChange={setType}
              placeholder="All opportunity types"
              options={options.types}
            />
            <Select value={flag} onValueChange={(v) => setFlag(v as Flag)}>
              <SelectTrigger className="h-10 rounded-2xl border-primary/15 bg-white/70">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Everything</SelectItem>
                <SelectItem value="new">New opportunities</SelectItem>
                <SelectItem value="premium">Premium opportunities</SelectItem>
                <SelectItem value="available">Available opportunities</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="-mx-4 mt-6 flex snap-x gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
          <button type="button" onClick={() => setCategory("all")} className={chipClass(category === "all")}>
            All
          </button>
          {CATEGORY_CHIPS.filter((c) => options.categories.includes(c)).map((c) => (
            <button key={c} type="button" onClick={() => setCategory(c)} className={chipClass(category === c)}>
              {c}
            </button>
          ))}
        </div>

        <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-foreground/80">
          {filtered.length} opportunities
        </p>

        {isLoading ? (
          <div className="mt-4 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-64 rounded-3xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="liquid-glass mt-4 rounded-3xl p-12 text-center">
            <h2 className="text-lg font-semibold text-primary">No opportunities match your filters</h2>
            <p className="mt-2 text-sm text-foreground/80">Try another category or search term.</p>
          </div>
        ) : (
          <div className="mt-4 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filtered.slice(0, 120).map((o, i) => {
              const fresh = Date.now() - new Date(o.created_at).getTime() < NEW_WINDOW;
              const phone = revealedFor(o);
              const biz = o.business_id ? businessById.get(o.business_id) : undefined;
              return (
                <GlassCard key={o.id} index={i} className="flex flex-col">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {fresh ? <StatusPill label="NEW" /> : <StatusPill label="RECENT" />}
                    {o.premium_only ? <StatusPill label="PREMIUM" /> : null}
                    <StatusPill label={o.status === "available" ? "AVAILABLE" : o.status} />
                    {!phone ? <StatusPill label="LOCKED" /> : null}
                  </div>

                  <h3 className="mt-3 text-base font-semibold text-primary">{o.title}</h3>
                  <p className="text-xs font-semibold uppercase tracking-wider text-secondary">
                    {o.category} · {o.opportunity_type}
                  </p>
                  <p className="mt-2 flex items-center gap-1.5 text-sm text-foreground/80">
                    <MapPin className="size-3.5 text-secondary" /> {o.location}
                  </p>
                  <p className="mt-2 line-clamp-2 text-sm text-foreground/80">{o.description}</p>

                  <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-foreground/80">
                    <Badge variant="secondary" className="rounded-full text-[10px]">
                      Added {shortDate(o.created_at)}
                    </Badge>
                    {o.potential_value ? (
                      <Badge variant="outline" className="rounded-full text-[10px]">
                        {o.potential_value}
                      </Badge>
                    ) : null}
                    {biz ? (
                      <Badge variant="outline" className="rounded-full text-[10px]">
                        {biz.business_name}
                      </Badge>
                    ) : null}
                  </div>

                  {phone ? (
                    <div className="mt-4 rounded-2xl border border-secondary/30 bg-secondary/10 px-3 py-2.5">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground/80">
                        Contact
                      </p>
                      <a href={`tel:${phone}`} className="font-semibold text-primary">
                        {phoneDisplay(phone)}
                      </a>
                    </div>
                  ) : (
                    <LockedContact>
                      <p className="mt-1 text-[11px] text-foreground/80">
                        Use your subscription access to unlock this{" "}
                        {o.lead_id ? "candidate" : "contact"}.
                      </p>
                    </LockedContact>
                  )}

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="hero"
                      className="rounded-full"
                      disabled={pending || !!phone}
                      onClick={() => unlockFor(o)}
                    >
                      <Unlock className="size-3.5" /> {o.lead_id ? "Unlock Candidate" : "Unlock"}
                    </Button>
                    <Button size="sm" variant="outline" className="rounded-full" onClick={() => setActive(o)}>
                      View Details
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="rounded-full"
                      onClick={() => {
                        setSaved((s) => ({ ...s, [o.id]: !s[o.id] }));
                        toast.success(saved[o.id] ? "Removed from saved" : "Opportunity saved");
                      }}
                    >
                      {saved[o.id] ? (
                        <BookmarkCheck className="size-3.5 text-secondary" />
                      ) : (
                        <Bookmark className="size-3.5" />
                      )}
                      Save
                    </Button>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        )}

        <div className="liquid-glass mt-12 rounded-3xl p-8 text-center">
          <Sparkles className="mx-auto size-6 text-secondary" />
          <h2 className="mt-3 text-2xl font-bold text-primary">
            One Subscription. Multiple Business Opportunities.
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-foreground/80">
            Explore Kanyakumari businesses, discover B2B opportunities, access eligible loan candidate
            data and unlock valuable business connections through one powerful platform.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              { p: "₹1", t: "Start Subscription" },
              { p: "₹10", t: "Unlock Candidate Data" },
              { p: "₹100", t: "Go Premium" },
            ].map((c, i) => (
              <div
                key={c.p}
                className="liquid-glass reveal-soft rounded-3xl px-4 py-5"
                style={{ animationDelay: `${i * 70}ms` }}
              >
                <p className="font-display text-2xl font-bold text-primary">{c.p}</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-foreground/80">
                  {c.t}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild variant="hero" className="rounded-full">
              <Link to="/plans">Choose a plan</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full">
              <Link to="/contacts">
                <Briefcase className="size-4" /> Explore business directory
              </Link>
            </Button>
          </div>
        </div>

        <div className="mt-6 flex items-start gap-2 rounded-2xl bg-muted px-4 py-3 text-xs text-foreground/80">
          <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-secondary" />
          Candidate names and contact numbers stay locked. Unlocks run through the existing
          subscription and allocation checks, and every reveal is written to the access log.
        </div>

        <AdminManagedNote>
          Opportunity records, quotas and weekly claim attempts are enforced by the backend for every
          request.
        </AdminManagedNote>
      </div>

      <Sheet open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <SheetContent className="w-full overflow-y-auto border-primary/15 bg-cream/95 backdrop-blur-xl sm:max-w-lg">
          {active ? (
            <>
              <SheetHeader>
                <SheetTitle className="text-xl text-primary">{active.title}</SheetTitle>
                <p className="text-xs font-semibold uppercase tracking-wider text-secondary">
                  {active.category} · {active.opportunity_type}
                </p>
              </SheetHeader>
              <div className="space-y-5 px-4 pb-8">
                <DetailBlock label="Location" delay={60}>
                  {active.location}
                </DetailBlock>
                <DetailBlock label="About This Opportunity" delay={120}>
                  {active.description}
                </DetailBlock>
                <DetailBlock label="Status" delay={180}>
                  {active.status} {active.premium_only ? "· Premium members" : ""}
                </DetailBlock>
                {active.potential_value ? (
                  <DetailBlock label="Potential Value" delay={220}>
                    {active.potential_value}
                  </DetailBlock>
                ) : null}
                <DetailBlock label="Date Added" delay={260}>
                  {shortDate(active.created_at)}
                </DetailBlock>
                {active.business_id && businessById.get(active.business_id) ? (
                  <DetailBlock label="Linked Business" delay={300}>
                    {businessById.get(active.business_id)!.business_name} ·{" "}
                    {businessById.get(active.business_id)!.category}
                  </DetailBlock>
                ) : null}

                {revealedFor(active) ? (
                  <div className="reveal-soft rounded-2xl border border-secondary/30 bg-secondary/10 px-3 py-2.5">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground/80">
                      Contact
                    </p>
                    <a href={`tel:${revealedFor(active)}`} className="font-semibold text-primary">
                      {phoneDisplay(revealedFor(active)!)}
                    </a>
                  </div>
                ) : (
                  <LockedContact>
                    <p className="mt-1 text-[11px] text-foreground/80">
                      Use your subscription access to unlock this{" "}
                      {active.lead_id ? "candidate" : "contact"}.
                    </p>
                  </LockedContact>
                )}

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="hero"
                    className="rounded-full"
                    disabled={pending || !!revealedFor(active)}
                    onClick={() => unlockFor(active)}
                  >
                    <Unlock className="size-4" /> Unlock
                  </Button>
                  <Button asChild variant="outline" className="rounded-full">
                    <Link to="/plans">View plans</Link>
                  </Button>
                </div>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </PublicPage>
  );
}

function DetailBlock({
  label,
  children,
  delay = 0,
}: {
  label: string;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <div className="reveal-soft" style={{ animationDelay: `${delay}ms` }}>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground/80">
        {label}
      </p>
      <div className="mt-1 text-sm text-primary">{children}</div>
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  placeholder,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: string[];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-10 rounded-2xl border-primary/15 bg-white/70">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="max-h-72">
        <SelectItem value="all">{placeholder}</SelectItem>
        {options.map((o) => (
          <SelectItem key={o} value={o}>
            {o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function chipClass(activeChip: boolean) {
  return `snap-start whitespace-nowrap rounded-full border px-4 py-2 text-xs font-semibold transition ${
    activeChip
      ? "border-secondary/50 bg-primary text-cream shadow-soft"
      : "border-primary/15 bg-white/60 text-primary hover:border-secondary/40 hover:bg-white"
  }`;
}
