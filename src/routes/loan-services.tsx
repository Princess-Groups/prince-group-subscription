import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BadgeCheck,
  Briefcase,
  Car,
  Database,
  Filter,
  Gift,
  GraduationCap,
  Handshake,
  Home,
  Landmark,
  Lightbulb,
  MapPin,
  MessagesSquare,
  Search,
  Share2,
  ShieldCheck,
  Store,
  TrendingUp,
  UserRound,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import heroLoans from "@/assets/prince-hero-loans.png.asset.json";
import { PublicPage } from "@/components/site/PublicPage";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const title = "Loan Candidate Data for Bank Managers & Executives | PRINCE";
const description =
  "PRINCE supplies verified loan candidate data and lead data to bank managers and bank executives — from 1 lakh to 6 lakh+ candidate records across every loan category.";

export const Route = createFileRoute("/loan-services")({
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
  component: LoanDataPage,
});

const VOLUMES = [
  { value: "1 Lakh+", label: "Candidate Data", note: "Entry data pack" },
  { value: "2 Lakh+", label: "Candidate Data", note: "Taluk-level coverage" },
  { value: "3 Lakh+", label: "Candidate Data", note: "Nagercoil & Marthandam belt" },
  { value: "4 Lakh+", label: "Candidate Data", note: "Coastal & inland Kanyakumari" },
  { value: "5 Lakh+", label: "Candidate Data", note: "District-wide coverage" },
  { value: "6 Lakh+", label: "Candidate Data", note: "Full Kanyakumari network" },
];


const CATEGORIES = [
  { icon: Home, name: "Home Loan" },
  { icon: Briefcase, name: "Business Loan" },
  { icon: UserRound, name: "Personal Loan" },
  { icon: Car, name: "Vehicle Loan" },
  { icon: GraduationCap, name: "Education Loan" },
  { icon: Store, name: "MSME Loan" },
];

const DATA_AVAILABILITY = [
  { value: "1 Lakh+", label: "Loan Candidates Data" },
  { value: "6 Lakhs+", label: "B2B Contacts Data" },
  { value: "1000+", label: "Enquiries" },
] as const;

function AnimatedDataAvailability() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(
      () => setActiveIndex((current) => (current + 1) % DATA_AVAILABILITY.length),
      2800,
    );
    return () => window.clearInterval(timer);
  }, []);

  const item = DATA_AVAILABILITY[activeIndex] ?? DATA_AVAILABILITY[0];

  return (
    <div className="mt-4 min-h-20" aria-live="polite" aria-atomic="true">
      <div key={item.value} className="data-availability-entry">
        <p className="font-display text-4xl font-bold leading-none text-accent sm:text-5xl">
          {item.value}
        </p>
        <p className="mt-3 font-display text-lg font-bold leading-tight text-cream drop-shadow-[0_2px_8px_oklch(0.18_0.05_148/0.55)] sm:text-xl">
          {item.label}
        </p>
      </div>
    </div>
  );
}

type Row = { name: string; type: string; status: "Verified" | "New" | "Follow-up" };

const SAMPLE: Row[] = [
  { name: "Arun Kumar", type: "Home Loan", status: "Verified" },
  { name: "Meena Rajan", type: "Business Loan", status: "New" },
  { name: "Vignesh S.", type: "Personal Loan", status: "Follow-up" },
  { name: "Priya Devi", type: "Vehicle Loan", status: "Verified" },
  { name: "Karthik R.", type: "Education Loan", status: "New" },
  { name: "Selvi Murugan", type: "MSME Loan", status: "Verified" },
  { name: "Ramesh Babu", type: "Home Loan", status: "Follow-up" },
  { name: "Anitha Krishnan", type: "Personal Loan", status: "Verified" },
];

const STATUS_TONE: Record<Row["status"], string> = {
  Verified: "bg-accent/20 text-accent border-accent/30",
  New: "bg-cream/10 text-cream/95 border-cream/20",
  "Follow-up": "bg-secondary/25 text-cream border-secondary/40",
};

