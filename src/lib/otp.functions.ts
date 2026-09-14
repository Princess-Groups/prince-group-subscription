import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const OTP_TTL_MINUTES = 10;
const MAX_ATTEMPTS = 5;

function normalisePhone(raw: string) {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return digits;
  if (digits.length >= 10 && digits.length <= 15) return digits;
  throw new Error("Please enter a valid mobile number.");
}

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function sendSms(phone: string, code: string) {
  const text = `${code} is your PRINCE GROUP verification code. It expires in ${OTP_TTL_MINUTES} minutes.`;

  const msg91Key = process.env["MSG91_AUTH_KEY"];
  if (msg91Key) {
    const res = await fetch("https://control.msg91.com/api/v5/flow/", {
      method: "POST",
      headers: { authkey: msg91Key, "content-type": "application/json" },
      body: JSON.stringify({
        template_id: process.env["MSG91_TEMPLATE_ID"],
        sender: process.env["MSG91_SENDER_ID"],
        short_url: "0",
        recipients: [{ mobiles: phone, OTP: code, otp: code }],
      }),
    });
    if (!res.ok) {
      console.error("MSG91 send failed", res.status, await res.text());
      throw new Error("Could not send the OTP right now. Please try again.");
    }
    return;
  }

  const sid = process.env["TWILIO_ACCOUNT_SID"];
  const token = process.env["TWILIO_AUTH_TOKEN"];
  const from = process.env["TWILIO_FROM"];
  if (sid && token && from) {
    const body = new URLSearchParams({ To: `+${phone}`, From: from, Body: text });
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: {
        authorization: `Basic ${btoa(`${sid}:${token}`)}`,
        "content-type": "application/x-www-form-urlencoded",
      },
      body,
    });
    if (!res.ok) {
      console.error("Twilio send failed", res.status, await res.text());
      throw new Error("Could not send the OTP right now. Please try again.");
    }
    return;
  }

  throw new Error(
    "SMS sending is not configured yet. Please contact support to complete verification.",
  );
}

export const sendPhoneOtp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { phone: string }) => input)
  .handler(async ({ data, context }) => {
    const phone = normalisePhone(data.phone ?? "");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const since = new Date(Date.now() - 60_000).toISOString();
    const { count } = await supabaseAdmin
      .from("phone_otps")
      .select("id", { count: "exact", head: true })
      .eq("user_id", context.userId)
      .gte("created_at", since);
    if ((count ?? 0) >= 2) {
      throw new Error("Please wait a minute before requesting another code.");
    }

    const code = String(crypto.getRandomValues(new Uint32Array(1))[0]! % 1_000_000).padStart(6, "0");
    const { error } = await supabaseAdmin.from("phone_otps").insert({
      user_id: context.userId,
      phone,
      code_hash: await sha256(`${phone}:${code}`),
      expires_at: new Date(Date.now() + OTP_TTL_MINUTES * 60_000).toISOString(),
    });
    if (error) throw new Error("Could not start verification. Please try again.");

    await sendSms(phone, code);
    return { sent: true, phone };
  });

export const verifyPhoneOtp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { code: string; name: string; email: string; location: string }) => input)
  .handler(async ({ data, context }) => {
    const code = (data.code ?? "").replace(/\D/g, "");
    if (code.length !== 6) throw new Error("Please enter the 6-digit code.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("phone_otps")
      .select("*")
      .eq("user_id", context.userId)
      .is("consumed_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!row) throw new Error("Please request a new verification code.");
    if (new Date(row.expires_at).getTime() < Date.now()) {
      throw new Error("That code has expired. Please request a new one.");
    }
    if (row.attempts >= MAX_ATTEMPTS) {
      throw new Error("Too many incorrect attempts. Please request a new code.");
    }

    if ((await sha256(`${row.phone}:${code}`)) !== row.code_hash) {
      await supabaseAdmin
        .from("phone_otps")
        .update({ attempts: row.attempts + 1 })
        .eq("id", row.id);
      throw new Error("That code is incorrect. Please try again.");
    }

    await supabaseAdmin
      .from("phone_otps")
      .update({ consumed_at: new Date().toISOString() })
      .eq("id", row.id);

    const profileUpdate: Record<string, unknown> = {
      phone: row.phone,
      phone_verified: true,
    };
    if (data.name?.trim()) profileUpdate["name"] = data.name.trim().slice(0, 100);
    if (data.email?.trim()) profileUpdate["email"] = data.email.trim().slice(0, 255);
    if (data.location?.trim()) profileUpdate["location"] = data.location.trim().slice(0, 120);

    const { error } = await supabaseAdmin
      .from("profiles")
      .update(profileUpdate)
      .eq("id", context.userId);
    if (error) throw new Error("Verification saved failed. Please try again.");

    return { verified: true };
  });
