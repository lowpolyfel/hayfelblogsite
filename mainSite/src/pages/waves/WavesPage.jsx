import HayfelWaves from './HayfelWaves'
import { HiddenTools } from '../../shared/ui/HiddenTools'
import './waves.css'

// Sección oculta: no está en el menú ni enlazada desde ninguna parte. Se
// llega solo picando seis veces el HAYFEL grande del centro de la portada.
//
// El componente de dentro se deja tal cual, con sus propios valores por
// defecto. Lo único que se añade es la salida, por fuera.
export function WavesPage() {
  return (
    <div className="wv">
      <HayfelWaves />
      <HiddenTools links={[{ href: '#', label: '← salir' }]} />
    </div>
  )
}
