import { createFileRoute, Link } from "@tanstack/react-router";
import { BadgeCheck, Building2, Lock, Users } from "lucide-react";

import { AdminManagedNote, PageHero, PublicPage } from "@/components/site/PublicPage";
import { PlansSection } from "@/components/site/PlansSection";
import { Button } from "@/components/ui/button";

const title = "Bank Executive Portal — Leads for Finance Professionals | PRINCE";
const description =
  "A dedicated portal for bank and finance executives with approved accounts, Business or Premium plans and allocated customer leads.";

export const Route = createFileRoute("/bank-executive")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: BankExecutivePage,
});

function BankExecutivePage() {
  return (
    <PublicPage>
      <PageHero
        eyebrow="Bank Executive Portal"
        title="Built for bank and finance executives"
        subtitle="Executive accounts use a unique ID and password, require administrator approval, and subscribe on the Business or Premium plan only."
      />

      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {[
            { icon: Lock, title: "Secure executive login", body: "Role-based access separates executives from customer accounts." },
            { icon: BadgeCheck, title: "Administrator approval", body: "New accounts remain pending until approved by an administrator." },
            { icon: Users, title: "Allocated customer leads", body: "Leads arrive with requirement, status and assignment date." },
            { icon: Building2, title: "Business & Premium only", body: "The Starter plan is not offered in the executive portal." },
          ].map((c) => (
            <div key={c.title} className="card-lift rounded-3xl border border-primary/10 bg-card p-6 shadow-soft">
              <span className="grid size-11 place-items-center rounded-2xl bg-gradient-olive text-accent">
                <c.icon className="size-5" />
              </span>
              <h3 className="mt-5 text-base font-semibold text-primary">{c.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{c.body}</p>
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
        subtitle="Bank Executives subscribe on the Business or Premium plan. Slot availability is shared with the main membership pool."
        filter={(code) => code !== "starter"}
      />
    </PublicPage>
  );
}
