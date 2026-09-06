import { Link } from "@tanstack/react-router";
import { Crown, Menu, Phone } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useSession } from "@/hooks/useAuth";
import { settingString, useSettings } from "@/hooks/usePlatform";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/plans", label: "Plans" },
  { to: "/services", label: "Loan Services" },
  { to: "/branches", label: "Branches" },
  { to: "/opportunities", label: "Opportunities" },
  { to: "/contacts", label: "Directory" },
  { to: "/offers", label: "Offers" },
  { to: "/contact", label: "Contact" },
] as const;

export function BrandMark({ tone = "dark" }: { tone?: "dark" | "light" }) {
  return (
    <span className="flex min-w-0 items-center gap-2.5">
      <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-gradient-olive text-accent shadow-soft">
        <Crown className="size-5" />
      </span>
      <span className="flex min-w-0 flex-col leading-none">
        <span
          className={`font-display text-lg font-extrabold tracking-[0.22em] ${
            tone === "light" ? "text-cream" : "text-primary"
          }`}
        >
          PRINCE
        </span>
        <span className="mt-1 truncate text-[10px] font-semibold uppercase tracking-[0.18em] text-secondary">
          Premium Access
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
      <div className="mx-auto flex h-18 max-w-7xl items-center gap-3 px-4 sm:px-6">
        <Link to="/" className="min-w-0 shrink">
          <BrandMark />
        </Link>

        <nav className="mx-auto hidden items-center gap-0.5 xl:flex">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-all hover:bg-muted hover:text-primary"
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
