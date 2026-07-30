import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig({
  server: {
    proxy: {
      // Všechny requesty začínající na /api budou přeposlány do backendu
      '/api': {
        target: 'http://backend:8000', // Jméno služby v docker-compose
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '') // Odstraní '/api' před odesláním
      }
    }
  },
  plugins: [
    react(),
    basicSsl(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      // PWA manifest pro iPhone
      manifest: {
        name: 'CalorieTracker',
        short_name: 'CalTrack',
        description: 'Sleduj své kalorie',
        theme_color: '#1e293b',
        background_color: '#1e293b',
        display: 'standalone', // Skrytí lišt prohlížeče
        scope: '/', // Podstránky patří do aplikace
        start_url: '/',
        icons: [
          // Ikony později
        ]
      }
    })
  ],
})