function LoanDataPage() {
  const [q, setQ] = useState("");
  const [type, setType] = useState("All");

  const rows = useMemo(
    () =>
      SAMPLE.filter(
        (r) =>
          (type === "All" || r.type === type) &&
          (!q.trim() || r.name.toLowerCase().includes(q.trim().toLowerCase())),
      ),
    [q, type],
  );

  return (
    <PublicPage>
      {/* Hero */}
      <section className="relative isolate overflow-hidden text-cream">
        <img
          src={heroLoans.url}
          alt="Green financial visual with loan document, house, car and gold coins"
          className="absolute inset-x-0 top-0 -z-20 h-auto w-full object-top"
        />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(100deg,oklch(0.17_0.05_148/0.95)_0%,oklch(0.19_0.055_147/0.88)_45%,oklch(0.2_0.05_146/0.45)_100%)]" />
        <div className="grid-lines pointer-events-none absolute inset-0 opacity-50" />
        <div className="hero-orb -left-24 top-0 size-[26rem] bg-accent/25" />
        <div className="hero-orb -right-20 bottom-0 size-[28rem] bg-secondary/30" />

        <div className="relative mx-auto grid max-w-7xl gap-14 px-4 py-20 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:py-28">
          <div className="reveal">
            <div className="flex flex-wrap gap-2">
              <span className="pill-badge">
                <Database className="size-3.5" /> Loan Candidate Data Platform
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/12 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-accent">
                <MapPin className="size-3.5" /> Kanyakumari District Data
              </span>
            </div>
            <h1 className="mt-6 text-4xl font-bold leading-[1.06] sm:text-5xl lg:text-[3.4rem]">
              Loan Candidate Data.
              <span className="block text-gradient-olive">Built for Banking Professionals.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-cream/90">
              PRINCE supplies structured loan candidate and lead data from Kanyakumari district to
              bank managers and bank executives. We are a data platform — we do not issue loans or
              process loan applications for customers.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Button asChild size="lg" variant="lime" className="w-full sm:w-auto">
                <a href="#candidate-data">Explore Available Candidate Data →</a>
              </Button>
              <Button asChild size="lg" variant="onOlive" className="w-full sm:w-auto">
                <Link to="/contact">Get Data Details</Link>
              </Button>
            </div>
          </div>

          <div className="relative">
            <div className="glass-dark rounded-[2rem] p-6 shadow-lift">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-accent">
                  Data Availability
                </span>
                <Landmark className="size-4 text-accent" />
              </div>
              <AnimatedDataAvailability />
              <div className="mt-6 space-y-3">
                {CATEGORIES.slice(0, 4).map((c, i) => (
                  <div key={c.name} className="flex items-center gap-3 text-xs text-cream/95">
                    <c.icon className="size-4 shrink-0 text-accent" />
                    <span className="w-28 shrink-0">{c.name}</span>
                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-cream/12">
                      <span
                        className="block h-full rounded-full bg-gradient-lime"
                        style={{ width: `${92 - i * 14}%` }}
                      />
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex items-center gap-2 rounded-2xl border border-accent/25 bg-accent/10 px-4 py-3 text-xs text-cream/95">
                <ShieldCheck className="size-4 shrink-0 text-accent" />
                Contact numbers stay masked until a data agreement is active.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Volumes */}
      <section className="bg-gradient-cream py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-secondary">
              Available Volumes
            </span>
            <h2 className="mt-3 text-3xl font-bold text-primary sm:text-4xl">
              Kanyakumari district candidate data packs
            </h2>
            <p className="mt-3 text-sm text-foreground/80">
              Every pack is sourced from Kanyakumari district, category-tagged and refreshed by our
              data team. Choose the coverage that matches your branch target.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {VOLUMES.map((v) => (
              <div
                key={v.value}
                className="card-lift rounded-3xl border border-primary/10 bg-card p-7 shadow-soft"
              >
                <span className="grid size-11 place-items-center rounded-2xl bg-gradient-olive text-accent">
                  <Database className="size-5" />
                </span>
                <p className="mt-5 font-display text-3xl font-bold text-primary">{v.value}</p>
                <p className="text-sm font-medium text-secondary">{v.label}</p>
                <p className="mt-3 text-xs uppercase tracking-wider text-foreground/80">
                  {v.note}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Candidate data explorer */}
      <section
        id="candidate-data"
        className="relative overflow-hidden bg-gradient-olive py-20 text-cream"
      >
        <div className="grid-lines pointer-events-none absolute inset-0 opacity-40" />
        <div className="hero-orb -right-24 top-10 size-[24rem] bg-accent/20" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <span className="pill-badge">
            <Filter className="size-3.5" /> Sample Preview
          </span>
          <h2 className="mt-5 text-3xl font-bold sm:text-4xl">
            Search the candidate data
            <span className="block text-gradient-olive">before you request access</span>
          </h2>
          <p className="mt-4 max-w-2xl text-sm text-cream/90">
            The records below are sample entries for demonstration only. Contact numbers are masked
            and no real personal information is shown.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <div className="relative w-full max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-cream/95" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search candidate name"
                className="border-cream/15 bg-cream/5 pl-9 text-cream placeholder:text-cream/40"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {["All", ...CATEGORIES.map((c) => c.name)].map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`rounded-full border px-4 py-2 text-xs font-semibold transition-colors ${
                    type === t
                      ? "border-accent/40 bg-accent/20 text-accent"
                      : "border-cream/15 text-cream/90 hover:bg-cream/10"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="glass-dark mt-8 overflow-hidden rounded-[2rem]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-cream/10 text-[11px] uppercase tracking-wider text-cream/95">
                    <th className="px-6 py-4 font-semibold">Candidate Name</th>
                    <th className="px-6 py-4 font-semibold">Contact Number</th>
                    <th className="px-6 py-4 font-semibold">Required Loan Type</th>
                    <th className="px-6 py-4 font-semibold">Data Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.name} className="border-b border-cream/5 last:border-0">
                      <td className="px-6 py-4 font-medium text-cream">{r.name}</td>
                      <td className="px-6 py-4 font-mono text-xs text-cream/90">+91 XXXXX XXXXX</td>
                      <td className="px-6 py-4 text-cream/95">{r.type}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold ${STATUS_TONE[r.status]}`}
                        >
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-10 text-center text-cream/90">
                        No sample records match this filter.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CATEGORIES.map((c) => (
              <div key={c.name} className="glass-dark hover-glow rounded-3xl p-6">
                <span className="grid size-11 place-items-center rounded-2xl bg-accent/15 text-accent">
                  <c.icon className="size-5" />
                </span>
                <h3 className="mt-4 text-base font-semibold text-cream">{c.name}</h3>
                <p className="mt-1.5 text-xs text-cream/90">
                  Category-tagged candidate records with requirement and status fields.
                </p>
              </div>
            ))}
          </div>

          <div className="mt-12 rounded-[2rem] border border-accent/25 bg-accent/10 p-8 text-center">
            <h3 className="text-2xl font-bold text-cream">Need data for your branch targets?</h3>
            <p className="mx-auto mt-2 max-w-2xl text-sm text-cream/90">
              Share your loan category and volume requirement for Kanyakumari district. Our team will confirm current
              availability and data terms.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg" variant="lime">
                <Link to="/contact">Get Data Details</Link>
              </Button>
              <Button asChild size="lg" variant="onOlive">
                <Link to="/bank-executive">Bank Executive Login</Link>
              </Button>
            </div>
            <p className="mt-6 flex items-center justify-center gap-2 text-xs text-cream/95">
              <BadgeCheck className="size-3.5 text-accent" /> PRINCE is a candidate-data and
              lead-data provider for banking professionals, not a direct loan provider.
            </p>
          </div>
        </div>
      </section>
    </PublicPage>
  );
}
