// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import type { PluginOption } from "vite";

const assetOrigin =
  process.env.VITE_ASSET_ORIGIN?.trim().replace(/\/$/, "") ||
  "https://project--92032d2e-ff07-40e9-82dd-e2202315f52f.lovable.app";

const productionAssetUrls: PluginOption = {
  name: "production-asset-urls",
  enforce: "pre",
  transform(source, id) {
    if (!id.endsWith(".asset.json")) return null;

    const asset = JSON.parse(source) as { url?: string };
    if (!asset.url?.startsWith("/__l5e/assets-v1/")) return null;

    return {
      code: JSON.stringify({ ...asset, url: `${assetOrigin}${asset.url}` }),
      map: null,
    };
  },
};

export default defineConfig({
  vite: {
    plugins: [productionAssetUrls],
  },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
