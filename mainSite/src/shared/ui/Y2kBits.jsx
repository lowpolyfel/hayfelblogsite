import './y2k.css'

// Piezas Y2K portadas de un póster hecho por el usuario, recoloreadas a la
// paleta del sitio (el azul eléctrico del original pasa a crimson).

// Globo de alambre girando: son aros planos rotados en Y dentro de un
// contenedor con preserve-3d; la ilusión de esfera la da el giro del padre.
export function Globe3D({ className = '', rings = 5, reverse = false, duration = 12 }) {
  return (
    <div className={`globe-wrap ${className}`} aria-hidden="true">
      <div className="globe-3d" style={{ animationDuration: `${duration}s`, animationDirection: reverse ? 'reverse' : 'normal' }}>
        {Array.from({ length: rings }, (_, i) => (
          <span key={i} className="globe-ring" style={{ transform: `rotateY(${(180 / rings) * i}deg)` }} />
        ))}
        <span className="globe-ring" style={{ transform: 'rotateX(90deg)' }} />
      </div>
    </div>
  )
}

// Las cuatro marcas de esquina del marco (dos redondas en diagonal, dos
// cuadradas). Va dentro de cualquier elemento con la clase `y2k-frame`.
export function Y2kCorners() {
  return (
    <>
      <span className="y2k-corner tl" aria-hidden="true" />
      <span className="y2k-corner tr" aria-hidden="true" />
      <span className="y2k-corner bl" aria-hidden="true" />
      <span className="y2k-corner br" aria-hidden="true" />
    </>
  )
}

// Mancha orgánica flotante
export function Blob({ className = '' }) {
  return (
    <svg className={`y2k-blob ${className}`} viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <path d="M10,20 C40,0 80,10 90,40 C100,70 60,100 30,90 C0,80 -10,40 10,20 Z" />
    </svg>
  )
}

// Separador decorativo: línea + bloque de rayas diagonales + puntos, con una
// línea de texto japonés opcional.
export function Y2kDivider({ jp, flip = false }) {
  return (
    <div className={`y2k-divider ${flip ? 'flip' : ''}`} aria-hidden="true">
      <span className="rule" />
      <span className="stripes" />
      <span className="dots"><i /><i /><i /></span>
      {jp && <span className="jp">{jp}</span>}
      <span className="rule" />
      <span className="star">★</span>
    </div>
  )
}
