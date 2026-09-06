import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { PublicPage } from "@/components/site/PublicPage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSession } from "@/hooks/useAuth";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";

const title = "Sign In or Create Your Membership | OliveEdge";
const description =
  "Secure sign-in for customers and bank executives. Create an account to subscribe, claim leads and access member pricing.";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
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

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return toast.error(error.message);
    navigate({ to: "/dashboard" });
  }

  async function signUp(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: fullName, phone },
      },
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Account created. You can sign in now.");
  }

  async function google() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) return toast.error("Google sign-in failed. Please try again.");
    if (result.redirected) return;
    navigate({ to: "/dashboard" });
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
            <ul className="mt-8 space-y-3 text-sm text-primary-foreground/75">
              <li>• Member pricing of 25% to 75% on eligible services</li>
              <li>• Lead allocation with permanent duplicate prevention</li>
              <li>• Live premium slot availability</li>
              <li>• Payments confirmed only after gateway verification</li>
            </ul>
          </div>
        </div>

        <div className="flex items-center justify-center px-4 py-16 sm:px-8">
          <div className="w-full max-w-md">
            <h1 className="text-3xl font-bold text-primary">Welcome to OliveEdge</h1>
            <p className="mt-2 text-sm text-muted-foreground">
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

            <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-widest text-muted-foreground">
              <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
            </div>
            <Button variant="outline" className="w-full" onClick={google}>
              Continue with Google
            </Button>

            <p className="mt-6 text-xs text-muted-foreground">
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
