import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { registerSW } from 'virtual:pwa-register'

// Service worker: nová verze se po nasazení stáhne a stránka se sama obnoví (autoUpdate).
// iOS PWA se z pozadí jen "probudí" bez načtení → při návratu do appky zkontroluje aktualizaci.
registerSW({
  immediate: true,
  onRegisteredSW(_swUrl, registration) {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') registration?.update()
    })
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
