import { createFileRoute } from "@tanstack/react-router";

import { LegalPage } from "@/components/site/LegalPage";

const title = "Refund & Cancellation Policy | PRINCE";
const description =
  "How subscription cancellations, renewals and refund requests are handled for PRINCE memberships.";

export const Route = createFileRoute("/refund")({
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
  component: () => (
    <LegalPage
      eyebrow="Legal"
      title="Refund & Cancellation"
      sections={[
        {
          heading: "Cancelling a subscription",
          body: "You can cancel at any time from the Subscription page. Cancellation stops future renewals; access continues until the end of the paid period.",
        },
        {
          heading: "Refund eligibility",
          body: "Subscription fees are generally non-refundable once leads, contact reveals or discounted services have been used within the billing period. Duplicate or failed-but-charged transactions are refunded in full after verification with the payment gateway.",
        },
        {
          heading: "Application fees and GST",
          body: "Application fees and applicable GST are non-refundable once a payment has been verified.",
        },
        {
          heading: "How to request a refund",
          body: "Contact support with your registered email and the payment reference. Approved refunds are returned to the original payment method within standard gateway timelines.",
        },
      ]}
    />
  ),
});
