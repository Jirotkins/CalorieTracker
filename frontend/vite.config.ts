import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
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
