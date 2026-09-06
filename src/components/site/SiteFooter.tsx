import { Link } from "@tanstack/react-router";
import { Phone, ShieldCheck } from "lucide-react";

import { settingString, useSettings } from "@/hooks/usePlatform";

export function SiteFooter() {
  const { data: settings } = useSettings();
  const phone = settingString(settings, "support_phone", "95559155535");

  return (
    <footer className="mt-24 bg-gradient-olive text-primary-foreground">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-accent/20 text-accent">
              <ShieldCheck className="size-5" />
            </span>
            <span className="font-display text-lg font-bold">OliveEdge</span>
          </div>
          <p className="mt-4 max-w-md text-sm text-primary-foreground/70">
            A premium subscription platform for loan opportunities, business contacts, service
            discounts and managed lead access. All availability, pricing and data are controlled by
            the platform administrator.
          </p>
          <a
            href={`tel:${phone}`}
            className="mt-6 inline-flex items-center gap-2 rounded-full border border-accent/40 px-4 py-2 text-sm font-semibold text-accent transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <Phone className="size-4" /> {phone}
          </a>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-accent">Platform</h4>
          <ul className="mt-4 space-y-2 text-sm text-primary-foreground/70">
            <li><Link to="/plans" className="hover:text-accent">Subscription Plans</Link></li>
            <li><Link to="/services" className="hover:text-accent">Services</Link></li>
            <li><Link to="/opportunities" className="hover:text-accent">Loan Opportunities</Link></li>
            <li><Link to="/contacts" className="hover:text-accent">Business Contacts</Link></li>
            <li><Link to="/offers" className="hover:text-accent">Offers</Link></li>
            <li><Link to="/bank-executive" className="hover:text-accent">Bank Executive Portal</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-accent">Legal</h4>
          <ul className="mt-4 space-y-2 text-sm text-primary-foreground/70">
            <li><Link to="/terms" className="hover:text-accent">Terms &amp; Conditions</Link></li>
            <li><Link to="/privacy" className="hover:text-accent">Privacy Policy</Link></li>
            <li><Link to="/refund" className="hover:text-accent">Refund &amp; Cancellation</Link></li>
            <li><Link to="/contact" className="hover:text-accent">Contact Us</Link></li>
            <li><Link to="/auth" className="hover:text-accent">Login / Register</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-primary-foreground/10 px-4 py-6 text-center text-xs text-primary-foreground/50">
        © {new Date().getFullYear()} OliveEdge. Subscription access is limited and admin-controlled.
        Loan assistance services do not guarantee approval.
      </div>
    </footer>
  );
}
