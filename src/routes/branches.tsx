import { createFileRoute, Link } from "@tanstack/react-router";
import { Phone } from "lucide-react";

import branchesHeroBg from "@/assets/page-themes/branches-section-background.png.asset.json";

import { PageHero, PublicPage } from "@/components/site/PublicPage";
import { BranchesSection, ContactCtaSection } from "@/components/site/sections";
import { Button } from "@/components/ui/button";
import { settingString, useSettings } from "@/hooks/usePlatform";

const title = "20 Branches All Over Kanyakumari | PRINCE Branch Network";
const description =
  "Find your nearest PRINCE branch. 20 branches all over Kanyakumari District for documentation, registration, business services and premium membership access.";

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
  const phone = settingString(settings, "support_phone", "9559155535");

  return (
    <PublicPage>
      <PageHero
        bgImage={branchesHeroBg.url}
        eyebrow="Branch Network"
        title={<span className="text-gradient-olive">20 Branches.</span>}
        highlight="All Over Kanyakumari."
        subtitle="PRINCE GROUP operates 20 branches all over Kanyakumari District, giving members local support for documentation, registration and business services wherever they are."
        actions={
          <>
            <Button asChild size="lg" variant="lime" className="w-full sm:w-auto">
              <a href={`tel:${phone}`}>
                <Phone className="size-4" /> Talk to a branch team
              </a>
            </Button>
            <Button asChild size="lg" variant="onOlive" className="w-full sm:w-auto">
              <Link to="/payment">Explore Plans</Link>
            </Button>
          </>
        }
      />

      <BranchesSection full />
      <ContactCtaSection />
    </PublicPage>
  );
}
