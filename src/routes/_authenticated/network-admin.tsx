import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app/AppShell";
import { NetworkPill } from "@/components/network/NetworkBits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { shortDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/network-admin")({
  head: () => ({
    meta: [
      { title: "Network Admin | PRINCE" },
      { name: "description", content: "Manage subscriber profiles, enquiries, reports and network activity." },
      { property: "og:title", content: "Network Admin | PRINCE" },
      { property: "og:description", content: "Prince Group subscriber network administration." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: NetworkAdminPage,
});

type Stats = Record<string, number | { category: string; count: number }[]>;

function NetworkAdminPage() {
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");

  const stats = useQuery({
    queryKey: ["network-admin-stats"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("network_admin_stats");
      if (error) throw error;
      return data as unknown as Stats;
    },
  });

  const profiles = useQuery({
    queryKey: ["admin-member-profiles", q],
    queryFn: async () => {
      let query = supabase
        .from("member_profiles")
        .select("user_id,full_name,company_name,category,location,status,featured,communication_blocked,created_at")
        .order("created_at", { ascending: false })
        .limit(50);
      if (q) query = query.or(`full_name.ilike.%${q}%,company_name.ilike.%${q}%,category.ilike.%${q}%`);
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });

  const enquiries = useQuery({
    queryKey: ["admin-enquiries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("member_enquiries")
        .select("id,title,enquiry_type,category,status,hidden,featured,created_at")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });

  const reports = useQuery({
    queryKey: ["admin-reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("member_reports")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });

  const setStatus = useMutation({
    mutationFn: async (input: { userId: string; status: "pending" | "approved" | "suspended"; blocked?: boolean }) => {
      const { error } = await supabase.rpc("admin_set_member_status", {
        _user_id: input.userId,
        _status: input.status,
        _blocked: input.blocked ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Member updated.");
      void queryClient.invalidateQueries({ queryKey: ["admin-member-profiles"] });
      void queryClient.invalidateQueries({ queryKey: ["network-admin-stats"] });
    },
  });

  const s = stats.data ?? {};
  const cards: [string, string][] = [
    ["Total Subscribers", "total_subscribers"],
    ["Active Subscribers", "active_subscribers"],
    ["Member Profiles", "total_profiles"],
    ["Total Enquiries", "total_enquiries"],
    ["Connections", "total_connections"],
    ["Messages", "total_messages"],
    ["Calls", "total_calls"],
    ["Open Reports", "open_reports"],
  ];
  const topCategories = (s["top_categories"] as { category: string; count: number }[] | undefined) ?? [];

  return (
    <AppShell title="Network Admin" subtitle="Subscriber profiles, enquiries, reports and activity">
      {stats.isLoading ? (
        <Skeleton className="h-28 rounded-3xl" />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map(([label, key]) => (
            <div key={key} className="liquid-glass rounded-3xl p-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
              <p className="mt-1 text-2xl font-bold text-primary">{Number(s[key] ?? 0)}</p>
            </div>
          ))}
        </div>
      )}

      {topCategories.length ? (
        <div className="liquid-glass mt-4 rounded-3xl p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Most active business categories
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {topCategories.map((c) => (
              <NetworkPill key={c.category}>
                {c.category} · {c.count}
              </NetworkPill>
            ))}
          </div>
        </div>
      ) : null}

      <Tabs defaultValue="members" className="mt-6">
        <TabsList className="flex h-auto flex-wrap gap-1 rounded-full bg-muted/70 p-1">
          <TabsTrigger value="members" className="rounded-full px-4 py-2 text-sm font-semibold">
            Member Profiles
          </TabsTrigger>
          <TabsTrigger value="enquiries" className="rounded-full px-4 py-2 text-sm font-semibold">
            Enquiries
          </TabsTrigger>
          <TabsTrigger value="reports" className="rounded-full px-4 py-2 text-sm font-semibold">
            Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="mt-4">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search members by name, company or category"
            className="max-w-md"
          />
          <div className="mt-4 space-y-2">
            {(profiles.data ?? []).map((m) => (
              <div
                key={m.user_id}
                className="liquid-glass flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-primary">{m.full_name || "Unnamed member"}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {m.company_name} · {m.category || "No category"} · {m.location}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <NetworkPill tone={m.status === "approved" ? "lime" : "olive"}>{m.status}</NetworkPill>
                  {m.communication_blocked ? <NetworkPill tone="cream">comms blocked</NetworkPill> : null}
                  <Button size="sm" variant="outline" onClick={() => setStatus.mutate({ userId: m.user_id, status: "approved", blocked: false })}>
                    Approve
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setStatus.mutate({ userId: m.user_id, status: "suspended", blocked: true })}>
                    Suspend
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={async () => {
                      const { error } = await supabase
                        .from("member_profiles")
                        .update({ featured: !m.featured })
                        .eq("user_id", m.user_id);
                      if (error) toast.error("Could not update featured status.");
                      else {
                        toast.success(m.featured ? "Removed from featured." : "Marked as featured.");
                        void queryClient.invalidateQueries({ queryKey: ["admin-member-profiles"] });
                      }
                    }}
                  >
                    {m.featured ? "Unfeature" : "Feature"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="enquiries" className="mt-4 space-y-2">
          {(enquiries.data ?? []).map((e) => (
            <div key={e.id} className="liquid-glass flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-primary">{e.title}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {e.enquiry_type} · {e.category || "No category"} · {shortDate(e.created_at)}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <NetworkPill>{e.status}</NetworkPill>
                {e.hidden ? <NetworkPill tone="cream">hidden</NetworkPill> : null}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    const { error } = await supabase
                      .from("member_enquiries")
                      .update({ hidden: !e.hidden })
                      .eq("id", e.id);
                    if (error) toast.error("Could not update this enquiry.");
                    else {
                      toast.success(e.hidden ? "Enquiry restored." : "Enquiry removed from the feed.");
                      void queryClient.invalidateQueries({ queryKey: ["admin-enquiries"] });
                    }
                  }}
                >
                  {e.hidden ? "Restore" : "Remove"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={async () => {
                    const { error } = await supabase
                      .from("member_enquiries")
                      .update({ featured: !e.featured })
                      .eq("id", e.id);
                    if (error) toast.error("Could not update this enquiry.");
                    else {
                      toast.success(e.featured ? "Removed from featured." : "Marked as featured.");
                      void queryClient.invalidateQueries({ queryKey: ["admin-enquiries"] });
                    }
                  }}
                >
                  {e.featured ? "Unfeature" : "Feature"}
                </Button>
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="reports" className="mt-4 space-y-2">
          {(reports.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No reports submitted.</p>
          ) : (
            (reports.data ?? []).map((r) => (
              <div key={r.id} className="liquid-glass flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-primary">
                    {r.target_type} · {r.reason}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {r.details || "No extra detail"} · {shortDate(r.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <NetworkPill>{r.status}</NetworkPill>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      const { error } = await supabase
                        .from("member_reports")
                        .update({ status: "reviewed" })
                        .eq("id", r.id);
                      if (error) toast.error("Could not update this report.");
                      else {
                        toast.success("Marked reviewed.");
                        void queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
                      }
                    }}
                  >
                    Mark reviewed
                  </Button>
                </div>
              </div>
            ))
          )}
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
