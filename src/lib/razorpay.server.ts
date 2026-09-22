// Server-only Razorpay helpers. Never import this from client code.
const RAZORPAY_API = "https://api.razorpay.com/v1";

export type RazorpayConfig = { keyId: string; keySecret: string };

export function getRazorpayConfig(): RazorpayConfig {
  const keyId = process.env["RAZORPAY_KEY_ID"];
  const keySecret = process.env["RAZORPAY_KEY_SECRET"];
  if (!keyId || !keySecret) {
    throw new Error(
      "Razorpay is not configured yet. Please add the Razorpay Key ID and Key Secret.",
    );
  }
  return { keyId, keySecret };
}

function basicAuth({ keyId, keySecret }: RazorpayConfig): string {
  return `Basic ${btoa(`${keyId}:${keySecret}`)}`;
}

export async function hmacSha256Hex(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export type RazorpayOrder = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  receipt?: string;
};

export async function createOrder(input: {
  amountPaise: number;
  receipt: string;
  notes?: Record<string, string>;
}): Promise<RazorpayOrder> {
  const config = getRazorpayConfig();
  const res = await fetch(`${RAZORPAY_API}/orders`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: basicAuth(config) },
    body: JSON.stringify({
      amount: input.amountPaise,
      currency: "INR",
      receipt: input.receipt,
      payment_capture: 1,
      notes: input.notes ?? {},
    }),
  });
  const body = (await res.json()) as { error?: { description?: string } } & RazorpayOrder;
  if (!res.ok) {
    console.error("[razorpay] order creation failed", res.status, body);
    throw new Error(body?.error?.description ?? "Could not start the payment. Please try again.");
  }
  return body;
}

export type RazorpayPayment = {
  id: string;
  order_id: string | null;
  status: string;
  amount: number;
  method?: string;
  error_description?: string | null;
};

export async function fetchPayment(paymentId: string): Promise<RazorpayPayment> {
  const config = getRazorpayConfig();
  const res = await fetch(`${RAZORPAY_API}/payments/${encodeURIComponent(paymentId)}`, {
    headers: { authorization: basicAuth(config) },
  });
  const body = (await res.json()) as { error?: { description?: string } } & RazorpayPayment;
  if (!res.ok) {
    console.error("[razorpay] payment fetch failed", res.status, body);
    throw new Error("Could not confirm the payment with Razorpay.");
  }
  return body;
}

/** Checkout handler signature: HMAC(order_id|payment_id) with the key secret. */
export async function isValidCheckoutSignature(input: {
  orderId: string;
  paymentId: string;
  signature: string;
}): Promise<boolean> {
  const { keySecret } = getRazorpayConfig();
  const expected = await hmacSha256Hex(keySecret, `${input.orderId}|${input.paymentId}`);
  return timingSafeEqualHex(expected, input.signature.trim().toLowerCase());
}

type AdminClient = Awaited<
  typeof import("@/integrations/supabase/client.server")
>["supabaseAdmin"];

/** Marks a payment row paid and activates its subscription. Idempotent. */
export async function markPaymentSuccessful(
  admin: AdminClient,
  args: { orderId: string; paymentId: string },
): Promise<{ updated: boolean }> {
  const { data: payment, error } = await admin
    .from("payments")
    .select("id, subscription_id, status")
    .eq("razorpay_order_id", args.orderId)
    .maybeSingle();
  if (error) throw error;
  if (!payment) return { updated: false };
  if (payment.status === "success") return { updated: true };

  const now = new Date();
  const renewal = new Date(now);
  renewal.setMonth(renewal.getMonth() + 1);

  const { error: payErr } = await admin
    .from("payments")
    .update({
      status: "success",
      razorpay_payment_id: args.paymentId,
      paid_at: now.toISOString(),
    })
    .eq("id", payment.id);
  if (payErr) throw payErr;

  if (payment.subscription_id) {
    const { error: subErr } = await admin
      .from("subscriptions")
      .update({
        status: "active",
        start_date: now.toISOString(),
        renewal_date: renewal.toISOString(),
      })
      .eq("id", payment.subscription_id);
    if (subErr) throw subErr;
  }
  return { updated: true };
}

export async function markPaymentFailed(
  admin: AdminClient,
  args: { orderId: string; paymentId?: string | undefined },
): Promise<void> {
  const { data: payment } = await admin
    .from("payments")
    .select("id, subscription_id, status")
    .eq("razorpay_order_id", args.orderId)
    .maybeSingle();
  if (!payment || payment.status === "success") return;

  await admin
    .from("payments")
    .update({ status: "failed", razorpay_payment_id: args.paymentId ?? null })
    .eq("id", payment.id);
  if (payment.subscription_id) {
    await admin
      .from("subscriptions")
      .update({ status: "payment_failed" })
      .eq("id", payment.subscription_id);
  }
}
