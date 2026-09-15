import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { PublicPage } from "@/components/site/PublicPage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSession } from "@/hooks/useAuth";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";

const title = "Sign In or Create Your Membership | PRINCE";
const description =
  "Secure sign-in for customers and bank executives. Create an account to subscribe, claim leads and access member pricing.";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { user, loading } = useSession();
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard", replace: true });
  }, [loading, user, navigate]);

  const signInSchema = z.object({
    email: z.string().trim().email({ message: "Please enter a valid email address." }).max(255),
    password: z.string().min(6, { message: "Password must be at least 6 characters." }).max(72),
  });

  const signUpSchema = signInSchema.extend({
    fullName: z
      .string()
      .trim()
      .min(2, { message: "Please enter your full name." })
      .max(100),
    phone: z
      .string()
      .trim()
      .regex(/^[0-9+\-\s]{10,15}$/, { message: "Please enter a valid mobile number." }),
  });

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    const parsed = signInSchema.safeParse({ email: email.trim(), password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check your details.");
      return;
    }
    setBusy(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });
    setBusy(false);
    if (error) {
      toast.error(
        error.message.toLowerCase().includes("invalid")
          ? "Incorrect email or password. Please try again."
          : error.message,
      );
      return;
    }
    if (!data.session) {
      toast.error("Sign in could not be completed. Please try again.");
      return;
    }
    toast.success("Signed in successfully.");
    navigate({ to: "/dashboard", replace: true });
  }

  async function signUp(e: React.FormEvent) {
    e.preventDefault();
    const parsed = signUpSchema.safeParse({
      email: email.trim(),
      password,
      fullName: fullName.trim(),
      phone: phone.trim(),
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check your details.");
      return;
    }
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: parsed.data.fullName, phone: parsed.data.phone },
      },
    });
    setBusy(false);
    if (error) {
      toast.error(
        error.message.toLowerCase().includes("already registered")
          ? "This email already has an account. Please sign in instead."
          : error.message,
      );
      return;
    }
    if (data.session) {
      toast.success("Account created. Welcome to PRINCE.");
      navigate({ to: "/dashboard", replace: true });
      return;
    }
    const signedIn = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });
    if (signedIn.data.session) {
      toast.success("Account created. Welcome to PRINCE.");
      navigate({ to: "/dashboard", replace: true });
      return;
    }
    toast.success("Account created. Please confirm your email, then sign in.");
  }

  async function google() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Google sign-in failed. Please try again.");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/dashboard", replace: true });
  }

  return (
    <PublicPage>
      <div className="grid min-h-[80vh] lg:grid-cols-2">
        <div className="relative hidden overflow-hidden bg-gradient-olive p-12 text-primary-foreground lg:block">
          <div className="pointer-events-none absolute -left-20 bottom-0 size-96 rounded-full bg-accent/20 blur-3xl" />
          <div className="relative flex h-full flex-col justify-center">
            <h2 className="max-w-md text-4xl font-bold leading-tight">
              Premium access to discounts, leads and business data.
            </h2>
            <ul className="mt-8 space-y-3 text-sm text-primary-foreground/95">
              <li>• Member pricing of 10% to 50% on eligible services</li>
              <li>• Lead allocation with permanent duplicate prevention</li>
              <li>• Live premium slot availability</li>
              <li>• Payments confirmed only after gateway verification</li>
            </ul>
          </div>
        </div>

        <div className="flex items-center justify-center px-4 py-16 sm:px-8">
          <div className="w-full max-w-md">
            <h1 className="text-3xl font-bold text-primary">Welcome to PRINCE</h1>
            <p className="mt-2 text-sm text-foreground/80">
              Sign in to manage your subscription, leads and business access.
            </p>

            <Tabs defaultValue="signin" className="mt-8">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Create Account</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={signIn} className="mt-6 space-y-4">
                  <Field id="email" label="Email" type="email" value={email} onChange={setEmail} />
                  <Field id="password" label="Password" type="password" value={password} onChange={setPassword} />
                  <Button type="submit" variant="hero" className="w-full" disabled={busy}>
                    Sign In
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={signUp} className="mt-6 space-y-4">
                  <Field id="name" label="Full name" value={fullName} onChange={setFullName} />
                  <Field id="phone" label="Phone" value={phone} onChange={setPhone} />
                  <Field id="email2" label="Email" type="email" value={email} onChange={setEmail} />
                  <Field id="password2" label="Password" type="password" value={password} onChange={setPassword} />
                  <Button type="submit" variant="hero" className="w-full" disabled={busy}>
                    Create Account
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-widest text-foreground/80">
              <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
            </div>
            <Button variant="outline" className="w-full" onClick={google}>
              Continue with Google
            </Button>

            <p className="mt-6 text-xs text-foreground/80">
              Bank executives must be approved by an administrator before portal access is granted.
            </p>
          </div>
        </div>
      </div>
    </PublicPage>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} value={value} required onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
