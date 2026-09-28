import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Publishable Razorpay Key ID for Checkout. The secret never leaves the server. */
export const getRazorpayKeyId = createServerFn({ method: "GET" }).handler(async () => {
  const keyId = process.env["RAZORPAY_KEY_ID"] ?? "";
  return { keyId, configured: Boolean(keyId && process.env["RAZORPAY_KEY_SECRET"]) };
});

const createOrderInput = z.object({ planCode: z.string().min(1).max(64) });

type OpenPayment = {
  id: string;
  total_amount: number;
  status: string;
  subscription_id: string | null;
  razorpay_order_id: string | null;
  pending_plan_code: string | null;
};

const planChangeMessages: Record<string, string> = {
  plan_not_found: "That plan is no longer available.",
  slots_full: "All slots for this plan are currently taken.",
  plan_not_available_for_bank_executive: "This plan is not available for your account type.",
};

type SupabaseAdmin = Awaited<
  typeof import("@/integrations/supabase/client.server")
>["supabaseAdmin"];

/** The payment a first-time checkout should charge: the newest unpaid row. */
async function findOpenPayment(
  supabaseAdmin: SupabaseAdmin,
  userId: string,
): Promise<OpenPayment | null> {
  const { data, error } = await supabaseAdmin
    .from("payments")
    .select("id, total_amount, status, subscription_id, razorpay_order_id, pending_plan_code")
    .eq("user_id", userId)
    .in("status", ["created", "pending"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as OpenPayment | null) ?? null;
}

/**
 * A user who already has an active/pending subscription cannot call
 * start_subscription again, so no payment row is created and there is nothing to
 * charge. This quotes the requested plan and opens a payment against the existing
 * subscription, recording the target plan so it is only switched on once Razorpay
 * confirms the capture.
 */
async function preparePlanChangePayment(
  supabaseAdmin: SupabaseAdmin,
  userId: string,
  planCode: string,
): Promise<OpenPayment> {
  const { data: subscription, error: subErr } = await supabaseAdmin
    .from("subscriptions")
    .select("id, plan_id, status")
    .eq("user_id", userId)
    .in("status", ["active", "pending"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (subErr) throw new Error(subErr.message);
  if (!subscription) {
    throw new Error("Could not find your current subscription to change.");
  }

  const { data: currentPlan } = await supabaseAdmin
    .from("plans")
    .select("code")
    .eq("id", subscription.plan_id)
    .maybeSingle();
  const currentPlanCode = currentPlan?.code ?? null;

  const { data: targetPlan, error: planErr } = await supabaseAdmin
    .from("plans")
    .select("id, code, active, slot_limit, bank_executive_eligible")
    .eq("code", planCode)
    .maybeSingle();
  if (planErr) throw new Error(planErr.message);
  if (!targetPlan?.active) {
    throw new Error(planChangeMessages["plan_not_found"]!);
  }

  const { data: roles } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  const isBank = (roles ?? []).some(
    (r) => r.role === "bank_executive" || r.role === "premium_bank_executive",
  );
  if (isBank && !targetPlan.bank_executive_eligible) {
    throw new Error(planChangeMessages["plan_not_available_for_bank_executive"]!);
  }

  if (targetPlan.slot_limit !== null) {
    const { count } = await supabaseAdmin
      .from("subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("plan_id", targetPlan.id)
      .in("status", ["active", "pending"]);
    // This user's own subscription stops occupying a slot once it moves plan.
    const occupied = (count ?? 0) - (subscription.plan_id === targetPlan.id ? 1 : 0);
    if (occupied >= targetPlan.slot_limit) {
      throw new Error(planChangeMessages["slots_full"]!);
    }
  }

  // Reuse an untouched checkout for this plan, otherwise close the stale ones and
  // open a fresh payment so the charged amount always matches the chosen plan.
  const { data: openPayments, error: openErr } = await supabaseAdmin
    .from("payments")
    .select("id, total_amount, status, subscription_id, razorpay_order_id, pending_plan_code")
    .eq("user_id", userId)
    .in("status", ["created", "pending"])
    .order("created_at", { ascending: false });
  if (openErr) throw new Error(openErr.message);

  const reusable = (openPayments ?? []).find(
    (p) =>
      p.subscription_id === subscription.id &&
      !p.razorpay_order_id &&
      (p.pending_plan_code ?? null) ===
        (subscription.plan_id === targetPlan.id ? null : targetPlan.code),
  );
  if (reusable) return reusable as OpenPayment;

  const staleIds = (openPayments ?? []).filter((p) => p.status !== "success").map((p) => p.id);
  if (staleIds.length > 0) {
    const { error: staleErr } = await supabaseAdmin
      .from("payments")
      .update({ status: "failed" })
      .in("id", staleIds);
    if (staleErr) throw new Error(staleErr.message);
  }

  const { data: hasSuccess } = await supabaseAdmin
    .from("payments")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "success");
  const { data: quote, error: quoteErr } = await supabaseAdmin.rpc("quote_for_plan", {
    _plan_code: targetPlan.code,
    _first_payment: (hasSuccess ?? 0) === 0,
  });
  if (quoteErr) throw new Error(quoteErr.message);
  const q = (quote ?? {}) as Record<string, unknown>;
  if (q["error"]) {
    throw new Error(planChangeMessages[String(q["error"])] ?? "Could not price this plan.");
  }

  const planChange = subscription.plan_id !== targetPlan.id;
  const { data: payment, error: insertErr } = await supabaseAdmin
    .from("payments")
    .insert({
      user_id: userId,
      subscription_id: subscription.id,
      base_amount: Number(q["base_amount"] ?? 0),
      discount: Number(q["discount"] ?? 0),
      gst: Number(q["gst"] ?? 0),
      application_fee: Number(q["application_fee"] ?? 0),
      total_amount: Number(q["total_amount"] ?? 0),
      status: "created",
      pending_plan_code: planChange ? targetPlan.code : null,
    })
    .select("id, total_amount, status, subscription_id, razorpay_order_id, pending_plan_code")
    .single();
  if (insertErr) throw new Error(insertErr.message);

  await supabaseAdmin.from("audit_logs").insert({
    user_id: userId,
    action: "subscription.plan_change",
    entity: "payments",
    entity_id: payment.id,
    meta: {
      plan_code: targetPlan.code,
      previous_plan_code: currentPlanCode,
      quote: {
        base_amount: Number(q["base_amount"] ?? 0),
        discount: Number(q["discount"] ?? 0),
        gst: Number(q["gst"] ?? 0),
        application_fee: Number(q["application_fee"] ?? 0),
        total_amount: Number(q["total_amount"] ?? 0),
      },
    },
  });

  return payment as OpenPayment;
}

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
        ...planChangeMessages,
      };
      throw new Error(messages[started.error] ?? "Could not start this subscription.");
    }

    // Already subscribed: this is a plan change, so open a payment for the plan
    // that was actually picked instead of failing on a missing pending payment.
    const payment =
      started.error === "subscription_already_exists"
        ? await preparePlanChangePayment(supabaseAdmin, userId, data.planCode)
        : await findOpenPayment(supabaseAdmin, userId);

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
