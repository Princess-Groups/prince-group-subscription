import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  Building2,
  Globe,
  Instagram,
  MapPin,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Unlock,
} from "lucide-react";
import { useMemo, useState } from "react";

import { GlassCard, LockedContact, StatTile, StatusPill } from "@/components/site/GlassBits";
import { AdminManagedNote, PageHero, PublicPage } from "@/components/site/PublicPage";
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
import { useBusinesses, useUnlockBusinessContact, type Business } from "@/hooks/useDirectory";
import { phoneDisplay, shortDate } from "@/lib/format";
import directoryHomeBg from "@/assets/directory-home-bg.png.asset.json";

const title = "Kanyakumari Business Directory | PRINCE GROUP";
const description =
  "Explore a premium business intelligence directory of Kanyakumari businesses by category, area and service. Contact numbers unlock with your subscription.";

export const Route = createFileRoute("/contacts")({
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
  component: DirectoryPage,
});

const QUICK_CHIPS = [
  "Furniture & Interior",
  "Restaurants & Cafés",
  "Hotels & Resorts",
  "Education & Academies",
  "Hospitals & Healthcare",
  "Digital Marketing & Advertising",
  "Finance & Loans",
  "Real Estate",
  "Event Management",
  "Beauty & Salon",
  "Jewellery",
  "Automobile",
];

type Sort = "az" | "recent" | "popular" | "category";
type Flag = "all" | "popular" | "recent" | "premium";

