import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Handshake,
  MessagesSquare,
  Plus,
  Search,
  Sparkles,
  UserPlus,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { EnquiryCard, MemberCard, NetworkPill, UpgradeGate } from "@/components/network/NetworkBits";
import { PageHero, PublicPage, SectionHeading } from "@/components/site/PublicPage";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "@/hooks/useAuth";
import {
  ENQUIRY_TYPES,
  useBlockMember,
  useCreateGroup,
  useEnquirySearch,
  useMemberCategories,
  useMemberSearch,
  useMyEnquiries,
  useNetworkAccess,
  useReport,
  useRequestConnect,
  useStartConversation,
  type EnquiryCardData,
} from "@/hooks/useNetwork";
import { supabase } from "@/integrations/supabase/client";
import { shortDate } from "@/lib/format";

const title = "Enquiry & Connect | Prince Group Subscriber Network";
const description =
  "Connect with businesses, professionals and opportunities within the Prince Group Subscriber Network — member directory, enquiries and secure messaging.";

export const Route = createFileRoute("/enquiry")({
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
  component: EnquiryPage,
});

const ALL = "__all__";

function EnquiryPage() {
  const { user } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: access } = useNetworkAccess();
  const active = !!access?.active;

  const { data: categories } = useMemberCategories();
  const [tab, setTab] = useState("members");

  // member search
  const [q, setQ] = useState("");
  const [category, setCategory] = useState(ALL);
  const [location, setLocation] = useState("");
  const [page, setPage] = useState(0);
  const members = useMemberSearch({
    q,
    category: category === ALL ? "" : category,
    location,
    page,
  });

  // enquiry feed
  const [eq, setEq] = useState("");
  const [etype, setEtype] = useState(ALL);
  const [epage, setEpage] = useState(0);
  const feed = useEnquirySearch({ q: eq, category: "", type: etype === ALL ? "" : etype, page: epage });

  // group selection
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [groupOpen, setGroupOpen] = useState(false);
  const [groupTitle, setGroupTitle] = useState("");

  const startConversation = useStartConversation();
  const createGroup = useCreateGroup();
  const report = useReport();
  const block = useBlockMember();
  const connect = useRequestConnect();

  const myEnquiries = useMyEnquiries(user?.id);
  const [detail, setDetail] = useState<EnquiryCardData | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);

  function requireActive() {
    if (!user) {
      navigate({ to: "/auth" });
      return false;
    }
    if (!active) {
      toast.error("Become a Prince Group Subscriber to connect with verified business members.");
      navigate({ to: "/payment" });
      return false;
    }
    return true;
  }

  async function message(userId: string) {
    if (!requireActive()) return;
    try {
      const id = await startConversation.mutateAsync(userId);
      navigate({ to: "/enquiry/messages", search: { c: id } });
    } catch (err) {
      toast.error(friendly((err as Error).message));
    }
  }

  async function doConnect(userId: string) {
    if (!requireActive()) return;
    try {
      await connect.mutateAsync({ toUser: userId });
      toast.success("Connect request sent.");
    } catch {
      toast.error("Could not send the request right now.");
    }
  }

  async function doReport(targetType: string, targetId: string) {
    if (!user) return void navigate({ to: "/auth" });
    try {
      await report.mutateAsync({ targetType, targetId, reason: "Reported from directory" });
      toast.success("Reported. Our team will review it.");
    } catch {
      toast.error("Could not submit the report.");
    }
  }

  async function doBlock(userId: string) {
    if (!user) return void navigate({ to: "/auth" });
    try {
      await block.mutateAsync(userId);
      toast.success("Member blocked.");
    } catch {
      toast.error("Could not block this member.");
    }
  }

  function toggleSelect(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  const rows = members.data?.rows ?? [];
  const total = members.data?.total ?? 0;
  const feedRows = feed.data?.rows ?? [];

  return (
    <PublicPage>
      <PageHero
        eyebrow="Prince Group Subscriber Network"
        title="CONNECT. COMMUNICATE."
        highlight="GROW."
        subtitle="Connect with businesses, professionals and opportunities within the Prince Group Subscriber Network."
        actions={
          <>
            <Button asChild size="lg" variant="lime">
              <Link to="/enquiry/messages">
                <MessagesSquare className="size-4" /> My Enquiries & Messages
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/enquiry/profile">
                <UserPlus className="size-4" /> Create Your Business Profile
              </Link>
            </Button>
          </>
        }
      />

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
        {!active ? (
          <div className="mb-8">
            <UpgradeGate />
          </div>
        ) : null}

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-6 flex h-auto flex-wrap gap-1 rounded-full bg-muted/70 p-1">
            <TabsTrigger value="members" className="rounded-full px-4 py-2 text-sm font-semibold">
              <Users className="mr-1.5 size-4" /> Explore Members
            </TabsTrigger>
            <TabsTrigger value="feed" className="rounded-full px-4 py-2 text-sm font-semibold">
              <Sparkles className="mr-1.5 size-4" /> Enquiry Feed
            </TabsTrigger>
            <TabsTrigger value="mine" className="rounded-full px-4 py-2 text-sm font-semibold">
              <Handshake className="mr-1.5 size-4" /> My Enquiries
            </TabsTrigger>
          </TabsList>

          {/* ---------------- Explore members ---------------- */}
          <TabsContent value="members" className="mt-0">
            <SectionHeading
              eyebrow="Member Directory"
              title="Verified"
              highlight="Business Members"
              subtitle="Search by name, company, business, category, service, location, what they need or what they offer."
            />

            <div className="liquid-glass mt-6 rounded-3xl p-4 sm:p-5">
              <div className="grid gap-3 md:grid-cols-[1.4fr_1fr_1fr_auto]">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={q}
                    onChange={(e) => {
                      setQ(e.target.value);
                      setPage(0);
                    }}
                    placeholder="Search digital marketing, distributor, hiring, company…"
                    className="pl-9"
                  />
                </div>
                <Select
                  value={category}
                  onValueChange={(v) => {
                    setCategory(v);
                    setPage(0);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>All categories</SelectItem>
                    {(categories ?? []).map((c) => (
                      <SelectItem key={c.id} value={c.name}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  value={location}
                  onChange={(e) => {
                    setLocation(e.target.value);
                    setPage(0);
                  }}
                  placeholder="Location"
                />
                <div className="flex gap-2">
                  <Button
                    variant={selecting ? "lime" : "outline"}
                    onClick={() => {
                      if (!requireActive()) return;
                      setSelecting((s) => !s);
                      setSelected([]);
                    }}
                  >
                    <Users className="size-4" /> Select Members
                  </Button>
                </div>
              </div>

              {selecting ? (
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-secondary/30 bg-secondary/10 px-4 py-2.5">
                  <span className="text-xs font-semibold text-primary">
                    {selected.length} member{selected.length === 1 ? "" : "s"} selected
                  </span>
                  <Button size="sm" variant="lime" disabled={!selected.length} onClick={() => setGroupOpen(true)}>
                    <Plus className="size-3.5" /> Create Group
                  </Button>
                </div>
              ) : null}
            </div>

            {members.isLoading ? (
              <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-72 rounded-3xl" />
                ))}
              </div>
            ) : rows.length === 0 ? (
              <p className="mt-8 text-sm text-muted-foreground">
                No member profiles match this search yet.
              </p>
            ) : (
              <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {rows.map((m, i) => (
                  <div key={(m.user_id ?? "locked") + i} className="relative">
                    {selecting && m.user_id ? (
                      <label className="absolute right-4 top-4 z-10 inline-flex cursor-pointer items-center gap-2 rounded-full border border-primary/20 bg-background/90 px-2.5 py-1 text-[11px] font-semibold text-primary shadow-soft">
                        <input
                          type="checkbox"
                          checked={selected.includes(m.user_id)}
                          onChange={() => toggleSelect(m.user_id!)}
                          className="size-3.5 accent-current"
                        />
                        Select
                      </label>
                    ) : null}
                    <MemberCard
                      member={m}
                      index={i}
                      onMessage={message}
                      onReport={(id) => doReport("member", id)}
                      onBlock={doBlock}
                    />
                  </div>
                ))}
              </div>
            )}

            {active && total > rows.length ? (
              <div className="mt-8 flex items-center justify-center gap-3">
                <Button variant="outline" disabled={page === 0} onClick={() => setPage((p) => Math.max(p - 1, 0))}>
                  Previous
                </Button>
                <span className="text-xs font-semibold text-muted-foreground">
                  Page {page + 1} · {total} members
                </span>
                <Button
                  variant="outline"
                  disabled={(page + 1) * 12 >= total}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Load More
                </Button>
              </div>
            ) : null}
          </TabsContent>

          {/* ---------------- Enquiry feed ---------------- */}
          <TabsContent value="feed" className="mt-0">
            <SectionHeading
              eyebrow="Enquiry Discovery"
              title="Live"
              highlight="Business Enquiries"
              subtitle="Explore what other subscribers need and offer — then connect or message directly."
            />
            <div className="liquid-glass mt-6 grid gap-3 rounded-3xl p-4 sm:p-5 md:grid-cols-[1.6fr_1fr]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={eq}
                  onChange={(e) => {
                    setEq(e.target.value);
                    setEpage(0);
                  }}
                  placeholder="Search enquiries — wholesale supplier, recruitment partner…"
                  className="pl-9"
                />
              </div>
              <Select
                value={etype}
                onValueChange={(v) => {
                  setEtype(v);
                  setEpage(0);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All enquiry types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All enquiry types</SelectItem>
                  {ENQUIRY_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {feed.isLoading ? (
              <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-60 rounded-3xl" />
                ))}
              </div>
            ) : feedRows.length === 0 ? (
              <p className="mt-8 text-sm text-muted-foreground">No enquiries posted yet.</p>
            ) : (
              <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {feedRows.map((e, i) => (
                  <EnquiryCard
                    key={e.id}
                    enquiry={e}
                    index={i}
                    onView={setDetail}
                    onMessage={message}
                    onConnect={doConnect}
                    onReport={(id) => doReport("enquiry", id)}
                  />
                ))}
              </div>
            )}

            {active && (feed.data?.total ?? 0) > feedRows.length ? (
              <div className="mt-8 flex items-center justify-center gap-3">
                <Button variant="outline" disabled={epage === 0} onClick={() => setEpage((p) => Math.max(p - 1, 0))}>
                  Previous
                </Button>
                <span className="text-xs font-semibold text-muted-foreground">Page {epage + 1}</span>
                <Button
                  variant="outline"
                  disabled={(epage + 1) * 12 >= (feed.data?.total ?? 0)}
                  onClick={() => setEpage((p) => p + 1)}
                >
                  Load More
                </Button>
              </div>
            ) : null}
          </TabsContent>

          {/* ---------------- My enquiries ---------------- */}
          <TabsContent value="mine" className="mt-0">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <SectionHeading
                eyebrow="My Enquiries"
                title="Your"
                highlight="Business Requirements"
                subtitle="Post what you need or offer. Active enquiries appear in the subscriber feed."
              />
              <Button
                size="lg"
                variant="lime"
                onClick={() => {
                  if (!requireActive()) return;
                  setComposeOpen(true);
                }}
              >
                <Plus className="size-4" /> New Enquiry
              </Button>
            </div>

            {!user ? (
              <p className="mt-6 text-sm text-muted-foreground">
                <Link to="/auth" className="font-semibold text-primary underline">
                  Sign in
                </Link>{" "}
                to manage your enquiries.
              </p>
            ) : (myEnquiries.data ?? []).length === 0 ? (
              <p className="mt-6 text-sm text-muted-foreground">You have not posted any enquiries yet.</p>
            ) : (
              <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {(myEnquiries.data ?? []).map((e, i) => (
                  <article
                    key={e.id}
                    className="liquid-glass reveal-soft rounded-3xl p-5"
                    style={{ animationDelay: `${Math.min(i, 10) * 55}ms` }}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <NetworkPill tone="lime">{e.enquiry_type}</NetworkPill>
                      <NetworkPill>{e.status}</NetworkPill>
                    </div>
                    <h3 className="mt-3 text-base font-bold text-primary">{e.title}</h3>
                    <p className="mt-2 line-clamp-3 text-xs text-muted-foreground">{e.description}</p>
                    <p className="mt-3 text-[11px] text-muted-foreground">Created {shortDate(e.created_at)}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {(["active", "connected", "closed"] as const).map((s) => (
                        <Button
                          key={s}
                          size="sm"
                          variant={e.status === s ? "lime" : "outline"}
                          onClick={async () => {
                            const { error } = await supabase
                              .from("member_enquiries")
                              .update({ status: s })
                              .eq("id", e.id);
                            if (error) toast.error("Could not update this enquiry.");
                            else {
                              toast.success(`Marked ${s}.`);
                              void queryClient.invalidateQueries({ queryKey: ["my-enquiries"] });
                              void queryClient.invalidateQueries({ queryKey: ["enquiry-search"] });
                            }
                          }}
                        >
                          {s}
                        </Button>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </section>

      <NewEnquiryDialog
        open={composeOpen}
        onOpenChange={setComposeOpen}
        userId={user?.id}
        categories={(categories ?? []).map((c) => c.name)}
      />

      {/* group dialog */}
      <Dialog open={groupOpen} onOpenChange={setGroupOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create group discussion</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Label htmlFor="group-title">Group name</Label>
            <Input
              id="group-title"
              value={groupTitle}
              onChange={(e) => setGroupTitle(e.target.value)}
              placeholder="e.g. Distribution partners – Kanyakumari"
            />
            <p className="text-xs text-muted-foreground">{selected.length} members selected.</p>
          </div>
          <DialogFooter>
            <Button
              variant="lime"
              onClick={async () => {
                try {
                  const id = await createGroup.mutateAsync({ title: groupTitle, members: selected });
                  setGroupOpen(false);
                  setSelecting(false);
                  setSelected([]);
                  navigate({ to: "/enquiry/messages", search: { c: id } });
                } catch (err) {
                  toast.error(friendly((err as Error).message));
                }
              }}
            >
              Create Group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* enquiry detail */}
      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{detail?.title}</DialogTitle>
          </DialogHeader>
          {detail ? (
            <div className="space-y-3 text-sm">
              <div className="flex flex-wrap gap-2">
                <NetworkPill tone="lime">{detail.enquiry_type}</NetworkPill>
                {detail.category ? <NetworkPill>{detail.category}</NetworkPill> : null}
                <NetworkPill>{detail.location}</NetworkPill>
              </div>
              <p className="text-muted-foreground">{detail.description}</p>
              {detail.what_i_need ? (
                <p>
                  <span className="font-semibold text-primary">What they need:</span>{" "}
                  <span className="text-muted-foreground">{detail.what_i_need}</span>
                </p>
              ) : null}
              {detail.what_i_offer ? (
                <p>
                  <span className="font-semibold text-primary">What they offer:</span>{" "}
                  <span className="text-muted-foreground">{detail.what_i_offer}</span>
                </p>
              ) : null}
              <p className="text-xs text-muted-foreground">
                Posted by {detail.author_name} · {shortDate(detail.created_at)}
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                {detail.author_id ? (
                  <>
                    <Button variant="lime" onClick={() => void message(detail.author_id!)}>
                      Message
                    </Button>
                    <Button variant="outline" onClick={() => void doConnect(detail.author_id!)}>
                      Request Connect
                    </Button>
                    <Button asChild variant="ghost">
                      <Link to="/enquiry/members/$id" params={{ id: detail.author_id }}>
                        View Profile
                      </Link>
                    </Button>
                  </>
                ) : null}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </PublicPage>
  );
}

function NewEnquiryDialog({
  open,
  onOpenChange,
  userId,
  categories,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  userId: string | undefined;
  categories: string[];
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    title: "",
    enquiry_type: ENQUIRY_TYPES[0] as string,
    category: "",
    description: "",
    what_i_need: "",
    what_i_offer: "",
    location: "Kanyakumari",
    contact_preference: "message",
  });
  const [saving, setSaving] = useState(false);

  function set(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit() {
    if (!userId) return;
    if (!form.title.trim()) {
      toast.error("Add an enquiry title.");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("member_enquiries").insert({ ...form, user_id: userId });
    setSaving(false);
    if (error) {
      toast.error("Only active subscribers can post enquiries.");
      return;
    }
    toast.success("Enquiry published to the subscriber network.");
    onOpenChange(false);
    void queryClient.invalidateQueries({ queryKey: ["my-enquiries"] });
    void queryClient.invalidateQueries({ queryKey: ["enquiry-search"] });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New business enquiry</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div>
            <Label htmlFor="e-title">Enquiry title</Label>
            <Input
              id="e-title"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Looking for a digital marketing agency"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Type</Label>
              <Select value={form.enquiry_type} onValueChange={(v) => set("enquiry_type", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ENQUIRY_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Category</Label>
              <Select {...(form.category ? { value: form.category } : {})} onValueChange={(v) => set("category", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="e-desc">Description</Label>
            <Textarea
              id="e-desc"
              rows={3}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="e-need">What I need</Label>
              <Textarea id="e-need" rows={2} value={form.what_i_need} onChange={(e) => set("what_i_need", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="e-offer">What I offer</Label>
              <Textarea id="e-offer" rows={2} value={form.what_i_offer} onChange={(e) => set("what_i_offer", e.target.value)} />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="e-loc">Location</Label>
              <Input id="e-loc" value={form.location} onChange={(e) => set("location", e.target.value)} />
            </div>
            <div>
              <Label>Contact preference</Label>
              <Select value={form.contact_preference} onValueChange={(v) => set("contact_preference", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="message">In-site message</SelectItem>
                  <SelectItem value="call">Call</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="lime" disabled={saving} onClick={() => void submit()}>
            {saving ? "Publishing…" : "Publish Enquiry"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function friendly(code: string) {
  const map: Record<string, string> = {
    no_active_subscription: "An active subscription is required to communicate with members.",
    member_not_active: "This member's subscription is not active right now.",
    blocked: "Messaging is unavailable between you and this member.",
    communication_blocked: "Your communication access is currently suspended.",
  };
  return map[code] ?? "Something went wrong. Please try again.";
}
