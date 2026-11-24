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
        "subscription-plan-text hover-glow relative flex h-full flex-col rounded-[1.75rem] border p-7 text-cream",
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
          highlight ? "text-accent" : "text-accent",
        )}
      >
        {plan.name}
      </p>
      <p className="mt-1 text-sm font-medium text-cream">
        {plan.tagline}
      </p>

      <div className="mt-6 flex items-end gap-2">
        <span className="font-display text-4xl font-bold text-cream">{inr(plan.daily_display)}</span>
        <span className="pb-1.5 text-sm font-medium text-cream">
          /day
        </span>
      </div>
      <p className="text-sm font-semibold text-accent">
        {inr(plan.price)}/{plan.billing_period === "monthly" ? "month" : plan.billing_period}
        {plan.code === "premium" ? ` · ${inr(plan.daily_display * 365)}/year equivalent` : ""}
      </p>

      <div
        className={cn(
          "mt-5 rounded-2xl px-4 py-3 text-sm font-semibold",
          highlight ? "bg-cream/12 text-accent" : "bg-cream/10 text-accent",
        )}
      >
        {plan.code === "premium"
          ? `Flat ${plan.discount_percentage}% Discount on eligible services`
          : `${plan.discount_percentage}% discount on eligible services`}
        <span className="mt-1 block text-xs font-normal text-cream">
          {plan.lead_limit} unique loan leads per month
        </span>
      </div>

      {limited ? (
        <div className="mt-5">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-cream">
              {full ? (plan.code === "premium" ? "Premium Slots Full" : "Limit Reached") : `${remaining} / ${plan.slot_limit} Slots Available`}
            </span>
            <span className="text-accent">{occupied} occupied</span>
          </div>
          <Progress value={((occupied / (plan.slot_limit || 1)) * 100) | 0} className="mt-2 h-2 bg-cream/20" />
        </div>
      ) : null}

      <ul className="mt-6 flex-1 space-y-2.5 text-sm font-medium">
        {plan.benefits.map((b) => (
          <li key={b} className="flex gap-2">
            <Check className="mt-0.5 size-4 shrink-0 text-accent" />
            <span className="text-cream">{b}</span>
          </li>
        ))}
      </ul>

      <div className="mt-7">
        {full ? (
          <div className="space-y-2">
            <Button disabled variant="outline" className="w-full border-cream/30 text-cream">
              <Lock className="size-4" />
              {plan.code === "premium" ? "Premium Slots Full" : "Limit Reached"}
            </Button>
            <Button asChild variant={highlight ? "lime" : "onOlive"} className={cn("w-full", !highlight && "border-accent/60 bg-accent/15 font-bold")}>
              <a href={`tel:${supportPhone}`}>Contact Us for Availability</a>
            </Button>
          </div>
        ) : onSubscribe ? (
          <Button
            variant={highlight ? "lime" : "onOlive"}
            className={cn("w-full", !highlight && "border-accent/60 bg-accent/15 font-bold")}
            disabled={busy}
            onClick={() => onSubscribe(plan.code)}
          >
            {plan.code === "starter" ? "Start for ₹1" : "Subscribe Now"}
          </Button>
        ) : (
          <Button asChild variant={highlight ? "lime" : "onOlive"} className={cn("w-full", !highlight && "border-accent/60 bg-accent/15 font-bold")}>
            <Link to="/payment" search={{ plan: plan.code }}>
              {plan.code === "starter" ? "Start for ₹1" : "Subscribe Now"}
            </Link>
          </Button>
        )}
        <p className="mt-3 text-center text-[11px] font-medium text-cream">
          Recurring payment enabled · GST &amp; application fee calculated at checkout
        </p>
      </div>
    </div>
  );
}
