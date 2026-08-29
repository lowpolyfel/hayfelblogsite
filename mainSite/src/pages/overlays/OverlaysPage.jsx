import HayfelBroadcast from './HayfelBroadcast'
import './overlays.css'

// Sección oculta: no está en el menú ni enlazada desde ninguna parte. Se
// llega solo picando cinco veces el logo HAYFEL de la barra del inicio.
//
// `HayfelBroadcast.jsx` se deja exactamente como lo entregó el usuario: no
// se le toca ni una línea. Todo lo que hace falta añadir (la salida) vive
// aquí fuera, envolviéndolo.
export function OverlaysPage() {
  return (
    <div className="ov">
      <HayfelBroadcast />
      {/* Invisible hasta que el ratón se acerca: así no aparece en la
          captura de OBS, donde no hay puntero. */}
      <a className="ov-exit" href="#">← salir</a>
    </div>
  )
}