function DirectoryPage() {
  const { data, isLoading } = useBusinesses();
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("all");
  const [location, setLocation] = useState("all");
  const [type, setType] = useState("all");
  const [service, setService] = useState("all");
  const [flag, setFlag] = useState<Flag>("all");
  const [sort, setSort] = useState<Sort>("az");
  const [showFilters, setShowFilters] = useState(false);
  const [active, setActive] = useState<Business | null>(null);
  const [revealed, setRevealed] = useState<Record<string, string>>({});

  const navigate = useNavigate();
  const unlock = useUnlockBusinessContact(
    (id, phone) => setRevealed((r) => ({ ...r, [id]: phone })),
    () =>
      navigate({
        to: "/payment",
        search: { item: "Business Contact Unlock", amount: 10 },
      }),
  );

  const businesses = useMemo(() => data ?? [], [data]);

  const options = useMemo(() => {
    const cats = new Set<string>();
    const locs = new Set<string>();
    const types = new Set<string>();
    const servs = new Set<string>();
    for (const b of businesses) {
      cats.add(b.category);
      if (b.location) locs.add(b.location);
      if (b.business_type) types.add(b.business_type);
      for (const s of b.services ?? []) servs.add(s);
    }
    const sorted = (s: Set<string>) => [...s].sort((a, b) => a.localeCompare(b));
    return {
      categories: sorted(cats),
      locations: sorted(locs),
      types: sorted(types),
      services: sorted(servs),
    };
  }, [businesses]);

  const recentCutoff = Date.now() - 30 * 86400000;

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    let rows = businesses.filter((b) => {
      if (category !== "all" && b.category !== category) return false;
      if (location !== "all" && b.location !== location) return false;
      if (type !== "all" && b.business_type !== type) return false;
      if (service !== "all" && !(b.services ?? []).includes(service)) return false;
      if (flag === "popular" && !b.is_popular) return false;
      if (flag === "premium" && !b.is_premium) return false;
      if (flag === "recent" && new Date(b.created_at).getTime() < recentCutoff) return false;
      if (!term) return true;
      return [b.business_name, b.category, b.location, b.business_type, ...(b.services ?? [])]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term));
    });
    rows = [...rows].sort((a, b) => {
      if (sort === "recent")
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sort === "popular") return Number(b.is_popular) - Number(a.is_popular);
      if (sort === "category")
        return a.category.localeCompare(b.category) || a.business_name.localeCompare(b.business_name);
      return a.business_name.localeCompare(b.business_name);
    });
    return rows;
  }, [businesses, q, category, location, type, service, flag, sort, recentCutoff]);

  const related = useMemo(
    () =>
      active
        ? businesses.filter((b) => b.id !== active.id && b.category === active.category).slice(0, 4)
        : [],
    [active, businesses],
  );

  return (
    <PublicPage>
      <PageHero
        eyebrow="Business Intelligence"
        title="Kanyakumari Business Directory"
        highlight="Explore Businesses"
        subtitle="Discover verified businesses across the district by category, area and service. Business details are open — contact numbers stay locked until you unlock them with your subscription."
        bgImageCss={directoryHomeBg.url}
        cleanBackground
      />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile value={`${businesses.length}`} label="Listed Businesses" index={0} />
          <StatTile value={`${options.categories.length}`} label="Categories" index={1} />
          <StatTile value={`${options.locations.length}`} label="Areas Covered" index={2} />
          <StatTile
            value={`${businesses.filter((b) => b.is_premium).length}`}
            label="Premium Businesses"
            index={3}
          />
        </div>

        {/* Search + sort */}
        <div className="liquid-glass mt-8 rounded-3xl p-4 sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-foreground/80" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search businesses, categories or locations..."
                className="h-11 rounded-2xl border-primary/15 bg-white/70 pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <Select value={sort} onValueChange={(v) => setSort(v as Sort)}>
                <SelectTrigger className="h-11 w-full rounded-2xl border-primary/15 bg-white/70 sm:w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="az">Sort: A–Z</SelectItem>
                  <SelectItem value="recent">Sort: Recently Added</SelectItem>
                  <SelectItem value="popular">Sort: Popular</SelectItem>
                  <SelectItem value="category">Sort: Category</SelectItem>
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

          <div className={`${showFilters ? "grid" : "hidden"} mt-3 gap-3 sm:grid-cols-2 lg:grid lg:grid-cols-5`}>
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
              placeholder="All business types"
              options={options.types}
            />
            <FilterSelect
              value={service}
              onChange={setService}
              placeholder="All services"
              options={options.services}
            />
            <Select value={flag} onValueChange={(v) => setFlag(v as Flag)}>
              <SelectTrigger className="h-10 rounded-2xl border-primary/15 bg-white/70">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Everything</SelectItem>
                <SelectItem value="popular">Popular businesses</SelectItem>
                <SelectItem value="recent">Recently added</SelectItem>
                <SelectItem value="premium">Premium businesses</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Category chips */}
        <div className="-mx-4 mt-6 flex snap-x gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
          <button
            type="button"
            onClick={() => setCategory("all")}
            className={chipClass(category === "all")}
          >
            All
          </button>
          {QUICK_CHIPS.filter((c) => options.categories.includes(c) || businesses.length === 0).map(
            (c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={chipClass(category === c)}
              >
                {c.split(" & ")[0]}
              </button>
            ),
          )}
        </div>

        <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-foreground/80">
          {filtered.length} businesses
        </p>

        {isLoading ? (
          <div className="mt-4 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-72 rounded-3xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="liquid-glass mt-4 rounded-3xl p-12 text-center">
            <h2 className="text-lg font-semibold text-primary">No businesses match your search</h2>
            <p className="mt-2 text-sm text-foreground/80">
              Try a different category, area or search term.
            </p>
          </div>
        ) : (
          <div className="mt-4 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filtered.slice(0, 120).map((b, i) => (
              <GlassCard key={b.id} index={i} className="flex flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-primary">{b.business_name}</h3>
                    <p className="text-xs font-semibold uppercase tracking-wider text-secondary">
                      {b.category}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    {b.is_premium ? <StatusPill label="PREMIUM" /> : null}
                    {b.is_popular ? <StatusPill label="HOT" /> : null}
                  </div>
                </div>

                <p className="mt-3 flex items-center gap-1.5 text-sm text-foreground/80">
                  <MapPin className="size-3.5 text-secondary" />
                  {b.location ?? "Kanyakumari"} / {b.district ?? "Kanyakumari"}
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-foreground/80">
                  <Building2 className="size-3.5 text-secondary" />
                  {b.business_type ?? "Local Business"}
                </p>

                <p className="mt-3 line-clamp-2 text-sm text-foreground/80">{b.description}</p>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {(b.services ?? []).slice(0, 3).map((s) => (
                    <Badge key={s} variant="secondary" className="rounded-full text-[10px]">
                      {s}
                    </Badge>
                  ))}
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-foreground/80">
                  <span className="inline-flex items-center gap-1">
                    <Globe className="size-3.5 text-secondary" />
                    {b.website ? "Website available" : "No website"}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Instagram className="size-3.5 text-secondary" />
                    {b.social_links && Object.keys(b.social_links).length > 0
                      ? "Social media active"
                      : "No social profile"}
                  </span>
                  <StatusPill label={b.status === "available" ? "AVAILABLE" : b.status} />
                </div>

                {revealed[b.id] ? (
                  <div className="mt-4 rounded-2xl border border-secondary/30 bg-secondary/10 px-3 py-2.5">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground/80">
                      Contact Number
                    </p>
                    <a
                      href={`tel:${revealed[b.id]}`}
                      className="font-semibold text-primary"
                    >
                      {phoneDisplay(revealed[b.id]!)}
                    </a>
                  </div>
                ) : (
                  <LockedContact>
                    <p className="mt-1 text-[11px] text-foreground/80">
                      Use your subscription access to unlock this contact.
                    </p>
                  </LockedContact>
                )}

                <div className="mt-4 flex flex-wrap gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="hero"
                    className="rounded-full"
                    disabled={unlock.isPending || !!revealed[b.id]}
                    onClick={() => unlock.mutate(b.id)}
                  >
                    <Unlock className="size-3.5" /> Unlock Contact
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full"
                    onClick={() => setActive(b)}
                  >
                    View Details
                  </Button>
                </div>
              </GlassCard>
            ))}
          </div>
        )}

        <div className="liquid-glass mt-12 rounded-3xl p-8 text-center">
          <Sparkles className="mx-auto size-6 text-secondary" />
          <h2 className="mt-3 text-2xl font-bold text-primary">
            One Subscription. Multiple Business Opportunities.
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-foreground/80">
            Explore Kanyakumari businesses, discover B2B opportunities and unlock valuable business
            connections through one powerful platform.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild variant="hero" className="rounded-full">
              <Link to="/payment">View subscription plans</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full">
              <Link to="/opportunities">
                Explore opportunities <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>

        <div className="mt-6 flex items-start gap-2 rounded-2xl bg-muted px-4 py-3 text-xs text-foreground/80">
          <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-secondary" />
          Only publicly available business information is listed. Contact numbers are served by the
          backend after subscription checks and every unlock is written to the access log.
        </div>

        <AdminManagedNote>
          Directory records are imported and moderated by administrators; sample records stay
          labelled until verified data is uploaded.
        </AdminManagedNote>
      </div>

      <Sheet open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <SheetContent className="w-full overflow-y-auto border-primary/15 bg-cream/95 backdrop-blur-xl sm:max-w-lg">
          {active ? (
            <>
              <SheetHeader>
                <SheetTitle className="text-xl text-primary">{active.business_name}</SheetTitle>
                <p className="text-xs font-semibold uppercase tracking-wider text-secondary">
                  {active.category}
                </p>
              </SheetHeader>
              <div className="space-y-5 px-4 pb-8">
                <div className="reveal-soft flex flex-wrap gap-2">
                  {active.is_premium ? <StatusPill label="PREMIUM" /> : null}
                  {active.is_popular ? <StatusPill label="HOT" /> : null}
                  <StatusPill label="LOCKED" />
                </div>

                <DetailBlock label="Location" delay={60}>
                  {active.location ?? "Kanyakumari"} / {active.district ?? "Kanyakumari"}
                </DetailBlock>
                <DetailBlock label="Business Type" delay={120}>
                  {active.business_type ?? "Local Business"}
                </DetailBlock>
                <DetailBlock label="About Business" delay={180}>
                  {active.description}
                </DetailBlock>
                <DetailBlock label="Services" delay={240}>
                  <span className="flex flex-wrap gap-1.5">
                    {(active.services ?? []).map((s) => (
                      <Badge key={s} variant="secondary" className="rounded-full text-[10px]">
                        {s}
                      </Badge>
                    ))}
                  </span>
                </DetailBlock>
                <DetailBlock label="Online Presence" delay={300}>
                  {active.website ? "Website available" : "No website"} ·{" "}
                  {active.social_links && Object.keys(active.social_links).length > 0
                    ? "Social media active"
                    : "No social profile"}
                </DetailBlock>
                <DetailBlock label="Listed On" delay={340}>
                  {shortDate(active.created_at)}
                </DetailBlock>

                {revealed[active.id] ? (
                  <div className="reveal-soft rounded-2xl border border-secondary/30 bg-secondary/10 px-3 py-2.5">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground/80">
                      Contact Number
                    </p>
                    <a href={`tel:${revealed[active.id]}`} className="font-semibold text-primary">
                      {phoneDisplay(revealed[active.id]!)}
                    </a>
                  </div>
                ) : (
                  <LockedContact>
                    <p className="mt-1 text-[11px] text-foreground/80">
                      Use your subscription access to unlock this contact.
                    </p>
                  </LockedContact>
                )}

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="hero"
                    className="rounded-full"
                    disabled={unlock.isPending || !!revealed[active.id]}
                    onClick={() => unlock.mutate(active.id)}
                  >
                    <Unlock className="size-4" /> Unlock Contact
                  </Button>
                  <Button asChild variant="outline" className="rounded-full">
                    <Link to="/opportunities">Business opportunities</Link>
                  </Button>
                </div>

                {related.length > 0 ? (
                  <div className="reveal-soft" style={{ animationDelay: "400ms" }}>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground/80">
                      Similar businesses
                    </p>
                    <div className="mt-2 space-y-2">
                      {related.map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => setActive(r)}
                          className="liquid-glass w-full rounded-2xl px-3 py-2.5 text-left"
                        >
                          <p className="text-sm font-semibold text-primary">{r.business_name}</p>
                          <p className="text-xs text-foreground/80">
                            {r.business_type ?? r.category} · {r.location ?? "Kanyakumari"}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
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
