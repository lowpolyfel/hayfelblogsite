import './torn-paper.css'

// Rasgado de papel en doble capa (portado de un prototipo del usuario).
//
// En vez de recortar el elemento con clip-path (dientes geométricos, siempre
// iguales), el borde sale de un filtro SVG: feTurbulence genera ruido y
// feDisplacementMap empuja los píxeles del borde con ese ruido, así que el
// desgarre es orgánico y nunca se repite. Van dos capas: una de base que
// sobresale un poco y otra de color encima, de modo que el papel de abajo
// asoma por el borde como en un pegote de papel arrancado de verdad.
//
// Los filtros se declaran una sola vez por página con <TornFilters />.

export function TornFilters() {
  return (
    <svg width="0" height="0" className="torn-defs" aria-hidden="true" focusable="false">
      <filter id="torn-base">
        <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="4" result="r" />
        <feDisplacementMap in="SourceGraphic" in2="r" scale="12" xChannelSelector="R" yChannelSelector="G" />
      </filter>
      <filter id="torn-top">
        <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="4" result="r" />
        <feDisplacementMap in="SourceGraphic" in2="r" scale="14" xChannelSelector="R" yChannelSelector="G" />
      </filter>
      <filter id="torn-aggr-base">
        <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="4" result="r" />
        <feDisplacementMap in="SourceGraphic" in2="r" scale="25" xChannelSelector="R" yChannelSelector="G" />
      </filter>
      <filter id="torn-aggr-top">
        <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="4" result="r" />
        <feDisplacementMap in="SourceGraphic" in2="r" scale="28" xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </svg>
  )
}

// `cut` elige por dónde se rasga (ver la lista completa en torn-paper.css).
// `base`/`top` son los colores de las dos capas. `hard` cambia la sombra
// suave por una sombra dura desplazada, que pega mejor con lo brutalista.
// `sm` achica el filo, para piezas sueltas dentro de una retícula.
// El contenedor tiene que llevar la clase `torn-host`.
//
// Nota sobre los cortes: los que dejan un borde "recto" lo consiguen sacando
// esa capa fuera de cuadro, así que solo se leen bien cuando algo recorta por
// ahí (las bandas a lo ancho las recorta la propia página). En una pieza
// suelta y sin recorte se rasgan igual los cuatro lados, que es justo lo que
// hace `cut="all"` a propósito.
export function TornPaper({ cut = 'both', base = 'crimson', top = 'ink2', aggressive = false, hard = false, sm = false }) {
  const mods = [aggressive && 'torn-aggr', hard && 'torn-hard', sm && 'torn-sm'].filter(Boolean).join(' ')
  return (
    <div className={`torn-layers cut-${cut} ${mods}`} aria-hidden="true">
      <div className={`torn-base tn-${base}`} />
      <div className={`torn-top tn-${top}`} />
    </div>
  )
}
