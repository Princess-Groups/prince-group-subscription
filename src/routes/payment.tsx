import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { BadgeCheck, Building2, CreditCard, ShieldCheck, UserCheck } from "lucide-react";
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
import { checkoutReturnPath, subscriptionCode } from "@/lib/subscription-flow";
import { saveProfileDetails } from "@/lib/profile.functions";
import { loginEmail, registrationSchema } from "@/lib/member-registration";
import { supabase } from "@/integrations/supabase/client";
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
  const navigate = useNavigate();
  const { user, loading: sessionLoading } = useSession();
  const { data: profile } = useProfile(user?.id);
  const { data: plans } = usePlans();
  const queryClient = useQueryClient();

  const [selectedPlan, setSelectedPlan] = useState(subscriptionCode(planParam) ?? "");
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [location, setLocation] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [paid, setPaid] = useState(false);

  useEffect(() => {
    setSelectedPlan(subscriptionCode(planParam) ?? "");
  }, [planParam]);

  function choosePlan(code: string) {
    setSelectedPlan(code);
    void navigate({ to: "/payment", search: { plan: code }, replace: true, resetScroll: false });
  }

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
      if (!plan) throw new Error("Please choose a subscription plan to pay for.");
      const details = registrationSchema.safeParse({
        name, phone: mobile, location, email,
        username: user ? "member" : username,
        password: user ? "signed-in" : password,
      });
      if (!details.success) throw new Error(details.error.issues[0]?.message ?? "Please check your details.");

      if (!user) {
        const authEmail = loginEmail(details.data.username);
        const { data, error } = await supabase.auth.signUp({
          email: authEmail,
          password: details.data.password,
          options: { data: { full_name: details.data.name, phone: details.data.phone, username: details.data.username.toLowerCase() } },
        });
        if (error) {
          throw new Error(
            error.message.toLowerCase().includes("already registered")
              ? "This username is taken. Choose another or sign in."
              : error.message,
          );
        }
        if (!data.session) {
          const signedIn = await supabase.auth.signInWithPassword({ email: authEmail, password: details.data.password });
          if (!signedIn.data.session) throw new Error("Registration done, but sign-in failed. Please sign in.");
        }
      }

      await saveDetailsFn({
        data: {
          name: details.data.name,
          phone: details.data.phone,
          email: details.data.email ?? "",
          location: details.data.location ?? "",
        },
      });

      const Razorpay = await loadRazorpayScript();
      const order = await createOrderFn({ data: { planCode: plan.code } });

      return await new Promise<"success" | "failed" | "dismissed" | "pending">((resolve, reject) => {
        const checkout = new Razorpay({
          key: order.keyId,
          order_id: order.orderId,
          amount: order.amount,
          currency: order.currency,
          name: "PRINCE GROUP",
          description: `${plan.name} Subscription`,
          prefill: { name: name.trim(), contact: mobile.trim(), ...(email.trim() ? { email: email.trim() } : {}) },
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
    onSuccess: async (result) => {
      await queryClient.invalidateQueries();
      if (result === "success") {
        toast.success("Payment verified — your subscription is now active.");
        setPaid(true);
        void navigate({ to: "/dashboard", replace: true });
      } else if (result === "failed") {
        toast.error("The payment did not go through. Please try again.");
      } else if (result === "pending") {
        toast.info("Your payment is awaiting confirmation. Your plan will activate only after capture is verified.");
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
        subtitle="Choose your plan, register in seconds and pay securely by card, UPI, net banking or wallet through Razorpay."
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
              {/* Left: plan choice + summary */}
              <div className="space-y-6">
                <div className="rounded-3xl border border-primary/10 bg-card p-7 shadow-soft">
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-primary">
                    <CreditCard className="size-5 text-secondary" /> 1. Choose your plan
                  </h3>
                  <div role="group" aria-label="Subscription plans" className="mt-5 grid gap-3">
                    {(plans ?? []).map((p) => (
                      <Button
                        key={p.code}
                        type="button"
                        variant={selectedPlan === p.code ? "hero" : "outline"}
                        aria-pressed={selectedPlan === p.code}
                        aria-label={`Select ₹${p.daily_display} ${p.name} plan`}
                        className="h-auto justify-between whitespace-normal rounded-2xl px-5 py-4 text-left"
                        onClick={() => choosePlan(p.code)}
                      >
                        <span className="font-display text-lg font-bold">
                          {inr(p.daily_display)}/day
                        </span>
                        <span className="text-sm font-semibold">= {inr(p.price)}/month</span>
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="rounded-3xl bg-gradient-olive p-7 text-cream shadow-lift">
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-accent">
                    You are paying for
                  </p>
                  <h2 className="mt-2 text-2xl font-bold">{itemLabel}</h2>
                  <p className="mt-4 flex items-end gap-2">
                    <span className="font-display text-5xl font-bold text-accent">{inr(amount)}</span>
                    {plan ? <span className="pb-2 text-sm text-cream/90">/month</span> : null}
                  </p>
                  {plan ? (
                    <p className="mt-2 text-sm text-cream/95">
                      {inr(plan.daily_display)}/day × 30 days · {plan.discount_percentage}% member discount
                    </p>
                  ) : (
                    <p className="mt-2 text-sm text-cream/95">Pick a plan above to see the amount.</p>
                  )}
                  <p className="mt-4 flex items-center gap-2 text-xs text-cream/90">
                    <ShieldCheck className="size-4 text-accent" />
                    Secure Razorpay payment. Your plan activates only after Razorpay confirms it.
                  </p>
                </div>
              </div>

              {/* Right: registration details → Pay & Activate */}
              <div className="rounded-3xl border border-primary/10 bg-card p-7 shadow-soft sm:p-8">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-primary">
                  <Building2 className="size-5 text-secondary" /> 2. {user ? "Your details" : "Register"}
                </h3>
                {sessionLoading ? null : (
                  <form
                    className="mt-6 space-y-5"
                    onSubmit={(e) => {
                      e.preventDefault();
                      payOnline.mutate();
                    }}
                  >
                    {user ? (
                      <div className="flex items-center gap-2 rounded-2xl bg-muted/60 px-4 py-3 text-xs text-foreground/80">
                        <UserCheck className="size-4 text-secondary" />
                        You are signed in. Confirm your details to continue.
                      </div>
                    ) : (
                      <p className="text-xs text-foreground/80">
                        Already registered?{" "}
                        <Link
                          to="/auth"
                          search={{ redirect: checkoutReturnPath(selectedPlan) }}
                          className="font-semibold text-secondary underline"
                        >
                          Sign in
                        </Link>
                      </p>
                    )}

                    <div className="grid gap-5 sm:grid-cols-2">
                      <Field label="Name" required>
                        <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={100} required placeholder="Your full name" />
                      </Field>
                      <Field label="Contact Number" required>
                        <Input value={mobile} onChange={(e) => setMobile(e.target.value)} maxLength={15} required inputMode="tel" placeholder="10-digit mobile number" />
                      </Field>
                    </div>

                    {!user ? (
                      <div className="grid gap-5 sm:grid-cols-2">
                        <Field label="Username" required>
                          <Input value={username} onChange={(e) => setUsername(e.target.value)} maxLength={30} required autoComplete="username" placeholder="Choose a username" />
                        </Field>
                        <Field label="Password" required>
                          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} maxLength={72} required autoComplete="new-password" placeholder="Min. 6 characters" />
                        </Field>
                      </div>
                    ) : null}

                    <div className="grid gap-5 sm:grid-cols-2">
                      <Field label="Location (optional)">
                        <Input value={location} onChange={(e) => setLocation(e.target.value)} maxLength={120} placeholder="City / District" />
                      </Field>
                      <Field label="Email ID (optional)">
                        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={255} placeholder="you@example.com" />
                      </Field>
                    </div>

                    {notConfigured ? (
                      <p className="rounded-2xl bg-destructive/10 px-4 py-3 text-xs text-destructive">
                        Payments are not set up yet.
                      </p>
                    ) : null}

                    <Button type="submit" variant="hero" size="lg" className="w-full" disabled={payOnline.isPending || notConfigured || !plan}>
                      {payOnline.isPending
                        ? "Opening payment…"
                        : plan
                          ? `Pay & Activate — ${inr(amount)}`
                          : "Select a plan to pay"}
                    </Button>
                    <p className="text-center text-[11px] text-foreground/80">
                      You will complete the payment securely in the Razorpay window.
                    </p>
                  </form>
                )}
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
