import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
    VitePWA({
      registerType: 'autoUpdate',
      // PWA fully disabled — stale workbox SWs on unvrsm.ru intercepted fetches
      // and broke the site. Kill-switch SWs in public/sw.js + public/service-worker.js
      // unregister themselves on existing devices.
      disable: true,
      injectRegister: false,
      devOptions: { enabled: false },
      manifest: false,
    }),
  ].filter(Boolean),
  // CRITICAL: Force Vite to pre-bundle React dependencies together
  // This prevents multiple React instances causing "dispatcher.useEffect" errors
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-dom/client',
      'react/jsx-runtime',
      'react/jsx-dev-runtime',
      '@tanstack/react-query',
      'react-router-dom',
      'scheduler',
    ],
    esbuildOptions: {
      jsx: 'automatic',
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    // Dedupe React to prevent multiple instances
    dedupe: ['react', 'react-dom'],
  },
  build: {
    // Keep all third-party packages in a single vendor chunk.
    // Splitting React, React DOM and React Query into separate manual chunks
    // created a circular dependency in production where query-* imported React
    // before the vendor chunk had finished initializing it.
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
      },
    },
    // Use esbuild for minification (faster and no extra dependencies)
    minify: 'esbuild',
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Increase chunk size warning limit for better splitting
    chunkSizeWarningLimit: 500,
    // Target modern browsers for smaller output
    target: 'es2020',
    // Generate modulepreload links for better loading
    modulePreload: {
      polyfill: true,
    },
  },
}));
