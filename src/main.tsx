import { registerSW } from 'virtual:pwa-register'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

registerSW({
  onNeedRefresh() {
    console.log('[PWA] New content available, updating...')
  },
  onOfflineReady() {
    console.log('[PWA] App ready to work offline')
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
