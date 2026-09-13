import { Link } from "@tanstack/react-router";
import { Check, Crown, Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { Plan, SlotCount } from "@/hooks/usePlatform";
import { inr } from "@/lib/format";
import { cn } from "@/lib/utils";

export function PlanCard({
  plan,
  slot,
  supportPhone,
  onSubscribe,
  busy,
}: {
  plan: Plan;
  slot?: SlotCount;
  supportPhone: string;
  onSubscribe?: (planCode: string) => void;
  busy?: boolean;
}) {
  const limited = plan.slot_limit != null;
  const remaining = slot?.remaining ?? plan.slot_limit ?? null;
  const occupied = slot?.occupied ?? 0;
  const full = limited && (remaining ?? 0) <= 0;
  const highlight = plan.highlight;

  return (
    <div
      className={cn(
        "hover-glow relative flex h-full flex-col rounded-[1.75rem] border p-7 text-cream",
        highlight
          ? "border-accent/45 bg-cream/10 shadow-lift glow-lime"
          : "glass-dark border-cream/12",
      )}
    >
      {highlight ? (
        <span className="absolute -top-3 left-7 inline-flex items-center gap-1 rounded-full bg-gradient-lime px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-primary">
          <Crown className="size-3" /> Most Exclusive
        </span>
      ) : null}

      <p
        className={cn(
          "text-xs font-bold uppercase tracking-[0.2em]",
          highlight ? "text-accent" : "text-accent/85",
        )}
      >
        {plan.name}
      </p>
      <p className={cn("mt-1 text-sm", highlight ? "text-cream/95" : "text-cream/90")}>
        {plan.tagline}
      </p>

      <div className="mt-6 flex items-end gap-2">
        <span className="font-display text-4xl font-bold">{inr(plan.daily_display)}</span>
        <span className={cn("pb-1.5 text-sm", highlight ? "text-cream/90" : "text-cream/90")}>
          /day
        </span>
      </div>
      <p className={cn("text-sm font-semibold", highlight ? "text-accent" : "text-accent/85")}>
        {inr(plan.price)}/{plan.billing_period === "monthly" ? "month" : plan.billing_period}
        {plan.code === "premium" ? ` · ${inr(plan.daily_display * 365)}/year equivalent` : ""}
      </p>

      <div
        className={cn(
          "mt-5 rounded-2xl px-4 py-3 text-sm font-semibold",
          highlight ? "bg-cream/12 text-accent" : "bg-cream/8 text-cream",
        )}
      >
        {plan.code === "premium"
          ? `Flat ${plan.discount_percentage}% Discount on eligible services`
          : `${plan.discount_percentage}% discount on eligible services`}
        <span className={cn("mt-1 block text-xs font-normal", highlight ? "text-cream/90" : "text-cream/90")}>
          {plan.lead_limit} lead allocations · {plan.weekly_attempt_limit} claim attempt/week
        </span>
      </div>

      {limited ? (
        <div className="mt-5">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className={highlight ? "text-cream/95" : "text-cream/90"}>
              {full ? (plan.code === "premium" ? "Premium Slots Full" : "Limit Reached") : `${remaining} / ${plan.slot_limit} Slots Available`}
            </span>
            <span className={highlight ? "text-accent" : "text-accent/85"}>{occupied} occupied</span>
          </div>
          <Progress value={((occupied / (plan.slot_limit || 1)) * 100) | 0} className="mt-2 h-2 bg-cream/15" />
        </div>
      ) : null}

      <ul className="mt-6 flex-1 space-y-2.5 text-sm">
        {plan.benefits.map((b) => (
          <li key={b} className="flex gap-2">
            <Check className={cn("mt-0.5 size-4 shrink-0", highlight ? "text-accent" : "text-accent/85")} />
            <span className={highlight ? "text-cream/90" : "text-cream/95"}>{b}</span>
          </li>
        ))}
      </ul>

      <div className="mt-7">
        {full ? (
          <div className="space-y-2">
            <Button disabled variant="outline" className="w-full border-cream/25 text-cream/90">
              <Lock className="size-4" />
              {plan.code === "premium" ? "Premium Slots Full" : "Limit Reached"}
            </Button>
            <Button asChild variant={highlight ? "lime" : "onOlive"} className="w-full">
              <a href={`tel:${supportPhone}`}>Contact Us for Availability</a>
            </Button>
          </div>
        ) : onSubscribe ? (
          <Button
            variant={highlight ? "lime" : "onOlive"}
            className="w-full"
            disabled={busy}
            onClick={() => onSubscribe(plan.code)}
          >
            {plan.code === "starter" ? "Start for ₹1" : "Subscribe Now"}
          </Button>
        ) : (
          <Button asChild variant={highlight ? "lime" : "onOlive"} className="w-full">
            <Link to="/payment" search={{ plan: plan.code }}>
              {plan.code === "starter" ? "Start for ₹1" : "Subscribe Now"}
            </Link>
          </Button>
        )}
        <p className={cn("mt-3 text-center text-[11px]", highlight ? "text-cream/90" : "text-cream/95")}>
          Recurring payment enabled · GST &amp; application fee calculated at checkout
        </p>
      </div>
    </div>
  );
}
