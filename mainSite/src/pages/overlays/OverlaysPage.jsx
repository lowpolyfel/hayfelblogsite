import { useEffect, useRef, useState } from 'react'
import HayfelBroadcast from './HayfelBroadcast'
import './overlays.css'

// Sección oculta: no está en el menú ni enlazada desde ninguna parte. Se
// llega solo picando cinco veces el logo HAYFEL de la barra del inicio.
//
// Apertura y cierre son dos direcciones distintas (#overlays y
// #overlays-fin) sobre el mismo componente: el programa se le pasa por
// prop, y el key lo remonta al cambiar de una a otra para que la
// secuencia arranque desde la primera escena.
export function OverlaysPage({ variant = 'intro' }) {
  const esCierre = variant === 'outro'
  const [toolsVisible, setToolsVisible] = useState(false)
  const hideTimer = useRef(null)

  useEffect(() => {
    const showTools = () => {
      setToolsVisible(true)
      clearTimeout(hideTimer.current)
      hideTimer.current = setTimeout(() => setToolsVisible(false), 5000)
    }

    window.addEventListener('mousemove', showTools)
    return () => {
      window.removeEventListener('mousemove', showTools)
      clearTimeout(hideTimer.current)
    }
  }, [])

  return (
    <div className="ov">
      <HayfelBroadcast key={variant} program={esCierre ? 'end' : 'start'} />

      {/* Invisibles hasta que el ratón se mueve; se ocultan después de 5s
          sin movimiento. No aparecen en la captura de OBS. */}
      <nav className={`ov-tools ${toolsVisible ? 'visible' : ''}`}>
        <a href="#">← salir</a>
        <a href={esCierre ? '#overlays' : '#overlays-fin'}>
          {esCierre ? 'ver apertura' : 'ver cierre'}
        </a>
      </nav>
    </div>
  )
}
