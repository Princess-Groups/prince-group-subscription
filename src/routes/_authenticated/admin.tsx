import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRoles, useSession } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { inr, shortDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin Control Centre | OliveEdge" },
      { name: "description", content: "Platform analytics, subscription approvals, account status and audit logs." },
      { property: "og:title", content: "Admin Control Centre | OliveEdge" },
      { property: "og:description", content: "Platform analytics, approvals and audit logs." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

type Stats = Record<string, number>;

function AdminPage() {
  const queryClient = useQueryClient();
  const { user } = useSession();
  const { data: roles, isLoading: rolesLoading } = useRoles(user?.id);
  const isAdmin = (roles ?? []).some((r) => r === "admin" || r === "super_admin");

  const stats = useQuery({
    queryKey: ["admin-stats"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_stats");
      if (error) throw error;
      return data as unknown as Stats;
    },
  });

  const subs = useQuery({
    queryKey: ["admin-subs"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("id,status,created_at,user_id,plans(name)")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as unknown as {
        id: string;
        status: string;
        created_at: string;
        user_id: string;
        plans: { name: string } | null;
      }[];
    },
  });

  const logs = useQuery({
    queryKey: ["admin-logs"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("id,action,entity,created_at")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as unknown as {
        id: string;
        action: string;
        entity: string | null;
        created_at: string;
      }[];
    },
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data, error } = await supabase.rpc("admin_set_subscription_status", {
        _sub_id: id,
        _status: status as never,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Subscription status updated.");
      queryClient.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const bootstrap = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("claim_super_admin");
      if (error) throw error;
      return data as Record<string, unknown>;
    },
    onSuccess: (res) => {
      if (res?.["error"]) {
        toast.error("An administrator already exists.");
        return;
      }
      toast.success("You are now the platform administrator.");
      queryClient.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (rolesLoading) {
    return (
      <AppShell title="Admin Control Centre">
        <Skeleton className="h-64 rounded-3xl" />
      </AppShell>
    );
  }

  if (!isAdmin) {
    return (
      <AppShell title="Admin Control Centre" subtitle="Restricted area">
        <div className="rounded-3xl border border-primary/10 bg-card p-10 text-center shadow-soft">
          <h2 className="text-xl font-bold text-primary">Administrator access required</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Your account doesn't have administrator rights. If this platform has no administrator
            yet, the first signed-in user can claim the role once.
          </p>
          <Button variant="hero" className="mt-6" onClick={() => bootstrap.mutate()}>
            Claim administrator role
          </Button>
        </div>
      </AppShell>
    );
  }

  const s = stats.data ?? {};

  return (
    <AppShell title="Admin Control Centre" subtitle="Analytics, approvals and audit trail">
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total members", value: String(s["users"] ?? 0) },
          { label: "Active subscriptions", value: String(s["active_subscriptions"] ?? 0) },
          { label: "Leads in system", value: String(s["leads"] ?? 0) },
          { label: "Verified revenue", value: inr(Number(s["revenue"] ?? 0)) },
        ].map((c) => (
          <div key={c.label} className="rounded-3xl border border-primary/10 bg-card p-6 shadow-soft">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {c.label}
            </p>
            <p className="mt-2 font-display text-2xl font-bold text-primary">{c.value}</p>
          </div>
        ))}
      </div>

      <Tabs defaultValue="subs" className="mt-8">
        <TabsList>
          <TabsTrigger value="subs">Subscriptions</TabsTrigger>
          <TabsTrigger value="logs">Audit log</TabsTrigger>
        </TabsList>

        <TabsContent value="subs">
          <div className="mt-4 overflow-x-auto rounded-3xl border border-primary/10 bg-card p-2 shadow-soft sm:p-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Created</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(subs.data ?? []).map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="text-xs text-muted-foreground">
                      {shortDate(row.created_at)}
                    </TableCell>
                    <TableCell>{row.plans?.name ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={row.status === "active" ? "default" : "outline"} className="capitalize">
                        {row.status.replaceAll("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="space-x-2 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setStatus.mutate({ id: row.id, status: "active" })}
                      >
                        Activate
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setStatus.mutate({ id: row.id, status: "cancelled" })}
                      >
                        Cancel
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <AdminManagedNote>
            Manual activation is for verified offline payments only; gateway payments activate
            through webhook verification.
          </AdminManagedNote>
        </TabsContent>

        <TabsContent value="logs">
          <div className="mt-4 overflow-x-auto rounded-3xl border border-primary/10 bg-card p-2 shadow-soft sm:p-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(logs.data ?? []).map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="text-xs text-muted-foreground">
                      {shortDate(l.created_at)}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{l.action}</TableCell>
                    <TableCell>{l.entity ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
