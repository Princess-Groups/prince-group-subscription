import { createFileRoute } from "@tanstack/react-router";

import { PageHero, PublicPage } from "@/components/site/PublicPage";
import { PlansSection } from "@/components/site/PlansSection";
import { LoanClientOfferSection, TrustSection } from "@/components/site/sections";

const title = "Subscription Plans & Live Slot Availability | OliveEdge";
const description =
  "Compare Starter, Business and Premium memberships with member discounts, lead quotas and live slot availability, all admin-configurable.";

export const Route = createFileRoute("/plans")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: PlansPage,
});

function PlansPage() {
  return (
    <PublicPage>
      <PageHero
        eyebrow="Membership"
        title="Plans built for discounts, opportunities and leads"
        subtitle="Prices, discounts, lead limits and slot counts are managed by administrators and validated on the server at checkout."
      />
      <PlansSection title="All Subscription Plans" />
      <LoanClientOfferSection />
      <TrustSection />
    </PublicPage>
  );
}
