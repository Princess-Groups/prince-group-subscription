import { createFileRoute } from "@tanstack/react-router";

type WebhookPayload = {
  event?: string;
  payload?: {
    payment?: {
      entity?: { id?: string; order_id?: string | null; status?: string };
    };
  };
};

export const Route = createFileRoute("/api/public/razorpay-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["RAZORPAY_WEBHOOK_SECRET"];
        if (!secret) return new Response("Webhook not configured", { status: 503 });

        const signature = request.headers.get("x-razorpay-signature");
        const raw = await request.text();
        if (!signature) return new Response("Missing signature", { status: 401 });

        const { hmacSha256Hex, markPaymentFailed, markPaymentSuccessful, timingSafeEqualHex } =
          await import("@/lib/razorpay.server");
        const expected = await hmacSha256Hex(secret, raw);
        if (!timingSafeEqualHex(expected, signature.trim().toLowerCase())) {
          return new Response("Invalid signature", { status: 401 });
        }

        let body: WebhookPayload;
        try {
          body = JSON.parse(raw) as WebhookPayload;
        } catch {
          return new Response("Invalid payload", { status: 400 });
        }

        const entity = body.payload?.payment?.entity;
        const orderId = entity?.order_id ?? undefined;
        if (!orderId) return new Response("ok");

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        try {
          if (body.event === "payment.captured" || body.event === "order.paid") {
            await markPaymentSuccessful(supabaseAdmin, { orderId, paymentId: entity?.id ?? "" });
          } else if (body.event === "payment.failed") {
            await markPaymentFailed(supabaseAdmin, { orderId, paymentId: entity?.id });
          }
        } catch (error) {
          console.error("[razorpay-webhook]", error);
          return new Response("Processing error", { status: 500 });
        }
        return new Response("ok");
      },
    },
  },
});
