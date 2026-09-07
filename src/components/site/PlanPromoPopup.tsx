import { Link } from "@tanstack/react-router";
import { Crown, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { usePlans } from "@/hooks/usePlatform";
import { inr } from "@/lib/format";

const FIRST_DELAY = 12_000;
const VISIBLE_FOR = 14_000;
const REPEAT_AFTER = 90_000;

/**
 * Premium, non-blocking promotional notification that rotates through the
 * live backend plans. Never blocks scrolling, never stacks.
 */
export function PlanPromoPopup() {
  const { data: plans } = usePlans();
  const list = (plans ?? []).slice(0, 3);

  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (dismissed || list.length === 0) return;
    let hideTimer: ReturnType<typeof setTimeout>;
    const show = () => {
      setIndex((i) => (i + 1) % list.length);
      setOpen(true);
      hideTimer = setTimeout(() => setOpen(false), VISIBLE_FOR);
    };
    const first = setTimeout(show, FIRST_DELAY);
    const repeat = setInterval(show, REPEAT_AFTER);
    return () => {
      clearTimeout(first);
      clearTimeout(hideTimer);
      clearInterval(repeat);
    };
  }, [dismissed, list.length]);

  const plan = list[index];
  if (!plan || dismissed) return null;

  return (
    <div
      role="complementary"
      aria-label="Subscription plan promotion"
      className={`pointer-events-none fixed bottom-4 right-4 z-[60] w-[min(22rem,calc(100vw-2rem))] transition-all duration-500 ${
        open ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
      }`}
    >
      <div className="glass-dark pointer-events-auto relative overflow-hidden rounded-3xl border border-accent/30 p-5 text-cream shadow-lift">
        <div className="hero-orb -right-10 -top-10 size-32 bg-accent/25" />
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setDismissed(true);
          }}
          aria-label="Close promotion"
          className="absolute right-3 top-3 grid size-7 place-items-center rounded-full border border-cream/15 text-cream/70 transition-colors hover:bg-cream/10 hover:text-accent"
        >
          <X className="size-3.5" />
        </button>

        <span className="relative inline-flex items-center gap-1.5 rounded-full bg-gradient-lime px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
          <Crown className="size-3" /> Limited Membership
        </span>

        <h3 className="relative mt-4 text-lg font-bold">{plan.name} Plan</h3>
        <p className="relative mt-1 text-xs text-cream/65">{plan.tagline}</p>

        <div className="relative mt-4 flex items-end gap-2">
          <span className="font-display text-3xl font-bold text-accent">
            {inr(plan.daily_display)}
          </span>
          <span className="pb-1 text-xs text-cream/60">
            / day · {inr(plan.price)} {plan.billing_period}
          </span>
        </div>

        <p className="relative mt-3 text-xs text-cream/70">
          {plan.discount_percentage}% member discount on eligible services
          {plan.slot_limit != null ? ` · only ${plan.slot_limit} slots` : ""}.
        </p>

        <Button asChild variant="lime" size="sm" className="relative mt-5 w-full">
          <Link to="/plans" onClick={() => setOpen(false)}>
            View Plan →
          </Link>
        </Button>

        <div className="relative mt-4 flex justify-center gap-1.5">
          {list.map((p, i) => (
            <span
              key={p.id}
              className={`h-1 rounded-full transition-all ${
                i === index ? "w-5 bg-accent" : "w-1.5 bg-cream/25"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
