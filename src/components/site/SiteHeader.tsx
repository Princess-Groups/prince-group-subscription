import { Link } from "@tanstack/react-router";
import { MapPin, Menu, Phone, Sparkles } from "lucide-react";
import { useState } from "react";

import princeLogo from "@/assets/prince-logo.png.asset.json";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useSession } from "@/hooks/useAuth";
import { settingString, useSettings } from "@/hooks/usePlatform";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/plans", label: "Plans" },
  { to: "/loan-services", label: "Candidate Data" },
  { to: "/services", label: "Services" },
  { to: "/branches", label: "Branches" },
  { to: "/opportunities", label: "Opportunities" },
  { to: "/contacts", label: "Directory" },
  { to: "/offers", label: "Offers" },
  { to: "/office", label: "Office" },
  { to: "/contact", label: "Contact" },
] as const;

export const BRANCH_TAGLINE = "20 Branches All Over Kanyakumari";
export const BRAND_STATEMENT = "THE ONE BRAND ALL YOUR NEEDS";

export function BrandMark({ tone = "dark" }: { tone?: "dark" | "light" }) {
  return (
    <span className="flex min-w-0 items-center gap-2.5">
      <span className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-2xl bg-cream shadow-soft ring-1 ring-primary/10">
        <img
          src={princeLogo.url}
          alt="Prince Group logo"
          width={44}
          height={44}
          className="size-9 object-contain"
        />
      </span>
      <span className="flex min-w-0 flex-col leading-none">
        <span
          className={`font-display text-base font-extrabold tracking-[0.2em] sm:text-lg ${
            tone === "light" ? "text-cream" : "text-primary"
          }`}
        >
          PRINCE GROUP
        </span>
        <span
          className={`mt-1 truncate text-[10px] font-semibold uppercase tracking-[0.18em] ${
            tone === "light" ? "text-accent" : "text-secondary"
          }`}
        >
          {BRAND_STATEMENT}
        </span>
      </span>
    </span>
  );
}

export function SiteHeader() {
  const { user } = useSession();
  const { data: settings } = useSettings();
  const phone = settingString(settings, "support_phone", "95559155535");
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-primary/10 bg-background/80 backdrop-blur-xl">
      {/* Brand strip — always visible on every screen size */}
      <div className="bg-gradient-olive text-cream">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-6 gap-y-1 px-4 py-2 text-center sm:px-6 md:justify-between">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-accent sm:text-[11px]">
            <MapPin className="size-3.5 shrink-0" /> {BRANCH_TAGLINE}
          </span>
          <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-cream/85 sm:text-[11px]">
            <Sparkles className="size-3.5 shrink-0 text-accent" /> {BRAND_STATEMENT}
          </span>
        </div>
      </div>

      <div className="mx-auto flex h-18 max-w-7xl items-center gap-3 px-4 py-2 sm:px-6">
        <Link to="/" className="min-w-0 shrink">
          <BrandMark />
        </Link>

        <nav className="mx-auto hidden items-center gap-0 xl:flex">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="whitespace-nowrap rounded-full px-2.5 py-2 text-[13px] font-medium text-muted-foreground transition-all hover:bg-muted hover:text-primary"
              activeProps={{ className: "bg-muted text-primary shadow-soft" }}
              activeOptions={{ exact: item.to === "/" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2 xl:ml-0">
          <a
            href={`tel:${phone}`}
            className="hidden items-center gap-2 rounded-full border border-primary/15 px-4 py-2 text-xs font-semibold text-primary transition-colors hover:border-secondary/50 hover:bg-muted lg:inline-flex"
          >
            <Phone className="size-3.5 text-secondary" /> {phone}
          </a>

          {user ? (
            <Button asChild size="sm" variant="lime">
              <Link to="/dashboard">Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button asChild size="sm" variant="ghost" className="hidden sm:inline-flex">
                <Link to="/auth">Login</Link>
              </Button>
              <Button asChild size="sm" variant="lime">
                <Link to="/plans">Explore Plans</Link>
              </Button>
            </>
          )}

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button size="icon" variant="outline" className="xl:hidden">
                <Menu className="size-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 border-l border-cream/10 bg-gradient-olive">
              <div className="mt-8 flex flex-col gap-1">
                <BrandMark tone="light" />
                <p className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">
                  <MapPin className="size-3.5" /> {BRANCH_TAGLINE}
                </p>
                <div className="mt-6 flex flex-col gap-1">
                  {NAV.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setOpen(false)}
                      className="rounded-2xl px-4 py-3 text-sm font-semibold text-cream/85 transition-colors hover:bg-cream/10 hover:text-accent"
                    >
                      {item.label}
                    </Link>
                  ))}
                  <Link
                    to="/bank-executive"
                    onClick={() => setOpen(false)}
                    className="rounded-2xl px-4 py-3 text-sm font-semibold text-cream/85 transition-colors hover:bg-cream/10 hover:text-accent"
                  >
                    Bank Executive Portal
                  </Link>
                  <Link
                    to="/auth"
                    onClick={() => setOpen(false)}
                    className="rounded-2xl px-4 py-3 text-sm font-semibold text-cream/85 transition-colors hover:bg-cream/10 hover:text-accent"
                  >
                    Login / Register
                  </Link>
                </div>
                <Button asChild variant="lime" className="mt-6 w-full">
                  <a href={`tel:${phone}`}>
                    <Phone className="size-4" /> Call {phone}
                  </a>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
