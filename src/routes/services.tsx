import { createFileRoute } from "@tanstack/react-router";
import { FileText, Sparkles } from "lucide-react";

import servicesHeroBg from "@/assets/page-themes/services-section-background.png.asset.json";

import { AdminManagedNote, PageHero, PublicPage } from "@/components/site/PublicPage";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useServices } from "@/hooks/usePlatform";
import { inr } from "@/lib/format";

const title = "Member Services & Discounted Pricing | PRINCE";
const description =
  "Documentation, registration, digital marketing and software services with member pricing from 10% to 50% off, based on your active plan.";

export const Route = createFileRoute("/services")({
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
  component: ServicesPage,
});

type ServiceRow = {
  id: string;
  category: string;
  name: string;
  description: string | null;
  original_price: number | null;
};

const PRIMARY_CATEGORY = "Documentation Services";

function ServiceGlassCard({ service }: { service: ServiceRow }) {
  return (
    <article className="liquid-glass group relative overflow-hidden rounded-[1.75rem] p-6">
      <span
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-12 size-32 rounded-full bg-gradient-lime opacity-25 blur-2xl transition-opacity duration-500 group-hover:opacity-45"
      />
      <span className="relative grid size-11 place-items-center rounded-2xl bg-gradient-olive text-accent">
        <FileText className="size-5" />
      </span>
      <h3 className="relative mt-5 text-base font-semibold text-primary">{service.name}</h3>
      {service.description ? (
        <p className="relative mt-2 text-sm leading-relaxed text-foreground/80">
          {service.description}
        </p>
      ) : null}
      <div className="relative mt-5 flex flex-wrap items-center gap-2">
        {service.original_price ? (
          <span className="text-sm font-semibold text-primary">
            From {inr(service.original_price)}
          </span>
        ) : (
          <span className="text-sm text-foreground/80">Pricing on request</span>
        )}
        <Badge variant="secondary">Member discount applies</Badge>
      </div>
    </article>
  );
}

function ServicesPage() {
  const { data, isLoading } = useServices();
  const rows = (data ?? []) as unknown as ServiceRow[];
  const categories = [...new Set(rows.map((r) => r.category))].sort((a, b) =>
    a === PRIMARY_CATEGORY ? -1 : b === PRIMARY_CATEGORY ? 1 : 0,
  );
  const primary = categories.filter((c) => c === PRIMARY_CATEGORY);
  const rest = categories.filter((c) => c !== PRIMARY_CATEGORY);

  return (
    <PublicPage>
      <PageHero
        bgImage={servicesHeroBg.url}
        eyebrow="Services"
        eyebrowClassName="text-olive-dark text-xs tracking-[0.22em] font-extrabold"
        title={<span className="text-primary">Every service, one member discount</span>}
        subtitle="Your plan discount is applied automatically to eligible services. Starter members save 10%, Business 25% and Premium a flat 50%."
        subtitleClassName="text-olive-light font-bold text-shadow-readable"
      />

      {/* Documentation Services — premium cream + liquid glass */}
      {primary.map((cat) => (
        <section key={cat} className="relative overflow-hidden bg-gradient-cream py-20">
          <span
            aria-hidden
            className="hero-orb -left-24 top-10 size-96 bg-secondary/15"
          />
          <span aria-hidden className="hero-orb -right-24 bottom-0 size-80 bg-accent/20" />

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-secondary/30 bg-card/70 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-secondary backdrop-blur">
              <Sparkles className="size-3.5" /> Most requested
            </span>
            <h2 className="mt-4 text-3xl font-bold text-primary sm:text-4xl">{cat}</h2>
            <p className="mt-3 max-w-2xl text-sm text-foreground/80">
              Certificates, registrations and legal paperwork handled end to end by our branch teams
              across Kanyakumari district.
            </p>

            {isLoading ? (
              <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-48 rounded-[1.75rem]" />
                ))}
              </div>
            ) : (
              <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {rows
                  .filter((r) => r.category === cat)
                  .map((s) => (
                    <ServiceGlassCard key={s.id} service={s} />
                  ))}
              </div>
            )}
          </div>
        </section>
      ))}

      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-40 rounded-3xl" />
            ))}
          </div>
        ) : (
          <div className="space-y-14">
            {rest.map((cat) => (
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
                          <p className="mt-2 text-sm text-foreground/80">{s.description}</p>
                        ) : null}
                        <div className="mt-5 flex flex-wrap items-center gap-2">
                          {s.original_price ? (
                            <span className="text-sm font-semibold text-primary">
                              From {inr(s.original_price)}
                            </span>
                          ) : (
                            <span className="text-sm text-foreground/80">
                              Pricing on request
                            </span>
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
