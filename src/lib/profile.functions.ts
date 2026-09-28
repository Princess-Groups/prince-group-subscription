import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const saveProfileDetails = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: { name: string; phone: string; email: string; location: string }) => input,
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const profileUpdate = {
      ...(data.name?.trim() ? { name: data.name.trim().slice(0, 100) } : {}),
      ...(data.phone?.trim() ? { phone: data.phone.trim().slice(0, 20) } : {}),
      ...(data.email?.trim() ? { email: data.email.trim().slice(0, 255) } : {}),
      ...(data.location?.trim() ? { location: data.location.trim().slice(0, 120) } : {}),
      phone_verified: true,
    };

    const { error } = await supabaseAdmin
      .from("profiles")
      .update(profileUpdate)
      .eq("id", context.userId);
    if (error) throw new Error("Could not save your details. Please try again.");

    return { saved: true };
  });
