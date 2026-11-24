import assert from "node:assert/strict";
import { test } from "node:test";
import { retainPhoneVerification } from "./phone-verification";

test("typing a phone number cannot verify it", () => {
  assert.equal(retainPhoneVerification({ phone: "9876543210", previousPhone: null, previousVerified: false }), false);
});
test("changing an already verified number removes verification", () => {
  assert.equal(retainPhoneVerification({ phone: "9876543210", previousPhone: "9876543211", previousVerified: true }), false);
  assert.equal(retainPhoneVerification({ phone: "+91 98765 43210", previousPhone: "9876543210", previousVerified: true }), true);
});
test("Auth confirmation verifies only its matching phone", () => {
  const input = { phone: "9876543210", previousPhone: null, previousVerified: false, confirmedPhone: "+919876543210" };
  assert.equal(retainPhoneVerification(input), false);
  assert.equal(retainPhoneVerification({ ...input, confirmedAt: "2026-11-24T15:00:00Z" }), true);
  assert.equal(retainPhoneVerification({ ...input, confirmedPhone: "9876543211", confirmedAt: "2026-11-24T15:00:00Z" }), false);
});