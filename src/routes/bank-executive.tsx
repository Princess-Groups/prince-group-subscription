import { createFileRoute, Link } from "@tanstack/react-router";
import { BadgeCheck, Building2, Check, Lock, Users } from "lucide-react";
import { usePlans } from "@/hooks/usePlatform";
import { inr } from "@/lib/format";

import { AdminManagedNote, PageHero, PublicPage } from "@/components/site/PublicPage";
import { PlansSection } from "@/components/site/PlansSection";
import { Button } from "@/components/ui/button";

const title = "Bank Executive Portal — Leads for Finance Professionals | PRINCE";
const description =
  "A dedicated portal for bank and finance executives with approved accounts, three monthly subscription plans and allocated customer leads.";

export const Route = createFileRoute("/bank-executive")({
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
  component: BankExecutivePage,
});

function BankExecutivePage() {
  const { data: plans } = usePlans();
  return (
    <PublicPage>
      <PageHero
        eyebrow="Bank Executive Portal"
        title="Built for bank and finance executives"
        subtitle="Executive accounts use a unique ID and password, require administrator approval, and can choose Starter, Business or Premium membership."
      />

      <section id="executive-plans" className="scroll-mt-28 bg-gradient-olive py-16 text-cream sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <h2 className="text-center font-display text-3xl font-bold sm:text-4xl">
            Bank Executive Plans
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-cream/90">
            Choose a plan, create your account and complete payment on the secure payment screen.
          </p>

          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {(plans ?? []).map((p) => (
              <div
                key={p.code}
                className={`subscription-plan-text flex h-full flex-col rounded-[1.75rem] border p-7 ${
                  p.highlight ? "border-accent/45 bg-cream/10 shadow-lift" : "glass-dark border-cream/12"
                }`}
              >
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">
                  {p.name}
                </p>
                <p className="mt-2 font-display text-4xl font-bold">{inr(p.daily_display)} Plan</p>
                <p className="mt-1 text-sm font-semibold text-accent">{inr(p.price)} / {p.billing_period === "monthly" ? "month" : p.billing_period}</p>
                <ul className="mt-6 flex-1 space-y-2.5 text-sm font-medium text-cream">
                  {p.benefits.slice(0, 3).map((point) => (
                    <li key={point} className="flex gap-2">
                      <Check className="mt-0.5 size-4 shrink-0 text-accent" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
                <Button asChild variant={p.highlight ? "lime" : "onOlive"} className={`mt-7 w-full ${p.highlight ? "" : "border-accent/60 bg-accent/15 font-bold"}`}>
                  <Link
                    to="/payment"
                    search={{ plan: p.code, item: `${inr(p.daily_display)} Plan — Bank Executive` }}
                  >
                    Pay Now
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {[
            { icon: Lock, title: "Secure executive login", body: "Role-based access separates executives from customer accounts." },
            { icon: BadgeCheck, title: "Administrator approval", body: "New accounts remain pending until approved by an administrator." },
            { icon: Users, title: "Allocated customer leads", body: "Leads arrive with requirement, status and assignment date." },
            { icon: Building2, title: "Three membership plans", body: "Starter, Business and Premium use the same secure subscription payment flow." },
          ].map((c) => (
            <div key={c.title} className="card-lift rounded-3xl border border-primary/10 bg-card p-6 shadow-soft">
              <span className="grid size-11 place-items-center rounded-2xl bg-gradient-olive text-accent">
                <c.icon className="size-5" />
              </span>
              <h3 className="mt-5 text-base font-semibold text-primary">{c.title}</h3>
              <p className="mt-2 text-sm text-foreground/80">{c.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap gap-3">
          <Button asChild variant="hero" size="lg">
            <Link to="/auth">Executive sign in</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/contact">Request approval</Link>
          </Button>
        </div>

        <AdminManagedNote>
          Executive eligibility, approval status and lead assignment are all controlled from the
          admin portal.
        </AdminManagedNote>
      </div>

      <PlansSection
        title="Executive Plans"
        subtitle="Bank Executives can choose Starter, Business or Premium. Slot availability is shared with the main membership pool."
      />
    </PublicPage>
  );
}
