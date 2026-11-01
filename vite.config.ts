import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'উৎসব সঞ্চয় — শারদীয় দুর্গোৎসব',
        short_name: 'উৎসব সঞ্চয়',
        description: 'শারদীয় দুর্গোৎসব তহবিল ও চাঁদা ব্যবস্থাপনা',
        theme_color: '#a61f1f',
        background_color: '#fff8ec',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: '/icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,webmanifest}']
      }
    })
  ]
});
