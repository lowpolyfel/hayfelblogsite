import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { consumirTokenDeLaUrl } from './services/api/twitch/twitchAuth'

// Antes de montar nada: si venimos de Twitch, el token llega en el hash
// (#access_token=...) y el router del sitio también lee el hash. Se guarda y
// se reescribe la URL a #config para que no choquen.
consumirTokenDeLaUrl()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
