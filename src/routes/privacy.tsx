import { createFileRoute } from "@tanstack/react-router";

import { LegalPage } from "@/components/site/LegalPage";

const title = "Privacy Policy | OliveEdge";
const description =
  "How OliveEdge collects, protects and logs member data, lead records and business contact information.";

export const Route = createFileRoute("/privacy")({
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
      title="Privacy Policy"
      sections={[
        {
          heading: "What we collect",
          body: "Account details you provide (name, email, phone), subscription and payment records, lead allocations, and logs of the contact details you reveal.",
        },
        {
          heading: "How data is protected",
          body: "Access is enforced at the database level. Members can only read their own subscription, payment and lead records; contact numbers are served only for leads allocated to that member.",
        },
        {
          heading: "Access logging",
          body: "Every contact reveal — allowed or denied — is written to an access log with the member, lead and plan involved. Administrators can audit this log at any time.",
        },
        {
          heading: "Payments",
          body: "Card and bank details are handled entirely by the payment gateway. We store only the gateway references and the amounts charged.",
        },
        {
          heading: "Your choices",
          body: "You can request correction or deletion of your account data by contacting support. Some billing records are retained where required by law.",
        },
      ]}
    />
  ),
});
