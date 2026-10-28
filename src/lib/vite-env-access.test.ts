import { test } from "node:test";
import assert from "node:assert/strict";
import { transformWithOxc } from "vite";
import { normalizeViteEnvAccess } from "./vite-env-access";

test("both browser connection settings survive Vite's environment replacement", async () => {
  const source = normalizeViteEnvAccess(
    "export const config = [import.meta.env['VITE_SUPABASE_URL'], import.meta.env['VITE_SUPABASE_PUBLISHABLE_KEY']];",
  );
  const result = await transformWithOxc(source, "connection.js", {
    define: {
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify("https://example.invalid"),
      "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify("sb_publishable_test"),
      "import.meta.env": "{}",
    },
  });
  assert.ok(result.code.includes('"https://example.invalid"'));
  assert.ok(result.code.includes('"sb_publishable_test"'));
  assert.ok(!result.code.includes('{}['));
});

test("server secrets and dynamic lookups are left unchanged", () => {
  const source = "process.env['RAZORPAY_KEY_SECRET']; import.meta.env[key];";
  assert.equal(normalizeViteEnvAccess(source), source);
});