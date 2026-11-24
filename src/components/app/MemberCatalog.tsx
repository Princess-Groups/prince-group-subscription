import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Database, RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { inr, shortDate } from "@/lib/format";

type Catalog = {
  active: boolean;
  plan_code?: string;
  discount_percentage?: number;
  services: { id: string; name: string; category: string; description: string; original_price: number; member_price: number }[];
  loan_categories: { loan_type: string; available: number }[];
  candidates: { allocation_id: string; id: string; lead_code: string; name: string; loan_type: string | null; location: string | null; requirement: string | null; status: string; allocated_at: string }[];
};

export function MemberCatalog() {
  const [search, setSearch] = useState("");
  const catalog = useQuery({
    queryKey: ["member-catalog"],
    refetchInterval: 15_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("my_member_catalog");
      if (error) throw error;
      const result = data as unknown as Catalog & { error?: string };
      if (result.error) throw new Error("Sign in to access your member catalog.");
      return result;
    },
  });
  const services = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (catalog.data?.services ?? []).filter((service) =>
      !term || `${service.name} ${service.category} ${service.description}`.toLowerCase().includes(term),
    );
  }, [search, catalog.data?.services]);

  if (catalog.isLoading) return <Skeleton className="mt-8 h-48 rounded-3xl" />;
  if (catalog.error) return (
    <div role="alert" className="mt-8 text-destructive">
      <p>Member services and candidate data could not be loaded.</p>
      <Button variant="outline" className="mt-3" onClick={() => void catalog.refetch()}>Try again</Button>
    </div>
  );
  if (!catalog.data?.active) return (
    <section className="mt-10 border-t border-border pt-8">
      <h2 className="text-xl font-bold text-primary">Member services &amp; candidate data</h2>
      <p className="mt-2 text-sm text-muted-foreground">An active paid subscription is required.</p>
      <Button asChild variant="hero" className="mt-4"><Link to="/payment">Choose a plan</Link></Button>
    </section>
  );
  return (
    <div className="mt-10 space-y-10">
      <section className="border-t border-border pt-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-primary">Member Services</h2>
            <p className="mt-1 text-sm text-muted-foreground">{catalog.data.services.length} available · {catalog.data.discount_percentage}% member discount</p>
          </div>
          <Button variant="outline" size="icon" aria-label="Refresh member services and candidate data" disabled={catalog.isFetching} onClick={() => void catalog.refetch()}>
            <RefreshCw className={catalog.isFetching ? "size-4 animate-spin" : "size-4"} />
          </Button>
        </div>
        <Input className="mt-5 max-w-md" aria-label="Search member services" placeholder="Search services or categories" value={search} onChange={(event) => setSearch(event.target.value)} />
        <div className="mt-5 overflow-x-auto">
          <Table>
            <TableHeader><TableRow><TableHead>Service</TableHead><TableHead>Category</TableHead><TableHead>Standard price</TableHead><TableHead>Member price</TableHead></TableRow></TableHeader>
            <TableBody>
              {services.map((service) => <TableRow key={service.id}>
                <TableCell className="min-w-48 font-medium">{service.name}<p className="mt-1 max-w-md text-xs font-normal text-muted-foreground">{service.description}</p></TableCell>
                <TableCell>{service.category}</TableCell><TableCell>{inr(service.original_price)}</TableCell><TableCell className="font-semibold text-secondary">{inr(service.member_price)}</TableCell>
              </TableRow>)}
              {!services.length && <TableRow><TableCell colSpan={4}>No matching available services.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>
      </section>

      <section className="border-t border-border pt-8">
        <h2 className="text-xl font-bold text-primary">Available Loan Data</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {catalog.data.loan_categories.map((category) => <div key={category.loan_type} className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
            <Database className="size-5 shrink-0 text-secondary" />
            <div><p className="font-semibold text-primary">{category.loan_type}</p><p className="text-sm text-muted-foreground">{category.available.toLocaleString("en-IN")} available records</p></div>
          </div>)}
        </div>
        {!catalog.data.loan_categories.length && <p className="mt-4 text-sm text-muted-foreground">No loan records are currently available.</p>}
      </section>

      <section className="border-t border-border pt-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-primary">My Loan &amp; Candidate Data</h2>
          <Button asChild variant="outline"><Link to="/leads">All allocated leads &amp; Excel download</Link></Button>
        </div>
        <div className="mt-5 overflow-x-auto">
          <Table>
            <TableHeader><TableRow><TableHead>Candidate</TableHead><TableHead>Loan type</TableHead><TableHead>Location</TableHead><TableHead>Status</TableHead><TableHead>Allocated</TableHead></TableRow></TableHeader>
            <TableBody>
              {catalog.data.candidates.map((candidate) => <TableRow key={candidate.allocation_id}>
                <TableCell className="font-medium">{candidate.name}<p className="text-xs text-muted-foreground">{candidate.lead_code}</p></TableCell>
                <TableCell>{candidate.loan_type || "Loan enquiry"}</TableCell><TableCell>{candidate.location || "—"}</TableCell>
                <TableCell><Badge variant="outline">{candidate.status}</Badge></TableCell><TableCell>{shortDate(candidate.allocated_at)}</TableCell>
              </TableRow>)}
              {!catalog.data.candidates.length && <TableRow><TableCell colSpan={5}>No leads allocated yet. Claim your monthly leads above.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );
}