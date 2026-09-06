import { createFileRoute } from "@tanstack/react-router";

import { AdminManagedNote, PageHero, PublicPage } from "@/components/site/PublicPage";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useServices } from "@/hooks/usePlatform";
import { inr } from "@/lib/format";

const title = "Member Services & Discounted Pricing | PRINCE";
const description =
  "Loan assistance, documentation, digital marketing and software services with member pricing from 25% to 75% off, based on your active plan.";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: ServicesPage,
});

type ServiceRow = {
  id: string;
  category: string;
  name: string;
  description: string | null;
  base_price: number | null;
};

function ServicesPage() {
  const { data, isLoading } = useServices();
  const rows = (data ?? []) as unknown as ServiceRow[];
  const categories = [...new Set(rows.map((r) => r.category))];

  return (
    <PublicPage>
      <PageHero
        eyebrow="Services"
        title="Every service, one member discount"
        subtitle="Your plan discount is applied automatically to eligible services. Starter members save 25%, Business 50% and Premium 75%."
      />

      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-40 rounded-3xl" />
            ))}
          </div>
        ) : (
          <div className="space-y-14">
            {categories.map((cat) => (
              <section key={cat}>
                <h2 className="text-2xl font-bold text-primary">{cat}</h2>
                <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {rows
                    .filter((r) => r.category === cat)
                    .map((s) => (
                      <div
                        key={s.id}
                        className="card-lift rounded-3xl border border-primary/10 bg-card p-6 shadow-soft"
                      >
                        <h3 className="text-base font-semibold text-primary">{s.name}</h3>
                        {s.description ? (
                          <p className="mt-2 text-sm text-muted-foreground">{s.description}</p>
                        ) : null}
                        <div className="mt-5 flex flex-wrap items-center gap-2">
                          {s.base_price ? (
                            <span className="text-sm font-semibold text-primary">
                              From {inr(s.base_price)}
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">Pricing on request</span>
                          )}
                          <Badge variant="secondary">Member discount applies</Badge>
                        </div>
                      </div>
                    ))}
                </div>
              </section>
            ))}
          </div>
        )}

        <AdminManagedNote>
          Service catalogue, categories and base prices are maintained by administrators. Final
          member price is calculated from your active plan discount at the time of billing.
        </AdminManagedNote>
      </div>
    </PublicPage>
  );
}
