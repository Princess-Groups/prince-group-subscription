import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarClock, Gauge, Ticket, Wallet } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/app/AppShell";
import { AdminManagedNote } from "@/components/site/PublicPage";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { inr, weeklyResetCountdown } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Member Dashboard | OliveEdge" },
      { name: "description", content: "Track your subscription, lead quota, weekly claim attempts and allocations." },
      { property: "og:title", content: "Member Dashboard | OliveEdge" },
      { property: "og:description", content: "Track your subscription, lead quota and allocations." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DashboardPage,
});

type Snapshot = {
  has_subscription: boolean;
  subscription: { id: string; status: string; renewal_date: string | null; leads_used: number; advance_period: string | null } | null;
  plan: { code: string; name: string; price: number; discount_percentage: number; lead_limit: number; weekly_attempt_limit: number; leads_per_attempt: number } | null;
  attempts_used: number;
  total_allocated: number;
};

const CLAIM_ERRORS: Record<string, string> = {
  no_active_subscription: "Your subscription isn't active yet — payment must be verified first.",
  weekly_attempt_used: "You've used this week's claim attempt. It resets next week.",
  lead_limit_reached: "You've reached your plan's total lead limit.",
  no_leads: "No new leads are available for you right now.",
};

function DashboardPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["my-dashboard"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("my_dashboard");
      if (error) throw error;
      return data as unknown as Snapshot;
    },
  });

  const claim = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("claim_leads");
      if (error) throw error;
      return data as Record<string, unknown>;
    },
    onSuccess: (res) => {
      const err = res?.["error"] as string | undefined;
      if (err) return toast.error(CLAIM_ERRORS[err] ?? err);
      toast.success(`${res["allocated"]} lead(s) allocated to your account.`);
      queryClient.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const plan = data?.plan;
  const sub = data?.subscription;
  const used = sub?.leads_used ?? 0;
  const limit = plan?.lead_limit ?? 0;
  const attemptsLeft = Math.max((plan?.weekly_attempt_limit ?? 0) - (data?.attempts_used ?? 0), 0);

  return (
    <AppShell title="Member Dashboard" subtitle="Your subscription, quota and lead activity">
      {isLoading ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-3xl" />
          ))}
        </div>
      ) : !data?.has_subscription ? (
        <div className="rounded-3xl border border-primary/10 bg-card p-10 text-center shadow-soft">
          <h2 className="text-2xl font-bold text-primary">No subscription yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Choose a plan to unlock member discounts, lead allocation and business data.
          </p>
          <Button asChild variant="hero" className="mt-6">
            <Link to="/plans">View plans</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <Stat
              icon={Wallet}
              label="Current Plan"
              value={plan?.name ?? "—"}
              hint={plan ? `${inr(plan.price)}/month · ${plan.discount_percentage}% discount` : ""}
            />
            <Stat
              icon={Gauge}
              label="Subscription Status"
              value={sub?.status?.replaceAll("_", " ") ?? "—"}
              hint={
                sub?.status === "active"
                  ? "Payment verified"
                  : "Activates only after verified payment"
              }
            />
            <Stat
              icon={Ticket}
              label="Leads Used"
              value={`${used} / ${limit}`}
              hint={`${Math.max(limit - used, 0)} remaining in your quota`}
            />
            <Stat
              icon={CalendarClock}
              label="Weekly Attempts Left"
              value={String(attemptsLeft)}
              hint={weeklyResetCountdown()}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <div className="rounded-3xl border border-primary/10 bg-card p-7 shadow-soft">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-primary">Lead quota usage</h2>
                  <p className="text-sm text-muted-foreground">
                    {plan?.leads_per_attempt} lead(s) per weekly claim attempt.
                  </p>
                </div>
                <Badge variant="secondary">{data.total_allocated} allocated all-time</Badge>
              </div>
              <Progress value={limit ? (used / limit) * 100 : 0} className="mt-6 h-2.5" />
              <div className="mt-7 flex flex-wrap gap-3">
                <Button
                  variant="hero"
                  disabled={claim.isPending || attemptsLeft <= 0 || sub?.status !== "active"}
                  onClick={() => claim.mutate()}
                >
                  {attemptsLeft <= 0 ? "Weekly attempt used" : "Claim this week's leads"}
                </Button>
                <Button asChild variant="outline">
                  <Link to="/leads">View my leads</Link>
                </Button>
              </div>
              <AdminManagedNote>
                Each lead can be allocated to your account only once — duplicate allocation is
                permanently blocked by the backend.
              </AdminManagedNote>
            </div>

            <div className="rounded-3xl bg-gradient-olive p-7 text-primary-foreground shadow-lift">
              <h2 className="text-lg font-semibold">Advance access</h2>
              <p className="mt-2 text-sm text-primary-foreground/75">
                Reserve an upcoming period in advance. Reservations stay pending until the payment
                is verified.
              </p>
              <p className="mt-5 text-xs uppercase tracking-widest text-accent">Reserved period</p>
              <p className="font-display text-2xl font-bold">
                {sub?.advance_period ?? "None reserved"}
              </p>
              <Button asChild variant="lime" className="mt-6 w-full">
                <Link to="/subscription">Manage subscription</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Wallet;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="card-lift rounded-3xl border border-primary/10 bg-card p-6 shadow-soft">
      <span className="grid size-10 place-items-center rounded-2xl bg-muted text-secondary">
        <Icon className="size-4" />
      </span>
      <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 font-display text-xl font-bold capitalize text-primary">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
