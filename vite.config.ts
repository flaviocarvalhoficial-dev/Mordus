import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from "vite-plugin-pwa";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'favicon.ico', 'robots.txt'],
      devOptions: {
        enabled: true,
        type: 'module',
      },
      manifest: {
        name: 'Mordus — Gestão de Igrejas',
        short_name: 'Mordus',
        description: 'Gerenciamento financeiro e administrativo de igrejas em um só lugar.',
        theme_color: '#F67748',
        background_color: '#F3EDE4',
        display: 'standalone',
        display_override: ['window-controls-overlay', 'standalone', 'minimal-ui'],
        scope: '/',
        start_url: '/',
        orientation: 'any',
        icons: [
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
          {
            src: 'favicon.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
          },
          {
            src: 'favicon.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
          }
        ],
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 5000000, // 5MB
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": "/src",
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
  },
  build: {
    chunkSizeWarningLimit: 3000,
  },
}));
