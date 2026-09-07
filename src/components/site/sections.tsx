import { Link } from "@tanstack/react-router";
import {
  BadgeCheck,
  BarChart3,
  Building2,
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
} from "lucide-react";

import kanyakumariVisual from "@/assets/prince-kanyakumari.jpg";
import heroMap from "@/assets/prince-hero-map.png.asset.json";
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

export function HeroSection() {
  return (
    <section className="relative isolate overflow-hidden text-cream">
      <img
        src={heroMap.url}
        alt="Glowing green map with connected location pins representing the PRINCE branch network"
        className="absolute inset-0 -z-20 size-full object-cover"
      />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(100deg,oklch(0.18_0.05_148/0.94)_0%,oklch(0.2_0.06_146/0.86)_42%,oklch(0.22_0.06_144/0.42)_100%)]" />
      <div className="grid-lines pointer-events-none absolute inset-0 -z-10 opacity-25" />

      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-28">
        <div className="reveal max-w-2xl">
          <span className="pill-badge">
            <Sparkles className="size-3.5" /> Limited Premium Membership
          </span>
          <h1 className="mt-6 text-4xl font-bold leading-[1.06] drop-shadow-[0_2px_18px_oklch(0.18_0.05_148/0.7)] sm:text-5xl lg:text-6xl">
            One Subscription.
            <span className="block text-gradient-olive">All The Data You Need.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-cream/80 sm:text-lg">
            Unlock 1,00,000+ original loan candidate profiles, 6,00,000+ Kanyakumari business
            contacts and exclusive member pricing across every Prince Group service.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button asChild size="lg" variant="lime" className="w-full sm:w-auto">
              <a href="#bank-executive-plans">Explore Bank Executive Plans →</a>
            </Button>
            <Button asChild size="lg" variant="onOlive" className="w-full sm:w-auto">
              <Link to="/plans">View Subscription Plans</Link>
            </Button>
          </div>
        </div>

        <div className="mt-14 grid gap-4 sm:mt-16 md:grid-cols-3">
          {HERO_STATS.map((s) => (
            <div key={s.label} className="glass-dark hover-glow rounded-3xl px-6 py-7">
              <p className="font-display text-3xl font-bold text-accent sm:text-4xl">
                <CountUp to={s.to} suffix={s.suffix} />
              </p>
              <p className="mt-2 text-xs uppercase tracking-wider text-cream/70">{s.label}</p>
              <span className="mt-4 block h-1 overflow-hidden rounded-full bg-cream/12">
                <span className="block h-full w-2/3 rounded-full bg-gradient-lime" />
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
  { name: "₹10 Plan", note: "Valid for 1 Day", slots: 500, emphasis: false },
  { name: "₹100 Plan", note: "Monthly access", slots: 400, emphasis: false },
  { name: "₹100 Yearly Plan", note: "Best value — yearly access", slots: 100, emphasis: true },
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

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {SLOT_PLANS.map((p) => (
            <div
              key={p.name}
              className={`card-lift relative overflow-hidden rounded-3xl border p-7 shadow-soft ${
                p.emphasis
                  ? "border-secondary/40 bg-gradient-olive text-cream shadow-lift"
                  : "border-primary/10 bg-card"
              }`}
            >
              {p.emphasis ? <div className="hero-orb -right-10 -top-10 size-48 bg-accent/25" /> : null}
              <p
                className={`relative text-xs font-bold uppercase tracking-[0.2em] ${
                  p.emphasis ? "text-accent" : "text-secondary"
                }`}
              >
                {p.emphasis ? "Only a few left" : "Available now"}
              </p>
              <h3
                className={`relative mt-3 font-display text-2xl font-bold ${
                  p.emphasis ? "text-cream" : "text-primary"
                }`}
              >
                {p.name}
              </h3>
              <p className={`relative mt-1 text-sm ${p.emphasis ? "text-cream/70" : "text-muted-foreground"}`}>
                {p.note}
              </p>
              <p
                className={`relative mt-6 font-display font-bold ${
                  p.emphasis
                    ? "pulse text-5xl text-accent drop-shadow-[0_0_18px_oklch(0.85_0.19_125/0.45)]"
                    : "text-4xl text-primary"
                }`}
              >
                <CountUp to={p.slots} />
              </p>
              <p
                className={`relative mt-1 text-xs font-semibold uppercase tracking-wider ${
                  p.emphasis ? "text-cream/80" : "text-muted-foreground"
                }`}
              >
                {p.emphasis ? "Only 100 slots available" : "Slots available"}
              </p>
              <span
                className={`relative mt-5 block h-1.5 overflow-hidden rounded-full ${
                  p.emphasis ? "bg-cream/15" : "bg-muted"
                }`}
              >
                <span
                  className="block h-full rounded-full bg-gradient-lime transition-[width] duration-1000"
                  style={{ width: p.emphasis ? "18%" : p.slots === 500 ? "72%" : "55%" }}
                />
              </span>
              <Button
                asChild
                variant={p.emphasis ? "lime" : "outline"}
                className="relative mt-6 w-full"
              >
                <Link to="/plans">Claim your slot</Link>
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
          <p className="mt-5 text-sm leading-relaxed text-cream/70 sm:text-base">
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
                  <p className="truncate text-xs text-cream/60">{c.location}</p>
                </div>
              </div>

              <p className="mt-5 text-[11px] font-semibold uppercase tracking-wider text-accent">
                Profile: Loan Candidate
              </p>

              <div className="mt-3 space-y-2 text-xs text-cream/70">
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

              <button
                type="button"
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full border border-accent/40 px-4 py-2 text-xs font-semibold text-accent transition-all group-hover:-translate-y-0.5 group-hover:bg-accent group-hover:text-accent-foreground"
              >
                <Lock className="size-3.5" /> Unlock Profile
              </button>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center gap-3 text-center">
          <Button asChild size="lg" variant="lime" className="floaty hover-scale w-full sm:w-auto">
            <Link to="/loan-services">
              EXPLORE ALL DATA <span aria-hidden>→</span>
            </Link>
          </Button>
          <p className="text-xs text-cream/55">
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
        <p className="mx-auto mt-4 max-w-2xl text-sm text-muted-foreground">
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

export function BranchesSection({ full = false }: { full?: boolean }) {
  const list = full ? BRANCHES : BRANCHES.slice(0, 10);

  return (
    <section className="bg-gradient-cream py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <SectionHeading
            eyebrow="Branch Network"
            title="20 Branches"
            highlight="All Over Kanyakumari"
            subtitle="Local teams across Kanyakumari District for documentation, registration, business and data services — with admin-verified coverage in every town."
          />
          <div className="order-last lg:order-none">
            <img
              src={kanyakumariVisual}
              alt="Glowing map of Kanyakumari district with Prince Group branch location pins"
              width={1280}
              height={1024}
              loading="lazy"
              className="mx-auto w-full rounded-[2rem] object-cover shadow-lift"
            />
          </div>
        </div>

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
                  <p className="mt-1 text-[11px] uppercase tracking-wider text-cream/65">{s.label}</p>
                </div>
              ))}
            </div>
            <p className="relative mt-6 text-sm text-cream/70">
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
              className={`card-lift group rounded-3xl border p-6 shadow-soft ${
                i === 0 ? "border-secondary/40 bg-card ring-1 ring-secondary/20" : "border-primary/10 bg-card"
              }`}
            >
              <span className="grid size-11 place-items-center rounded-2xl bg-gradient-olive text-accent transition-transform group-hover:scale-105">
                {i === 0 ? <Star className="size-5" /> : <MapPin className="size-5" />}
              </span>
              <h3 className="mt-5 text-lg font-semibold text-primary">{town}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Documentation · Registration · Business services
              </p>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-secondary">
                Branch open
              </p>
            </div>
          ))}
        </div>

        <AdminManagedNote>
          Branch towns, addresses and contact routing are configurable from Admin Settings; the list
          above is the current published coverage across Kanyakumari District.
        </AdminManagedNote>
      </div>
    </section>
  );
}

export function BankExecutiveSection() {
  return (
    <section id="bank-executive-plans" className="mx-auto max-w-7xl scroll-mt-28 px-4 py-20 sm:px-6">
      <div className="relative overflow-hidden rounded-[2rem] border border-primary/10 bg-gradient-olive p-8 text-cream shadow-lift sm:p-12">
        <div className="grid-lines pointer-events-none absolute inset-0 opacity-40" />
        <div className="hero-orb -right-20 -top-20 size-80 bg-accent/20" />
        <div className="relative grid gap-10 lg:grid-cols-2">
          <div>
            <span className="pill-badge">
              <Building2 className="size-3.5" /> Bank Executive Plans
            </span>
            <h2 className="mt-5 text-3xl font-bold sm:text-4xl">
              A dedicated portal for
              <span className="block text-gradient-olive">bank &amp; finance executives</span>
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-cream/70">
              Bank Executives subscribe on the Business plan or the Premium plan only. The Starter
              plan is not offered inside the Bank Executive portal. Every account requires a unique
              user ID, password and administrator approval before access is granted.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild variant="lime" className="w-full sm:w-auto">
                <Link to="/bank-executive">Bank Executive Login</Link>
              </Button>
              <Button asChild variant="onOlive" className="w-full sm:w-auto">
                <Link to="/auth">Request an Account</Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { icon: ShieldCheck, title: "Secure Login", body: "Unique executive ID and password with role-based access control." },
              { icon: BadgeCheck, title: "Admin Approval", body: "Accounts stay pending until an administrator approves them." },
              { icon: Users, title: "Candidate Data", body: "Allocated candidate profiles with status, requirement and assignment date." },
              { icon: Lock, title: "Protected Contacts", body: "Contact numbers are revealed only for allocated profiles, and every view is logged." },
            ].map((c) => (
              <div key={c.title} className="glass-dark hover-glow rounded-2xl p-5">
                <c.icon className="size-5 text-accent" />
                <h3 className="mt-3 text-sm font-semibold">{c.title}</h3>
                <p className="mt-1.5 text-xs text-cream/70">{c.body}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="relative mt-8 text-xs text-cream/55">
          <DemoBadge className="mr-2" />
          Executive dashboards currently show synthetic records. Administrators replace them with
          imported data before go-live.
        </p>
      </div>
    </section>
  );
}

export function TrustSection() {
  const cards = [
    { icon: TrendingUp, title: "Exclusive Discounts", body: "25% to 75% member pricing across eligible services, applied automatically from your plan." },
    { icon: ShieldCheck, title: "Verified, Admin-Controlled Opportunities", body: "Every opportunity is reviewed and published by administrators before members see it." },
    { icon: Lock, title: "Limited Membership", body: "500 Business slots and 100 Premium slots. Availability is counted live." },
    { icon: Building2, title: "Premium Business Access", body: "Business directory, B2B opportunities and loan candidate data in one place." },
    { icon: BarChart3, title: "Powerful Data Management", body: "Unique profile IDs, allocation history and duplicate prevention on every claim." },
    { icon: BadgeCheck, title: "Secure Subscription Payments", body: "Payments are confirmed only after gateway verification — never assumed successful." },
  ];

  return (
    <section className="bg-gradient-cream py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading eyebrow="Trust" title="Why Members" highlight="Choose PRINCE" />
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => (
            <div key={c.title} className="card-lift rounded-3xl border border-primary/10 bg-card p-6 shadow-soft">
              <span className="grid size-11 place-items-center rounded-2xl bg-muted text-secondary">
                <c.icon className="size-5" />
              </span>
              <h3 className="mt-5 text-lg font-semibold text-primary">{c.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{c.body}</p>
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
        <p className="relative mx-auto mt-4 max-w-2xl text-sm text-cream/70 sm:text-base">
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
