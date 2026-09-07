import { createFileRoute } from "@tanstack/react-router";

import { PlansHero } from "@/components/site/PlansHero";
import { PublicPage } from "@/components/site/PublicPage";
import { PlansSection } from "@/components/site/PlansSection";
import { TrustSection } from "@/components/site/sections";

const title = "Subscription Plans & Live Slot Availability | PRINCE";
const description =
  "Compare Starter, Business and Premium memberships with member discounts, lead quotas and live slot availability, all admin-configurable.";

export const Route = createFileRoute("/plans")({
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
  component: PlansPage,
});

function PlansPage() {
  return (
    <PublicPage>
      <PlansHero />
      <PlansSection title="All Subscription Plans" />
      <TrustSection />
    </PublicPage>
  );
}
