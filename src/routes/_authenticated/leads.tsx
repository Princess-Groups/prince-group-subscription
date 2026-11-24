import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Download, Eye, Lock } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app/AppShell";
import { AdminManagedNote } from "@/components/site/PublicPage";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { inr, shortDate } from "@/lib/format";
import { Checkbox } from "@/components/ui/checkbox";
import { downloadBlob } from "@/lib/file-download";

export const Route = createFileRoute("/_authenticated/leads")({
  head: () => ({
    meta: [
      { title: "My Allocated Leads | PRINCE" },
      { name: "description", content: "Every lead allocated to your account with status, requirement and protected contact reveal." },
      { property: "og:title", content: "My Allocated Leads | PRINCE" },
      { property: "og:description", content: "Allocated leads with protected contact reveal." },
      { name: "robots", content: "noindex" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LeadsPage,
});

type Row = {
  id: string;
  allocated_at: string;
  leads: {
    id: string;
    lead_code: string;
    name: string | null;
    loan_type: string;
    estimated_amount: number | null;
    location: string | null;
    status: string;
  } | null;
};

function LeadsPage() {
  const [revealed, setRevealed] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<string[]>([]);
  const [ready, setReady] = useState<Blob | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["my-allocations"],
    refetchInterval: 15_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lead_allocations")
        .select("id,allocated_at,leads(id,lead_code,name,loan_type,estimated_amount,location,status)")
        .order("allocated_at", { ascending: false }).limit(1000);
      if (error) throw error;
      return (data ?? []) as unknown as Row[];
    },
  });

  const exportLeads = useMutation({ mutationFn: async () => {
    const r = await supabase.rpc('download_my_loan_leads', { _ids: selected }); if (r.error) throw r.error;
    const xlsx = await import('xlsx');
    const rows = (r.data as Record<string, unknown>[]).map(row => Object.fromEntries(Object.entries(row).map(([k,v]) => [k, v && typeof v === 'object' ? JSON.stringify(v) : v])));
    const workbook = xlsx.utils.book_new(); const sheet = xlsx.utils.json_to_sheet(rows);
    sheet['!cols'] = [{ wch: 18 }, { wch: 24 }, { wch: 18 }, { wch: 24 }, { wch: 22 }, { wch: 40 }, { wch: 20 }];
    xlsx.utils.book_append_sheet(workbook, sheet, 'Allocated leads');
    return new Blob([xlsx.write(workbook, { type: 'array', bookType: 'xlsx' })], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }, onSuccess: blob => setReady(blob), onError: (e: Error) => toast.error(e.message) });

  const reveal = useMutation({
    mutationFn: async (leadId: string) => {
      const { data, error } = await supabase.rpc("reveal_lead_contact", { _lead_id: leadId });
      if (error) throw error;
      return { leadId, res: data as Record<string, unknown> };
    },
    onSuccess: ({ leadId, res }) => {
      if (res?.["error"]) {
        toast.error("This lead is not allocated to your account.");
        return;
      }
      setRevealed((r) => ({ ...r, [leadId]: String(res["phone"] ?? "Not available") }));
      toast.success("Contact revealed — this view has been logged.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AppShell title="My Leads" subtitle="Allocated leads with permanent duplicate prevention">
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Button variant="outline" disabled={!data?.length} onClick={() => { setSelected((data ?? []).slice(0, 500).map(r => r.id)); setReady(null); }}>Select latest {Math.min(data?.length ?? 0, 500)}</Button>
        <Button variant="hero" disabled={!selected.length || exportLeads.isPending} onClick={() => exportLeads.mutate()}><Download className="size-4" />{exportLeads.isPending ? 'Preparing…' : `Prepare Excel (${selected.length})`}</Button>
        {ready && <Button variant="outline" onClick={() => downloadBlob(ready, 'prince-allocated-leads.xlsx')}><Download className="size-4" />Download Excel</Button>}
      </div>
      {error && <p role="alert" className="mb-4 text-destructive">{error.message}</p>}
      <div className="rounded-3xl border border-primary/10 bg-card p-2 shadow-soft sm:p-4">
        {isLoading ? (
          <div className="space-y-3 p-4">
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-12 rounded-xl" />
            ))}
          </div>
        ) : (data ?? []).length === 0 ? (
          <div className="p-12 text-center">
            <h2 className="text-lg font-semibold text-primary">No leads allocated yet</h2>
            <p className="mt-2 text-sm text-foreground/80">
              Claim your monthly leads from the dashboard.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Select</TableHead>
                  <TableHead>Lead ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Requirement</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Allocated</TableHead>
                  <TableHead className="text-right">Contact</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data ?? []).map((row) => {
                  const lead = row.leads;
                  if (!lead) return null;
                  return (
                    <TableRow key={row.id}>
                      <TableCell><Checkbox aria-label={`Select ${lead.lead_code}`} checked={selected.includes(row.id)} disabled={!selected.includes(row.id) && selected.length >= 500} onCheckedChange={v => { setReady(null); setSelected(s => v === true ? [...s, row.id] : s.filter(id => id !== row.id)); }} /></TableCell>
                      <TableCell className="font-mono text-xs font-semibold text-secondary">
                        {lead.lead_code}
                      </TableCell>
                      <TableCell className="font-medium">{lead.name ?? "—"}</TableCell>
                      <TableCell>
                        {lead.loan_type}
                        {lead.estimated_amount ? ` · ${inr(lead.estimated_amount)}` : ""}
                      </TableCell>
                      <TableCell>{lead.location ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {lead.status.replaceAll("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-foreground/80">
                        {shortDate(row.allocated_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        {revealed[lead.id] ? (
                          <a
                            href={`tel:${revealed[lead.id]}`}
                            className="font-semibold text-secondary"
                          >
                            {revealed[lead.id]}
                          </a>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={reveal.isPending}
                            onClick={() => reveal.mutate(lead.id)}
                          >
                            <Eye className="size-3.5" /> Reveal
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <div className="mt-6 flex items-start gap-2 rounded-2xl bg-muted px-4 py-3 text-xs text-foreground/80">
        <Lock className="mt-0.5 size-3.5 shrink-0 text-secondary" />
        Contact numbers are served by the backend only for leads allocated to you, and every reveal
        is written to the contact access log.
      </div>
      <AdminManagedNote>
        Lead status values and reassignments are controlled by administrators.
      </AdminManagedNote>
    </AppShell>
  );
}
