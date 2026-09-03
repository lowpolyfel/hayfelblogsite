import { useState } from 'react'
import { Icon } from '../../shared/assets/icons/Icon'
import { Starfield } from '../../shared/assets/patterns/Starfield'
import { BlurType } from '../../shared/ui/BlurType'
import { TornPaper } from '../../shared/ui/TornPaper'
import { HiddenTools } from '../../shared/ui/HiddenTools'
import './waves.css'

const FONDOS = [
  { variant: 0, red: '#c8102e', label: 'crimson · deriva' },
  { variant: 1, red: '#1450c8', label: 'azul · lluvia' },
  { variant: 2, red: '#c89010', label: 'dorado · galaxia' },
]

// Segunda versión de waves: el mismo texto derretido, pero sobre el fondo
// de estrellas de la versión legacy en vez del shader de olas.
export function WavesLegacyPage() {
  const [idx, setIdx] = useState(0)
  const fondo = FONDOS[idx % FONDOS.length]

  return (
    <div className="wv wv-legacy">
      <Starfield className="wv-bg" variant={fondo.variant} red={fondo.red} />

      {/* La palabra sola se perdía contra las estrellas: va sobre un recorte
          de papel roto, el mismo de la portada pero en pequeño. */}
      <div className="wv-panel torn-host">
        <TornPaper cut="both" base="crimson" top="ink2" sm />
        <BlurType id="wv2-blurtype" />
      </div>

      {/* Rejilla de líneas de barrido y viñeteado: el mismo filtro de tubo
          que lleva la versión legacy sobre su fondo de estrellas. */}
      <div className="wv-crt" aria-hidden="true" />

      <button className="wv-bgswitch" onClick={() => setIdx((i) => (i + 1) % FONDOS.length)}
        aria-label="Cambiar fondo">
        <Icon name="sparkle" size={11} /> {fondo.label}
      </button>

      <HiddenTools
        links={[
          { href: '#', label: '← salir' },
          { href: '#waves', label: 'ver olas' },
        ]}
      />
    </div>
  )
}
