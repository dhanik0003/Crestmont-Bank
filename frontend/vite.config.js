import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    // Raise the warning limit slightly — three.js is intentionally large
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Vendor: React core
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'react-vendor';
          }
          // Vendor: Router
          if (id.includes('node_modules/react-router')) {
            return 'router-vendor';
          }
          // Vendor: Three.js (heavy — isolate so it doesn't bloat the main bundle)
          if (id.includes('node_modules/three')) {
            return 'three-vendor';
          }
          // Vendor: Axios + other small libs
          if (id.includes('node_modules/axios') || id.includes('node_modules/class-variance')) {
            return 'utils-vendor';
          }
        },
      },
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});
