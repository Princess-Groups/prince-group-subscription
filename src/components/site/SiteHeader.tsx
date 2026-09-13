import { Link } from "@tanstack/react-router";
import { MapPin, Menu, Phone, Sparkles } from "lucide-react";
import { useState } from "react";

import princeLogo from "@/assets/prince-logo.png.asset.json";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useSession } from "@/hooks/useAuth";
import { phoneDisplay } from "@/lib/format";
import { settingString, useSettings } from "@/hooks/usePlatform";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/plans", label: "Plans" },
  { to: "/loan-services", label: "Candidate Data" },
  { to: "/services", label: "Services" },
  { to: "/branches", label: "Branches" },
  { to: "/opportunities", label: "Opportunities" },
  { to: "/contacts", label: "Directory" },
  { to: "/enquiry", label: "Enquiry" },
  { to: "/offers", label: "Offers" },
  { to: "/office", label: "Office" },
  { to: "/contact", label: "Contact" },
] as const;

export const BRANCH_TAGLINE = "20 Branches All Over Kanyakumari";
export const BRAND_STATEMENT = "THE ONE BRAND ALL YOUR NEEDS";

export function BrandMark({ tone = "dark" }: { tone?: "dark" | "light" }) {
  return (
    <span className="flex min-w-0 items-center gap-3">
      <span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-2xl bg-cream shadow-soft ring-1 ring-primary/10">
        <img
          src={princeLogo.url}
          alt="Prince Group logo"
          width={48}
          height={48}
          className="size-10 object-contain"
        />
      </span>

      <span className="flex min-w-0 flex-col leading-none">
        <span
          className={`font-brand text-xl font-semibold tracking-wide sm:text-2xl ${
            tone === "light" ? "text-cream" : "text-primary"
          }`}
        >
          Prince Group
        </span>
        <span
          className={`mt-1.5 text-[9px] font-medium italic tracking-[0.14em] sm:text-[10px] ${
            tone === "light" ? "text-accent" : "text-secondary"
          }`}
          style={{ fontFamily: "var(--font-brand)" }}
        >
          The One Brand All Your Needs
        </span>
      </span>
    </span>
  );
}

function GlassNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav
      aria-label="Primary"
      className="relative flex items-center gap-0.5 overflow-x-auto rounded-full border border-white/50 bg-white/45 px-1.5 py-1.5 shadow-[0_18px_40px_-22px_oklch(0.28_0.06_148/0.45),inset_0_1px_0_oklch(1_0_0/0.6)] backdrop-blur-xl backdrop-saturate-150 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {NAV.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          onClick={onNavigate}
          className="whitespace-nowrap rounded-full px-3 py-1.5 text-[12.5px] font-semibold text-primary/75 transition-all duration-300 hover:bg-white/70 hover:text-primary hover:shadow-[inset_0_1px_0_oklch(1_0_0/0.7),0_6px_16px_-8px_oklch(0.28_0.06_148/0.5)]"
          activeProps={{
            className:
              "bg-primary !text-cream shadow-[0_8px_20px_-8px_oklch(0.28_0.06_148/0.7),inset_0_1px_0_oklch(1_0_0/0.25)] hover:bg-primary hover:!text-cream",
          }}
          activeOptions={{ exact: item.to === "/" }}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

export function SiteHeader() {
  const { user } = useSession();
  const { data: settings } = useSettings();
  const phone = settingString(settings, "support_phone", "9559155535");
  const [open, setOpen] = useState(false);


  return (
    <header className="sticky top-0 z-50">
      {/* Tagline strip */}
      <div className="bg-gradient-olive text-cream">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-6 gap-y-1 px-4 py-1.5 text-center sm:px-6 md:justify-between">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-accent sm:text-[11px]">
            <MapPin className="size-3.5 shrink-0" /> {BRANCH_TAGLINE}
          </span>
          <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-cream/85 sm:text-[11px]">
            <Sparkles className="size-3.5 shrink-0 text-accent" /> {BRAND_STATEMENT}
          </span>
        </div>
      </div>

      {/* Brand + glass navigation area */}
      <div className="border-b border-primary/10 bg-background/70 backdrop-blur-2xl backdrop-saturate-150">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          {/* Top brand row */}
          <div className="flex items-center justify-between gap-3 py-3">
            <Link to="/" className="min-w-0 shrink">
              <BrandMark />
            </Link>

            <div className="flex shrink-0 items-center gap-2">
              <a
                href={`tel:${phone}`}
                className="hidden items-center gap-2 rounded-full border border-white/50 bg-white/45 px-4 py-2 text-xs font-semibold text-primary shadow-[inset_0_1px_0_oklch(1_0_0/0.6)] backdrop-blur-xl transition-all hover:bg-white/70 lg:inline-flex"
              >
                <Phone className="size-3.5 text-secondary" /> {phoneDisplay(phone)}
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
                    <Link to="/payment">Explore Plans</Link>
                  </Button>
                </>
              )}

              <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                  <Button size="icon" variant="outline" className="md:hidden">
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
                        <Phone className="size-4" /> Call {phoneDisplay(phone)}
                      </a>
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          {/* Floating liquid-glass navigation bar */}
          <div className="hidden pb-3 md:flex md:justify-center">
            <GlassNav />
          </div>
        </div>
      </div>
    </header>
  );
}
