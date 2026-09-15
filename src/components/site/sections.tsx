import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Building2,
  Clock3,
  Database,
  Lock,
  MapPin,
  Navigation,
  Phone,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  Users,
  UserRound,
} from "lucide-react";

import bankExecutiveTeam from "@/assets/bank-executive-team.webp";
import arumanaiBranch from "@/assets/branches/branch-arumanai.webp.asset.json";
import karungalBranch from "@/assets/branches/branch-karungal.webp.asset.json";
import kollemcodeBranch from "@/assets/branches/branch-kollemcode.webp.asset.json";
import marthandamBranch from "@/assets/branches/branch-marthandam.webp.asset.json";
import munchiraiBranch from "@/assets/branches/branch-munchirai.webp.asset.json";
import nagercoilBranch from "@/assets/branches/branch-nagercoil.webp.asset.json";
import palliyadiBranch from "@/assets/branches/branch-palliyadi.webp.asset.json";
import palugalBranch from "@/assets/branches/branch-palugal.webp.asset.json";
import thiruvattarBranch from "@/assets/branches/branch-thiruvattar.webp.asset.json";
import verkilambiBranch from "@/assets/branches/branch-verkilambi.webp.asset.json";

import heroImage from "@/assets/prince-homepage-hero.png.asset.json";
import { CountUp } from "@/components/site/CountUp";
import { AdminManagedNote, DemoBadge, SectionHeading } from "@/components/site/PublicPage";
import { Button } from "@/components/ui/button";
import { phoneDisplay } from "@/lib/format";
import { settingString, useSettings } from "@/hooks/usePlatform";

export const BRANCH_TAGLINE = "20 Branches All Over Kanyakumari";

/* ---------------- Hero with live animated statistics ---------------- */

const HERO_STATS = [
  { to: 100000, suffix: "+", label: "Original Loan Candidate Profiles" },
  { to: 600000, suffix: "+", label: "Kanyakumari Business B2B Contacts" },
  { to: 1000, suffix: "+", label: "Daily Enquiries Handled" },
];

const STAT_ENTRIES = [
  [
    { name: "Vignesh", detail: "Home Loan" },
    { name: "Mahesh", detail: "Business Loan" },
    { name: "Karthik", detail: "Mortgage Loan" },
    { name: "Suresh", detail: "Personal Loan" },
  ],
  [
    { name: "GR Furniture", detail: "Furniture & Interior" },
    { name: "Kings Chicken", detail: "Restaurant" },
    { name: "APN Artistic", detail: "Printing & Design" },
    { name: "Sree Devi Textiles", detail: "Clothing & Fashion" },
    { name: "Kings Street Restaurant", detail: "Food & Dining" },
  ],
  [
    { name: "Rahul", detail: "Hi, I need a home loan...", meta: "10:24 AM" },
    { name: "Priya", detail: "Can you share business loan details?", meta: "11:17 AM" },
    { name: "Sundar", detail: "Looking for mortgage loan options.", meta: "01:03 PM" },
    { name: "Meena", detail: "Need personal loan, please help.", meta: "03:42 PM" },
  ],
] as const;

function LiveStatGraph({ index }: { index: number }) {
  return (
    <div className="stat-ecg" aria-hidden="true" style={{ animationDelay: `${index * -0.45}s` }}>
      <svg viewBox="0 0 360 48" preserveAspectRatio="none" className="size-full overflow-visible">
        <path className="stat-ecg-glow" d="M0 25 H82 L94 25 L104 8 L116 41 L128 18 L140 25 H220 L232 25 L242 8 L254 41 L266 18 L278 25 H360" />
        <path className="stat-ecg-line" d="M0 25 H82 L94 25 L104 8 L116 41 L128 18 L140 25 H220 L232 25 L242 8 L254 41 L266 18 L278 25 H360" />
      </svg>
    </div>
  );
}

