import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Building2,
  Flag,
  Globe,
  Handshake,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  PhoneCall,
  Share2,
  ShieldBan,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { CallPanel } from "@/components/network/CallPanel";
import { NetworkPill, UpgradeGate } from "@/components/network/NetworkBits";
import { PublicPage } from "@/components/site/PublicPage";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useBlockMember,
  useMemberDetail,
  useReport,
  useRequestConnect,
  useStartConversation,
} from "@/hooks/useNetwork";

export const Route = createFileRoute("/enquiry_/members/$id")({
  head: () => ({
    meta: [
      { title: "Member Profile | Prince Group Subscriber Network" },
      {
        name: "description",
        content: "View a verified Prince Group subscriber's business profile, products, services and requirements.",
      },
      { property: "og:title", content: "Member Profile | Prince Group Subscriber Network" },
      { property: "og:description", content: "Verified business member profile inside the Prince Group network." },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MemberProfilePage,
});

function MemberProfilePage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useMemberDetail(id);
  const startConversation = useStartConversation();
  const connect = useRequestConnect();
  const report = useReport();
  const block = useBlockMember();
  const [calling, setCalling] = useState(false);

  const blockedView = data?.error === "no_active_subscription" || data?.error === "not_authenticated";

  async function message() {
    try {
      const cid = await startConversation.mutateAsync(id);
      navigate({ to: "/enquiry/messages", search: { c: cid } });
    } catch {
      toast.error("Messaging is available to active subscribers.");
    }
  }

  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: data?.full_name ?? "Member profile", url });
      else {
        await navigator.clipboard.writeText(url);
        toast.success("Profile link copied.");
      }
    } catch {
      /* dismissed */
    }
  }

  return (
    <PublicPage>
      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        <Button asChild variant="ghost" size="sm" className="mb-6">
          <Link to="/enquiry">
            <ArrowLeft className="size-4" /> Back to Enquiry
          </Link>
        </Button>

        {isLoading ? (
          <Skeleton className="h-96 rounded-3xl" />
        ) : blockedView ? (
          <UpgradeGate />
        ) : !data || data.error ? (
          <p className="text-sm text-foreground/80">This member profile is not available.</p>
        ) : (
          <>
            <div className="liquid-glass relative overflow-hidden rounded-3xl p-6 sm:p-8">
              <span className="pointer-events-none absolute -right-24 -top-24 size-64 rounded-full bg-secondary/15 blur-3xl" />
              <div className="relative flex flex-col gap-6 sm:flex-row sm:items-start">
                <span className="grid size-24 shrink-0 place-items-center overflow-hidden rounded-3xl bg-primary/10 text-2xl font-bold text-primary ring-1 ring-primary/15">
                  {data.photo_url || data.company_logo_url ? (
                    <img src={data.photo_url ?? data.company_logo_url ?? ""} alt="" loading="lazy" decoding="async" className="size-full object-cover" />
                  ) : (
                    data.full_name.slice(0, 2).toUpperCase()
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <h1 className="text-2xl font-bold text-primary sm:text-3xl">{data.full_name}</h1>
                  <p className="mt-1 text-sm font-semibold text-secondary">{data.designation}</p>
                  <p className="mt-1 inline-flex items-center gap-2 text-sm text-foreground/80">
                    <Building2 className="size-4" /> {data.company_name || "Independent"}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {data.category ? <NetworkPill>{data.category}</NetworkPill> : null}
                    <NetworkPill>
                      <MapPin className="size-3" /> {data.location}
                    </NetworkPill>
                    <NetworkPill tone="lime">Verified subscriber</NetworkPill>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <Button variant="lime" onClick={() => void message()}>
                      <MessageSquare className="size-4" /> Message
                    </Button>
                    <Button
                      variant="outline"
                      onClick={async () => {
                        try {
                          await connect.mutateAsync({ toUser: id });
                          toast.success("Connect request sent.");
                        } catch {
                          toast.error("Could not send the request.");
                        }
                      }}
                    >
                      <Handshake className="size-4" /> Request Connect
                    </Button>
                    <Button variant="outline" onClick={() => setCalling(true)}>
                      <PhoneCall className="size-4" /> Call
                    </Button>
                    <Button variant="ghost" onClick={() => void share()}>
                      <Share2 className="size-4" /> Share Profile
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
              <div className="space-y-5">
                <Panel title="About Business">{data.about_company || "—"}</Panel>
                <Panel title="About">{data.about_me || "—"}</Panel>
                <Panel title="Products / Services">{data.products_services || "—"}</Panel>
              </div>
              <div className="space-y-5">
                <Panel title="What We Offer">{data.what_we_offer || "—"}</Panel>
                <Panel title="What We Need">{data.what_we_need || "—"}</Panel>
                <div className="liquid-glass rounded-3xl p-5">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-primary">Contact availability</h2>
                  <ul className="mt-3 space-y-2 text-sm text-foreground/80">
                    <li className="inline-flex items-center gap-2">
                      <MessageSquare className="size-4 text-secondary" /> Preferred: {data.preferred_contact}
                    </li>
                    {data.business_email ? (
                      <li className="flex items-center gap-2">
                        <Mail className="size-4 text-secondary" /> {data.business_email}
                      </li>
                    ) : null}
                    {data.business_phone ? (
                      <li className="flex items-center gap-2">
                        <Phone className="size-4 text-secondary" /> {data.business_phone}
                      </li>
                    ) : (
                      <li className="text-xs">Phone kept private — connect through in-site messaging or call.</li>
                    )}
                    {data.website ? (
                      <li className="flex items-center gap-2">
                        <Globe className="size-4 text-secondary" />
                        <a href={data.website} target="_blank" rel="noreferrer" className="underline">
                          {data.website}
                        </a>
                      </li>
                    ) : null}
                  </ul>
                  <div className="mt-4 flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={async () => {
                        await report.mutateAsync({ targetType: "member", targetId: id, reason: "Reported from profile" });
                        toast.success("Reported. Our team will review it.");
                      }}
                    >
                      <Flag className="size-3.5" /> Report
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={async () => {
                        await block.mutateAsync(id);
                        toast.success("Member blocked.");
                        navigate({ to: "/enquiry" });
                      }}
                    >
                      <ShieldBan className="size-3.5" /> Block
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </section>

      <CallPanel
        open={calling}
        onOpenChange={setCalling}
        calleeId={id}
        calleeName={data?.full_name ?? "Member"}
      />
    </PublicPage>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="liquid-glass rounded-3xl p-5">
      <h2 className="text-sm font-bold uppercase tracking-wider text-primary">{title}</h2>
      <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-foreground/80">{children}</p>
    </div>
  );
}
