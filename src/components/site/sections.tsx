import { Link } from "@tanstack/react-router";
import {
  BadgeCheck,
  BarChart3,
  Briefcase,
  Building2,
  Car,
  Code2,
  FileText,
  GraduationCap,
  Home,
  Landmark,
  Lock,
  MapPin,
  Megaphone,
  Navigation,
  Phone,
  ShieldCheck,
  Sparkles,
  Store,
  TrendingUp,
  UserRound,
  Users,
} from "lucide-react";

import benefitsVisual from "@/assets/prince-benefits.jpg";
import branchesVisual from "@/assets/prince-branches.jpg";
import loansVisual from "@/assets/prince-loans.jpg";
import { AdminManagedNote, DemoBadge, SectionHeading } from "@/components/site/PublicPage";
import { Button } from "@/components/ui/button";
import { settingString, useSettings } from "@/hooks/usePlatform";
import { inr } from "@/lib/format";

type HeroStat = { label: string; value: string };

export function HeroSection() {
  const { data: settings } = useSettings();
  const stats = (settings?.["hero_stats"] as HeroStat[] | undefined) ?? [
    { label: "Business Contacts", value: "6,00,000+" },
    { label: "Loan Profiles", value: "1,00,000+" },
    { label: "Daily Enquiries", value: "1,000+" },
    { label: "Branches In India", value: "20" },
  ];

  return (
    <section className="relative overflow-hidden bg-gradient-olive text-cream">
      <div className="grid-lines pointer-events-none absolute inset-0 opacity-50" />
      <div className="hero-orb -left-32 top-10 size-96 bg-accent/25" />
      <div className="hero-orb -right-24 bottom-0 size-[30rem] bg-secondary/30" />

      <div className="relative mx-auto grid max-w-7xl gap-14 px-4 py-20 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:py-28">
        <div className="reveal">
          <span className="pill-badge">
            <Sparkles className="size-3.5" /> Limited Premium Membership
          </span>
          <h1 className="mt-6 text-4xl font-bold leading-[1.06] sm:text-5xl lg:text-6xl">
            Unlock Premium Access.
            <span className="block text-gradient-olive">Unlock Better Opportunities.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-cream/70 sm:text-lg">
            Choose your subscription plan and unlock exclusive discounts, business opportunities,
            loan profiles, premium leads and powerful business resources.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Button asChild size="lg" variant="lime" className="w-full sm:w-auto">
              <Link to="/plans">Explore Plans →</Link>
            </Button>
            <Button asChild size="lg" variant="onOlive" className="w-full sm:w-auto">
              <Link to="/opportunities">View Available Opportunities</Link>
            </Button>
          </div>

          <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="glass-dark rounded-2xl px-4 py-4">
                <p className="font-display text-xl font-bold text-accent">{s.value}</p>
                <p className="mt-1 text-[11px] uppercase tracking-wider text-cream/60">{s.label}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-cream/45">
            Statistics shown here are admin-managed display values, editable from Admin Settings.
          </p>
        </div>

        <div className="relative hidden min-h-[30rem] lg:block">
          <div className="absolute inset-8 rounded-full bg-accent/10 blur-3xl" />
          <img
            src={benefitsVisual}
            alt="Premium PRINCE membership benefits: offers, discounts and business opportunities"
            width={1024}
            height={1024}
            className="floaty absolute inset-0 m-auto w-[86%] rounded-[2.5rem] object-contain mix-blend-lighten"
          />


          <div className="floaty glass-dark absolute right-4 top-4 w-64 rounded-3xl p-5">
            <div className="flex items-center gap-2 text-accent">
              <Landmark className="size-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">Loan Profiles</span>
            </div>
            <p className="mt-3 font-display text-3xl font-bold">1,00,000+</p>
            <div className="mt-4 space-y-2">
              {["Personal", "Business", "Home", "MSME"].map((t, i) => (
                <div key={t} className="flex items-center justify-between text-xs text-cream/70">
                  <span>{t} Loan</span>
                  <span className="h-1.5 w-24 overflow-hidden rounded-full bg-cream/15">
                    <span
                      className="block h-full rounded-full bg-gradient-lime"
                      style={{ width: `${90 - i * 15}%` }}
                    />
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div
            className="floaty glass-dark absolute bottom-12 left-0 w-72 rounded-3xl p-5"
            style={{ animationDelay: "1.4s" }}
          >
            <div className="flex items-center gap-2 text-accent">
              <BarChart3 className="size-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">Lead Engine</span>
            </div>
            <div className="mt-4 flex items-end gap-1.5">
              {[38, 62, 45, 80, 55, 92, 70].map((h, i) => (
                <span
                  key={i}
                  className="w-6 rounded-t-md bg-gradient-lime"
                  style={{ height: `${h}px`, opacity: 0.45 + i * 0.08 }}
                />
              ))}
            </div>
            <p className="mt-4 text-xs text-cream/70">
              Weekly claim attempts, quotas and duplicate prevention enforced server-side.
            </p>
          </div>

          <div
            className="floaty absolute bottom-0 right-16 w-56 rounded-2xl border border-accent/30 bg-accent/15 p-4 backdrop-blur-xl"
            style={{ animationDelay: "0.7s" }}
          >
            <div className="flex items-center gap-2 text-accent">
              <Users className="size-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">B2B Directory</span>
            </div>
            <p className="mt-2 font-display text-2xl font-bold">6,00,000+</p>
            <p className="text-[11px] text-cream/70">Verified business directory</p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Loan services (reference 3) ---------------- */

const LOAN_CATEGORIES = [
  { icon: Home, title: "Home Loan", body: "Purchase, construction and balance transfer profiles." },
  { icon: UserRound, title: "Personal Loan", body: "Salaried and self-employed requirement profiles." },
  { icon: Briefcase, title: "Business Loan", body: "Working capital and expansion requirements." },
  { icon: GraduationCap, title: "Education Loan", body: "Domestic and overseas study financing." },
  { icon: Car, title: "Vehicle Loan", body: "New, used and commercial vehicle profiles." },
  { icon: Store, title: "MSME Loan", body: "Machinery, inventory and MSME scheme profiles." },
];

export function LoanServicesSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-olive py-20 text-cream sm:py-24">
      <div className="grid-lines pointer-events-none absolute inset-0 opacity-40" />
      <div className="hero-orb -right-32 top-0 size-[26rem] bg-accent/20" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid items-center gap-14 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <span className="pill-badge">
              <Landmark className="size-3.5" /> Loan Candidate Data
            </span>
            <h2 className="mt-5 text-3xl font-bold leading-[1.1] sm:text-4xl lg:text-5xl">
              Loan Candidate Data.
              <span className="block text-gradient-olive">Built for Banking Professionals.</span>
            </h2>
            <p className="mt-5 max-w-xl text-sm leading-relaxed text-cream/70 sm:text-base">
              PRINCE supplies structured loan candidate and lead data — 1 lakh to 6 lakh+ records —
              to bank managers and bank executives across every major loan category. We are a data
              platform, not a direct loan provider.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" variant="lime" className="w-full sm:w-auto">
                <Link to="/loan-services">Explore Available Candidate Data →</Link>
              </Button>
              <Button asChild size="lg" variant="onOlive" className="w-full sm:w-auto">
                <Link to="/contact">Get Data Details</Link>
              </Button>
            </div>
          </div>

          <div className="relative">
            <div className="hero-orb left-1/4 top-1/3 size-72 bg-accent/20" />
            <div className="relative mb-6 overflow-hidden rounded-[2rem] border border-cream/12 shadow-lift">
              <img
                src={loansVisual}
                alt="Loan approval document with home, vehicle and gold coins"
                width={1024}
                height={1024}
                loading="lazy"
                className="h-56 w-full object-cover sm:h-64"
              />
            </div>
            <div className="relative grid gap-4 sm:grid-cols-2">

            {LOAN_CATEGORIES.map((c, i) => (
              <div
                key={c.title}
                className="glass-dark hover-glow floaty rounded-3xl p-6"
                style={{ animationDelay: `${(i % 3) * 0.6}s` }}
              >
                <span className="grid size-11 place-items-center rounded-2xl bg-accent/15 text-accent">
                  <c.icon className="size-5" />
                </span>
                <h3 className="mt-4 text-base font-semibold text-cream">{c.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-cream/65">{c.body}</p>
              </div>
            ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

/* ---------------- Branch network (reference 1) ---------------- */

const BRANCH_CITIES = [
  "Chennai", "Bengaluru", "Hyderabad", "Kochi", "Coimbatore",
  "Madurai", "Kanyakumari", "Trivandrum", "Mumbai", "Pune",
  "Ahmedabad", "Delhi NCR", "Jaipur", "Lucknow", "Indore",
  "Kolkata", "Bhubaneswar", "Nagpur", "Vijayawada", "Mysuru",
];

export function BranchesSection({ full = false }: { full?: boolean }) {
  const cities = full ? BRANCH_CITIES : BRANCH_CITIES.slice(0, 8);

  return (
    <section className="bg-gradient-cream py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <SectionHeading
            eyebrow="Branch Network"
            title="20 Branches"
            highlight="Across India"
            subtitle="A growing national footprint for loan assistance, documentation support and business services — with local teams and admin-verified coverage in every region."
          />
          <div className="order-last lg:order-none">
            <img
              src={branchesVisual}
              alt="Map of India with PRINCE branch location pins"
              width={1024}
              height={1024}
              loading="lazy"
              className="mx-auto w-full max-w-md rounded-[2rem] object-contain"
            />
          </div>
        </div>

        <div className="mt-12">


          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-olive p-8 text-cream shadow-lift">
            <div className="hero-orb -right-16 -top-16 size-64 bg-accent/25" />
            <div className="relative grid gap-4 sm:grid-cols-3">
              {[
                { value: "20", label: "Branches" },
                { value: "12+", label: "States covered" },
                { value: "Local", label: "On-ground teams" },
              ].map((s) => (
                <div key={s.label} className="glass-dark rounded-2xl px-4 py-5 text-center">
                  <p className="font-display text-3xl font-bold text-accent">{s.value}</p>
                  <p className="mt-1 text-[11px] uppercase tracking-wider text-cream/65">{s.label}</p>
                </div>
              ))}
            </div>
            <p className="relative mt-6 text-sm text-cream/70">
              Branch discovery, coverage and contact routing are administered centrally so members
              always reach the right regional team.
            </p>
            <Button asChild variant="lime" className="relative mt-6 w-full sm:w-auto">
              <Link to="/branches">
                <Navigation className="size-4" /> Find a branch
              </Link>
            </Button>
          </div>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {cities.map((city) => (
            <div
              key={city}
              className="card-lift group rounded-3xl border border-primary/10 bg-card p-6 shadow-soft"
            >
              <span className="grid size-11 place-items-center rounded-2xl bg-gradient-olive text-accent transition-transform group-hover:scale-105">
                <MapPin className="size-5" />
              </span>
              <h3 className="mt-5 text-lg font-semibold text-primary">{city}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Loan assistance · Documentation · Business services
              </p>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-secondary">
                Branch open
              </p>
            </div>
          ))}
        </div>

        <AdminManagedNote>
          Branch cities, addresses and contact routing are configurable from Admin Settings; the
          list above is the current published coverage.
        </AdminManagedNote>
      </div>
    </section>
  );
}

const CATEGORY_ICON: Record<string, typeof Landmark> = {
  "Loan Services": Landmark,
  "Documentation Services": FileText,
  "Digital Marketing": Megaphone,
  "Software Services": Code2,
};

export function ServiceCategoriesSection() {
  const groups = [
    {
      title: "Loan Services",
      items: ["Personal Loans", "Business Loans", "Home Loans", "Vehicle Loans", "Education Loans", "Working Capital", "MSME Loans"],
    },
    {
      title: "Documentation Services",
      items: ["Marriage Registration", "Land Survey", "Documentation Services", "Registration Assistance"],
    },
    {
      title: "Digital Marketing",
      items: ["Website Development", "SEO", "Social Media Marketing", "Graphic Design", "Video Editing", "Reels Creation", "Google Ads", "Meta Ads", "WhatsApp Marketing"],
    },
    {
      title: "Software Services",
      items: ["Billing Software", "Accounting Software", "HR Software", "Business Management Software", "Custom Software"],
    },
  ];

  return (
    <section className="bg-gradient-cream py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Benefits"
          title="Everything You Need"
          highlight="in One Subscription"
          subtitle="Member pricing is calculated automatically from your active plan discount."
        />

        <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {groups.map((g) => {
            const Icon = CATEGORY_ICON[g.title] ?? Briefcase;
            return (
              <div key={g.title} className="card-lift rounded-3xl border border-primary/10 bg-card p-6 shadow-soft">
                <span className="grid size-11 place-items-center rounded-2xl bg-gradient-olive text-accent">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-5 text-lg font-semibold text-primary">{g.title}</h3>
                <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                  {g.items.map((i) => (
                    <li key={i} className="flex gap-2">
                      <BadgeCheck className="mt-0.5 size-3.5 shrink-0 text-secondary" />
                      {i}
                    </li>
                  ))}
                </ul>
                <Button asChild variant="ghost" size="sm" className="mt-5 px-0">
                  <Link to="/services">View member pricing →</Link>
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function BankExecutiveSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
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
              { icon: Users, title: "Customer Leads", body: "Allocated leads with status, requirement and assignment date." },
              { icon: Lock, title: "Protected Contacts", body: "Contact numbers are revealed only for allocated leads, and every view is logged." },
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

export function LoanClientOfferSection() {
  const { data: settings } = useSettings();
  const offer = (settings?.["loan_client_offer"] as
    | { enabled?: boolean; first_month?: number; next_month?: number; discount_label?: string; advance_mode?: boolean }
    | undefined) ?? {};
  if (offer.enabled === false) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
      <div className="grid items-center gap-8 rounded-[2rem] border border-secondary/25 bg-card p-8 shadow-soft sm:p-12 lg:grid-cols-2">
        <div>
          <span className="text-xs font-bold uppercase tracking-[0.25em] text-secondary">
            Special Subscription for Loan Clients
          </span>
          <h2 className="mt-3 text-3xl font-bold text-primary sm:text-4xl">
            One of the Best Subscription Plans for Loan Clients
          </h2>
          <p className="mt-4 text-sm text-muted-foreground">
            {offer.discount_label ?? "33% OFF for First Month"} — first month{" "}
            {inr(offer.first_month ?? 99)} + GST, from the second month {inr(offer.next_month ?? 10)} + GST.
            {offer.advance_mode ? " Advance payable mode available." : ""}
          </p>
          <Button asChild size="lg" variant="lime" className="mt-7 w-full sm:w-auto">
            <Link to="/plans">Get Started →</Link>
          </Button>
          <AdminManagedNote>All amounts on this offer are configurable from Admin Settings.</AdminManagedNote>
        </div>
        <div className="relative overflow-hidden rounded-3xl bg-gradient-olive p-7 text-cream">
          <div className="hero-orb -right-10 -top-10 size-48 bg-accent/25" />
          <p className="relative text-xs font-semibold uppercase tracking-widest text-accent">First month</p>
          <p className="relative mt-2 font-display text-5xl font-bold">{inr(offer.first_month ?? 99)}</p>
          <p className="relative mt-1 text-sm text-cream/70">+ GST, applied on first payment only</p>
          <div className="relative mt-6 space-y-2 border-t border-cream/15 pt-6 text-sm text-cream/80">
            <div className="flex justify-between"><span>From month 2</span><span>{inr(offer.next_month ?? 10)} + GST</span></div>
            <div className="flex justify-between"><span>Advance payable mode</span><span>{offer.advance_mode ? "Available" : "Disabled"}</span></div>
            <div className="flex justify-between"><span>Recurring payment</span><span>Enabled</span></div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function TrustSection() {
  const cards = [
    { icon: TrendingUp, title: "Exclusive Discounts", body: "25% to 75% member pricing across eligible services, applied automatically from your plan." },
    { icon: ShieldCheck, title: "Verified, Admin-Controlled Opportunities", body: "Every opportunity is reviewed and published by administrators before members see it." },
    { icon: Lock, title: "Limited Membership", body: "500 Business slots and 100 Premium slots. Availability is counted live." },
    { icon: Building2, title: "Premium Business Access", body: "Business directory, B2B opportunities and loan profile categories in one place." },
    { icon: BarChart3, title: "Powerful Lead Management", body: "Unique lead IDs, allocation history and duplicate prevention on every claim." },
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
  const phone = settingString(settings, "support_phone", "95559155535");

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
              <Phone className="size-4" /> Call Now — {phone}
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
