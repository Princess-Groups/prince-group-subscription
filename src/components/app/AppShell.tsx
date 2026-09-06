import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";

import { DemoBadge } from "@/components/site/PublicPage";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useRoles, useSession } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/leads", label: "My Leads", icon: Users },
  { to: "/subscription", label: "Subscription", icon: CreditCard },
] as const;

export function AppShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const { user } = useSession();
  const { data: roles } = useRoles(user?.id);
  const isAdmin = (roles ?? []).some((r) => r === "admin" || r === "super_admin");
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const nav = (
    <nav className="space-y-1">
      {NAV.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          onClick={() => setOpen(false)}
          className={cn(
            "flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-medium transition-colors",
            pathname === item.to
              ? "bg-primary-foreground/10 text-accent"
              : "text-primary-foreground/70 hover:bg-primary-foreground/5 hover:text-primary-foreground",
          )}
        >
          <item.icon className="size-4" />
          {item.label}
        </Link>
      ))}
      {isAdmin ? (
        <Link
          to="/admin"
          onClick={() => setOpen(false)}
          className={cn(
            "flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-medium transition-colors",
            pathname === "/admin"
              ? "bg-primary-foreground/10 text-accent"
              : "text-primary-foreground/70 hover:bg-primary-foreground/5 hover:text-primary-foreground",
          )}
        >
          <ShieldCheck className="size-4" />
          Admin Control
        </Link>
      ) : null}
    </nav>
  );

  const sidebarInner = (
    <div className="flex h-full flex-col p-6">
      <Link to="/" className="flex items-center gap-2">
        <span className="grid size-9 place-items-center rounded-xl bg-primary-foreground/10 text-accent">
          <Sparkles className="size-4" />
        </span>
        <span className="font-display text-lg font-bold text-primary-foreground">
          Olive<span className="text-accent">Edge</span>
        </span>
      </Link>
      <div className="mt-8 flex-1">{nav}</div>
      <div className="space-y-3">
        <p className="truncate text-xs text-primary-foreground/50">{user?.email}</p>
        <Button variant="onOlive" size="sm" className="w-full" onClick={signOut}>
          <LogOut className="size-4" /> Sign out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-72 shrink-0 bg-gradient-olive lg:block">{sidebarInner}</aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-primary/10 bg-background/85 px-4 py-4 backdrop-blur-xl sm:px-8">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 border-0 bg-gradient-olive p-0">
              {sidebarInner}
            </SheetContent>
          </Sheet>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold text-primary sm:text-xl">{title}</h1>
            {subtitle ? (
              <p className="truncate text-xs text-muted-foreground sm:text-sm">{subtitle}</p>
            ) : null}
          </div>
          <DemoBadge className="ml-auto hidden sm:inline-flex" />
        </header>

        <main className="flex-1 px-4 py-8 sm:px-8">{children}</main>
      </div>
    </div>
  );
}
