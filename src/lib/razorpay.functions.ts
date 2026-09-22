import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Publishable Razorpay Key ID for Checkout. The secret never leaves the server. */
export const getRazorpayKeyId = createServerFn({ method: "GET" }).handler(async () => {
  const keyId = process.env["RAZORPAY_KEY_ID"] ?? "";
  return { keyId, configured: Boolean(keyId && process.env["RAZORPAY_KEY_SECRET"]) };
});

const createOrderInput = z.object({ planCode: z.string().min(1).max(64) });

/**
 * Creates (or reuses) the pending subscription + payment rows, then opens a
 * Razorpay order for the server-computed amount. The client never sends prices.
 */
export const createRazorpayOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => createOrderInput.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { createOrder, getRazorpayConfig } = await import("./razorpay.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { keyId } = getRazorpayConfig();

    const { data: startResult, error: startError } = await supabase.rpc("start_subscription", {
      _plan_code: data.planCode,
    });
    if (startError) throw new Error(startError.message);

    const started = (startResult ?? {}) as { error?: string; subscription_id?: string };
    if (started.error && started.error !== "subscription_already_exists") {
      const messages: Record<string, string> = {
        phone_not_verified: "Please verify your mobile number before paying.",
        plan_not_found: "That plan is no longer available.",
        slots_full: "All slots for this plan are currently taken.",
        plan_not_available_for_bank_executive: "This plan is not available for your account type.",
      };
      throw new Error(messages[started.error] ?? "Could not start this subscription.");
    }

    const { data: payment, error: payErr } = await supabaseAdmin
      .from("payments")
      .select("id, total_amount, status, subscription_id, razorpay_order_id")
      .eq("user_id", userId)
      .in("status", ["created", "pending"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (payErr) throw new Error(payErr.message);
    if (!payment) throw new Error("No pending payment found for your account.");

    const amountPaise = Math.round(Number(payment.total_amount) * 100);
    if (!Number.isFinite(amountPaise) || amountPaise < 100) {
      throw new Error("This payment amount is invalid. Please contact support.");
    }

    const order = await createOrder({
      amountPaise,
      receipt: payment.id,
      notes: { payment_id: payment.id, plan_code: data.planCode, user_id: userId },
    });

    const { error: updErr } = await supabaseAdmin
      .from("payments")
      .update({ razorpay_order_id: order.id, status: "pending" })
      .eq("id", payment.id);
    if (updErr) throw new Error(updErr.message);

    return {
      keyId,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      paymentRowId: payment.id,
    };
  });

const verifyInput = z.object({
  razorpay_order_id: z.string().min(1).max(64),
  razorpay_payment_id: z.string().min(1).max(64),
  razorpay_signature: z.string().min(1).max(256),
});

/** Verifies the Checkout signature AND the payment status at Razorpay before activating. */
export const verifyRazorpayPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => verifyInput.parse(data))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { fetchPayment, isValidCheckoutSignature, markPaymentFailed, markPaymentSuccessful } =
      await import("./razorpay.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const valid = await isValidCheckoutSignature({
      orderId: data.razorpay_order_id,
      paymentId: data.razorpay_payment_id,
      signature: data.razorpay_signature,
    });
    if (!valid) {
      await markPaymentFailed(supabaseAdmin, {
        orderId: data.razorpay_order_id,
        paymentId: data.razorpay_payment_id,
      });
      throw new Error("Payment could not be verified. Please contact support.");
    }

    // The order must belong to this signed-in user.
    const { data: row } = await supabaseAdmin
      .from("payments")
      .select("id, user_id")
      .eq("razorpay_order_id", data.razorpay_order_id)
      .maybeSingle();
    if (!row || row.user_id !== userId) {
      throw new Error("This payment does not belong to your account.");
    }

    const remote = await fetchPayment(data.razorpay_payment_id);
    if (remote.order_id !== data.razorpay_order_id) {
      throw new Error("Payment could not be verified. Please contact support.");
    }
    if (remote.status !== "captured" && remote.status !== "authorized") {
      await markPaymentFailed(supabaseAdmin, {
        orderId: data.razorpay_order_id,
        paymentId: data.razorpay_payment_id,
      });
      return { status: "failed" as const };
    }

    await markPaymentSuccessful(supabaseAdmin, {
      orderId: data.razorpay_order_id,
      paymentId: data.razorpay_payment_id,
    });
    return { status: "success" as const };
  });
