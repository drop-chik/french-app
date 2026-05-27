import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { TanStackRouterVite } from '@tanstack/router-vite-plugin';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    TanStackRouterVite({
      routesDirectory: './src/app/routes',
      generatedRouteTree: './src/routeTree.gen.ts',
    }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'FrenchUp — Изучай французский',
        short_name: 'FrenchUp',
        description: 'AI-powered French learning: vocabulary SRS, grammar, listening, reading and conversation',
        theme_color: '#1d4ed8',
        background_color: '#0f0f10',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/dashboard',
        lang: 'ru',
        icons: [
          { src: '/pwa-icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/pwa-icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/pwa-icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Cache the SPA shell so the app opens offline. API calls aren't
        // cached — they need fresh data from the server. .webp added (we
        // converted PNGs); legacy .png patterns dropped since the only
        // PNGs left are PWA icons in /public.
        globPatterns: ['**/*.{js,css,html,svg,webp,png,woff,woff2}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        // Bump max size for precache entries — main JS chunk is ~600 KB
        // raw which exceeds the workbox default 2MB cap (would silently
        // skip otherwise; we precache because users open the app daily).
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        // Pull in our custom push-notification handler.
        importScripts: ['sw-push.js'],
        runtimeCaching: [
          // Inter is bundled by @fontsource into the precache via globPatterns
          // above — no runtime fetch needed, so no Google Fonts entry here.
          {
            // User avatars — accept slightly stale, refresh in background.
            urlPattern: /\/api\/profile\/.+\/avatar/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'avatars-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 7 },
            },
          },
          {
            // Listening MP3s — large, change rarely, "stale ok while we
            // refetch". Saves 100-500 KB per replay.
            urlPattern: /\/api\/listening\/exercises\/.+\/audio/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'listening-audio-cache',
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: {
        enabled: false, // Don't enable SW in dev — too noisy on HMR
      },
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  build: {
    // Bundle-splitting hints. Vite's automatic chunking lumped every vendor
    // dep into the main bundle (1.19 MB raw). Split known-cacheable libs into
    // named chunks so:
    //   1. Long-term browser cache hits on subsequent visits (vendor hash
    //      doesn't change every release).
    //   2. Initial page render gets a smaller main chunk, lazier vendors are
    //      fetched in parallel.
    //   3. CDN gets to deliver fewer bytes per route change (chunks already
    //      cached from the first visit).
    rollupOptions: {
      output: {
        manualChunks: {
          'react': ['react', 'react-dom'],
          'router': ['@tanstack/react-router'],
          'query': ['@tanstack/react-query', '@tanstack/react-query-devtools'],
          'radix': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-progress',
            '@radix-ui/react-toast',
            '@radix-ui/react-slot',
            '@radix-ui/react-tooltip',
          ],
          'icons': ['lucide-react'],
          'animation': ['framer-motion', 'canvas-confetti'],
          'forms': ['react-hook-form', 'zod'],
          'sentry': ['@sentry/react'],
        },
      },
    },
    // Default warning threshold (500 KB) was masking the 1.2 MB main chunk
    // for ages — set explicitly so the warning stays meaningful after split.
    chunkSizeWarningLimit: 350,
  },
});
