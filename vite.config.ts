// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// Never set ssr.external or resolve.external: the Worker has no runtime module resolution, so
// the build fails. Never add compression (compressPublicAssets, vite-plugin-compression):
// hosting already compresses at the edge.
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { VitePWA } from "vite-plugin-pwa";

// Vercel builds: the backend's public address and publishable key are safe to ship, so
// fill them in when the Vercel project has no environment variables set.
const onVercel = !!process.env["VERCEL"];
if (onVercel) {
  process.env["VITE_SUPABASE_URL"] ||= "https://c--ab79f942-0872-4c66-a722-67a17e3a9510-prod.lovable.cloud";
  process.env["VITE_SUPABASE_PUBLISHABLE_KEY"] ||= "sb_publishable_nTRsuuVPh1e2XX7os-z03A_j7WkzZNu";
  process.env["VITE_SUPABASE_PROJECT_ID"] ||= "nedxjefmmnrkkmlulofz";
}

export default defineConfig({
  // Lovable hosting builds for its own edge runtime; Vercel builds emit Vercel's output format.
  ...(onVercel ? { nitro: { preset: "vercel" } } : {}),
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    server: { entry: "server" },
  },
  plugins: [
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: null,
      devOptions: { enabled: false },
      filename: "sw.js",
      manifest: false,
      workbox: {
        globPatterns: ["**/*.{js,mjs,css,woff2,png,svg,ico,webp,jpg,webmanifest}"],
        globIgnores: ["**/server/**", "**/shikijs__langs*", "**/mermaid+uuid*", "**/cytoscape*"],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        navigateFallback: null,
        runtimeCaching: [
          {
            urlPattern: ({ request, url }) =>
              request.mode === "navigate" && !url.pathname.startsWith("/~oauth") && !url.pathname.startsWith("/api/"),
            handler: "NetworkFirst",
            options: {
              cacheName: "nf-pages",
              networkTimeoutSeconds: 4,
              expiration: { maxEntries: 150 },
              cacheableResponse: { statuses: [200] },
            },
          },
          {
            urlPattern: ({ url }) => url.origin === "https://i.ytimg.com",
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "nf-covers",
              expiration: { maxEntries: 600, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: ({ url }) =>
              url.origin === "https://fonts.googleapis.com" || url.origin === "https://fonts.gstatic.com",
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "nf-fonts",
              expiration: { maxEntries: 40, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
});
