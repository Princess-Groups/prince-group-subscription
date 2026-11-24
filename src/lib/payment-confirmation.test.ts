import assert from "node:assert/strict";
import { test } from "node:test";
import { capturedPaymentMatches } from "./payment-confirmation";

test("subscription activation requires captured payment, not authorization or failure", () => {
  for (const status of ["authorized", "created", "failed"]) {
    assert.equal(capturedPaymentMatches({ order_id: "order_1", status, amount: 3000, currency: "INR" }, { orderId: "order_1", totalAmount: 30 }), false);
  }
  assert.equal(capturedPaymentMatches({ order_id: "order_1", status: "captured", amount: 3000, currency: "INR" }, { orderId: "order_1", totalAmount: 30 }), true);
});
test("each monthly plan must have its exact amount captured in INR for the stored order", () => {
  for (const amount of [30, 300, 3000]) {
    const remote = { order_id: "order_1", status: "captured", amount: amount * 100, currency: "INR" };
    assert.equal(capturedPaymentMatches(remote, { orderId: "order_1", totalAmount: amount }), true);
    assert.equal(capturedPaymentMatches({ ...remote, amount: amount * 100 - 1 }, { orderId: "order_1", totalAmount: amount }), false);
    assert.equal(capturedPaymentMatches({ ...remote, currency: "USD" }, { orderId: "order_1", totalAmount: amount }), false);
    assert.equal(capturedPaymentMatches(remote, { orderId: "another_order", totalAmount: amount }), false);
  }
});