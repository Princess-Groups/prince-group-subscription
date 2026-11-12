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