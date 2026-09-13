import { Link } from "@tanstack/react-router";
import { Gift, Sparkles, Timer } from "lucide-react";

import { Button } from "@/components/ui/button";
import { shortDate } from "@/lib/format";

export type OfferRow = {
  id: string;
  code: string;
  title: string;
  description: string | null;
  discount: number | null;
  active: boolean;
  start_date: string | null;
  end_date: string | null;
  applicable_plan: string | null;
};

/** Premium, visually dominant December campaign banner driven by backend offer data. */
export function DecemberOffer({ offer }: { offer: OfferRow }) {
  return (
    <section className="mx-auto max-w-7xl px-4 pt-14 sm:px-6">
      <div className="reveal relative isolate overflow-hidden rounded-[2.25rem] border border-[oklch(0.86_0.13_95/0.45)] bg-gradient-olive p-8 text-cream shadow-lift sm:p-14">
        <div className="plans-aurora pointer-events-none absolute inset-0 -z-10" />
        <div className="grid-lines pointer-events-none absolute inset-0 -z-10 opacity-35" />
        <div className="hero-orb -left-20 -top-16 size-80 bg-accent/25" />
        <div className="hero-orb -right-16 bottom-0 size-72 bg-secondary/25" />

        {["left-[8%] top-[22%]", "right-[12%] top-[18%]", "right-[26%] bottom-[16%]"].map(
          (pos, i) => (
            <span
              key={pos}
              aria-hidden
              className={`coin floaty pointer-events-none absolute hidden size-8 md:grid ${pos}`}
              style={{ animationDelay: `${i * 1.6}s` }}
            >
              <Sparkles className="size-1/2" />
            </span>
          ),
        )}

        <div className="relative grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-[oklch(0.86_0.13_95/0.5)] bg-[oklch(0.86_0.13_95/0.12)] px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-[oklch(0.92_0.11_98)]">
              <Gift className="size-3.5" /> Seasonal Campaign
            </span>
            <h2 className="mt-5 font-display text-4xl font-extrabold leading-[1.05] sm:text-5xl lg:text-6xl">
              <span className="shimmer-gold">DECEMBER OFFER</span>
            </h2>
            <p className="mt-4 max-w-xl text-base font-semibold text-accent">{offer.title}</p>
            {offer.description ? (
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-cream/90">
                {offer.description}
              </p>
            ) : null}

            <div className="mt-7 flex flex-wrap items-center gap-3 text-xs font-semibold">
              {offer.start_date || offer.end_date ? (
                <span className="inline-flex items-center gap-2 rounded-full border border-cream/20 px-4 py-2 text-cream/95">
                  <Timer className="size-3.5 text-accent" />
                  {offer.start_date ? shortDate(offer.start_date) : "Now"}
                  {offer.end_date ? ` — ${shortDate(offer.end_date)}` : ""}
                </span>
              ) : null}
              {offer.applicable_plan ? (
                <span className="rounded-full border border-accent/30 bg-accent/10 px-4 py-2 capitalize text-accent">
                  {offer.applicable_plan} plan
                </span>
              ) : null}
              <span
                className={`rounded-full px-4 py-2 ${
                  offer.active
                    ? "bg-gradient-lime text-primary"
                    : "border border-cream/20 text-cream/90"
                }`}
              >
                {offer.active ? "Live now" : "Scheduled"}
              </span>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" variant="lime" className="w-full sm:w-auto">
                <Link
                  to="/payment"
                  search={offer.applicable_plan ? { plan: offer.applicable_plan } : {}}
                >
                  Claim December Offer →
                </Link>
              </Button>
              <Button asChild size="lg" variant="onOlive" className="w-full sm:w-auto">
                <Link to="/contact">Ask About This Offer</Link>
              </Button>
            </div>
          </div>

          <div className="relative">
            <div className="glass-dark hover-glow relative overflow-hidden rounded-[2rem] border border-[oklch(0.86_0.13_95/0.35)] p-8 text-center">
              <div className="hero-orb -right-12 -top-12 size-40 bg-accent/30" />
              <p className="relative text-[11px] font-bold uppercase tracking-[0.25em] text-cream/90">
                Save up to
              </p>
              <p className="relative mt-3 font-display text-7xl font-extrabold shimmer-gold">
                {offer.discount ?? 0}%
              </p>
              <p className="relative mt-2 text-sm text-cream/90">
                Applied automatically at checkout during the campaign window.
              </p>
              <div className="relative mt-6 h-px w-full bg-gradient-lime opacity-40" />
              <p className="relative mt-5 text-xs text-cream/95">
                Discount value, dates and eligible plan are configured by administrators.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
