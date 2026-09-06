import { useEffect, useState } from 'react'
import { LegacyPage } from './pages/legacy/LegacyPage'
import { ScrapbookPage } from './pages/scrapbook/ScrapbookPage'
import { RedesPage } from './pages/redes/RedesPage'
import { CalendarioPage } from './pages/calendario/CalendarioPage'
import { OverlaysPage } from './pages/overlays/OverlaysPage'
import { WavesPage } from './pages/waves/WavesPage'
import { WavesLegacyPage } from './pages/waves/WavesLegacyPage'
import { RuletaOverlayPage } from './pages/overlays/RuletaOverlayPage'
import { ConfigPage } from './pages/config/ConfigPage'
import { TornFilters } from './shared/ui/TornPaper'

// Ruteo mínimo por hash, sin dependencias nuevas: redes en #redes,
// calendario en #calendario y la versión anterior guardada en #legacy, sin
// afectar el hosting estático (nada de rutas de servidor que configurar).
//
// #overlays y #overlays-fin (apertura y cierre del directo) y #waves no
// aparecen en ningún menú ni enlace: son secciones ocultas. A los overlays
// se llega picando cinco veces el logo de la barra del inicio; a waves,
// seis veces el HAYFEL grande del centro de la portada.
//
// #overlays/ruleta es el widget de la ruleta para el Browser Source de OBS y
// #config su panel de ajustes. Van por hash como todo lo demás: el hosting
// es estático y no hay rutas de servidor que configurar.
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
  // #config puede llevar cola (#config?error=...), así que se compara la
  // ruta sin los parámetros.
  const ruta = hash.split('?')[0]
  // Red de seguridad: si por lo que sea el token de Twitch sigue en el hash
  // al llegar aquí, esto es la vuelta del login y toca ir a los ajustes, no
  // caer en la portada.
  const vueltaDeTwitch = hash.includes('access_token=')

  // Al cambiar de página el scroll vuelve arriba: si no, se entra a #redes
  // a media altura por el scroll que traía la página anterior.
  useEffect(() => { window.scrollTo(0, 0) }, [hash])

  let page
  if (ruta === '#legacy') page = <LegacyPage />
  else if (ruta === '#redes') page = <RedesPage />
  else if (ruta === '#calendario') page = <CalendarioPage />
  else if (ruta === '#overlays') page = <OverlaysPage variant="intro" />
  else if (ruta === '#overlays-fin') page = <OverlaysPage variant="outro" />
  else if (ruta === '#overlays/ruleta') page = <RuletaOverlayPage />
  else if (ruta === '#config' || vueltaDeTwitch) page = <ConfigPage />
  else if (ruta === '#waves') page = <WavesPage />
  else if (ruta === '#waves-2') page = <WavesLegacyPage />
  else page = <ScrapbookPage />

  return (
    <>
      {/* Los filtros de rasgado se declaran una sola vez para todo el sitio */}
      <TornFilters />
      {page}
    </>
  )
}
