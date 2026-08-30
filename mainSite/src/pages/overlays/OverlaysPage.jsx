import HayfelBroadcast from './HayfelBroadcast'
import { HiddenTools } from '../../shared/ui/HiddenTools'
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
  return (
    <div className="ov">
      <HayfelBroadcast key={variant} program={esCierre ? 'end' : 'start'} />

      <HiddenTools
        links={[
          { href: '#', label: '← salir' },
          {
            href: esCierre ? '#overlays' : '#overlays-fin',
            label: esCierre ? 'ver apertura' : 'ver cierre',
          },
        ]}
      />
    </div>
  )
}
