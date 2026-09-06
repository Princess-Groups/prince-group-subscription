import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Lock, Search } from "lucide-react";
import { useState } from "react";

import { AdminManagedNote, DemoBadge, PageHero, PublicPage } from "@/components/site/PublicPage";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

const title = "Kanyakumari Business Contact Directory | PRINCE";
const description =
  "Search a curated B2B directory of businesses by category and area. Phone numbers unlock for subscribed members and every view is logged.";

export const Route = createFileRoute("/contacts")({
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
  component: ContactsPage,
});

type Contact = {
  id: string;
  business_name: string;
  category: string;
  area: string | null;
  is_demo: boolean;
};

function ContactsPage() {
  const [q, setQ] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["business-contacts", q],
    queryFn: async () => {
      let query = supabase
        .from("business_contacts")
        .select("id,business_name,category,area,is_demo")
        .order("business_name")
        .limit(60);
      if (q.trim()) query = query.ilike("business_name", `%${q.trim()}%`);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as Contact[];
    },
  });

  return (
    <PublicPage>
      <PageHero
        eyebrow="Business Directory"
        title="Business contacts across Kanyakumari"
        subtitle="Business name, category and area are public. Phone numbers are protected and revealed only to members with an active subscription."
      />

      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search business name"
              className="pl-9"
            />
          </div>
          <DemoBadge />
        </div>

        {isLoading ? (
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-36 rounded-3xl" />
            ))}
          </div>
        ) : (
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {(data ?? []).map((c) => (
              <div
                key={c.id}
                className="card-lift rounded-3xl border border-primary/10 bg-card p-5 shadow-soft"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-base font-semibold text-primary">{c.business_name}</h3>
                  <Badge variant="secondary">{c.category}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{c.area ?? "Kanyakumari"}</p>
                <div className="mt-4 flex items-center gap-2 rounded-2xl bg-muted px-3 py-2.5 text-xs text-muted-foreground">
                  <Lock className="size-3.5 shrink-0 text-secondary" /> Phone number hidden — members only
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-12 rounded-3xl border border-primary/10 bg-card p-8 text-center shadow-soft">
          <h2 className="text-2xl font-bold text-primary">Unlock verified contact numbers</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Subscribe to reveal numbers. Each reveal is recorded in your contact access log.
          </p>
          <Button asChild variant="hero" className="mt-6">
            <Link to="/plans">View plans</Link>
          </Button>
        </div>

        <AdminManagedNote>
          Directory records are imported and moderated by administrators; demo records are labelled
          until real data is uploaded.
        </AdminManagedNote>
      </div>
    </PublicPage>
  );
}
