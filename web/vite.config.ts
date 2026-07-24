import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// GitHub Pages serves project sites from /<repo-name>/, not the domain root.
const base = '/CalCount/';

export default defineConfig(({ command }) => ({
  base: command === 'build' ? base : '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'CalCount',
        short_name: 'CalCount',
        description: 'AI-ondersteunde calorietracker',
        theme_color: '#16a34a',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: base,
        scope: base,
      },
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3001',
      '/health': 'http://localhost:3001',
    },
  },
}));
