const BONE = '#D9D5C5'

// La palabra difuminada de HayfelWaves, suelta para poder ponerla sobre
// otro fondo. Es el mismo tratamiento: un desenfoque gaussiano y una matriz
// de color que corta por umbral, lo que deja un contorno derretido de color
// plano en vez de un degradado (tipo FF Blur).
//
// HayfelWaves conserva su propia copia dentro: ese archivo llegó tal cual
// del autor y no se toca.
export function BlurType({ word = 'hayfel', melt = 5.5, color = BONE, id = 'blurtype' }) {
  return (
    <div className="blurtype">
      <svg viewBox="0 0 700 200" style={{ width: 'min(62%, 700px)', height: 'auto', overflow: 'visible' }}>
        <defs>
          <filter id={id} x="-15%" y="-45%" width="130%" height="190%" colorInterpolationFilters="sRGB">
            <feGaussianBlur in="SourceGraphic" stdDeviation={melt} result="b" />
            <feColorMatrix
              in="b"
              type="matrix"
              values="0 0 0 0 0.851
                      0 0 0 0 0.835
                      0 0 0 0 0.773
                      0 0 0 26 -11"
            />
          </filter>
        </defs>
        <text
          x="350"
          y="138"
          textAnchor="middle"
          fontFamily="'Quicksand','Poppins','Helvetica Neue',Helvetica,Arial,sans-serif"
          fontWeight="700"
          fontSize="140"
          letterSpacing="7"
          fill={color}
          filter={`url(#${id})`}
        >
          {word}
        </text>
      </svg>
    </div>
  )
}
