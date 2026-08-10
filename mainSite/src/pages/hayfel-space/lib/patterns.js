function svgUri(svg) {
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
}

function makePattern(kind, size, background, line) {
  let content
  if (kind === 'grid') {
    content = `<path d="M ${size} 0 L 0 0 0 ${size}" fill="none" stroke="${line}" stroke-width="1.4"/>`
  } else if (kind === 'dots') {
    content = `<circle cx="${size / 2}" cy="${size / 2}" r="1.7" fill="${line}"/>`
  } else if (kind === 'cross') {
    const center = size / 2
    content = `<path d="M ${center - 6} ${center} H ${center + 6} M ${center} ${center - 6} V ${center + 6}" stroke="${line}" stroke-width="1.6" stroke-linecap="square"/>`
  } else {
    const half = size / 2
    content = `<rect width="${half}" height="${half}" fill="${line}"/><rect x="${half}" y="${half}" width="${half}" height="${half}" fill="${line}"/>`
  }
  return svgUri(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" fill="${background}"/>${content}</svg>`)
}

function makeGrain(seed) {
  return svgUri(`<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="${seed}" stitchTiles="stitch"/><feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.7 0"/></filter><rect width="100%" height="100%" filter="url(#n)"/></svg>`)
}

export const backgroundStyles = [
  { id: 'grid', label: 'CUADRÍCULA' },
  { id: 'dots', label: 'PUNTOS' },
  { id: 'cross', label: 'CRUCES' },
  { id: 'check', label: 'DAMERO' },
]

export const patterns = {
  grid: makePattern('grid', 46, '#d40e31', 'rgba(11,7,8,.4)'),
  dots: makePattern('dots', 30, '#d40e31', 'rgba(11,7,8,.48)'),
  cross: makePattern('cross', 38, '#d40e31', 'rgba(11,7,8,.42)'),
  check: makePattern('check', 88, '#d40e31', '#b80e2c'),
}

export const televisionPattern = makePattern('grid', 24, '#0b0708', 'rgba(255,31,63,.4)')
export const grainPattern = makeGrain(4)
export const tileSizes = { grid: 46, dots: 30, cross: 38, check: 88 }
