import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Built assets are served by Django/WhiteNoise under STATIC_URL, so production
// URLs must be prefixed with /static/. The dev server proxies the Django API.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/static/' : '/',
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    chunkSizeWarningLimit: 1200,
  },
  server: {
    proxy: {
      '/api': 'http://127.0.0.1:8000',
      '/health': 'http://127.0.0.1:8000',
    },
  },
}));
