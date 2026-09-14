import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Building2,
  Clock,
  Crown,
  Mail,
  MapPin,
  Navigation,
  Phone,
  Sparkles,
  Users,
} from "lucide-react";

import officeBackground from "@/assets/page-themes/office-background.png.asset.json";
import { PublicPage } from "@/components/site/PublicPage";
import { Button } from "@/components/ui/button";
import { phoneDisplay } from "@/lib/format";
import { settingString, useSettings } from "@/hooks/usePlatform";

const title = "PRINCE Corporate Office — Address, Hours & Departments";
const description =
  "Visit the PRINCE corporate office: address, working hours, department desks and direct contact lines for members, bank executives and partners.";

export const Route = createFileRoute("/office")({
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
  component: OfficePage,
});

function OfficePage() {
  const { data: settings } = useSettings();
  const phone = settingString(settings, "support_phone", "9559155535");
  const email = settingString(settings, "support_email", "jp@princegroup.net");
  const address = settingString(
    settings,
    "office_address",
    "PRINCE Corporate Office, Main Road, Nagercoil, Kanyakumari, Tamil Nadu",
  );

  const cards = [
    { icon: MapPin, title: "Head Office", body: address },
    { icon: Phone, title: "Direct Line", body: phoneDisplay(phone), href: `tel:${phone}` },
    { icon: Mail, title: "Email Desk", body: email, href: `mailto:${email}` },
    { icon: Clock, title: "Working Hours", body: "Monday – Saturday · 9:30 AM to 7:00 PM IST" },
  ];

  const desks = [
    { icon: Users, title: "Membership Desk", body: "Plan onboarding, renewals and member support." },
    { icon: Building2, title: "Bank Executive Desk", body: "Candidate data access and executive accounts." },
    { icon: Crown, title: "Partnerships", body: "Branch tie-ups, service partners and enterprise data." },
  ];

  return (
    <PublicPage>
      <div className="relative isolate">
        {/* Full-page background — Home page style fit */}
        <div
          className="absolute inset-0 -z-20 bg-top bg-no-repeat [background-size:100%_auto]"
          style={{ backgroundImage: `url(${officeBackground.url})` }}
          aria-hidden="true"
        />
        <div className="absolute inset-0 -z-10 bg-primary/20" aria-hidden="true" />

        {/* Hero */}
        <section className="relative overflow-hidden text-cream">
          <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-4 py-20 sm:px-6 lg:py-32">
            <div className="reveal">
              <span className="pill-badge border-gold/40 bg-gold/12 text-gold">
                <Sparkles className="size-3.5" /> Our Office
              </span>
              <h1 className="mt-6 text-4xl font-bold leading-[1.06] sm:text-5xl lg:text-6xl">
                Visit the PRINCE
                <span className="block text-gradient-olive">Corporate Office.</span>
              </h1>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-cream/90">
                One address for membership support, bank executive data access and partnership
                conversations — backed by our branch network across Kanyakumari District.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Button asChild size="lg" variant="lime" className="w-full sm:w-auto">
                  <a href={`tel:${phone}`}>
                    <Phone className="size-4" /> Call the office
                  </a>
                </Button>
                <Button asChild size="lg" variant="onOlive" className="w-full sm:w-auto">
                  <Link to="/branches">
                    <Navigation className="size-4" /> Find a branch
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Office details */}
        <section className="relative py-20">
          <div className="absolute inset-0 -z-10 bg-cream/92" aria-hidden="true" />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
            <div className="max-w-2xl">
              <span className="text-xs font-bold uppercase tracking-[0.25em] text-secondary">
                Office Details
              </span>
              <h2 className="mt-3 text-3xl font-bold text-primary sm:text-4xl">
                Everything you need to reach us
              </h2>
            </div>

            <div className="mt-12 grid gap-5 sm:grid-cols-2">
              {cards.map((c) => (
                <div
                  key={c.title}
                  className="card-lift rounded-3xl border border-primary/10 bg-card p-7 shadow-soft transition-colors hover:border-secondary/40"
                >
                  <span className="grid size-11 place-items-center rounded-2xl bg-gradient-olive text-accent">
                    <c.icon className="size-5" />
                  </span>
                  <h3 className="mt-5 text-lg font-semibold text-primary">{c.title}</h3>
                  {c.href ? (
                    <a
                      href={c.href}
                      className="mt-2 inline-block text-sm font-medium text-secondary hover:underline"
                    >
                      {c.body}
                    </a>
                  ) : (
                    <p className="mt-2 text-sm leading-relaxed text-foreground/80">{c.body}</p>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-14 grid gap-5 lg:grid-cols-3">
              {desks.map((d) => (
                <div
                  key={d.title}
                  className="card-lift rounded-3xl border border-primary/10 bg-card p-7 shadow-soft"
                >
                  <span className="grid size-11 place-items-center rounded-2xl bg-secondary/12 text-secondary">
                    <d.icon className="size-5" />
                  </span>
                  <h3 className="mt-5 text-base font-semibold text-primary">{d.title}</h3>
                  <p className="mt-2 text-sm text-foreground/80">{d.body}</p>
                </div>
              ))}
            </div>

            <div className="relative mt-14 overflow-hidden rounded-[2rem] bg-gradient-olive p-8 text-cream shadow-lift sm:p-12">
              <div className="hero-orb -right-16 -top-16 size-72 bg-gold/25" />
              <div className="relative grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
                <div>
                  <h3 className="text-2xl font-bold sm:text-3xl">Planning a visit?</h3>
                  <p className="mt-3 max-w-xl text-sm text-cream/90">
                    Call ahead and we will keep the right desk free for you — membership, candidate
                    data or partnerships.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3 lg:justify-end">
                  <Button asChild variant="lime">
                    <Link to="/contact">Send an enquiry</Link>
                  </Button>
                  <Button asChild variant="onOlive">
                    <a href={`tel:${phone}`}>Call {phoneDisplay(phone)}</a>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </PublicPage>
  );
}
