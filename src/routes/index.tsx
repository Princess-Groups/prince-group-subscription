import { createFileRoute } from "@tanstack/react-router";

import { PublicPage } from "@/components/site/PublicPage";
import { PlansSection } from "@/components/site/PlansSection";
import {
  BankExecutiveSection,
  BranchesSection,
  ContactCtaSection,
  HeroSection,
  LoanClientOfferSection,
  LoanServicesSection,
  ServiceCategoriesSection,
  TrustSection,
} from "@/components/site/sections";

const title = "PRINCE — Premium Access, Opportunities, Benefits & Loan Services";
const description =
  "Subscribe to unlock exclusive service discounts, loan profiles, business contacts and managed premium leads, with 20 branches across India and live slot availability.";

export const Route = createFileRoute("/")({
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
  component: Index,
});

function Index() {
  return (
    <PublicPage>
      <HeroSection />
      <ServiceCategoriesSection />
      <LoanServicesSection />
      <PlansSection />
      <BranchesSection />
      <BankExecutiveSection />
      <LoanClientOfferSection />
      <TrustSection />
      <ContactCtaSection />
    </PublicPage>
  );
}
