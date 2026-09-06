import { createFileRoute } from "@tanstack/react-router";

import { AdminManagedNote, PageHero, PublicPage } from "@/components/site/PublicPage";
import { LoanClientOfferSection } from "@/components/site/sections";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useOffers } from "@/hooks/usePlatform";
import { shortDate } from "@/lib/format";

const title = "Seasonal Offers & Loan Client Discounts | OliveEdge";
const description =
  "Current membership offers including December discounts and the special loan-client subscription, all switched on or off by administrators.";

export const Route = createFileRoute("/offers")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: OffersPage,
});

type Offer = {
  id: string;
  code: string;
  title: string;
  description: string | null;
  discount_percentage: number | null;
  active: boolean;
  starts_at: string | null;
  ends_at: string | null;
};

function OffersPage() {
  const { data, isLoading } = useOffers();
  const offers = (data ?? []) as unknown as Offer[];

  return (
    <PublicPage>
      <PageHero
        eyebrow="Offers"
        title="Live membership offers"
        subtitle="Offers are enabled, scheduled and priced by administrators. Only active offers apply at checkout."
      />

      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-44 rounded-3xl" />
            ))}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {offers.map((o) => (
              <div
                key={o.id}
                className="card-lift rounded-3xl border border-primary/10 bg-card p-6 shadow-soft"
              >
                <div className="flex items-center justify-between">
                  <Badge variant={o.active ? "default" : "outline"}>
                    {o.active ? "Active" : "Inactive"}
                  </Badge>
                  {o.discount_percentage ? (
                    <span className="text-sm font-bold text-secondary">
                      {o.discount_percentage}% OFF
                    </span>
                  ) : null}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-primary">{o.title}</h3>
                {o.description ? (
                  <p className="mt-2 text-sm text-muted-foreground">{o.description}</p>
                ) : null}
                <p className="mt-4 text-xs text-muted-foreground">
                  {o.starts_at ? `From ${shortDate(o.starts_at)}` : "No start date"}
                  {o.ends_at ? ` · until ${shortDate(o.ends_at)}` : ""}
                </p>
              </div>
            ))}
          </div>
        )}

        <AdminManagedNote>
          Offer validity windows and discount percentages are configurable and applied server-side
          during quote calculation.
        </AdminManagedNote>
      </div>

      <LoanClientOfferSection />
    </PublicPage>
  );
}
