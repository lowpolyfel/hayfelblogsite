import { useEffect, useState } from 'react'
import { LegacyPage } from './pages/legacy/LegacyPage'
import { ScrapbookPage } from './pages/scrapbook/ScrapbookPage'
import { RedesPage } from './pages/redes/RedesPage'
import { TornFilters } from './shared/ui/TornPaper'

// Ruteo mínimo por hash, sin dependencias nuevas: el sitio de redes vive en
// #redes y la versión anterior queda guardada en #legacy, sin afectar el
// hosting estático (nada de rutas de servidor que configurar).
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

  // Al cambiar de página el scroll vuelve arriba: si no, se entra a #redes
  // a media altura por el scroll que traía la página anterior.
  useEffect(() => { window.scrollTo(0, 0) }, [hash])

  let page
  if (hash === '#legacy') page = <LegacyPage />
  else if (hash === '#redes') page = <RedesPage />
  else page = <ScrapbookPage />

  return (
    <>
      {/* Los filtros de rasgado se declaran una sola vez para todo el sitio */}
      <TornFilters />
      {page}
    </>
  )
}
