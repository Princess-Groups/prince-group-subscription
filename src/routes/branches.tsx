import { createFileRoute, Link } from "@tanstack/react-router";
import { MapPin, Navigation, Phone } from "lucide-react";

import { PageHero, PublicPage } from "@/components/site/PublicPage";
import { BranchesSection, ContactCtaSection } from "@/components/site/sections";
import { Button } from "@/components/ui/button";
import { settingString, useSettings } from "@/hooks/usePlatform";

const title = "20 Branches Across India | PRINCE Branch Network";
const description =
  "Find your nearest PRINCE branch. 20 branches across India for loan assistance, documentation support, business services and premium membership access.";

export const Route = createFileRoute("/branches")({
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
  component: BranchesPage,
});

function BranchesPage() {
  const { data: settings } = useSettings();
  const phone = settingString(settings, "support_phone", "95559155535");

  return (
    <PublicPage>
      <PageHero
        eyebrow="Branch Network"
        title="20 Branches."
        highlight="One National Network."
        subtitle="PRINCE operates a growing branch network across India, giving members local support for loan assistance, documentation and business services wherever they are."
        actions={
          <>
            <Button asChild size="lg" variant="lime" className="w-full sm:w-auto">
              <a href={`tel:${phone}`}>
                <Phone className="size-4" /> Talk to a branch team
              </a>
            </Button>
            <Button asChild size="lg" variant="onOlive" className="w-full sm:w-auto">
              <Link to="/plans">Explore Plans</Link>
            </Button>
          </>
        }
        visual={
          <div className="glass-dark relative rounded-[2rem] p-8">
            <div className="hero-orb -right-10 -top-10 size-56 bg-accent/25" />
            <div className="relative flex items-center gap-2 text-accent">
              <Navigation className="size-4" />
              <span className="text-xs font-semibold uppercase tracking-[0.2em]">Coverage</span>
            </div>
            <div className="relative mt-6 grid grid-cols-2 gap-4">
              {[
                { value: "20", label: "Branches" },
                { value: "12+", label: "States" },
                { value: "1,000+", label: "Daily enquiries" },
                { value: "6L+", label: "Business contacts" },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl border border-cream/12 bg-cream/5 px-4 py-5">
                  <p className="font-display text-2xl font-bold text-accent">{s.value}</p>
                  <p className="mt-1 text-[11px] uppercase tracking-wider text-cream/60">{s.label}</p>
                </div>
              ))}
            </div>
            <p className="relative mt-6 flex items-center gap-2 text-xs text-cream/60">
              <MapPin className="size-3.5 text-accent" /> Coverage is administered centrally and
              updated as new branches open.
            </p>
          </div>
        }
      />

      <BranchesSection full />
      <ContactCtaSection />
    </PublicPage>
  );
}
