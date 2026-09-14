import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { BadgeCheck, Building2, QrCode, ShieldCheck, SmartphoneNfc, Upload } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import paymentQr from "@/assets/payment-qr.jpeg.asset.json";
import { PageHero, PublicPage } from "@/components/site/PublicPage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useProfile, useSession } from "@/hooks/useAuth";
import { usePlans } from "@/hooks/usePlatform";
import { supabase } from "@/integrations/supabase/client";
import { inr } from "@/lib/format";
import { sendPhoneOtp, verifyPhoneOtp } from "@/lib/otp.functions";

const title = "Payment & Unlock | PRINCE GROUP";
const description =
  "Pay for your PRINCE GROUP subscription or unlock package, verify your mobile number and submit your payment details for verification.";

const searchSchema = z.object({
  plan: z.string().optional(),
  item: z.string().optional(),
  amount: z.coerce.number().optional(),
});

export const Route = createFileRoute("/payment")({
  validateSearch: (search: Record<string, unknown>) => searchSchema.parse(search),
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PaymentPage,
});

function PaymentPage() {
  const { plan: planParam, item: itemParam, amount: amountParam } = Route.useSearch();
  const { user, loading: sessionLoading } = useSession();
  const { data: profile } = useProfile(user?.id);
  const { data: plans } = usePlans();
  const queryClient = useQueryClient();

  const [selectedPlan, setSelectedPlan] = useState(planParam ?? "");
  const [customItem, setCustomItem] = useState(itemParam ?? "");
  const [customAmount, setCustomAmount] = useState(amountParam ? String(amountParam) : "");
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [location, setLocation] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [utr, setUtr] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const verified = profile?.phone_verified === true;

  useEffect(() => {
    if (!profile) return;
    setName((v) => v || (profile.name ?? ""));
    setEmail((v) => v || (profile.email ?? ""));
    setMobile((v) => v || (profile.phone ?? ""));
    setLocation((v) => v || (profile.location ?? ""));
  }, [profile]);

  const plan = useMemo(
    () => (plans ?? []).find((p) => p.code === selectedPlan) ?? null,
    [plans, selectedPlan],
  );

  const itemLabel = plan ? `${plan.name} Subscription` : customItem || "Custom Payment";
  const amount = plan ? plan.price : Number(customAmount) || 0;

  const sendOtpFn = useServerFn(sendPhoneOtp);
  const verifyOtpFn = useServerFn(verifyPhoneOtp);

  const sendOtp = useMutation({
    mutationFn: async () => {
      if (!name.trim() || !mobile.trim() || !email.trim() || !location.trim()) {
        throw new Error("Please fill in your name, mobile number, location and email.");
      }
      await sendOtpFn({ data: { phone: mobile.trim() } });
    },
    onSuccess: () => {
      setOtpSent(true);
      toast.success("Verification code sent to your mobile number.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const verifyOtp = useMutation({
    mutationFn: async () => {
      await verifyOtpFn({
        data: {
          code: otp,
          name: name.trim(),
          email: email.trim(),
          location: location.trim(),
        },
      });
    },
    onSuccess: () => {
      toast.success("Mobile number verified.");
      queryClient.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const submit = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Please sign in to submit payment details.");
      if (!verified) throw new Error("Please verify your mobile number first.");
      if (!name.trim() || !mobile.trim() || !email.trim() || !utr.trim() || !file) {
        throw new Error("Please fill in all required fields.");
      }
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
        throw new Error("Please enter a valid email address.");
      }
      if (amount <= 0) throw new Error("Please choose a plan or enter a valid amount.");

      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
      const screenshotPath = `${user.id}/${Date.now()}-${safeName}`;
      const { error: upErr } = await supabase.storage
        .from("payment-proofs")
        .upload(screenshotPath, file, { contentType: file.type });
      if (upErr) throw upErr;

      const { error } = await supabase.from("payment_submissions").insert({
        user_id: user.id,
        name: name.trim(),
        mobile: mobile.trim(),
        email: email.trim(),
        plan_code: plan?.code ?? null,
        item: itemLabel,
        amount,
        utr: utr.trim(),
        screenshot_path: screenshotPath,
      });
      if (error) throw error;

      if (plan) {
        // Preserve the existing subscription backend: register a pending subscription.
        await supabase.rpc("start_subscription", { _plan_code: plan.code });
      }
    },
    onSuccess: () => {
      setSubmitted(true);
      queryClient.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <PublicPage>
      <PageHero
        eyebrow="Secure Payment"
        title="Complete Your Payment"
        highlight="Verify & Activate."
        subtitle="Scan the QR code to pay, then sign in and verify your mobile number with an OTP. Our team verifies every payment manually before activating your plan or profile access."
      />

      <section className="bg-gradient-cream py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          {submitted ? (
            <div className="mx-auto max-w-2xl rounded-3xl border border-primary/10 bg-card p-10 text-center shadow-lift">
              <span className="mx-auto grid size-16 place-items-center rounded-full bg-accent/15 text-secondary">
                <BadgeCheck className="size-8" />
              </span>
              <h2 className="mt-6 text-2xl font-bold text-primary">Payment details submitted</h2>
              <p className="mt-3 text-sm leading-relaxed text-foreground/80">
                Payment details submitted successfully. Our team will verify your payment and
                activate your plan/profile access.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Button asChild variant="hero">
                  <Link to="/subscription">View my subscription</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/">Back to home</Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr]">
              {/* Left: summary + payment option */}
              <div className="space-y-6">
                <div className="rounded-3xl bg-gradient-olive p-7 text-cream shadow-lift">
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-accent">
                    You are paying for
                  </p>
                  <h2 className="mt-2 text-2xl font-bold">{itemLabel}</h2>
                  <p className="mt-4 flex items-end gap-2">
                    <span className="font-display text-5xl font-bold text-accent">
                      {inr(amount)}
                    </span>
                    {plan ? (
                      <span className="pb-2 text-sm text-cream/90">
                        /{plan.billing_period === "monthly" ? "month" : plan.billing_period}
                      </span>
                    ) : null}
                  </p>
                  {plan ? (
                    <p className="mt-2 text-sm text-cream/95">
                      {plan.discount_percentage}% member discount · {plan.lead_limit} lead
                      allocations
                    </p>
                  ) : null}
                  <p className="mt-4 flex items-center gap-2 text-xs text-cream/90">
                    <ShieldCheck className="size-4 text-accent" />
                    Payments are activated only after manual verification — nothing is
                    auto-confirmed.
                  </p>
                </div>

                <div className="rounded-3xl border border-primary/10 bg-card p-7 text-center shadow-soft">
                  <h3 className="flex items-center justify-center gap-2 text-lg font-semibold text-primary">
                    <QrCode className="size-5 text-secondary" /> Select Payment Option
                  </h3>
                  <p className="mt-2 text-xs text-foreground/80">
                    Scan this QR code with any UPI app (GPay, PhonePe, Paytm, BHIM…) and pay{" "}
                    {inr(amount)}.
                  </p>
                  <img
                    src={paymentQr.url}
                    alt="Prince Group UPI QR code — scan to pay with any UPI app"
                    className="mx-auto mt-5 w-full max-w-xs rounded-2xl border border-primary/10"
                  />
                </div>
              </div>

              {/* Right: sign in → OTP → confirmation */}
              <div className="rounded-3xl border border-primary/10 bg-card p-7 shadow-soft sm:p-8">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-primary">
                  <Building2 className="size-5 text-secondary" /> Complete &amp; activate
                </h3>
                <ol className="mt-4 list-decimal space-y-1 pl-5 text-xs leading-relaxed text-foreground/80">
                  <li>Scan the QR code and complete your payment.</li>
                  <li>Sign in and verify your mobile number with the OTP we send you.</li>
                  <li>Submit your payment reference and screenshot to activate access.</li>
                </ol>

                {!user && !sessionLoading ? (
                  <div className="mt-8 rounded-2xl bg-muted p-6 text-center">
                    <p className="text-sm text-foreground/80">
                      Please sign in or create your account to continue.
                    </p>
                    <Button asChild variant="hero" className="mt-4">
                      <Link to="/auth">Sign in to continue</Link>
                    </Button>
                  </div>
                ) : user && !verified ? (
                  <form
                    className="mt-7 space-y-5"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (otpSent) verifyOtp.mutate();
                      else sendOtp.mutate();
                    }}
                  >
                    <div className="flex items-center gap-2 rounded-2xl bg-muted/60 px-4 py-3 text-xs text-foreground/80">
                      <SmartphoneNfc className="size-4 text-secondary" />
                      Mobile OTP verification is required before your subscription functions are
                      activated.
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                      <Field label="Name" required>
                        <Input
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          maxLength={100}
                          required
                          placeholder="Your full name"
                        />
                      </Field>
                      <Field label="Contact Number" required>
                        <Input
                          value={mobile}
                          onChange={(e) => setMobile(e.target.value)}
                          maxLength={15}
                          required
                          inputMode="tel"
                          placeholder="10-digit mobile number"
                        />
                      </Field>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                      <Field label="Location" required>
                        <Input
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          maxLength={120}
                          required
                          placeholder="City / District"
                        />
                      </Field>
                      <Field label="Email ID" required>
                        <Input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          maxLength={255}
                          required
                          placeholder="you@example.com"
                        />
                      </Field>
                    </div>

                    {otpSent ? (
                      <Field label="Enter OTP" required>
                        <Input
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          maxLength={6}
                          required
                          inputMode="numeric"
                          placeholder="6-digit code"
                        />
                      </Field>
                    ) : null}

                    <Button
                      type="submit"
                      variant="hero"
                      size="lg"
                      className="w-full"
                      disabled={sendOtp.isPending || verifyOtp.isPending}
                    >
                      {otpSent
                        ? verifyOtp.isPending
                          ? "Verifying…"
                          : "Verify OTP"
                        : sendOtp.isPending
                          ? "Sending OTP…"
                          : "Send OTP"}
                    </Button>

                    {otpSent ? (
                      <button
                        type="button"
                        className="w-full text-center text-xs font-semibold text-secondary underline-offset-4 hover:underline"
                        onClick={() => sendOtp.mutate()}
                        disabled={sendOtp.isPending}
                      >
                        Resend code
                      </button>
                    ) : null}
                  </form>
                ) : user ? (
                  <form
                    className="mt-7 space-y-5"
                    onSubmit={(e) => {
                      e.preventDefault();
                      submit.mutate();
                    }}
                  >
                    <p className="flex items-center gap-2 rounded-2xl bg-accent/10 px-4 py-3 text-xs font-semibold text-primary">
                      <BadgeCheck className="size-4 text-secondary" />
                      Mobile number verified
                    </p>

                    <div className="grid gap-5 sm:grid-cols-2">
                      <Field label="Selected Plan / Service" required>
                        {plans && plans.length > 0 ? (
                          <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={selectedPlan}
                            onChange={(e) => {
                              setSelectedPlan(e.target.value);
                              if (e.target.value) {
                                setCustomItem("");
                                setCustomAmount("");
                              }
                            }}
                          >
                            <option value="">{customItem || "Custom / other payment"}</option>
                            {plans.map((p) => (
                              <option key={p.code} value={p.code}>
                                {p.name} — {inr(p.price)}/
                                {p.billing_period === "monthly" ? "month" : p.billing_period}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <Input value={itemLabel} readOnly />
                        )}
                      </Field>
                      <Field label="Amount (₹)" required>
                        <Input
                          value={plan ? String(plan.price) : customAmount}
                          onChange={(e) => {
                            if (!plan) setCustomAmount(e.target.value);
                          }}
                          readOnly={!!plan}
                          inputMode="numeric"
                          required
                          placeholder="Amount paid"
                        />
                      </Field>
                    </div>

                    {!plan && !itemParam ? (
                      <Field label="Payment for (description)">
                        <Input
                          value={customItem}
                          onChange={(e) => setCustomItem(e.target.value)}
                          maxLength={120}
                          placeholder="e.g. Candidate data unlock, service payment"
                        />
                      </Field>
                    ) : null}

                    <Field label="Payment Reference / UTR Number" required>
                      <Input
                        value={utr}
                        onChange={(e) => setUtr(e.target.value)}
                        maxLength={40}
                        required
                        placeholder="e.g. 412345678901"
                      />
                    </Field>

                    <Field label="Payment Screenshot / Receipt" required>
                      <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-primary/25 bg-muted/40 px-4 py-6 text-sm text-foreground/80 transition-colors hover:border-secondary/50">
                        <Upload className="size-4 text-secondary" />
                        {file ? file.name : "Click to upload payment screenshot"}
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          required
                          className="hidden"
                          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                        />
                      </label>
                    </Field>

                    <Button
                      type="submit"
                      variant="hero"
                      size="lg"
                      className="w-full"
                      disabled={submit.isPending}
                    >
                      {submit.isPending ? "Submitting…" : `Submit Payment — ${inr(amount)}`}
                    </Button>
                    <p className="text-center text-[11px] text-foreground/80">
                      Your plan/profile access is activated only after our team verifies the
                      payment.
                    </p>
                  </form>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </section>
    </PublicPage>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold uppercase tracking-wider text-foreground/80">
        {label} {required ? <span className="text-destructive">*</span> : null}
      </Label>
      {children}
    </div>
  );
}
