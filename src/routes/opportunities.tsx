import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";

import { AdminManagedNote, DemoBadge, PageHero, PublicPage } from "@/components/site/PublicPage";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { inr, shortDate } from "@/lib/format";

const title = "Live Loan Opportunities & Enquiries | PRINCE";
const description =
  "Browse current loan enquiry categories, locations and requirement sizes. Contact details unlock for subscribed members with available lead quota.";

export const Route = createFileRoute("/opportunities")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: OpportunitiesPage,
});

type PublicLead = {
  id: string;
  lead_code: string;
  loan_type: string;
  city: string | null;
  loan_amount: number | null;
  status: string;
  created_at: string;
  is_demo: boolean;
};

function OpportunitiesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["public-leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("id,lead_code,loan_type,city,loan_amount,status,created_at,is_demo")
        .order("created_at", { ascending: false })
        .limit(60);
      if (error) throw error;
      return (data ?? []) as unknown as PublicLead[];
    },
  });

  return (
    <PublicPage>
      <PageHero
        eyebrow="Opportunities"
        title="Available loan opportunities"
        subtitle="Requirement, category and location are public. Customer names and contact numbers are revealed only after a lead is allocated to your account."
      />

      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <DemoBadge />
          <span className="text-xs text-muted-foreground">
            Sample records shown until administrators import live enquiries.
          </span>
        </div>

        {isLoading ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-48 rounded-3xl" />
            ))}
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {(data ?? []).map((lead) => (
              <div
                key={lead.id}
                className="card-lift rounded-3xl border border-primary/10 bg-card p-6 shadow-soft"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold text-secondary">
                    {lead.lead_code}
                  </span>
                  <Badge variant="outline" className="capitalize">
                    {lead.status.replaceAll("_", " ")}
                  </Badge>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-primary">{lead.loan_type}</h3>
                <p className="text-sm text-muted-foreground">{lead.city ?? "Location on request"}</p>
                <p className="mt-4 font-display text-2xl font-bold text-primary">
                  {lead.loan_amount ? inr(lead.loan_amount) : "Amount on request"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Posted {shortDate(lead.created_at)}
                </p>
                <div className="mt-5 flex items-center gap-2 rounded-2xl bg-muted px-3 py-2.5 text-xs text-muted-foreground">
                  <Lock className="size-3.5 shrink-0 text-secondary" />
                  Contact details locked — allocate this lead from your dashboard.
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-12 rounded-3xl bg-gradient-olive p-8 text-center text-primary-foreground">
          <h2 className="text-2xl font-bold">Ready to claim leads?</h2>
          <p className="mt-2 text-sm text-primary-foreground/75">
            Each lead can be allocated to a member only once — permanent duplicate prevention applies.
          </p>
          <Button asChild variant="lime" className="mt-6">
            <Link to="/plans">Choose a plan</Link>
          </Button>
        </div>

        <AdminManagedNote>
          Lead visibility, weekly claim attempts and per-plan quotas are enforced by the backend for
          every request.
        </AdminManagedNote>
      </div>
    </PublicPage>
  );
}
