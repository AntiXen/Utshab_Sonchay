import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
export default defineConfig({ plugins:[react(), VitePWA({ registerType:'autoUpdate', includeAssets:['favicon.svg'], manifest:{ name:'Puja Fund', short_name:'Puja Fund', description:'Community Durga Puja fund manager', theme_color:'#a61f1f', background_color:'#fff8ec', display:'standalone', start_url:'/', icons:[{src:'/icon.svg',sizes:'any',type:'image/svg+xml',purpose:'any maskable'}] }, workbox:{globPatterns:['**/*.{js,css,html,svg,webmanifest}']} })] });
