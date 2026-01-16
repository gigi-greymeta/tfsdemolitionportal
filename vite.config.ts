import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  // This is the key for hosting at https://greymeta.com.au/tfsapp/
  base: "/tfsapp/",

  server: {
    host: "::",
    port: 8080,
    hmr: { overlay: false },
  },

  plugins: [
    react(),
    mode === "development" && componentTagger(),

    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "robots.txt"],

      manifest: {
        name: "TFS Demolition - Driver Runsheets",
        short_name: "TFS Runsheets",
        description: "Driver Runsheet Management System for TFS Demolition",
        theme_color: "#f97316",
        background_color: "#0a0a0b",
        display: "standalone",
        orientation: "portrait",

        // IMPORTANT for /tfsapp hosting:
        scope: "/tfsapp/",
        start_url: "/tfsapp/",

        // Put these files in /public (so they end up at /tfsapp/pwa-*.png)
        icons: [
          { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },

      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        // Since you're cPanel-only now, remove Supabase runtime caching
        // unless you still call external APIs you want cached.
        runtimeCaching: [],
      },
    }),
  ].filter(Boolean),

  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
}));
