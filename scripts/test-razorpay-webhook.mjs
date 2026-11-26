import { createHmac } from "node:crypto";

// Sends a harmless probe (order_id: null) so no payment or subscription is touched.
const url =
  process.argv[2] ?? "https://www.princegroup-subscription.in/api/public/razorpay-webhook";
const secret = process.argv[3] ?? process.env["RAZORPAY_WEBHOOK_SECRET"];

if (!secret) {
  console.error("Usage: node scripts/test-razorpay-webhook.mjs [url] <webhook-secret>");
  process.exit(1);
}

const body = JSON.stringify({
  event: "payment.captured",
  payload: { payment: { entity: { id: "probe", order_id: null } } },
});
const signature = createHmac("sha256", secret).update(body, "utf8").digest("hex");

const response = await fetch(url, {
  method: "POST",
  headers: { "content-type": "application/json", "x-razorpay-signature": signature },
  body,
});

console.log(`status: ${response.status}`);
console.log(`body: ${await response.text()}`);
