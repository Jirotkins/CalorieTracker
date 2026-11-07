import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig({
  // Čas buildu — v Nastavení je vidět, jaká verze appky v telefonu běží
  define: {
    __APP_BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
  server: {
    proxy: {
      // Všechny requesty začínající na /api budou přeposlány do backendu
      '/api': {
        target: 'http://backend:8000', // Jméno služby v docker-compose
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '') // Odstraní '/api' před odesláním
      },
      // Proxy pro lokální vývoj, aby se načítaly fotky ze /static
      // Backend má root_path="/api" → fotky servíruje jen pod /api/static (viz nginx.conf)
      '/static': {
        target: 'http://backend:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/static/, '/api/static')
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
        lang: 'cs',
        icons: [
          { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          // Android si ikonu ořízne do svého tvaru (jablko je v bezpečné zóně)
          { src: '/maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ]
      },
      workbox: {
        // SPA fallback nesmí přebít API, Swagger (/api/docs) ani fotky
        navigateFallbackDenylist: [/^\/api/, /^\/static/],
        runtimeCaching: [
          {
            // Data z API: vždy zkusí síť, bez signálu vrátí poslední uloženou odpověď (jen čtení)
            urlPattern: ({ url, request }) => url.pathname.startsWith('/api/') && request.method === 'GET',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 4,
              expiration: { maxEntries: 200, maxAgeSeconds: 7 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [200] },
            },
          },
          {
            // Nahrané fotky se nemění (každá má unikátní název) → stačí je stáhnout jednou
            urlPattern: ({ url }) => url.pathname.startsWith('/static/photos/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'photo-cache',
              expiration: { maxEntries: 300, maxAgeSeconds: 60 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [200] },
            },
          },
        ],
      },
    })
  ],
})
