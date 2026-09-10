import { createFileRoute } from "@tanstack/react-router";

import { PublicPage } from "@/components/site/PublicPage";
import { PlansSection } from "@/components/site/PlansSection";
import {
  BankExecutiveSection,
  BranchesSection,
  ContactCtaSection,
  HeroSection,
  LoanCandidateDataSection,
  ServiceShowcaseSection,
  SlotAvailabilitySection,
  TrustSection,
} from "@/components/site/sections";

const title = "PRINCE GROUP — Premium Data Access, Offers & Services in Kanyakumari";
const description =
  "Subscribe to unlock 1,00,000+ loan candidate profiles, 6,00,000+ Kanyakumari business contacts, exclusive service discounts and live slot availability — 20 branches all over Kanyakumari.";

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
      <SlotAvailabilitySection />
      <BankExecutiveSection />
      <ServiceShowcaseSection />
      <LoanCandidateDataSection />
      <PlansSection cinematicFocus />
      <BranchesSection />
      <TrustSection />
      <ContactCtaSection />
    </PublicPage>
  );
}
