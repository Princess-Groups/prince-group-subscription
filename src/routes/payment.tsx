import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { BadgeCheck, Building2, CreditCard, Mail, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { PageHero, PublicPage } from "@/components/site/PublicPage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useProfile, useSession } from "@/hooks/useAuth";
import { usePlans } from "@/hooks/usePlatform";
import { inr } from "@/lib/format";
import { saveProfileDetails } from "@/lib/profile.functions";
import {
  createRazorpayOrder,
  getRazorpayKeyId,
  verifyRazorpayPayment,
} from "@/lib/razorpay.functions";

type RazorpayCheckout = new (options: Record<string, unknown>) => {
  open: () => void;
  on: (event: string, handler: (response: unknown) => void) => void;
};

function loadRazorpayScript(): Promise<RazorpayCheckout> {
  return new Promise((resolve, reject) => {
    const existing = (window as unknown as { Razorpay?: RazorpayCheckout }).Razorpay;
    if (existing) return resolve(existing);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => {
      const ctor = (window as unknown as { Razorpay?: RazorpayCheckout }).Razorpay;
      if (ctor) resolve(ctor);
      else reject(new Error("Could not load the payment window. Please try again."));
    };
    script.onerror = () =>
      reject(new Error("Could not load the payment window. Please try again."));
    document.body.appendChild(script);
  });
}

const title = "Payment & Unlock | PRINCE GROUP";
const description =
  "Pay for your PRINCE GROUP subscription or unlock package securely through Razorpay.";

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
  const { plan: planParam, item: itemParam } = Route.useSearch();
  const { user, loading: sessionLoading } = useSession();
  const { data: profile } = useProfile(user?.id);
  const { data: plans } = usePlans();
  const queryClient = useQueryClient();

  const [selectedPlan, setSelectedPlan] = useState(planParam ?? "");
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [location, setLocation] = useState("");
  const [paid, setPaid] = useState(false);

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

  const itemLabel = plan ? `${plan.name} Subscription` : itemParam || "Select a plan";
  const amount = plan?.price ?? 0;

  const saveDetailsFn = useServerFn(saveProfileDetails);
  const createOrderFn = useServerFn(createRazorpayOrder);
  const verifyPaymentFn = useServerFn(verifyRazorpayPayment);
  const keyIdFn = useServerFn(getRazorpayKeyId);

  const razorpayStatus = useQuery({
    queryKey: ["razorpay-config"],
    queryFn: () => keyIdFn({}),
    staleTime: 5 * 60 * 1000,
  });

  const payOnline = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Please sign in to pay.");
      if (!plan) throw new Error("Please choose a subscription plan to pay for.");
      if (!name.trim() || !mobile.trim() || !email.trim() || !location.trim()) {
        throw new Error("Please fill in your name, mobile number, location and email.");
      }
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
        throw new Error("Please enter a valid email address.");
      }

      await saveDetailsFn({
        data: {
          name: name.trim(),
          phone: mobile.trim(),
          email: email.trim(),
          location: location.trim(),
        },
      });

      const Razorpay = await loadRazorpayScript();
      const order = await createOrderFn({ data: { planCode: plan.code } });

      return await new Promise<"success" | "failed" | "dismissed">((resolve, reject) => {
        const checkout = new Razorpay({
          key: order.keyId,
          order_id: order.orderId,
          amount: order.amount,
          currency: order.currency,
          name: "PRINCE GROUP",
          description: `${plan.name} Subscription`,
          prefill: { name: name.trim(), email: email.trim(), contact: mobile.trim() },
          theme: { color: "#3f5b1f" },
          modal: { ondismiss: () => resolve("dismissed") },
          handler: (response: unknown) => {
            const r = response as {
              razorpay_order_id: string;
              razorpay_payment_id: string;
              razorpay_signature: string;
            };
            verifyPaymentFn({
              data: {
                razorpay_order_id: r.razorpay_order_id,
                razorpay_payment_id: r.razorpay_payment_id,
                razorpay_signature: r.razorpay_signature,
              },
            })
              .then((res) => resolve(res.status))
              .catch(reject);
          },
        });
        checkout.on("payment.failed", () => resolve("failed"));
        checkout.open();
      });
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries();
      if (result === "success") {
        toast.success("Payment verified — your subscription is now active.");
        setPaid(true);
      } else if (result === "failed") {
        toast.error("The payment did not go through. Please try again.");
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const notConfigured = !razorpayStatus.data?.configured;

  return (
    <PublicPage>
      <PageHero
        eyebrow="Secure Payment"
        title="Complete Your Payment"
        highlight="Pay & Activate."
        subtitle="Sign in with the email address you registered with, choose your plan and pay securely by card, UPI, net banking or wallet through Razorpay."
      />

      <section className="bg-gradient-cream py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          {paid ? (
            <div className="mx-auto max-w-2xl rounded-3xl border border-primary/10 bg-card p-10 text-center shadow-lift">
              <span className="mx-auto grid size-16 place-items-center rounded-full bg-accent/15 text-secondary">
                <BadgeCheck className="size-8" />
              </span>
              <h2 className="mt-6 text-2xl font-bold text-primary">Payment successful</h2>
              <p className="mt-3 text-sm leading-relaxed text-foreground/80">
                We have received your payment and your plan is now active.
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
              {/* Left: order summary */}
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
                  ) : (
                    <p className="mt-2 text-sm text-cream/95">
                      Pick a plan on the right to see the exact amount, including GST and any
                      offers.
                    </p>
                  )}
                  <p className="mt-4 flex items-center gap-2 text-xs text-cream/90">
                    <ShieldCheck className="size-4 text-accent" />
                    Payments run through Razorpay checkout and are activated only after Razorpay
                    confirms the capture.
                  </p>
                </div>

                <div className="rounded-3xl border border-primary/10 bg-card p-7 shadow-soft">
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-primary">
                    <CreditCard className="size-5 text-secondary" /> How payment works
                  </h3>
                  <ol className="mt-4 list-decimal space-y-1 pl-5 text-xs leading-relaxed text-foreground/80">
                    <li>Sign in with the email address you registered with.</li>
                    <li>Choose your plan and confirm your contact details.</li>
                    <li>Pay by card, UPI, net banking or wallet in the Razorpay window.</li>
                    <li>Your plan activates as soon as Razorpay confirms the payment.</li>
                  </ol>
                </div>
              </div>

              {/* Right: sign in → plan → Razorpay */}
              <div className="rounded-3xl border border-primary/10 bg-card p-7 shadow-soft sm:p-8">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-primary">
                  <Building2 className="size-5 text-secondary" /> Complete &amp; activate
                </h3>

                {!user && !sessionLoading ? (
                  <div className="mt-8 rounded-2xl bg-muted p-6 text-center">
                    <p className="text-sm text-foreground/80">
                      Please sign in or create your account to continue.
                    </p>
                    <Button asChild variant="hero" className="mt-4">
                      <Link to="/auth">Sign in to continue</Link>
                    </Button>
                  </div>
                ) : user ? (
                  <form
                    className="mt-7 space-y-5"
                    onSubmit={(e) => {
                      e.preventDefault();
                      payOnline.mutate();
                    }}
                  >
                    <div className="flex items-center gap-2 rounded-2xl bg-muted/60 px-4 py-3 text-xs text-foreground/80">
                      <Mail className="size-4 text-secondary" />
                      You are signed in as {user.email}. Confirm your details below to continue.
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

                    <div className="grid gap-5 sm:grid-cols-2">
                      <Field label="Selected Plan / Service" required>
                        {plans && plans.length > 0 ? (
                          <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={selectedPlan}
                            onChange={(e) => setSelectedPlan(e.target.value)}
                          >
                            <option value="">Select a plan</option>
                            {plans.map((p) => (
                              <option key={p.code} value={p.code}>
                                {p.name} — {inr(p.price)}/
                                {p.billing_period === "monthly" ? "month" : p.billing_period}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <Input value={itemParam ?? ""} readOnly />
                        )}
                      </Field>
                      <Field label="Amount (₹)" required>
                        <Input
                          value={plan ? String(plan.price) : ""}
                          readOnly
                          inputMode="numeric"
                          required
                          placeholder="Select a plan"
                        />
                      </Field>
                    </div>

                    {notConfigured ? (
                      <p className="rounded-2xl bg-destructive/10 px-4 py-3 text-xs text-destructive">
                        Online payments are not available right now. Please contact support.
                      </p>
                    ) : null}

                    <Button
                      type="submit"
                      variant="hero"
                      size="lg"
                      className="w-full"
                      disabled={payOnline.isPending || notConfigured || !plan}
                    >
                      {payOnline.isPending
                        ? "Opening payment…"
                        : plan
                          ? `Pay Now — ${inr(amount)}`
                          : "Select a plan to pay"}
                    </Button>
                    <p className="text-center text-[11px] text-foreground/80">
                      You will be taken to Razorpay to complete the payment securely.
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
