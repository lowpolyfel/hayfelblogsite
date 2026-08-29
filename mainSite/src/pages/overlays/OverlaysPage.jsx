import { useEffect, useRef, useState } from 'react'
import HayfelBroadcast from './HayfelBroadcast'
import HayfelBroadcastOutro from './HayfelBroadcastOutro'
import './overlays.css'

// Sección oculta: no está en el menú ni enlazada desde ninguna parte. Se
// llega solo picando cinco veces el logo HAYFEL de la barra del inicio.
//
// Los dos componentes de dentro (apertura y cierre) se dejan tal cual: el
// de cierre es copia del de apertura con los textos cambiados, misma
// estructura y mismo CSS. Todo lo que hace falta añadir (salida y cambio
// entre uno y otro) vive aquí fuera, envolviéndolos.
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
      {esCierre ? <HayfelBroadcastOutro /> : <HayfelBroadcast />}

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
