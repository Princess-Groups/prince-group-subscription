import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { retainPhoneVerification } from "./phone-verification";

export const saveProfileDetails = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: unknown) => z.object({ name: z.string().trim().min(2).max(100), phone: z.string().trim().regex(/^[0-9+\s-]{10,20}$/), email: z.string().trim().email().max(255).optional().or(z.literal("")), location: z.string().trim().max(120).optional().or(z.literal("")) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: existing, error: readError } = await context.supabase.from("profiles").select("phone,phone_verified").eq("id", context.userId).single();
    if (readError) throw new Error("Could not read your profile.");
    const { data: authenticated, error: authError } = await context.supabase.auth.getUser();
    if (authError || !authenticated.user) throw new Error("Please sign in again.");

    const profileUpdate = {
      ...(data.name?.trim() ? { name: data.name.trim().slice(0, 100) } : {}),
      ...(data.phone?.trim() ? { phone: data.phone.trim().slice(0, 20) } : {}),
      ...(data.email?.trim() ? { email: data.email.trim().slice(0, 255) } : {}),
      ...(data.location?.trim() ? { location: data.location.trim().slice(0, 120) } : {}),
      phone_verified: retainPhoneVerification({
        phone: data.phone, previousPhone: existing.phone, previousVerified: existing.phone_verified,
        ...(authenticated.user.phone ? { confirmedPhone: authenticated.user.phone } : {}),
        ...(authenticated.user.phone_confirmed_at ? { confirmedAt: authenticated.user.phone_confirmed_at } : {}),
      }),
    };

    const { error } = await supabaseAdmin
      .from("profiles")
      .update(profileUpdate)
      .eq("id", context.userId);
    if (error) throw new Error("Could not save your details. Please try again.");

    return { saved: true };
  });
