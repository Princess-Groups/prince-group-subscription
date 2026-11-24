import assert from "node:assert/strict";
import { test } from "node:test";

// Opt-in tests run against an isolated, temporary member fixture, never a customer's account.
const live = process.env["RUN_MEMBERSHIP_INTEGRATION_TESTS"] === "true";
async function request(path: string, body?: Record<string, unknown>, authenticated = false) {
  const url = process.env["MEMBERSHIP_TEST_URL"];
  const key = process.env["MEMBERSHIP_TEST_PUBLIC_KEY"];
  if (!url || !key) throw new Error("Membership test connection is required.");
  const token = authenticated ? process.env["MEMBERSHIP_TEST_TOKEN"] : undefined;
  if (authenticated && !token) throw new Error("A temporary test member session is required.");
  const headers: Record<string, string> = { apikey: key, "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const response = await fetch(`${url}/rest/v1/${path}`, {
    method: body ? "POST" : "GET", headers, ...(body ? { body: JSON.stringify(body) } : {}),
  });
  assert.equal(response.ok, true, `Member test request failed with status ${response.status}`);
  return await response.json() as unknown;
}

for (const [code, price, quota] of [["starter", 30, 3], ["business", 300, 10], ["premium", 3000, 50]] as const) {
  test(`${code} retains its monthly price and lead quota, including bank executive eligibility`, { skip: !live }, async () => {
    const rows = await request(`plans?code=eq.${code}&select=price,lead_limit,billing_period,bank_executive_eligible`) as Record<string, unknown>[];
    const plan = rows[0];
    assert.ok(plan);
    assert.equal(Number(plan["price"]), price);
    assert.equal(plan["lead_limit"], quota);
    assert.equal(plan["billing_period"], "monthly");
    assert.equal(plan["bank_executive_eligible"], true);
  });
}

test("Starter credits stop at exactly three allocations per monthly period", { skip: !live }, async () => {
  const credits = await request("rpc/my_loan_credits", {}, true) as Record<string, unknown>;
  assert.equal(credits["quota"], 3);
  assert.equal(credits["used"], 3);
  assert.equal(credits["remaining"], 0);
  const retry = await request("rpc/claim_leads", {}, true) as Record<string, unknown>;
  assert.equal(retry["error"], "lead_limit_reached");
});

test("members see only their own allocated candidate records and keep unique executive history", { skip: !live }, async () => {
  const catalog = await request("rpc/my_member_catalog", {}, true) as { active: boolean; candidates: { id: string }[] };
  const allocations = await request("lead_allocations?select=lead_id", undefined, true) as { lead_id: string }[];
  const history = await request("executive_lead_history?select=phone_key", undefined, true) as { phone_key: string }[];
  assert.equal(catalog.active, true);
  assert.equal(catalog.candidates.length, 3);
  assert.equal(history.length, 3);
  assert.equal(new Set(history.map((row) => row.phone_key)).size, 3);
  assert.deepEqual(new Set(catalog.candidates.map((row) => row.id)), new Set(allocations.map((row) => row.lead_id)));
});

test("Starter members cannot unlock Premium-only opportunity contacts", { skip: !live }, async () => {
  const id = process.env["MEMBERSHIP_TEST_PREMIUM_OPPORTUNITY"];
  assert.ok(id);
  const result = await request("rpc/reveal_opportunity_contact", { _opportunity_id: id }, true) as Record<string, unknown>;
  assert.equal(result["error"], "premium_required");
  assert.equal(result["phone"], undefined);
});

test("Starter member service prices receive exactly their ten percent discount", { skip: !live }, async () => {
  const catalog = await request("rpc/my_member_catalog", {}, true) as { discount_percentage: number; services: { original_price: number; member_price: number }[] };
  assert.equal(catalog.discount_percentage, 10);
  assert.ok(catalog.services.length > 0);
  for (const service of catalog.services) {
    assert.equal(Number(service.member_price), Math.round(Number(service.original_price) * 0.9 * 100) / 100);
  }
});

test("expired subscriptions cannot read the live member catalog, claim leads or reserve subscriber access", { skip: !live || process.env["MEMBERSHIP_TEST_EXPIRED"] !== "true" }, async () => {
  const catalog = await request("rpc/my_member_catalog", {}, true) as { active: boolean; services: unknown[]; candidates: unknown[]; loan_categories: unknown[] };
  assert.equal(catalog.active, false);
  assert.deepEqual(catalog.services, []);
  assert.deepEqual(catalog.candidates, []);
  assert.deepEqual(catalog.loan_categories, []);
  const claim = await request("rpc/claim_leads", {}, true) as Record<string, unknown>;
  assert.equal(claim["error"], "no_active_subscription");
  const reserve = await request("rpc/reserve_advance_period", { _period: "2027-01" }, true) as Record<string, unknown>;
  assert.equal(reserve["error"], "no_active_subscription");
});