import assert from "node:assert/strict";
import { test } from "node:test";
import { authDestination, checkoutReturnPath, subscriptionCode } from "./subscription-flow";

test("all three subscription selections survive sign-in and return directly to payment", () => {
  for (const plan of ["starter", "business", "premium"]) {
    assert.deepEqual(authDestination(checkoutReturnPath(plan)), { to: "/payment", search: { plan } });
  }
});

test("checkout rejects unknown plans rather than selecting or pricing a different plan", () => {
  assert.equal(subscriptionCode("admin"), undefined);
  assert.equal(checkoutReturnPath("admin"), "/payment");
});

test("sign-in cannot redirect customers to external or protocol-relative URLs", () => {
  for (const value of ["https://example.com/payment", "//example.com/payment", "/payment-elsewhere", "/admin"]) {
    assert.deepEqual(authDestination(value), { to: "/dashboard" });
  }
});