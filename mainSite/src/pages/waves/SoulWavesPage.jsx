import SoulWavesBackground from './SoulWavesBackground'
import { HiddenTools } from '../../shared/ui/HiddenTools'
import './waves.css'

// Tercera sección oculta de waves: la malla 3D que respira con las olas
// encima. El componente se deja tal cual, con su propio botón de claro y
// oscuro; lo único que se añade por fuera es la barra de salida.
//
// Como las otras dos, no está enlazada desde ningún menú: se llega por la
// dirección o saltando desde las vecinas con la barra oculta.
export function SoulWavesPage() {
  return (
    <div className="wv wv-soul">
      <SoulWavesBackground />
      <HiddenTools
        links={[
          { href: '#', label: '← salir' },
          { href: '#waves', label: 'ver olas' },
          { href: '#waves-2', label: 'ver estrellas' },
        ]}
      />
    </div>
  )
}