function LiveStatEntry({ index }: { index: number }) {
  const entries = STAT_ENTRIES[index] ?? STAT_ENTRIES[0];
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(
      () => setActiveIndex((current) => (current + 1) % entries.length),
      2800,
    );
    return () => window.clearInterval(timer);
  }, [entries.length, index]);

  const entry = entries[activeIndex];
  if (!entry) return null;
  const Icon = index === 1 ? Building2 : UserRound;

  return (
    <div className="stat-live-window" aria-live="off">
      <div key={`${index}-${activeIndex}`} className="stat-live-entry">
        <span className="stat-entry-icon"><Icon className="size-5" /></span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-cream">{entry.name}</span>
          <span className="mt-0.5 block truncate text-xs text-cream/90">{entry.detail}</span>
        </span>
        {"meta" in entry ? <span className="shrink-0 text-[10px] text-cream/95">{entry.meta}</span> : null}
      </div>
      <div className="stat-entry-dots" aria-hidden="true">
        {entries.map((item, itemIndex) => (
          <span key={item.name} data-active={itemIndex === activeIndex} />
        ))}
      </div>
    </div>
  );
}

export function HeroSection() {
  return (
    <section className="relative isolate overflow-hidden bg-gradient-olive text-cream">
      <div
        role="img"
        aria-label="Glowing green Kanyakumari map with connected location pins representing the PRINCE branch network"
        className="absolute inset-0 -z-20 size-full bg-top bg-no-repeat [background-size:100%_auto]"
        style={{ backgroundImage: `url(${heroImage.url})` }}
      />
      
      <div className="grid-lines pointer-events-none absolute inset-0 -z-10 opacity-25" />


      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-28">
        <div className="reveal max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-cream/20 bg-primary px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-cream">
            <Sparkles className="size-3.5" /> Limited Premium Membership
          </span>
          <h1 className="mt-6 font-brand text-[1.25rem] font-bold leading-[1.05] tracking-[-0.02em] drop-shadow-[0_2px_18px_oklch(0.18_0.05_148/0.7)] whitespace-normal sm:text-[1.5rem] md:text-[2rem] lg:text-[2.625rem]">
            <span className="block text-cream">
              <span className="inline-flex flex-wrap items-center gap-2 sm:gap-3">
                ALL IN ONE
                <span
                  className="inline-flex h-[1.15em] w-[1.15em] flex-shrink-0 items-center justify-center rounded-full border-2 border-cream/90 bg-gradient-lime text-[0.55em] font-bold text-cream shadow-[0_0_18px_oklch(0.834_0.169_121.8/0.45)]"
                  aria-label="₹1"
                >
                  <span className="leading-none">₹1</span>
                </span>
                POWERFUL SUBSCRIPTION
              </span>
            </span>
            <span className="mt-3 block sm:mt-4">
              <Link
                to="/payment"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-lime px-4 py-2 text-[0.55em] font-bold uppercase tracking-[0.12em] text-cream shadow-lift drop-shadow-[0_1px_2px_oklch(0.2_0.04_148/0.85)] transition-transform duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-cream/50 sm:px-5 sm:py-2.5"
              >
                GO PREMIUM UNLOCK MORE →
              </Link>
            </span>
          </h1>
          <p className="mt-6 max-w-xl font-sans text-base font-medium leading-relaxed text-cream drop-shadow-[0_2px_12px_oklch(0.18_0.05_148/0.6)] sm:text-lg">
            Subscription get started with one rupee. Unlock loan candidate data for just ₹10. Go Premium for ₹100 — all in one powerful subscription.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button asChild size="lg" variant="lime" className="w-full sm:w-auto">
              <a href="#bank-executive-plans">Explore Bank Executive Plans →</a>
            </Button>
            <Button asChild size="lg" variant="onOlive" className="w-full sm:w-auto">
              <Link to="/payment">View Subscription Plans</Link>
            </Button>
          </div>
        </div>

        <div className="mt-14 grid gap-5 sm:mt-16 md:grid-cols-3 lg:gap-6">
          {HERO_STATS.map((s, index) => (
            <div key={s.label} className="stat-card">
              <p className="font-display text-4xl font-bold leading-none text-accent sm:text-5xl lg:text-[3.25rem]">
                <CountUp to={s.to} suffix={s.suffix} />
              </p>
              <p className="mt-4 min-h-10 text-sm font-medium uppercase leading-snug text-cream/90">
                {s.label}
              </p>
              <LiveStatGraph index={index} />
              <LiveStatEntry index={index} />
              <span className="stat-progress-track">
                <span className="stat-progress-fill" />
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Live plan slot availability ---------------- */

const SLOT_PLANS = [
  {
    name: "₹10 Plan",
    note: "Valid for 1 Day",
    slots: 500,
    price: "₹10",
    per: "per day",
    badge: "Available now",
    emphasis: false,
  },
  {
    name: "₹100 Plan",
    note: "Monthly access",
    slots: 400,
    price: "₹100",
    per: "per month",
    badge: "Available now",
    emphasis: false,
  },
  {
    name: "₹100 Yearly Plan",
    note: "Best value — yearly access",
    slots: 100,
    price: "₹100",
    per: "per year",
    badge: "Only a few left",
    emphasis: true,
  },
];

export function SlotAvailabilitySection() {
  return (
    <section className="relative overflow-hidden bg-gradient-cream py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Live Availability"
          title="Subscription Slots"
          highlight="Filling Fast"
          subtitle="Slot availability is counted live and closes as soon as the limit is reached."
        />

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {SLOT_PLANS.map((p, index) => (
            <div
              key={p.name}
              className={`relative overflow-hidden rounded-[2rem] border p-7 shadow-soft transition-shadow duration-500 ${
                p.emphasis
                  ? "border-secondary/40 bg-gradient-olive text-cream shadow-lift"
                  : "border-primary/10 bg-card"
              }`}
            >
              {p.emphasis ? (
                <div className="hero-orb -right-10 -top-10 size-48 bg-accent/25" />
              ) : null}

              <span
                className={`relative inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] ${
                  p.emphasis
                    ? "bg-accent/15 text-accent"
                    : "bg-secondary/10 text-secondary"
                }`}
              >
                <span
                  className={`size-2 rounded-full ${p.emphasis ? "bg-accent" : "bg-secondary"}`}
                />
                {p.badge}
              </span>

              <h3
                className={`relative mt-4 font-display text-2xl font-bold ${
                  p.emphasis ? "text-cream" : "text-primary"
                }`}
              >
                {p.name}
              </h3>
              <p
                className={`relative mt-1 text-sm ${
                  p.emphasis ? "text-cream/90" : "text-foreground/80"
                }`}
              >
                {p.note}
              </p>

              <div className="relative mt-7 flex items-center justify-between gap-4">
                <div className="relative grid size-[9.5rem] shrink-0 place-items-center sm:size-40">
                  <span
                    aria-hidden
                    className={`slot-ring absolute inset-0 ${p.emphasis ? "slot-ring-neon" : ""}`}
                  />
                  <span
                    aria-hidden
                    className={`absolute inset-[10px] rounded-full ${
                      p.emphasis ? "bg-primary/70" : "bg-card"
                    }`}
                  />
                  <span className="relative text-center">
                    <span
                      className={`block font-display text-4xl font-bold leading-none sm:text-[2.75rem] ${
                        p.emphasis ? "text-cream" : "text-primary"
                      }`}
                    >
                      <CountUp to={p.slots} />
                    </span>
                    <span
                      className={`mt-1 block text-[10px] font-semibold uppercase tracking-[0.14em] ${
                        p.emphasis ? "text-cream/95" : "text-foreground/80"
                      }`}
                    >
                      Slots available
                    </span>
                  </span>
                </div>

                <div
                  className={`border-l pl-4 text-right ${
                    p.emphasis ? "border-cream/20" : "border-primary/10"
                  }`}
                >
                  <p
                    className={`font-display text-3xl font-bold ${
                      p.emphasis ? "text-cream" : "text-primary"
                    }`}
                  >
                    {p.price}
                  </p>
                  <p
                    className={`text-xs ${p.emphasis ? "text-cream/90" : "text-foreground/80"}`}
                  >
                    {p.per}
                  </p>
                </div>
              </div>

              <Button
                asChild
                variant={p.emphasis ? "lime" : "outline"}
                className="relative mt-7 w-full"
              >
                <Link
                  to="/payment"
                  search={{
                    item: `${p.name} Subscription`,
                    amount: [10, 100, 100][index],
                  }}
                >
                  Claim your slot
                </Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


/* ---------------- Loan candidate data — profile previews ---------------- */

const CANDIDATES = [
  { name: "Arun Kumar", location: "Nagercoil", initials: "AK" },
  { name: "Priya S", location: "Monday Market", initials: "PS" },
  { name: "Vignesh R", location: "Thuckalay", initials: "VR" },
  { name: "Divya Lakshmi", location: "Marthandam", initials: "DL" },
  { name: "Suresh Babu", location: "Kanyakumari", initials: "SB" },
];

export function LoanCandidateDataSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-olive py-20 text-cream sm:py-24">
      <div className="grid-lines pointer-events-none absolute inset-0 opacity-40" />
      <div className="hero-orb -right-32 top-0 size-[26rem] bg-accent/20" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <span className="pill-badge">
            <Database className="size-3.5" /> Loan Candidate Data
          </span>
          <h2 className="mt-5 text-3xl font-bold leading-[1.1] sm:text-4xl lg:text-5xl">
            Unlock and Explore
            <span className="block text-gradient-olive">Loan Candidate Data.</span>
          </h2>
          <p className="mt-5 text-sm leading-relaxed text-cream/90 sm:text-base">
            Prince Group provides access to original loan candidate profiles and business data for
            banking professionals. We are a data platform — we do not provide loans.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {CANDIDATES.map((c, i) => (
            <div
              key={c.name}
              className="glass-dark hover-glow group relative overflow-hidden rounded-3xl p-6"
              style={{ animationDelay: `${i * 0.15}s` }}
            >
              <div className="flex items-center gap-3">
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-accent/15 font-display text-base font-bold text-accent">
                  {c.initials}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-cream">{c.name}</p>
                  <p className="truncate text-xs text-cream/90">{c.location}</p>
                </div>
              </div>

              <p className="mt-5 text-[11px] font-semibold uppercase tracking-wider text-accent">
                Profile: Loan Candidate
              </p>

              <div className="mt-3 space-y-2 text-xs text-cream/90">
                <div className="flex justify-between">
                  <span>Contact</span>
                  <span className="select-none blur-[4px]">+91 98765 43210</span>
                </div>
                <div className="flex justify-between">
                  <span>Requirement</span>
                  <span className="select-none blur-[4px]">₹ 4,50,000</span>
                </div>
                <div className="flex justify-between">
                  <span>Profile status</span>
                  <span className="select-none blur-[4px]">Verified — Active</span>
                </div>
              </div>

              <Link
                to="/payment"
                search={{ item: "Loan Candidate Profile Unlock", amount: 10 }}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full border border-accent/40 px-4 py-2 text-xs font-semibold text-accent transition-all group-hover:-translate-y-0.5 group-hover:bg-accent group-hover:text-accent-foreground"
              >
                <Lock className="size-3.5" /> Unlock Profile
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center gap-3 text-center">
          <Button asChild size="lg" variant="lime" className="floaty hover-scale w-full sm:w-auto">
            <Link to="/loan-services">
              EXPLORE ALL DATA <span aria-hidden>→</span>
            </Link>
          </Button>
          <p className="text-xs text-cream/95">
            Profiles shown are sample previews. Full details unlock with an active subscription.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Animated service showcase ---------------- */

const SERVICES = [
  "Documentation Services",
  "Marriage Registration",
  "Registration Services",
  "Digital Marketing",
  "Event Services",
  "Graphic Designing",
  "App Development",
  "Software Development",
  "Video Editing",
  "Land Survey",
  "Billing Software",
  "Social Media Marketing",
];

function ServiceTicker({ reverse = false }: { reverse?: boolean }) {
  const items = [...SERVICES, ...SERVICES];
  return (
    <div className="marquee">
      <div className={reverse ? "marquee-track marquee-reverse" : "marquee-track"}>
        {items.map((s, i) => (
          <span
            key={`${s}-${i}`}
            className="mx-3 inline-flex shrink-0 items-center gap-2 rounded-full border border-primary/12 bg-card px-6 py-3 text-sm font-semibold text-primary shadow-soft"
          >
            <Star className="size-3.5 shrink-0 text-secondary" />
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}

export function ServiceShowcaseSection() {
  return (
    <section className="overflow-hidden bg-gradient-cream py-20">
      <div className="mx-auto max-w-7xl px-4 text-center sm:px-6">
        <span className="text-xs font-bold uppercase tracking-[0.25em] text-secondary">Benefits</span>
        <h2 className="mx-auto mt-3 max-w-3xl text-3xl font-bold text-primary sm:text-4xl">
          You Can Get Exclusive Offers
          <span className="block text-gradient-olive">Across All Our Services</span>
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-sm text-foreground/80">
          Member pricing is applied automatically from your active plan across every Prince Group
          service.
        </p>
      </div>

      <div className="mt-12 space-y-4">
        <ServiceTicker />
        <ServiceTicker reverse />
      </div>

      <div className="mt-12 text-center">
        <Button asChild size="lg" variant="lime">
          <Link to="/services">View member pricing →</Link>
        </Button>
      </div>
    </section>
  );
}

/* ---------------- Branch network — Kanyakumari ---------------- */

export const BRANCHES = [
  "Monday Market (Head Office)",
  "Kollemcode",
  "Palugal",
  "Arumanai",
  "Marthandam",
  "Thiruvattar",
  "Verkilambi",
  "Munchirai",
  "Karungal",
  "Palliyadi",
  "Thuckalay",
  "Eraniel",
  "Manavalakurichi",
  "Rajakkamangalam",
  "Nagercoil",
  "Edalakudi",
  "Kottaram",
  "Thovalai",
  "Boothapandi",
];

const BRANCH_PHOTOS: Record<string, string> = {
  "Monday Market (Head Office)": nagercoilBranch.url,
  Kollemcode: kollemcodeBranch.url,
  Palugal: palugalBranch.url,
  Arumanai: arumanaiBranch.url,
  Marthandam: marthandamBranch.url,
  Thiruvattar: thiruvattarBranch.url,
  Verkilambi: verkilambiBranch.url,
  Munchirai: munchiraiBranch.url,
  Karungal: karungalBranch.url,
  Palliyadi: palliyadiBranch.url,
  Nagercoil: nagercoilBranch.url,
};

const REFERENCE_BRANCH_PHOTOS = [
  nagercoilBranch.url,
  kollemcodeBranch.url,
  palugalBranch.url,
  arumanaiBranch.url,
  marthandamBranch.url,
  thiruvattarBranch.url,
  verkilambiBranch.url,
  munchiraiBranch.url,
  karungalBranch.url,
  palliyadiBranch.url,
];

const HOMEPAGE_BRANCHES = BRANCHES.map((name, index) => ({
  name,
  address: `${name.replace(" (Head Office)", "")}, Kanyakumari District`,
  image: BRANCH_PHOTOS[name] ?? REFERENCE_BRANCH_PHOTOS[index % REFERENCE_BRANCH_PHOTOS.length],
}));

export function BranchesSection({ full = false }: { full?: boolean }) {
  const list = full ? BRANCHES : BRANCHES.slice(0, 10);
  const { data: settings } = useSettings();
  const phone = settingString(settings, "support_phone", "9559155535");

  if (!full) {
    return (
      <section className="relative overflow-hidden bg-cream-soft py-20 sm:py-24">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-secondary/35 to-transparent" />
        <div className="relative mx-auto max-w-[90rem] px-4 sm:px-6">
          <header className="mx-auto max-w-2xl text-center">
            <span className="mx-auto grid size-12 place-items-center rounded-full bg-accent/15 text-secondary shadow-soft">
              <MapPin className="size-6" aria-hidden />
            </span>
            <div className="mt-5 flex items-center justify-center gap-4 sm:gap-7">
              <span className="h-px w-12 bg-secondary/55 sm:w-20" aria-hidden />
              <h2 className="text-3xl font-bold text-primary sm:text-4xl">Our Branches</h2>
              <span className="h-px w-12 bg-secondary/55 sm:w-20" aria-hidden />
            </div>
            <p className="mt-3 text-sm text-foreground/80 sm:text-base">
              Serving you across Kanyakumari District
            </p>
          </header>

          <div className="mt-10 grid items-stretch gap-5 sm:grid-cols-2 xl:grid-cols-5">
            {HOMEPAGE_BRANCHES.map((branch) => (
              <article
                key={branch.name}
                className="group flex min-h-[25rem] flex-col overflow-hidden rounded-2xl border border-primary/10 bg-primary text-cream shadow-soft transition-[transform,box-shadow] duration-500 ease-out motion-safe:hover:-translate-y-1.5 motion-safe:hover:shadow-lift"
              >
                <div className="relative aspect-[1.52/1] shrink-0 overflow-hidden">
                  <img
                    src={branch.image}
                    alt={`${branch.name.replace(" (Head Office)", "")} branch location in Kanyakumari District`}
                    loading="lazy"
                    className="absolute inset-0 size-full object-cover transition-transform duration-700 ease-out motion-safe:group-hover:scale-[1.035]"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-primary" />
                  <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full border border-cream/20 bg-primary/85 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-cream shadow-soft backdrop-blur-md">
                    <Building2 className="size-3" aria-hidden /> Branch Office
                  </span>
                </div>

                <div className="-mt-10 flex flex-1 flex-col bg-gradient-to-b from-transparent via-primary/95 to-olive-dark px-5 pb-5 pt-3">
                  <div className="relative min-h-[5.5rem]">
                    <h3 className="text-xl font-bold text-cream">{branch.name}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-cream/95">
                      Documentation · Registration · Business services
                    </p>
                  </div>
                  <div className="mt-auto grid gap-3 rounded-xl border border-cream/10 bg-olive-dark/65 p-4">
                    <div className="grid grid-cols-[1.1rem_minmax(0,1fr)] items-start gap-2.5">
                      <MapPin className="mt-0.5 size-4 text-accent" aria-hidden />
                      <p className="text-xs leading-relaxed text-cream/95">{branch.address}</p>
                    </div>
                    <a
                      href={`tel:${phone}`}
                      className="grid grid-cols-[1.1rem_minmax(0,1fr)] items-center gap-2.5 text-xs font-semibold text-cream transition-colors hover:text-accent"
                    >
                      <Phone className="size-4 text-accent" aria-hidden />
                      <span>+91 {phoneDisplay(phone)}</span>
                    </a>
                    <div className="grid grid-cols-[1.1rem_minmax(0,1fr)] items-center gap-2.5">
                      <Clock3 className="size-4 text-accent" aria-hidden />
                      <p className="text-xs text-cream/95">Mon – Sat · 9:00 AM – 7:00 PM</p>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Button asChild variant="lime" size="lg" className="w-full sm:w-auto">
              <Link to="/branches">
                <Navigation className="size-4" /> View all 20 branches
              </Link>
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden bg-gradient-olive py-20">

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          tone="light"
          eyebrow="Branch Network"
          title="20 Branches"
          highlight="All Over Kanyakumari"
          subtitle="Local teams across Kanyakumari District for documentation, registration, business and data services — with admin-verified coverage in every town."
        />

        <div className="mt-12">
          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-olive p-8 text-cream shadow-lift">
            <div className="hero-orb -right-16 -top-16 size-64 bg-accent/25" />
            <div className="relative grid gap-4 sm:grid-cols-3">
              {[
                { value: "20", label: "Branches" },
                { value: "Kanyakumari", label: "District coverage" },
                { value: "Local", label: "On-ground teams" },
              ].map((s) => (
                <div key={s.label} className="glass-dark rounded-2xl px-4 py-5 text-center">
                  <p className="font-display text-2xl font-bold text-accent sm:text-3xl">{s.value}</p>
                  <p className="mt-1 text-[11px] uppercase tracking-wider text-cream/90">{s.label}</p>
                </div>
              ))}
            </div>
            <p className="relative mt-6 text-sm text-cream/90">
              Branch discovery, coverage and contact routing are administered centrally so members
              always reach the right local team.
            </p>
            <Button asChild variant="lime" className="relative mt-6 w-full sm:w-auto">
              <Link to="/branches">
                <Navigation className="size-4" /> Find a branch
              </Link>
            </Button>
          </div>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {list.map((town, i) => (
            <div
              key={town}
              className={`glass-branch group rounded-3xl p-6 ${i === 0 ? "ring-1 ring-accent/25" : ""}`}
            >
              <span className="grid size-11 place-items-center rounded-2xl bg-gradient-olive text-accent transition-transform group-hover:scale-105">
                {i === 0 ? <Star className="size-5" /> : <MapPin className="size-5" />}
              </span>
              <h3 className="mt-5 text-lg font-semibold text-cream">{town}</h3>
              <p className="mt-1 text-sm text-cream/90">
                Documentation · Registration · Business services
              </p>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-accent">
                Branch open
              </p>
            </div>
          ))}
        </div>

        <div className="mt-3 rounded-2xl bg-olive-dark/60 px-4 py-3 text-cream/90">
          <AdminManagedNote>
            Branch towns, addresses and contact routing are configurable from Admin Settings; the list
            above is the current published coverage across Kanyakumari District.
          </AdminManagedNote>
        </div>
      </div>
    </section>
  );
}

export function BankExecutiveSection() {
  const features = [
    { icon: ShieldCheck, title: "Secure Login", body: "Unique executive ID and password with role-based access control." },
    { icon: BadgeCheck, title: "Admin Approval", body: "Accounts stay pending until an administrator approves them." },
    { icon: Users, title: "Candidate Data", body: "Allocated candidate profiles with status, requirement and assignment date." },
    { icon: Lock, title: "Protected Contacts", body: "Contact numbers are revealed only for allocated profiles, and every view is logged." },
  ];

  return (
    <section id="bank-executive-plans" className="mx-auto max-w-7xl scroll-mt-28 px-4 py-20 sm:px-6">
      <div className="relative isolate overflow-hidden rounded-[2rem] border border-primary/10 bg-gradient-olive text-cream shadow-lift">
        <div className="grid-lines pointer-events-none absolute inset-0 -z-10 opacity-25" />
        <div
          aria-hidden="true"
          className="bank-portal-visual pointer-events-none absolute inset-x-0 top-[25rem] -z-10 h-[31rem] bg-cover bg-center opacity-80 sm:top-[20rem] lg:inset-y-0 lg:left-[26%] lg:right-[27%] lg:h-auto lg:bg-center"
          style={{ backgroundImage: `url(${bankExecutiveTeam})` }}
        />
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(180deg,oklch(0.245_0.045_148/0.92)_0%,transparent_48%,oklch(0.245_0.045_148/0.9)_100%)] lg:bg-[linear-gradient(90deg,oklch(0.245_0.045_148)_0%,oklch(0.245_0.045_148/0.78)_29%,transparent_52%,oklch(0.94_0.03_115/0.95)_76%,oklch(0.97_0.02_105)_100%)]" />

        <div className="relative grid min-h-[39rem] gap-10 p-7 sm:p-10 lg:grid-cols-[0.92fr_0.72fr_1.12fr] lg:items-center lg:p-12">
          <div className="fade-up z-10 max-w-xl lg:self-center">
            <span className="pill-badge">
              <Building2 className="size-3.5" /> Bank Executive Plans
            </span>
            <h2 className="mt-5 text-3xl font-bold leading-[1.1] sm:text-4xl lg:text-[2.65rem]">
              A dedicated portal for
              <span className="block text-gradient-olive">bank &amp; finance executives</span>
            </h2>
            <p className="mt-5 text-sm leading-relaxed text-cream/95">
              Bank Executives subscribe on the Business plan or the Premium plan only. The Starter
              plan is not offered inside the Bank Executive portal. Every account requires a unique
              user ID, password and administrator approval before access is granted.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
              <Button asChild variant="lime" className="w-full sm:w-auto">
                <Link to="/bank-executive">Bank Executive Login <ArrowRight className="size-4" /></Link>
              </Button>
              <Button asChild variant="onOlive" className="w-full sm:w-auto">
                <Link to="/auth">Request an Account <ArrowRight className="size-4" /></Link>
              </Button>
            </div>
          </div>

          <div aria-hidden="true" className="h-[17rem] sm:h-[22rem] lg:h-auto" />

          <div className="grid gap-4 sm:grid-cols-2 lg:self-stretch lg:content-center">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="card-lift fade-up group relative min-h-44 rounded-3xl border border-card/65 bg-card/88 p-5 text-card-foreground shadow-soft backdrop-blur-xl sm:p-6"
                style={{ animationDelay: `${index * 90}ms` }}
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="grid size-12 place-items-center rounded-full bg-gradient-olive text-accent shadow-soft">
                    <feature.icon className="size-5" />
                  </span>
                  <span className="grid size-8 place-items-center rounded-full bg-accent/15 text-primary transition-transform duration-300 group-hover:translate-x-1">
                    <ArrowRight className="size-3.5" />
                  </span>
                </div>
                <h3 className="mt-5 text-base font-semibold text-primary">{feature.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-foreground/80">{feature.body}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative border-t border-cream/10 px-7 py-4 sm:px-10 lg:px-12">
          <p className="text-xs text-cream/90">
            <DemoBadge className="mr-2" />
            Executive dashboards currently show synthetic records. Administrators replace them with
            imported data before go-live.
          </p>
        </div>
      </div>
    </section>
  );
}

export function TrustSection() {
  const cards = [
    { icon: TrendingUp, title: "Exclusive Discounts", body: "10% to flat 50% member pricing across eligible services, applied automatically from your plan." },
    { icon: ShieldCheck, title: "Verified, Admin-Controlled Opportunities", body: "Every opportunity is reviewed and published by administrators before members see it." },
    { icon: Lock, title: "Limited Membership", body: "500 Business slots and 100 Premium slots. Availability is counted live." },
    { icon: Building2, title: "Premium Business Access", body: "Business directory, B2B opportunities and loan candidate data in one place." },
    { icon: BarChart3, title: "Powerful Data Management", body: "Unique profile IDs, allocation history and duplicate prevention on every claim." },
    { icon: BadgeCheck, title: "Secure Subscription Payments", body: "Payments are confirmed only after gateway verification — never assumed successful." },
  ];

  return (
    <section className="bg-gradient-cream py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading eyebrow="Trust" title="Why Choose" highlight="PRINCE GROUP" />
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => (
            <div key={c.title} className="card-lift rounded-3xl border border-primary/10 bg-card p-6 shadow-soft">
              <span className="grid size-11 place-items-center rounded-2xl bg-muted text-secondary">
                <c.icon className="size-5" />
              </span>
              <h3 className="mt-5 text-lg font-semibold text-primary">{c.title}</h3>
              <p className="mt-2 text-sm text-foreground/80">{c.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ContactCtaSection() {
  const { data: settings } = useSettings();
  const phone = settingString(settings, "support_phone", "9559155535");

  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-olive p-10 text-center text-cream shadow-lift sm:p-16">
        <div className="grid-lines pointer-events-none absolute inset-0 opacity-40" />
        <div className="hero-orb -left-16 -top-16 size-72 bg-accent/20" />
        <h2 className="relative text-3xl font-bold sm:text-4xl">
          Need More <span className="text-gradient-olive">Access?</span>
        </h2>
        <p className="relative mx-auto mt-4 max-w-2xl text-sm text-cream/90 sm:text-base">
          Our premium plans are limited. Contact our team for additional availability and business
          access.
        </p>
        <div className="relative mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg" variant="lime" className="w-full sm:w-auto">
            <a href={`tel:${phone}`}>
              <Phone className="size-4" /> Call Now — {phoneDisplay(phone)}
            </a>
          </Button>
          <Button asChild size="lg" variant="onOlive" className="w-full sm:w-auto">
            <Link to="/contact">Contact Support</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
