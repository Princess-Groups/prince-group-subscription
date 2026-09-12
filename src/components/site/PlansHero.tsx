import { Link } from "@tanstack/react-router";
import { Crown, IndianRupee, Sparkles } from "lucide-react";

import plansHeroBg from "@/assets/page-themes/plans-section-background.png.asset.json";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { usePlans, useSlots } from "@/hooks/usePlatform";
import { inr } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Premium podium-style hero for the Plans page.
 * All prices / names / slot counts come from the existing backend plan data.
 */
export function PlansHero() {
  const { data: plans, isLoading } = usePlans();
  const { data: slots } = useSlots();

  const list = (plans ?? []).slice(0, 3);
  const featuredIndex = Math.max(
    0,
    list.findIndex((p) => p.highlight) === -1 ? 1 : list.findIndex((p) => p.highlight),
  );

  return (
    <section className="relative isolate overflow-hidden bg-gradient-olive px-4 pb-24 pt-16 text-cream sm:px-6 sm:pt-20">
      {/* full-section background image for the Choose Your Plan area */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-20 size-full bg-top bg-no-repeat [background-size:100%_auto]"
        style={{ backgroundImage: `url(${plansHeroBg.url})` }}
      />
      



      <div className="relative max-w-6xl text-left">
        <span className="pill-badge">
          <Crown className="size-3.5" /> Premium Membership
        </span>
        <h1 className="mt-6 text-4xl font-bold leading-[1.06] sm:text-5xl lg:text-6xl">
          Choose Your
          <span className="block text-gradient-olive">Subscription Plan</span>
        </h1>
        <p className="mt-5 max-w-2xl text-sm leading-relaxed text-cream/70 sm:text-base">
          Daily pricing, member discounts, lead quotas and live slot availability — all managed by
          administrators and validated on the server at checkout.
        </p>
      </div>

      {/* Podium */}
      <div className="relative mx-auto mt-14 max-w-6xl">
        <div className="grid items-end gap-6 sm:grid-cols-3">
          {isLoading
            ? [0, 1, 2].map((i) => <Skeleton key={i} className="h-64 rounded-[1.75rem]" />)
            : list.map((plan, i) => {
                const featured = i === featuredIndex;
                const slot = slots?.find((s) => s.plan_code === plan.code);
                const remaining = slot?.remaining ?? plan.slot_limit;
                return (
                  <div
                    key={plan.id}
                    className={cn(
                      "podium-card group relative flex flex-col rounded-[1.75rem] border p-7 text-center transition-all duration-500",
                      featured
                        ? "border-accent/45 bg-cream/10 shadow-lift glow-lime sm:-mb-2 sm:scale-[1.05]"
                        : "glass-dark border-cream/12 hover:-translate-y-1.5",
                    )}
                  >
                    {featured ? (
                      <span className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-full bg-gradient-lime px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-primary">
                        <Crown className="size-3" /> Most Exclusive
                      </span>
                    ) : null}

                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">
                      {plan.name}
                    </p>
                    <p className="mt-1 text-xs text-cream/60">{plan.tagline}</p>

                    <p className="mt-6 font-display text-5xl font-bold shimmer-gold">
                      {inr(plan.daily_display)}
                    </p>
                    <p className="text-xs uppercase tracking-[0.18em] text-cream/55">per day</p>

                    <p className="mt-4 text-sm text-cream/75">
                      {inr(plan.price)} <span className="text-cream/50">/ {plan.billing_period}</span>
                    </p>

                    <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-[11px] font-semibold">
                      <span className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-accent">
                        {plan.discount_percentage}% service discount
                      </span>
                      {plan.slot_limit != null ? (
                        <span className="rounded-full border border-cream/15 px-3 py-1 text-cream/70">
                          {remaining ?? plan.slot_limit} slots left
                        </span>
                      ) : null}
                    </div>

                    <Button
                      asChild
                      variant={featured ? "lime" : "onOlive"}
                      className="mt-7 w-full"
                    >
                      <a href="#plans">View Plan Details</a>
                    </Button>

                    {/* podium base */}
                    <span
                      aria-hidden
                      className={cn(
                        "pointer-events-none absolute inset-x-6 -bottom-3 -z-10 h-8 rounded-b-[1.5rem] bg-gradient-lime opacity-25 blur-md transition-opacity duration-500 group-hover:opacity-45",
                        featured && "opacity-50",
                      )}
                    />
                  </div>
                );
              })}
        </div>

        {/* platform */}
        <div
          aria-hidden
          className="mx-auto mt-6 h-3 w-[86%] rounded-full bg-gradient-lime opacity-25 blur-[6px]"
        />
        <div
          aria-hidden
          className="mx-auto mt-2 h-16 w-[70%] rounded-[50%] bg-accent/12 blur-2xl"
        />
      </div>

      <div className="relative mx-auto mt-12 flex max-w-3xl flex-col justify-center gap-3 text-center sm:flex-row">
        <Button asChild size="lg" variant="lime" className="w-full sm:w-auto">
          <a href="#plans">
            <Sparkles className="size-4" /> Compare All Plans
          </a>
        </Button>
        <Button asChild size="lg" variant="onOlive" className="w-full sm:w-auto">
          <Link to="/contact">Talk to Our Team</Link>
        </Button>
      </div>
    </section>
  );
}
