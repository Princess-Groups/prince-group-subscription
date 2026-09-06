import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/app/AppShell";
import { AdminManagedNote } from "@/components/site/PublicPage";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { inr, shortDate, upcomingPeriods } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/subscription")({
  head: () => ({
    meta: [
      { title: "Subscription & Billing | PRINCE" },
      { name: "description", content: "Manage your plan, advance access reservations and payment history." },
      { property: "og:title", content: "Subscription & Billing | PRINCE" },
      { property: "og:description", content: "Manage your plan, advance access and payment history." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SubscriptionPage,
});

type Sub = {
  id: string;
  status: string;
  start_date: string | null;
  renewal_date: string | null;
  advance_period: string | null;
  leads_used: number;
  plans: { name: string; code: string; price: number; discount_percentage: number } | null;
};

type Payment = {
  id: string;
  base_amount: number;
  discount_amount: number;
  gst_amount: number;
  application_fee: number;
  total_amount: number;
  status: string;
  created_at: string;
};

function SubscriptionPage() {
  const queryClient = useQueryClient();

  const subQuery = useQuery({
    queryKey: ["my-subscription"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("id,status,start_date,renewal_date,advance_period,leads_used,plans(name,code,price,discount_percentage)")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as Sub | null;
    },
  });

  const paymentsQuery = useQuery({
    queryKey: ["my-payments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("id,base_amount,discount_amount,gst_amount,application_fee,total_amount,status,created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Payment[];
    },
  });

  const cancel = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("cancel_my_subscription");
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Subscription cancellation recorded.");
      queryClient.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const reserve = useMutation({
    mutationFn: async (period: string) => {
      const { data, error } = await supabase.rpc("reserve_advance_period", { _period: period });
      if (error) throw error;
      return data as Record<string, unknown>;
    },
    onSuccess: (res) => {
      if (res?.["error"]) {
        toast.error("An active subscription is required.");
        return;
      }
      toast.success("Advance period reserved — pending payment verification.");
      queryClient.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const sub = subQuery.data;

  return (
    <AppShell title="Subscription & Billing" subtitle="Plan, advance access and payment history">
      {subQuery.isLoading ? (
        <Skeleton className="h-52 rounded-3xl" />
      ) : !sub ? (
        <div className="rounded-3xl border border-primary/10 bg-card p-10 text-center shadow-soft">
          <h2 className="text-xl font-bold text-primary">No subscription found</h2>
          <Button asChild variant="hero" className="mt-5">
            <Link to="/plans">Choose a plan</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <div className="rounded-3xl border border-primary/10 bg-card p-7 shadow-soft">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-secondary">
                  Current plan
                </p>
                <h2 className="mt-1 text-2xl font-bold text-primary">{sub.plans?.name}</h2>
              </div>
              <Badge variant={sub.status === "active" ? "default" : "outline"} className="capitalize">
                {sub.status.replaceAll("_", " ")}
              </Badge>
            </div>

            <dl className="mt-6 grid gap-4 sm:grid-cols-2">
              <Item label="Price" value={sub.plans ? `${inr(sub.plans.price)}/month` : "—"} />
              <Item label="Member discount" value={`${sub.plans?.discount_percentage ?? 0}%`} />
              <Item label="Started" value={sub.start_date ? shortDate(sub.start_date) : "—"} />
              <Item label="Renews" value={sub.renewal_date ? shortDate(sub.renewal_date) : "—"} />
            </dl>

            {sub.status !== "active" ? (
              <div className="mt-6 flex items-start gap-2 rounded-2xl bg-muted px-4 py-3 text-xs text-muted-foreground">
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-secondary" />
                This subscription stays pending until the payment gateway confirms a verified
                payment through the webhook. Nothing is marked paid automatically.
              </div>
            ) : null}

            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild variant="hero">
                <Link to="/plans">Change plan</Link>
              </Button>
              <Button
                variant="outline"
                disabled={cancel.isPending || sub.status === "cancelled"}
                onClick={() => cancel.mutate()}
              >
                Cancel subscription
              </Button>
            </div>
          </div>

          <div className="rounded-3xl bg-gradient-olive p-7 text-primary-foreground shadow-lift">
            <h2 className="text-lg font-semibold">Advance access</h2>
            <p className="mt-2 text-sm text-primary-foreground/75">
              Reserve upcoming months in advance. Current reservation:{" "}
              <span className="font-semibold text-accent">{sub.advance_period ?? "none"}</span>
            </p>
            <div className="mt-5 space-y-2">
              {upcomingPeriods(3).map((p: { value: string; label: string }) => (
                <Button
                  key={p.value}
                  variant="onOlive"
                  className="w-full justify-between"
                  disabled={reserve.isPending}
                  onClick={() => reserve.mutate(p.value)}
                >
                  {p.label}
                  <span className="text-xs text-accent">Reserve</span>
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 rounded-3xl border border-primary/10 bg-card p-2 shadow-soft sm:p-4">
        <h2 className="px-4 pt-4 text-lg font-semibold text-primary">Payment history</h2>
        {paymentsQuery.isLoading ? (
          <div className="space-y-3 p-4">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-12 rounded-xl" />
            ))}
          </div>
        ) : (paymentsQuery.data ?? []).length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">No payments recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Base</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>GST</TableHead>
                  <TableHead>Application fee</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(paymentsQuery.data ?? []).map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="text-xs text-muted-foreground">
                      {shortDate(p.created_at)}
                    </TableCell>
                    <TableCell>{inr(p.base_amount)}</TableCell>
                    <TableCell>-{inr(p.discount_amount)}</TableCell>
                    <TableCell>{inr(p.gst_amount)}</TableCell>
                    <TableCell>{inr(p.application_fee)}</TableCell>
                    <TableCell className="font-semibold">{inr(p.total_amount)}</TableCell>
                    <TableCell>
                      <Badge variant={p.status === "paid" ? "default" : "outline"} className="capitalize">
                        {p.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <AdminManagedNote>
        GST percentage, application fee and offer discounts are configured by administrators and
        recalculated on the server for every quote.
      </AdminManagedNote>
    </AppShell>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-semibold text-primary">{value}</dd>
    </div>
  );
}
