import { useEffect, useState } from 'react'
import { LegacyPage } from './pages/legacy/LegacyPage'
import { ScrapbookPage } from './pages/scrapbook/ScrapbookPage'

// Ruteo mínimo por hash, sin dependencias nuevas: la versión anterior del
// sitio queda guardada y accesible en #legacy, sin afectar el hosting
// estático (nada de rutas de servidor que configurar).
function useHash() {
  const [hash, setHash] = useState(() => window.location.hash)
  useEffect(() => {
    const onChange = () => setHash(window.location.hash)
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return hash
}

export default function App() {
  const hash = useHash()
  if (hash === '#legacy') return <LegacyPage />
  return <ScrapbookPage />
}
