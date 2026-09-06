import { useEffect, useState } from 'react'
import { LegacyPage } from './pages/legacy/LegacyPage'
import { ScrapbookPage } from './pages/scrapbook/ScrapbookPage'
import { RedesPage } from './pages/redes/RedesPage'
import { CalendarioPage } from './pages/calendario/CalendarioPage'
import { OverlaysPage } from './pages/overlays/OverlaysPage'
import { WavesPage } from './pages/waves/WavesPage'
import { WavesLegacyPage } from './pages/waves/WavesLegacyPage'
import { EntrarPage } from './pages/puntos/EntrarPage'
import { PanelPage } from './pages/puntos/PanelPage'
import { RuletaPage } from './pages/puntos/RuletaPage'
import { VozPage } from './pages/puntos/VozPage'
import { RuletaOverlay } from './pages/overlay/RuletaOverlay'
import { VozOverlay } from './pages/overlay/VozOverlay'
import { TornFilters } from './shared/ui/TornPaper'

// Dos ruteos conviviendo, y es a propósito:
//
// · El blog va por hash (#redes, #calendario, #legacy, #waves...). Se quedó
//   así porque nació sobre un hosting estático, y cambiarlo ahora no aporta
//   nada: los enlaces de siempre siguen funcionando.
//
// · El panel de puntos de canal va por rutas de verdad. Ahora hay un
//   servidor Node delante que devuelve el index para cualquier ruta, así
//   que se puede, y eso importa sobre todo para los widgets: sus
//   direcciones son las que se pegan en OBS y no deberían cambiar nunca.
//
//     /puntos/entrar    entrar con Twitch
//     /puntos           qué recompensa dispara cada función
//     /puntos/ruleta    los premios de la ruleta
//     /puntos/voz       la voz y su moderación
//     /overlay/ruleta   widget de la ruleta
//     /overlay/voz      widget del lector
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

  // El panel manda sobre el hash: sus páginas tienen ruta propia.
  const limpia = ruta.replace(/\/+$/, '') || '/'

  const overlayDe = limpia.match(/^\/overlay\/(.+)$/)?.[1]
  if (overlayDe === 'ruleta') return <RuletaOverlay />
  if (overlayDe === 'voz') return <VozOverlay />

  // Se mira el resultado del match, no el grupo: en "/puntos" a secas el
  // grupo viene indefinido, y confundir eso con "no casó" mandaba la
  // portada del panel al blog.
  const puntos = limpia.match(/^\/puntos(?:\/(.*))?$/)
  if (puntos) {
    const seccionPanel = puntos[1] ?? ''
    if (seccionPanel === 'entrar') return <EntrarPage />
    if (seccionPanel === 'ruleta') return <RuletaPage />
    if (seccionPanel === 'voz') return <VozPage />
    return <PanelPage /> // /puntos
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
