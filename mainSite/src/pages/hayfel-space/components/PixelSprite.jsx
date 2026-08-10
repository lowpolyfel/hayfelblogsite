const pixels = [
  '................', '.....kkkkkk.....', '...kkaaaaaakk...', '..kaaaaaaaaaak..',
  '..kakkkkkkkkak..', '..kakcwkkwckak..', '..kakccwwcckak..', '..kakkkkkkkkak..',
  '..kaaaaaaaaaak..', '..kaokkkkkkoak..', '..kaawkwkwkaak..', '..kkaaaaaaaakk..',
  '...kkkkkkkkkk...', '....k.k..k.k....', '................', '................',
]

export function PixelSprite({ accent = '#d40e31', eye = '#ff1f3f', variant = 0 }) {
  const colors = { k: '#0b0708', a: accent, w: '#f5ede2', c: eye, o: '#d40e31' }
  const rectangles = []
  pixels.forEach((row, y) => {
    ;[...row].forEach((character, x) => {
      let color = character
      if (y === 5 && variant % 3 === 1 && (x === 6 || x === 9)) color = 'k'
      if (y === 6 && variant % 3 === 2 && (x === 7 || x === 8)) color = 'c'
      if (colors[color]) rectangles.push(<rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={colors[color]} />)
    })
  })
  return <svg viewBox="0 0 16 16" role="img" aria-label="Avatar pixel art de Hayfel">{rectangles}</svg>
}
