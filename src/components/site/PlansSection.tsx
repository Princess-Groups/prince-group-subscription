import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { PlanCard } from "@/components/site/PlanCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/hooks/useAuth";
import { phoneDisplay } from "@/lib/format";
import { settingString, usePlans, useSettings, useSlots } from "@/hooks/usePlatform";
import { supabase } from "@/integrations/supabase/client";

const ERRORS: Record<string, string> = {
  not_authenticated: "Please sign in to subscribe.",
  plan_not_found: "That plan is no longer available.",
  slots_full: "All slots for this plan are currently occupied.",
  subscription_already_exists: "You already have a subscription in progress.",
  plan_not_available_for_bank_executive: "This plan is not available for Bank Executive accounts.",
};

export function PlansSection({
  title = "Choose Your Subscription",
  subtitle = "Every price, discount, slot limit and lead rule below is configured by the administrator and enforced on the server.",
  filter,
}: {
  title?: string;
  subtitle?: string;
  filter?: (code: string) => boolean;
}) {
  const { data: plans, isLoading } = usePlans();
  const { data: slots } = useSlots();
  const { data: settings } = useSettings();
  const { user } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);

  const phone = settingString(settings, "support_phone", "9559155535");

  const subscribe = useMutation({
    mutationFn: async (planCode: string) => {
      const { data, error } = await supabase.rpc("start_subscription", { _plan_code: planCode });
      if (error) throw error;
      return data as Record<string, unknown>;
    },
    onSuccess: (data) => {
      const err = data?.["error"] as string | undefined;
      if (err) {
        toast.error(ERRORS[err] ?? err);
        return;
      }
      queryClient.invalidateQueries();
      toast.success("Subscription created — awaiting payment verification.");
      navigate({ to: "/subscription" });
    },
    onError: (e: Error) => toast.error(e.message),
    onSettled: () => setBusy(null),
  });

  const list = (plans ?? []).filter((p) => (filter ? filter(p.code) : true));

  return (
    <section id="plans" className="relative overflow-hidden bg-gradient-olive py-20 text-cream">
      <div className="grid-lines pointer-events-none absolute inset-0 opacity-40" />
      <div className="hero-orb -left-24 top-0 size-96 bg-accent/20" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
      <div className="max-w-2xl">
        <span className="pill-badge">Membership</span>
        <h2 className="mt-4 text-3xl font-bold sm:text-4xl">{title}</h2>
        <p className="mt-4 text-sm text-cream/70 sm:text-base">{subtitle}</p>
      </div>


      <div className="mt-12 grid gap-6 lg:grid-cols-3">
        {isLoading
          ? [0, 1, 2].map((i) => <Skeleton key={i} className="h-[520px] rounded-3xl" />)
          : list.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                {...(() => {
                  const slot = slots?.find((s) => s.plan_code === plan.code);
                  return slot ? { slot } : {};
                })()}
                supportPhone={phoneDisplay(phone)}
                busy={busy === plan.code}
                onSubscribe={(code) => {
                  if (!user) {
                    navigate({ to: "/auth" });
                    return;
                  }
                  setBusy(code);
                  subscribe.mutate(code);
                }}
              />
            ))}
      </div>

      <p className="mt-6 text-xs text-cream/55">
        <span className="font-semibold text-accent">Admin-managed:</span> Slot counters update live
        from active and pending subscriptions. Payments are only marked successful after
        verification through the payment gateway — nothing is auto-confirmed.
      </p>
      </div>
    </section>

  );
}
