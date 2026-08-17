import { useEffect, useRef, useState } from 'react'
import { Icon } from '../../../shared/assets/icons/Icon'
import './persona-menu.css'

// Letras dispersas al azar que se "enderezan" al hacer hover — el jitter se
// recalcula cada vez que el ítem se re-renderiza (una vez por apertura, vía
// la key de más abajo), no en cada render.
function ScatterText({ text }) {
  const chars = [...text].map((ch, i) => {
    const rot = (Math.random() * 16) - 8
    const scale = 0.9 + Math.random() * 0.2
    const ty = (Math.random() * 6) - 3
    return <span key={i} style={{ transform: `rotate(${rot}deg) scale(${scale}) translateY(${ty}px)` }}>{ch === ' ' ? ' ' : ch}</span>
  })
  return <>{chars}</>
}

// Un color de acento distinto por ítem — que el fondo entero (puntos, texto
// gigante, hover) cambie de paleta según lo que esté en foco, como si cada
// entrada del menú fuera una pantalla distinta.
const ACCENTS = ['#c8102e', '#7b3ff2', '#00b0c8', '#c89010', '#0f9e6e']

let audioCtx = null
function blip(freq, dur = 0.06) {
  try {
    audioCtx ||= new (window.AudioContext || window.webkitAudioContext)()
    if (audioCtx.state === 'suspended') audioCtx.resume()
    const osc = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    osc.type = 'square'
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0.06, audioCtx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur)
    osc.connect(gain).connect(audioCtx.destination)
    osc.start(); osc.stop(audioCtx.currentTime + dur)
  } catch { /* audio no disponible, no pasa nada */ }
}

export function PersonaMenu({ open, onClose, items, visits }) {
  const [activeIdx, setActiveIdx] = useState(0)
  const [openCount, setOpenCount] = useState(0)
  const [flash, setFlash] = useState(-1)
  const containerRef = useRef(null)
  const menuRef = useRef(null)
  const silhouetteRef = useRef(null)
  const bgTextRef = useRef(null)
  const halftoneRef = useRef(null)

  useEffect(() => {
    if (!open) return
    setOpenCount((n) => n + 1)
    setActiveIdx(0)
    document.body.style.overflow = 'hidden'
    blip(220, 0.09)
    return () => { document.body.style.overflow = '' }
  }, [open])

  useEffect(() => {
    if (!open) return
    function onKey(e) {
      if (e.key === 'Escape') { onClose(); return }
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); setActiveIdx((i) => (i + 1) % items.length); blip(340, 0.04) }
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); setActiveIdx((i) => (i - 1 + items.length) % items.length); blip(340, 0.04) }
      if (e.key === 'Enter') { const it = items[activeIdx]; if (!it.href) { e.preventDefault(); setFlash(activeIdx); setTimeout(() => setFlash(-1), 700) } }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, items, activeIdx, onClose])

  useEffect(() => {
    if (!open || !window.matchMedia('(pointer: fine)').matches) return
    function onMove(e) {
      const xAxis = (window.innerWidth / 2 - e.pageX) / 25
      const yAxis = (window.innerHeight / 2 - e.pageY) / 25
      if (menuRef.current) menuRef.current.style.transform = `rotateY(${-xAxis}deg) rotateX(${yAxis}deg) translateZ(10px)`
      if (silhouetteRef.current) silhouetteRef.current.style.transform = `translateX(${xAxis * 1.5}px) translateY(${yAxis * 1.5}px)`
      if (bgTextRef.current) bgTextRef.current.style.transform = `rotate(-8deg) translateX(${xAxis * -1}px) translateY(${yAxis * -1}px)`
      if (halftoneRef.current) halftoneRef.current.style.transform = `rotate(-15deg) translateX(${xAxis * -0.5}px) translateY(${yAxis * -0.5}px)`
    }
    const el = containerRef.current
    el?.addEventListener('pointermove', onMove)
    return () => el?.removeEventListener('pointermove', onMove)
  }, [open])

  function pick(i, item, e) {
    setActiveIdx(i)
    if (!item.href) { e.preventDefault(); setFlash(i); blip(180, 0.12); setTimeout(() => setFlash(-1), 700) }
    else blip(520, 0.05)
  }

  const activeItem = items[activeIdx]
  const accent = ACCENTS[activeIdx % ACCENTS.length]

  return (
    <div ref={containerRef} className={`pmenu ${open ? 'open' : ''}`} role="dialog" aria-modal="true"
      aria-hidden={!open} aria-label="Menú de navegación" style={{ '--pmenu-accent': accent }}>
      <div className="pmenu-halftone" ref={halftoneRef} aria-hidden="true" />
      <div className="pmenu-silhouette" ref={silhouetteRef} aria-hidden="true" />
      <div className="pmenu-bgtext" ref={bgTextRef} aria-hidden="true">{activeItem?.key}</div>

      <div className="pmenu-ribbon"><span>MENU</span></div>

      <button className="pmenu-close" onClick={onClose} aria-label="Cerrar menú">
        <Icon name="close" size={16} /> ESC
      </button>

      <div className="pmenu-hud-visits">
        <span className="cur">¤</span> {String(visits).padStart(6, '0')}
      </div>
      <div className="pmenu-hud-status">
        <div className="dot" /><div className="line" /><div className="text">STATUS: ONLINE</div>
      </div>

      <nav className="pmenu-items" ref={menuRef} key={openCount}>
        {items.map((item, i) => (
          item.href ? (
            <a key={item.key} href={item.href} target="_blank" rel="noreferrer" className={`pmenu-item ${flash === i ? 'flash' : ''}`}
              onMouseEnter={() => { setActiveIdx(i); blip(340, 0.04) }} onFocus={() => setActiveIdx(i)}
              onClick={(e) => pick(i, item, e)}>
              <div className="pmenu-layer-1" /><div className="pmenu-layer-2" />
              <div className="pmenu-text"><ScatterText text={item.key.toUpperCase()} /></div>
              <span className="pmenu-subtext">abrir ↗</span>
            </a>
          ) : (
            <span key={item.key} tabIndex={0} className={`pmenu-item pending ${flash === i ? 'flash' : ''}`}
              onMouseEnter={() => { setActiveIdx(i); blip(340, 0.04) }} onFocus={() => setActiveIdx(i)}
              onClick={(e) => pick(i, item, e)}>
              <div className="pmenu-layer-1" /><div className="pmenu-layer-2" />
              <div className="pmenu-text"><ScatterText text={item.key.toUpperCase()} /></div>
              <span className="pmenu-subtext">{flash === i ? '¡próximamente!' : 'próximamente'}</span>
            </span>
          )
        ))}
      </nav>
    </div>
  )
}
