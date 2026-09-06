import { useEffect, useState } from 'react'
import { LegacyPage } from './pages/legacy/LegacyPage'
import { ScrapbookPage } from './pages/scrapbook/ScrapbookPage'
import { RedesPage } from './pages/redes/RedesPage'
import { CalendarioPage } from './pages/calendario/CalendarioPage'
import { OverlaysPage } from './pages/overlays/OverlaysPage'
import { WavesPage } from './pages/waves/WavesPage'
import { WavesLegacyPage } from './pages/waves/WavesLegacyPage'
import { EntrarPage } from './pages/ruleta/EntrarPage'
import { PanelPage } from './pages/ruleta/PanelPage'
import { AjustesPage } from './pages/ruleta/AjustesPage'
import { OverlayPage } from './pages/ruleta/OverlayPage'
import { TornFilters } from './shared/ui/TornPaper'

// Dos ruteos conviviendo, y es a propósito:
//
// · El blog va por hash (#redes, #calendario, #legacy, #waves...). Se quedó
//   así porque nació sobre un hosting estático, y cambiarlo ahora no aporta
//   nada: los enlaces de siempre siguen funcionando.
//
// · La ruleta va por rutas de verdad (/ruleta/entrar, /ruleta/panel,
//   /ruleta/ajustes, /ruleta/overlay). Ahora hay un servidor Node delante
//   que devuelve el index para cualquier ruta, así que se puede. Son cuatro
//   páginas separadas de verdad, cada una con su dirección, y eso importa
//   sobre todo para la del widget: es la que se pega en OBS.
//
// #overlays y #overlays-fin (apertura y cierre del directo) y #waves no
// aparecen en ningún menú ni enlace: son secciones ocultas. A los overlays
// se llega picando cinco veces el logo de la barra del inicio; a waves,
// seis veces el HAYFEL grande del centro de la portada.

function useRuta() {
  const leer = () => ({ ruta: window.location.pathname, hash: window.location.hash })
  const [donde, setDonde] = useState(leer)
  useEffect(() => {
    const alCambiar = () => setDonde(leer())
    window.addEventListener('hashchange', alCambiar)
    window.addEventListener('popstate', alCambiar)
    return () => {
      window.removeEventListener('hashchange', alCambiar)
      window.removeEventListener('popstate', alCambiar)
    }
  }, [])
  return donde
}

export default function App() {
  const { ruta, hash } = useRuta()

  // Al cambiar de página el scroll vuelve arriba: si no, se entra a #redes
  // a media altura por el scroll que traía la página anterior.
  useEffect(() => { window.scrollTo(0, 0) }, [ruta, hash])

  // La ruleta manda sobre el hash: sus páginas tienen ruta propia.
  const ruletaDe = ruta.replace(/\/+$/, '').match(/^\/ruleta(?:\/(.*))?$/)?.[1] ?? null
  if (ruletaDe !== null) {
    if (ruletaDe === 'overlay') return <OverlayPage />
    if (ruletaDe === 'panel') return <PanelPage />
    if (ruletaDe === 'ajustes') return <AjustesPage />
    return <EntrarPage /> // /ruleta y /ruleta/entrar
  }

  const seccion = hash.split('?')[0]

  let page
  if (seccion === '#legacy') page = <LegacyPage />
  else if (seccion === '#redes') page = <RedesPage />
  else if (seccion === '#calendario') page = <CalendarioPage />
  else if (seccion === '#overlays') page = <OverlaysPage variant="intro" />
  else if (seccion === '#overlays-fin') page = <OverlaysPage variant="outro" />
  else if (seccion === '#waves') page = <WavesPage />
  else if (seccion === '#waves-2') page = <WavesLegacyPage />
  else page = <ScrapbookPage />

  return (
    <>
      {/* Los filtros de rasgado se declaran una sola vez para todo el sitio */}
      <TornFilters />
      {page}
    </>
  )
}
