import { createFileRoute } from "@tanstack/react-router";

import { LegalPage } from "@/components/site/LegalPage";

const title = "Terms & Conditions | OliveEdge";
const description =
  "Membership terms covering subscriptions, lead allocation limits, contact access rules and acceptable use of the OliveEdge platform.";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: () => (
    <LegalPage
      eyebrow="Legal"
      title="Terms & Conditions"
      sections={[
        {
          heading: "Membership and eligibility",
          body: "Membership is limited and granted at the platform administrator's discretion. Business and Premium memberships are capped by the published slot counts, and Bank Executive accounts require administrator approval before access is granted.",
        },
        {
          heading: "Subscriptions and billing",
          body: "Plan prices, discounts, GST and application fees are configured by administrators and calculated on the server at checkout. Recurring billing applies until you cancel. A subscription becomes active only after the payment gateway confirms a verified payment.",
        },
        {
          heading: "Lead allocation",
          body: "Leads are allocated according to your plan's weekly attempt limit and total lead quota. A lead already allocated to your account can never be allocated to it again. Contact details are released only for leads allocated to you, and every reveal is recorded.",
        },
        {
          heading: "Service outcomes",
          body: "Loan assistance, documentation, marketing and software services are facilitation services. We do not guarantee loan approval, sanction amount, or business outcomes of any kind.",
        },
        {
          heading: "Acceptable use",
          body: "Reselling, scraping or bulk-exporting contact data is prohibited and may result in immediate suspension without refund.",
        },
      ]}
    />
  ),
});
