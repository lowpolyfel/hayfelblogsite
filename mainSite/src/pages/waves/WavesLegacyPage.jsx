import { Starfield } from '../../shared/assets/patterns/Starfield'
import { BlurType } from '../../shared/ui/BlurType'
import { HiddenTools } from '../../shared/ui/HiddenTools'
import './waves.css'

// Segunda versión de waves: el mismo texto derretido, pero sobre el fondo
// de estrellas de la versión legacy en vez del shader de olas.
export function WavesLegacyPage() {
  return (
    <div className="wv wv-legacy">
      <Starfield className="wv-bg" variant={0} red="#c8102e" />
      <BlurType id="wv2-blurtype" />
      <HiddenTools
        links={[
          { href: '#', label: '← salir' },
          { href: '#waves', label: 'ver olas' },
        ]}
      />
    </div>
  )
}
