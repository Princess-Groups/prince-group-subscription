import { Link } from "@tanstack/react-router";
import {
  BadgeCheck,
  BarChart3,
  Briefcase,
  Building2,
  Code2,
  FileText,
  Landmark,
  Lock,
  Megaphone,
  Phone,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";

import { AdminManagedNote, DemoBadge } from "@/components/site/PublicPage";
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
    { label: "Premium Slots", value: "Limited" },
  ];

  return (
    <section className="relative overflow-hidden bg-gradient-olive text-primary-foreground">
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute -left-32 top-10 size-96 rounded-full bg-accent/25 blur-3xl" />
        <div className="absolute -right-24 bottom-0 size-[28rem] rounded-full bg-secondary/40 blur-3xl" />
      </div>

      <div className="relative mx-auto grid max-w-7xl gap-14 px-4 py-20 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:py-28">
        <div className="fade-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-primary-foreground/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            <Sparkles className="size-3.5" /> Limited Premium Membership
          </span>
          <h1 className="mt-6 text-4xl font-bold leading-[1.08] sm:text-5xl lg:text-6xl">
            Unlock Premium Access.
            <span className="block text-gradient-olive">Unlock Better Opportunities.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base text-primary-foreground/75 sm:text-lg">
            Choose your subscription plan and unlock exclusive discounts, business opportunities,
            loan profiles, premium leads and powerful business resources.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Button asChild size="lg" variant="lime">
              <Link to="/plans">Explore Plans</Link>
            </Button>
            <Button asChild size="lg" variant="onOlive">
              <Link to="/opportunities">View Available Opportunities</Link>
            </Button>
          </div>

          <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="glass-panel rounded-2xl px-4 py-4">
                <p className="font-display text-xl font-bold text-accent">{s.value}</p>
                <p className="mt-1 text-[11px] uppercase tracking-wider text-primary-foreground/60">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-primary-foreground/50">
            Statistics shown here are admin-managed display values, editable from Admin Settings.
          </p>
        </div>

        <div className="relative hidden lg:block">
          <div className="floaty absolute right-4 top-4 w-64 rounded-3xl border border-primary-foreground/15 bg-primary-foreground/10 p-5 backdrop-blur-xl">
            <div className="flex items-center gap-2 text-accent">
              <Landmark className="size-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">Loan Profiles</span>
            </div>
            <p className="mt-3 font-display text-3xl font-bold">1,00,000+</p>
            <div className="mt-4 space-y-2">
              {["Personal", "Business", "Home", "MSME"].map((t, i) => (
                <div key={t} className="flex items-center justify-between text-xs text-primary-foreground/70">
                  <span>{t} Loan</span>
                  <span className="h-1.5 w-24 overflow-hidden rounded-full bg-primary-foreground/15">
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
            className="floaty absolute bottom-10 left-0 w-72 rounded-3xl border border-primary-foreground/15 bg-primary-foreground/10 p-5 backdrop-blur-xl"
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
            <p className="mt-4 text-xs text-primary-foreground/70">
              Weekly claim attempts, quotas and duplicate prevention enforced server-side.
            </p>
          </div>

          <div
            className="floaty absolute right-16 bottom-0 w-56 rounded-2xl border border-accent/30 bg-accent/15 p-4 backdrop-blur-xl"
            style={{ animationDelay: "0.7s" }}
          >
            <div className="flex items-center gap-2 text-accent">
              <Users className="size-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">B2B Directory</span>
            </div>
            <p className="mt-2 font-display text-2xl font-bold">6,00,000+</p>
            <p className="text-[11px] text-primary-foreground/70">Kanyakumari business directory</p>
          </div>
        </div>
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
        <div className="max-w-2xl">
          <span className="text-xs font-bold uppercase tracking-[0.25em] text-secondary">Benefits</span>
          <h2 className="mt-3 text-3xl font-bold text-primary sm:text-4xl">
            Everything You Need in One Subscription
          </h2>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">
            Member pricing is calculated automatically from your active plan discount.
          </p>
        </div>

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
      <div className="overflow-hidden rounded-[2rem] border border-primary/10 bg-gradient-olive p-8 text-primary-foreground shadow-lift sm:p-12">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-accent/40 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-accent">
              <Building2 className="size-3.5" /> Bank Executive Plans
            </span>
            <h2 className="mt-5 text-3xl font-bold sm:text-4xl">
              A dedicated portal for bank &amp; finance executives
            </h2>
            <p className="mt-4 text-sm text-primary-foreground/75">
              Bank Executives subscribe on the ₹10 Business plan or the ₹100 Premium plan only. The
              ₹1 Starter plan is not offered inside the Bank Executive portal. Every account requires
              a unique user ID, password and administrator approval before access is granted.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild variant="lime">
                <Link to="/bank-executive">Bank Executive Login</Link>
              </Button>
              <Button asChild variant="onOlive">
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
              <div key={c.title} className="glass-panel rounded-2xl p-5">
                <c.icon className="size-5 text-accent" />
                <h3 className="mt-3 text-sm font-semibold">{c.title}</h3>
                <p className="mt-1.5 text-xs text-primary-foreground/70">{c.body}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="mt-8 text-xs text-primary-foreground/55">
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
          <Button asChild size="lg" variant="hero" className="mt-7">
            <Link to="/plans">Get Started</Link>
          </Button>
          <AdminManagedNote>All amounts on this offer are configurable from Admin Settings.</AdminManagedNote>
        </div>
        <div className="rounded-3xl bg-gradient-olive p-7 text-primary-foreground">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">First month</p>
          <p className="mt-2 font-display text-5xl font-bold">{inr(offer.first_month ?? 99)}</p>
          <p className="mt-1 text-sm text-primary-foreground/70">+ GST, applied on first payment only</p>
          <div className="mt-6 space-y-2 border-t border-primary-foreground/15 pt-6 text-sm text-primary-foreground/80">
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
        <div className="max-w-2xl">
          <span className="text-xs font-bold uppercase tracking-[0.25em] text-secondary">Trust</span>
          <h2 className="mt-3 text-3xl font-bold text-primary sm:text-4xl">Why Members Choose Us</h2>
        </div>
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
      <div className="rounded-[2rem] bg-gradient-olive p-10 text-center text-primary-foreground shadow-lift sm:p-16">
        <h2 className="text-3xl font-bold sm:text-4xl">Need More Access?</h2>
        <p className="mx-auto mt-4 max-w-2xl text-sm text-primary-foreground/75 sm:text-base">
          Our premium plans are limited. Contact our team for additional availability and business
          access.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg" variant="lime">
            <a href={`tel:${phone}`}>
              <Phone className="size-4" /> Call Now — {phone}
            </a>
          </Button>
          <Button asChild size="lg" variant="onOlive">
            <Link to="/contact">Contact Support</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
