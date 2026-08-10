export function svgUri(svg) {
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
}

// Generic tileable SVG pattern generator. `kind` picks the motif, `line` is
// its color, `background` fills the tile behind it. Pages define their own
// palette + backgroundStyles/tileSizes on top of this — nothing here is
// theme-specific.
export function makePattern(kind, size, background, line) {
  let content
  if (kind === 'grid') {
    content = `<path d="M ${size} 0 L 0 0 0 ${size}" fill="none" stroke="${line}" stroke-width="1.4"/>`
  } else if (kind === 'dots') {
    content = `<circle cx="${size / 2}" cy="${size / 2}" r="1.7" fill="${line}"/>`
  } else if (kind === 'cross') {
    const center = size / 2
    content = `<path d="M ${center - 6} ${center} H ${center + 6} M ${center} ${center - 6} V ${center + 6}" stroke="${line}" stroke-width="1.6" stroke-linecap="square"/>`
  } else if (kind === 'star') {
    const c = size / 2
    content = `<path d="M ${c} ${c - 7} L ${c} ${c + 7} M ${c - 7} ${c} L ${c + 7} ${c} M ${c - 5} ${c - 5} L ${c + 5} ${c + 5} M ${c - 5} ${c + 5} L ${c + 5} ${c - 5}" stroke="${line}" stroke-width="1.1" stroke-linecap="round" opacity=".8"/><circle cx="${c}" cy="${c}" r="1.4" fill="${line}"/>`
  } else if (kind === 'bolt') {
    content = `<path d="M ${size * .62} 0 L ${size * .22} ${size * .5} L ${size * .48} ${size * .5} L ${size * .1} ${size} M ${size * .62} 0 L ${size * .9} ${size * .42} L ${size * .64} ${size * .42} L ${size * .9} ${size}" fill="none" stroke="${line}" stroke-width="1.3" stroke-linejoin="round" opacity=".55"/>`
  } else if (kind === 'heart') {
    const c = size / 2
    content = `<path d="M ${c} ${c + 6} C ${c - 9} ${c - 2}, ${c - 6} ${c - 9}, ${c} ${c - 4} C ${c + 6} ${c - 9}, ${c + 9} ${c - 2}, ${c} ${c + 6} Z" fill="${line}" opacity=".7"/>`
  } else {
    const half = size / 2
    content = `<rect width="${half}" height="${half}" fill="${line}"/><rect x="${half}" y="${half}" width="${half}" height="${half}" fill="${line}"/>`
  }
  return svgUri(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" fill="${background}"/>${content}</svg>`)
}

export function makeGrain(seed) {
  return svgUri(`<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="${seed}" stitchTiles="stitch"/><feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.7 0"/></filter><rect width="100%" height="100%" filter="url(#n)"/></svg>`)
}
