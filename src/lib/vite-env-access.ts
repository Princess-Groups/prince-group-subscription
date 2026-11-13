/** Use current build settings first, with a public-only fallback for hosted builds. */
export function resolvePublicConnectionEnv(
  fallback: Record<string, string>,
  ...sources: Record<string, unknown>[]
): Record<string, string> {
  const resolved: Record<string, string> = {};
  for (const key of ["VITE_SUPABASE_URL", "VITE_SUPABASE_PUBLISHABLE_KEY"]) {
    for (const source of [fallback, ...sources]) {
      const value = source[key];
      if (typeof value === "string" && value.trim()) resolved[key] = value.trim();
    }
    if (!resolved[key]) throw new Error(`Missing public build setting: ${key}`);
  }
  return resolved;
}

/** Keep literal environment lookups compatible with Vite's define replacement. */
export function normalizeViteEnvAccess(source: string, publicEnv: Record<string, unknown> = {}): string {
  const normalized = source.replace(
    /\bimport\.meta\.env\[\s*['"](VITE_[A-Z0-9_]+)['"]\s*\]/g,
    "import.meta.env.$1",
  );
  return normalized.replace(/\bimport\.meta\.env\.(VITE_[A-Z0-9_]+)/g, (lookup, key: string) => {
    const value = publicEnv[key];
    return typeof value === "string" && value.length > 0 ? JSON.stringify(value) : lookup;
  });
}