// Ráfaga de confeti cuadrado en la posición dada, vía Web Animations API —
// sin dependencias, se limpia sola al terminar. Respeta prefers-reduced-motion.
export function confetti(x, y, colors) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const cols = colors || ['#1a1a1a', '#c8102e', '#ff3b52', '#f3f0e6']
  for (let i = 0; i < 22; i++) {
    const d = document.createElement('div')
    d.style.cssText = `position:fixed;width:9px;height:9px;z-index:8000;pointer-events:none;left:${x}px;top:${y}px;background:${cols[i % cols.length]}`
    document.body.appendChild(d)
    d.animate([{ transform: 'translate(0,0) rotate(0)', opacity: 1 },
    { transform: `translate(${(Math.random() - .5) * 260}px,${120 + Math.random() * 220}px) rotate(${Math.random() * 720}deg)`, opacity: 0 }],
      { duration: 900 + Math.random() * 500, easing: 'cubic-bezier(.2,.7,.3,1)' }).onfinish = () => d.remove()
  }
}
