import { useEffect, useState } from 'react'
import { LegacyPage } from './pages/legacy/LegacyPage'
import { ScrapbookPage } from './pages/scrapbook/ScrapbookPage'
import { RedesPage } from './pages/redes/RedesPage'
import { CalendarioPage } from './pages/calendario/CalendarioPage'
import { OverlaysPage } from './pages/overlays/OverlaysPage'
import { WavesPage } from './pages/waves/WavesPage'
import { TornFilters } from './shared/ui/TornPaper'

// Ruteo mínimo por hash, sin dependencias nuevas: redes en #redes,
// calendario en #calendario y la versión anterior guardada en #legacy, sin
// afectar el hosting estático (nada de rutas de servidor que configurar).
//
// #overlays y #overlays-fin (apertura y cierre del directo) y #waves no
// aparecen en ningún menú ni enlace: son secciones ocultas. A los overlays
// se llega picando cinco veces el logo de la barra del inicio; a waves,
// seis veces el HAYFEL grande del centro de la portada.
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
  else if (hash === '#calendario') page = <CalendarioPage />
  else if (hash === '#overlays') page = <OverlaysPage variant="intro" />
  else if (hash === '#overlays-fin') page = <OverlaysPage variant="outro" />
  else if (hash === '#waves') page = <WavesPage />
  else page = <ScrapbookPage />

  return (
    <>
      {/* Los filtros de rasgado se declaran una sola vez para todo el sitio */}
      <TornFilters />
      {page}
    </>
  )
}
