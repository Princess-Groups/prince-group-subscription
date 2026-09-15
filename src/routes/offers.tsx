import { createFileRoute } from "@tanstack/react-router";

import offersBackground from "@/assets/page-themes/offers-page-background.png.asset.json";
import { DecemberOffer, type OfferRow } from "@/components/site/DecemberOffer";
import { AdminManagedNote, PageHero, PublicPage } from "@/components/site/PublicPage";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useOffers } from "@/hooks/usePlatform";
import { shortDate } from "@/lib/format";

const title = "December Offer & Membership Discounts | PRINCE";
const description =
  "The December campaign plus every live membership discount, switched on, scheduled and priced by administrators.";

export const Route = createFileRoute("/offers")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OffersPage,
});

function OffersPage() {
  const { data, isLoading } = useOffers();
  const offers = (data ?? []) as unknown as OfferRow[];
  const december = offers.find((o) => o.code === "december");
  const others = offers.filter((o) => o.code !== "december");

  return (
    <PublicPage>
      <PageHero
        eyebrow="Offers"
        title="Live membership offers"
        subtitle="Offers are enabled, scheduled and priced by administrators. Only active offers apply at checkout."
        bgImageCss={offersBackground.url}
        cleanBackground
      />

      {december ? <DecemberOffer offer={december} /> : null}

      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-44 rounded-3xl" />
            ))}
          </div>
        ) : others.length > 0 ? (
          <>
            <h2 className="text-2xl font-bold text-primary">More live offers</h2>
            <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {others.map((o) => (
                <div
                  key={o.id}
                  className="card-lift rounded-3xl border border-primary/10 bg-card p-6 shadow-soft"
                >
                  <div className="flex items-center justify-between">
                    <Badge variant={o.active ? "default" : "outline"}>
                      {o.active ? "Active" : "Inactive"}
                    </Badge>
                    {o.discount ? (
                      <span className="text-sm font-bold text-secondary">{o.discount}% OFF</span>
                    ) : null}
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-primary">{o.title}</h3>
                  {o.description ? (
                    <p className="mt-2 text-sm text-foreground/80">{o.description}</p>
                  ) : null}
                  <p className="mt-4 text-xs text-foreground/80">
                    {o.start_date ? `From ${shortDate(o.start_date)}` : "No start date"}
                    {o.end_date ? ` · until ${shortDate(o.end_date)}` : ""}
                  </p>
                </div>
              ))}
            </div>
          </>
        ) : null}

        <AdminManagedNote>
          Offer validity windows and discount percentages are configurable and applied server-side
          during quote calculation.
        </AdminManagedNote>
      </div>
    </PublicPage>
  );
}
