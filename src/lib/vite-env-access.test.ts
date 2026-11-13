import { test } from "node:test";
import assert from "node:assert/strict";
import { transformWithOxc } from "vite";
import { normalizeViteEnvAccess, resolvePublicConnectionEnv } from "./vite-env-access";

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

test("public settings are embedded before replacement in both rendering environments", async () => {
  const source = normalizeViteEnvAccess(
    "export const config = [import.meta.env[ 'VITE_SUPABASE_URL' ], import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY];",
    { VITE_SUPABASE_URL: "https://example.invalid", VITE_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test" },
  );
  const result = await transformWithOxc(source, "connection.js", { define: { "import.meta.env": "{}" } });
  assert.ok(result.code.includes('"https://example.invalid"'));
  assert.ok(result.code.includes('"sb_publishable_test"'));
  assert.ok(!result.code.includes("import.meta.env"));
});

test("hosted builds with absent or blank environment values retain public connection settings", async () => {
  const env = resolvePublicConnectionEnv(
    { VITE_SUPABASE_URL: "https://example.invalid", VITE_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test" },
    {},
    { VITE_SUPABASE_URL: "", VITE_SUPABASE_PUBLISHABLE_KEY: undefined },
  );
  const source = normalizeViteEnvAccess(
    "export const config = [import.meta.env['VITE_SUPABASE_URL'] || process.env['SUPABASE_URL'], import.meta.env['VITE_SUPABASE_PUBLISHABLE_KEY'] || process.env['SUPABASE_PUBLISHABLE_KEY']];",
    env,
  );
  const result = await transformWithOxc(source, "connection.js", {
    define: { "import.meta.env": "{}", "process.env": "{}" },
  });
  assert.ok(result.code.includes('"https://example.invalid"'));
  assert.ok(result.code.includes('"sb_publishable_test"'));
});

test("current build values override fallback and private credentials are excluded", () => {
  const env = resolvePublicConnectionEnv(
    { VITE_SUPABASE_URL: "https://old.invalid", VITE_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_old" },
    { VITE_SUPABASE_URL: "https://current.invalid", VITE_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_current", SUPABASE_SERVICE_ROLE_KEY: "private-test-value" },
  );
  assert.deepEqual(env, { VITE_SUPABASE_URL: "https://current.invalid", VITE_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_current" });
});

test("missing public configuration fails during packaging instead of after opening a page", () => {
  assert.throws(() => resolvePublicConnectionEnv({}), /Missing public build setting: VITE_SUPABASE_URL/);
});