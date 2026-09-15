import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BadgeCheck,
  Clock,
  Headset,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import contactBackground from "@/assets/page-themes/contact-page-background.png.asset.json";
import { AdminManagedNote, PageHero, PublicPage } from "@/components/site/PublicPage";
import { Button } from "@/components/ui/button";
import { phoneDisplay } from "@/lib/format";
import { settingString, useSettings } from "@/hooks/usePlatform";

const title = "Contact Support & Membership Availability | PRINCE";
const description =
  "Talk to the PRINCE team about subscription plans, pricing, benefits, premium slots and business access.";

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

const ASSURANCES = [
  {
    icon: Sparkles,
    title: "Plan guidance, not guesswork",
    text: "We walk you through the ₹1, ₹10 and ₹100 subscriptions and show exactly what each one unlocks.",
  },
  {
    icon: BadgeCheck,
    title: "Clear pricing & benefits",
    text: "Understand discounts, slot limits, validity and renewals before you pay — no surprises later.",
  },
  {
    icon: ShieldCheck,
    title: "Verified activation",
    text: "Every payment is verified by our team before your plan and data access is switched on.",
  },
  {
    icon: Headset,
    title: "Real people, local support",
    text: "Our Kanyakumari-based team answers in Tamil or English through call, WhatsApp or email.",
  },
];

function ContactPage() {
  const { data: settings } = useSettings();
  const phone = settingString(settings, "support_phone", "9559155535");
  const email = settingString(settings, "support_email", "jp@princegroup.net");
  const address = settingString(settings, "support_address", "Kanyakumari, Tamil Nadu");
  const waNumber = `91${phone.replace(/\D/g, "").slice(-10)}`;

  const channels = [
    {
      icon: Phone,
      label: "Call us",
      value: phoneDisplay(phone),
      note: "Fastest way to get plan details",
      href: `tel:${phone}`,
      cta: "Call now",
    },
    {
      icon: Mail,
      label: "Email",
      value: email,
      note: "Share your requirement in detail",
      href: `mailto:${email}`,
      cta: "Send email",
    },
    {
      icon: MapPin,
      label: "Office",
      value: address,
      note: "Visit our team in person",
      href: undefined as string | undefined,
      cta: "",
    },
  ];

  return (
    <PublicPage>
      <PageHero
        eyebrow="Contact"
        title="Want to know more about our subscription plans?"
        subtitle="Our team is here to help you compare plans, understand pricing and benefits, and pick the subscription that fits your business — before you spend a rupee."
        bgImageCss={contactBackground.url}
        cleanBackground
        actions={
          <>
            <Button asChild size="lg" className="rounded-full px-7">
              <a href={`tel:${phone}`}>Talk to our team</a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-full border-cream/50 bg-cream/10 px-7 text-cream hover:bg-cream/20"
            >
              <a href={`mailto:${email}`}>Contact us</a>
            </Button>
          </>
        }
      />

      {/* Channels */}
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-16 sm:px-6 lg:grid-cols-3">
        {channels.map((c) => (
          <div
            key={c.label}
            className="card-lift rounded-3xl border border-primary/10 bg-card p-7 shadow-soft"
          >
            <span className="grid size-12 place-items-center rounded-2xl bg-gradient-olive text-accent">
              <c.icon className="size-5" />
            </span>
            <p className="mt-5 text-xs font-semibold uppercase tracking-widest text-secondary">
              {c.label}
            </p>
            <p className="mt-1 text-lg font-bold text-primary">{c.value}</p>
            <p className="mt-1 text-sm text-foreground/70">{c.note}</p>
            {c.href ? (
              <Button asChild variant="ghost" size="sm" className="mt-3 px-0">
                <a href={c.href}>{c.cta} →</a>
              </Button>
            ) : null}
          </div>
        ))}
      </div>

      {/* Why talk to us */}
      <section className="relative overflow-hidden bg-gradient-olive px-4 py-16 text-cream sm:px-6 sm:py-20">
        <div className="hero-orb -right-24 -top-24 size-96 bg-accent/20" />
        <div className="relative mx-auto max-w-7xl">
          <span className="pill-badge">Our team is here to help</span>
          <h2 className="mt-5 max-w-3xl text-3xl font-bold leading-tight sm:text-4xl">
            Not sure which plan is right for you?{" "}
            <span className="text-gradient-olive">We&apos;ll help you choose.</span>
          </h2>
          <p className="mt-4 max-w-2xl text-sm text-cream/85 sm:text-base">
            Tell us what you need — candidate data, B2B contacts, enquiries or referrals — and we
            will recommend the subscription that gives you the most value.
          </p>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {ASSURANCES.map((a) => (
              <div
                key={a.title}
                className="rounded-3xl border border-cream/20 bg-cream/10 p-6 backdrop-blur-xl transition hover:-translate-y-1 hover:bg-cream/15"
              >
                <span className="grid size-11 place-items-center rounded-2xl bg-accent/20 text-accent">
                  <a.icon className="size-5" />
                </span>
                <h3 className="mt-4 text-base font-bold text-cream">{a.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-cream/80">{a.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="relative overflow-hidden rounded-[2rem] border border-primary/10 bg-card p-8 shadow-soft sm:p-12">
          <div className="grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.25em] text-secondary">
                Talk to our team
              </span>
              <h2 className="mt-4 text-2xl font-bold text-primary sm:text-3xl">
                Get plan details, benefits and pricing in one quick conversation
              </h2>
              <p className="mt-3 max-w-xl text-sm text-foreground/80 sm:text-base">
                Call, WhatsApp or email us. We will explain every subscription, what data it
                unlocks, and how to activate it today.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild size="lg" className="rounded-full px-7">
                  <a href={`tel:${phone}`}>
                    <Phone className="mr-2 size-4" /> Talk to our team
                  </a>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-full px-7">
                  <a href={`https://wa.me/${waNumber}`} target="_blank" rel="noreferrer">
                    <MessageCircle className="mr-2 size-4" /> WhatsApp us
                  </a>
                </Button>
                <Button asChild size="lg" variant="ghost" className="rounded-full px-5">
                  <Link to="/plans">View plans →</Link>
                </Button>
              </div>
            </div>

            <div className="rounded-3xl border border-primary/10 bg-gradient-olive p-7 text-cream">
              <span className="grid size-11 place-items-center rounded-2xl bg-cream/15 text-accent">
                <Clock className="size-5" />
              </span>
              <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-cream/70">
                Support desk
              </p>
              <p className="mt-2 text-xl font-bold">{phoneDisplay(phone)}</p>
              <p className="mt-1 text-sm text-cream/85">{email}</p>
              <p className="mt-4 text-sm text-cream/75">{address}</p>
            </div>
          </div>
        </div>

        <AdminManagedNote>
          Support contact details are stored in settings and can be updated by an administrator at
          any time.
        </AdminManagedNote>
      </section>
    </PublicPage>
  );
}
