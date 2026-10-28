/** Keep literal environment lookups compatible with Vite's define replacement. */
export function normalizeViteEnvAccess(source: string): string {
  return source.replace(
    /\bimport\.meta\.env\[['"](VITE_[A-Z0-9_]+)['"]\]/g,
    "import.meta.env.$1",
  );
}