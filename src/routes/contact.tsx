import { createFileRoute } from "@tanstack/react-router";
import { Mail, MapPin, Phone } from "lucide-react";

import { AdminManagedNote, PageHero, PublicPage } from "@/components/site/PublicPage";
import { Button } from "@/components/ui/button";
import { settingString, useSettings } from "@/hooks/usePlatform";

const title = "Contact Support & Membership Availability | PRINCE";
const description =
  "Talk to the PRINCE team about plan availability, premium slots, lead allocation and business access.";

export const Route = createFileRoute("/contact")({
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
  component: ContactPage,
});

function ContactPage() {
  const { data: settings } = useSettings();
  const phone = settingString(settings, "support_phone", "9559155535");
  const email = settingString(settings, "support_email", "support@oliveedge.in");
  const address = settingString(settings, "support_address", "Kanyakumari, Tamil Nadu");

  return (
    <PublicPage>
      <PageHero
        eyebrow="Contact"
        title="We're here to help"
        subtitle="For plan availability, premium slots and account approvals, reach the support desk directly."
      />

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-16 sm:px-6 lg:grid-cols-3">
        {[
          { icon: Phone, label: "Call us", value: phone, href: `tel:${phone}` },
          { icon: Mail, label: "Email", value: email, href: `mailto:${email}` },
          { icon: MapPin, label: "Office", value: address },
        ].map((c) => (
          <div key={c.label} className="card-lift rounded-3xl border border-primary/10 bg-card p-7 shadow-soft">
            <span className="grid size-11 place-items-center rounded-2xl bg-gradient-olive text-accent">
              <c.icon className="size-5" />
            </span>
            <p className="mt-5 text-xs font-semibold uppercase tracking-widest text-secondary">
              {c.label}
            </p>
            <p className="mt-1 text-lg font-semibold text-primary">{c.value}</p>
            {c.href ? (
              <Button asChild variant="ghost" size="sm" className="mt-3 px-0">
                <a href={c.href}>Get in touch →</a>
              </Button>
            ) : null}
          </div>
        ))}
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        <AdminManagedNote>
          Support contact details are stored in settings and can be updated by an administrator at
          any time.
        </AdminManagedNote>
      </div>
    </PublicPage>
  );
}
