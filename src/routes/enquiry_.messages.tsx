import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Paperclip,
  PhoneCall,
  Search,
  Send,
  Users,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { CallPanel } from "@/components/network/CallPanel";
import { NetworkPill, UpgradeGate } from "@/components/network/NetworkBits";
import { PublicPage } from "@/components/site/PublicPage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import {
  useConversationMessages,
  useConversations,
  useNetworkAccess,
  useSendMessage,
} from "@/hooks/useNetwork";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/enquiry_/messages")({
  validateSearch: z.object({ c: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Member Messages | Prince Group Subscriber Network" },
      { name: "description", content: "Secure member-to-member messaging inside the Prince Group subscriber network." },
      { property: "og:title", content: "Member Messages | Prince Group Subscriber Network" },
      { property: "og:description", content: "Private business messaging for active Prince Group subscribers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MessagesPage,
});

function MessagesPage() {
  const { c } = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: access } = useNetworkAccess();
  const active = !!access?.active;

  const conversations = useConversations(active);
  const list = conversations.data ?? [];
  const activeId = c ?? list[0]?.id;
  const messages = useConversationMessages(active ? activeId : undefined);
  const send = useSendMessage();

  const [filter, setFilter] = useState("");
  const [body, setBody] = useState("");
  const [uploading, setUploading] = useState(false);
  const [calling, setCalling] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const current = list.find((x) => x.id === activeId);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.data?.length, activeId]);

  useEffect(() => {
    if (!activeId) return;
    void supabase
      .from("conversation_participants")
      .update({ last_read_at: new Date().toISOString() })
      .eq("conversation_id", activeId)
      .then(() => queryClient.invalidateQueries({ queryKey: ["my-conversations"] }));
  }, [activeId, queryClient, messages.data?.length]);

  async function submit() {
    if (!activeId || (!body.trim() && !fileRef.current?.files?.length)) return;
    let attachmentPath: string | null = null;
    const file = fileRef.current?.files?.[0];
    if (file) {
      setUploading(true);
      const { data: auth } = await supabase.auth.getUser();
      const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
      const path = `${auth.user?.id}/chat/${Date.now()}-${safe}`;
      const { error } = await supabase.storage.from("member-media").upload(path, file);
      setUploading(false);
      if (error) return toast.error("Could not upload that file.");
      attachmentPath = path;
      if (fileRef.current) fileRef.current.value = "";
    }
    try {
      await send.mutateAsync({ conversationId: activeId, body: body.trim(), attachmentPath });
      setBody("");
    } catch (err) {
      const code = (err as Error).message;
      toast.error(
        code === "no_active_subscription"
          ? "An active subscription is required to send messages."
          : code === "communication_blocked"
            ? "Your communication access is suspended."
            : "Message could not be sent.",
      );
    }
  }

  async function openAttachment(path: string) {
    const { data, error } = await supabase.storage.from("member-media").createSignedUrl(path, 300);
    if (error || !data) return toast.error("Attachment unavailable.");
    window.open(data.signedUrl, "_blank", "noopener");
  }

  const filtered = list.filter((x) => x.title.toLowerCase().includes(filter.toLowerCase()));

  return (
    <PublicPage>
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link to="/enquiry">
              <ArrowLeft className="size-4" /> Back to Enquiry
            </Link>
          </Button>
          <Button asChild variant="lime" size="sm">
            <Link to="/enquiry">
              <Users className="size-4" /> New Message · Select Members
            </Link>
          </Button>
        </div>

        <h1 className="mt-4 text-2xl font-bold text-primary sm:text-3xl">Member Messages</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Secure conversations between active Prince Group subscribers.
        </p>

        {!active ? (
          <div className="mt-6">
            <UpgradeGate note="Messaging, group discussions and calls are available to active subscribers only." />
          </div>
        ) : (
          <div className="mt-6 grid gap-5 lg:grid-cols-[340px_1fr]">
            {/* conversation list */}
            <aside className="liquid-glass rounded-3xl p-4">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  placeholder="Search conversations"
                  className="pl-9"
                />
              </div>
              <div className="mt-3 max-h-[60vh] space-y-1.5 overflow-y-auto pr-1">
                {conversations.isLoading ? (
                  <Skeleton className="h-20 rounded-2xl" />
                ) : filtered.length === 0 ? (
                  <p className="px-1 py-6 text-xs text-muted-foreground">
                    No conversations yet. Open a member profile and tap Message.
                  </p>
                ) : (
                  filtered.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => navigate({ to: "/enquiry/messages", search: { c: conv.id } })}
                      className={cn(
                        "w-full rounded-2xl border px-3 py-2.5 text-left transition-all",
                        conv.id === activeId
                          ? "border-primary/30 bg-primary/10"
                          : "border-transparent hover:border-primary/15 hover:bg-primary/5",
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-semibold text-primary">{conv.title}</span>
                        {conv.unread > 0 ? <NetworkPill tone="lime">{conv.unread}</NetworkPill> : null}
                      </div>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {conv.is_group ? `Group · ${conv.participants} members · ` : ""}
                        {conv.last_message ?? "No messages yet"}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </aside>

            {/* thread */}
            <div className="liquid-glass flex min-h-[60vh] flex-col rounded-3xl p-4 sm:p-5">
              {!activeId ? (
                <p className="m-auto text-sm text-muted-foreground">Select a conversation to start.</p>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-3 border-b border-primary/10 pb-3">
                    <div className="min-w-0">
                      <h2 className="truncate text-base font-bold text-primary">{current?.title}</h2>
                      <p className="text-[11px] text-muted-foreground">
                        {current?.is_group ? `${current.participants} members` : "Direct conversation"}
                      </p>
                    </div>
                    {current?.other_user_id ? (
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => setCalling(true)}>
                          <PhoneCall className="size-3.5" /> Call
                        </Button>
                        <Button asChild size="sm" variant="ghost">
                          <Link to="/enquiry/members/$id" params={{ id: current.other_user_id }}>
                            Profile
                          </Link>
                        </Button>
                      </div>
                    ) : null}
                  </div>

                  <div className="flex-1 space-y-3 overflow-y-auto py-4">
                    {(messages.data ?? []).map((m) => (
                      <div key={m.id} className={cn("flex", m.mine ? "justify-end" : "justify-start")}>
                        <div
                          className={cn(
                            "max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm",
                            m.mine
                              ? "bg-primary text-primary-foreground"
                              : "border border-primary/10 bg-background text-foreground",
                          )}
                        >
                          {!m.mine && current?.is_group ? (
                            <p className="mb-0.5 text-[10px] font-bold uppercase tracking-wider opacity-70">
                              {m.sender_name}
                            </p>
                          ) : null}
                          {m.body ? <p className="whitespace-pre-line">{m.body}</p> : null}
                          {m.attachment_path ? (
                            <button
                              onClick={() => void openAttachment(m.attachment_path!)}
                              className="mt-1 inline-flex items-center gap-1.5 text-xs underline"
                            >
                              <Paperclip className="size-3" /> Attachment
                            </button>
                          ) : null}
                          <p className="mt-1 text-[10px] opacity-70">
                            {new Date(m.created_at).toLocaleString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={endRef} />
                  </div>

                  <div className="flex items-end gap-2 border-t border-primary/10 pt-3">
                    <input ref={fileRef} type="file" className="hidden" accept="image/*,.pdf,.doc,.docx,.xlsx" />
                    <Button size="icon" variant="outline" onClick={() => fileRef.current?.click()}>
                      <Paperclip className="size-4" />
                    </Button>
                    <Textarea
                      rows={1}
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          void submit();
                        }
                      }}
                      placeholder="Write a business message…"
                      className="min-h-[44px] flex-1 resize-none"
                    />
                    <Button variant="lime" disabled={uploading || send.isPending} onClick={() => void submit()}>
                      <Send className="size-4" /> Send
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </section>

      {current?.other_user_id ? (
        <CallPanel
          open={calling}
          onOpenChange={setCalling}
          calleeId={current.other_user_id}
          calleeName={current.title}
          conversationId={current.id}
        />
      ) : null}
    </PublicPage>
  );
}
