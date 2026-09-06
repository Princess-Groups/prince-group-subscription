import { createFileRoute } from "@tanstack/react-router";

import { PublicPage } from "@/components/site/PublicPage";
import { PlansSection } from "@/components/site/PlansSection";
import {
  BankExecutiveSection,
  ContactCtaSection,
  HeroSection,
  LoanClientOfferSection,
  ServiceCategoriesSection,
  TrustSection,
} from "@/components/site/sections";

const title = "OliveEdge — Premium Subscription, Loan Leads & Business Access";
const description =
  "Subscribe to unlock exclusive service discounts, loan profiles, business contacts and managed premium leads with live slot availability.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <PublicPage>
      <HeroSection />
      <ServiceCategoriesSection />
      <PlansSection />
      <BankExecutiveSection />
      <LoanClientOfferSection />
      <TrustSection />
      <ContactCtaSection />
    </PublicPage>
  );
}
