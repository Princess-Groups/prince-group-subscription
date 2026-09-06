import { Link } from "@tanstack/react-router";
import { Crown, MapPin, Phone } from "lucide-react";

import { settingString, useSettings } from "@/hooks/usePlatform";

export function SiteFooter() {
  const { data: settings } = useSettings();
  const phone = settingString(settings, "support_phone", "95559155535");

  return (
    <footer className="relative mt-24 overflow-hidden bg-gradient-olive text-cream">
      <div className="grid-lines pointer-events-none absolute inset-0 opacity-40" />
      <div className="hero-orb -left-24 top-0 size-80 bg-accent/20" />

      <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2.5">
            <span className="grid size-10 place-items-center rounded-2xl bg-accent/15 text-accent">
              <Crown className="size-5" />
            </span>
            <span className="font-display text-lg font-extrabold tracking-[0.22em]">PRINCE</span>
          </div>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-cream/70">
            Premium access, opportunities, benefits and loan candidate data. A subscription platform for
            loan candidate data, business contacts, service discounts and managed lead access —
            availability, pricing and data controlled by the platform administrator.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href={`tel:${phone}`}
              className="inline-flex items-center gap-2 rounded-full border border-accent/40 px-4 py-2 text-sm font-semibold text-accent transition-all hover:-translate-y-0.5 hover:bg-accent hover:text-accent-foreground"
            >
              <Phone className="size-4" /> {phone}
            </a>
            <Link
              to="/branches"
              className="inline-flex items-center gap-2 rounded-full border border-cream/20 px-4 py-2 text-sm font-semibold text-cream/80 transition-all hover:-translate-y-0.5 hover:border-accent/50 hover:text-accent"
            >
              <MapPin className="size-4" /> 20 Branches All Over Kanyakumari
            </Link>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-accent">Platform</h4>
          <ul className="mt-4 space-y-2 text-sm text-cream/70">
            <li><Link to="/plans" className="hover:text-accent">Subscription Plans</Link></li>
            <li><Link to="/loan-services" className="hover:text-accent">Loan Candidate Data</Link></li>
            <li><Link to="/services" className="hover:text-accent">Member Services</Link></li>
            <li><Link to="/office" className="hover:text-accent">Our Office</Link></li>
            <li><Link to="/branches" className="hover:text-accent">Branch Network</Link></li>
            <li><Link to="/opportunities" className="hover:text-accent">Data Opportunities</Link></li>
            <li><Link to="/contacts" className="hover:text-accent">Business Contacts</Link></li>
            <li><Link to="/offers" className="hover:text-accent">Offers</Link></li>
            <li><Link to="/bank-executive" className="hover:text-accent">Bank Executive Portal</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-accent">Legal</h4>
          <ul className="mt-4 space-y-2 text-sm text-cream/70">
            <li><Link to="/terms" className="hover:text-accent">Terms &amp; Conditions</Link></li>
            <li><Link to="/privacy" className="hover:text-accent">Privacy Policy</Link></li>
            <li><Link to="/refund" className="hover:text-accent">Refund &amp; Cancellation</Link></li>
            <li><Link to="/contact" className="hover:text-accent">Contact Us</Link></li>
            <li><Link to="/auth" className="hover:text-accent">Login / Register</Link></li>
          </ul>
        </div>
      </div>
      <div className="relative border-t border-cream/10 px-4 py-6 text-center text-xs text-cream/50">
        © {new Date().getFullYear()} PRINCE. Subscription access is limited and admin-controlled.
        Prince Group provides data access and services — we do not provide loans.
      </div>
    </footer>
  );
}
