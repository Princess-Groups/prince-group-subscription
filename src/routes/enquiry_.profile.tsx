import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ImagePlus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { UpgradeGate } from "@/components/network/NetworkBits";
import { PublicPage } from "@/components/site/PublicPage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "@/hooks/useAuth";
import { useMemberCategories, useMyMemberProfile, useNetworkAccess } from "@/hooks/useNetwork";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/enquiry_/profile")({
  head: () => ({
    meta: [
      { title: "Create Your Business Profile | Prince Group Subscriber Network" },
      {
        name: "description",
        content: "Set up your Prince Group subscriber business profile so other verified members can find you.",
      },
      { property: "og:title", content: "Create Your Business Profile | Prince Group" },
      { property: "og:description", content: "Subscriber business profile setup for the Prince Group network." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProfileSetupPage,
});

const EMPTY = {
  full_name: "",
  company_name: "",
  designation: "",
  category: "",
  location: "Kanyakumari",
  about_me: "",
  about_company: "",
  products_services: "",
  what_we_offer: "",
  what_we_need: "",
  website: "",
  business_email: "",
  business_phone: "",
  preferred_contact: "message",
  photo_url: "",
  company_logo_url: "",
};

function ProfileSetupPage() {
  const { user } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: access } = useNetworkAccess();
  const { data: categories } = useMemberCategories();
  const { data: existing, isLoading } = useMyMemberProfile(user?.id);

  const [form, setForm] = useState(EMPTY);
  const [showPhone, setShowPhone] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!existing) return;
    setForm({
      full_name: existing.full_name ?? "",
      company_name: existing.company_name ?? "",
      designation: existing.designation ?? "",
      category: existing.category ?? "",
      location: existing.location ?? "Kanyakumari",
      about_me: existing.about_me ?? "",
      about_company: existing.about_company ?? "",
      products_services: existing.products_services ?? "",
      what_we_offer: existing.what_we_offer ?? "",
      what_we_need: existing.what_we_need ?? "",
      website: existing.website ?? "",
      business_email: existing.business_email ?? "",
      business_phone: existing.business_phone ?? "",
      preferred_contact: existing.preferred_contact ?? "message",
      photo_url: existing.photo_url ?? "",
      company_logo_url: existing.company_logo_url ?? "",
    });
    setShowPhone(!!existing.show_phone);
    setShowEmail(!!existing.show_email);
  }, [existing]);

  function set(key: keyof typeof EMPTY, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function upload(file: File, key: "photo_url" | "company_logo_url") {
    if (!user) return;
    const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 60);
    const path = `${user.id}/profile/${Date.now()}-${safe}`;
    const { error } = await supabase.storage.from("member-media").upload(path, file, { upsert: true });
    if (error) return toast.error("Could not upload that image.");
    const { data } = await supabase.storage.from("member-media").createSignedUrl(path, 60 * 60 * 24 * 365);
    if (data?.signedUrl) set(key, data.signedUrl);
  }

  async function save() {
    if (!user) return void navigate({ to: "/auth" });
    if (!form.full_name.trim()) return toast.error("Add your full name.");
    setSaving(true);
    const { error } = await supabase.from("member_profiles").upsert(
      {
        user_id: user.id,
        ...form,
        show_phone: showPhone,
        show_email: showEmail,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
    setSaving(false);
    if (error) return toast.error("Could not save your profile.");
    toast.success("Business profile saved.");
    void queryClient.invalidateQueries({ queryKey: ["my-member-profile"] });
    void queryClient.invalidateQueries({ queryKey: ["network-access"] });
    void queryClient.invalidateQueries({ queryKey: ["member-search"] });
  }

  return (
    <PublicPage>
      <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <Button asChild variant="ghost" size="sm" className="mb-6">
          <Link to="/enquiry">
            <ArrowLeft className="size-4" /> Back to Enquiry
          </Link>
        </Button>

        <h1 className="text-2xl font-bold text-primary sm:text-3xl">Create Your Business Profile</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your profile is visible to other active Prince Group subscribers. Private details stay hidden unless you
          choose to show them.
        </p>

        {!access?.active ? (
          <div className="mt-6">
            <UpgradeGate note="You can prepare your profile now — networking activates once your subscription is verified." />
          </div>
        ) : null}

        {isLoading ? null : (
          <div className="liquid-glass mt-6 grid gap-4 rounded-3xl p-5 sm:p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" value={form.full_name} onChange={(v) => set("full_name", v)} />
              <Field label="Designation / Role" value={form.designation} onChange={(v) => set("designation", v)} />
              <Field label="Company name" value={form.company_name} onChange={(v) => set("company_name", v)} />
              <div>
                <Label>Business category</Label>
                <Select value={form.category || undefined} onValueChange={(v) => set("category", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {(categories ?? []).map((c) => (
                      <SelectItem key={c.id} value={c.name}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Field label="Location" value={form.location} onChange={(v) => set("location", v)} />
              <Field label="Business website" value={form.website} onChange={(v) => set("website", v)} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <ImageField
                label="Profile photo"
                url={form.photo_url}
                onFile={(f) => void upload(f, "photo_url")}
              />
              <ImageField
                label="Company logo"
                url={form.company_logo_url}
                onFile={(f) => void upload(f, "company_logo_url")}
              />
            </div>

            <AreaField label="About me" value={form.about_me} onChange={(v) => set("about_me", v)} />
            <AreaField label="About company" value={form.about_company} onChange={(v) => set("about_company", v)} />
            <AreaField
              label="Products / Services"
              value={form.products_services}
              onChange={(v) => set("products_services", v)}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <AreaField label="What we offer" value={form.what_we_offer} onChange={(v) => set("what_we_offer", v)} />
              <AreaField label="What we need" value={form.what_we_need} onChange={(v) => set("what_we_need", v)} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Business email" value={form.business_email} onChange={(v) => set("business_email", v)} />
              <Field label="Business phone" value={form.business_phone} onChange={(v) => set("business_phone", v)} />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex items-center justify-between gap-3 rounded-2xl border border-primary/15 px-4 py-3">
                <span className="text-sm font-semibold text-primary">Show phone to members</span>
                <Switch checked={showPhone} onCheckedChange={setShowPhone} />
              </label>
              <label className="flex items-center justify-between gap-3 rounded-2xl border border-primary/15 px-4 py-3">
                <span className="text-sm font-semibold text-primary">Show email to members</span>
                <Switch checked={showEmail} onCheckedChange={setShowEmail} />
              </label>
            </div>

            <div>
              <Label>Preferred contact method</Label>
              <Select value={form.preferred_contact} onValueChange={(v) => set("preferred_contact", v)}>
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

            <Button size="lg" variant="lime" disabled={saving} onClick={() => void save()}>
              {saving ? "Saving…" : existing ? "Update Profile" : "Create Profile"}
            </Button>
          </div>
        )}
      </section>
    </PublicPage>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <Label>{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function AreaField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <Label>{label}</Label>
      <Textarea rows={3} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function ImageField({ label, url, onFile }: { label: string; url: string; onFile: (f: File) => void }) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="mt-1 flex items-center gap-3">
        <span className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-2xl bg-primary/10 ring-1 ring-primary/15">
          {url ? <img src={url} alt="" className="size-full object-cover" /> : <ImagePlus className="size-5 text-primary/60" />}
        </span>
        <Input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
          }}
        />
      </div>
    </div>
  );
}
