import { memo, useEffect, useRef, useState } from 'react'
import { Icon } from '../assets/icons/Icon'
import { Starfield } from '../assets/patterns/Starfield'
import './persona-menu.css'

// Letras dispersas al azar que se "enderezan" al hacer hover. Memoizado:
// `text` no cambia entre hovers, así que no hay que recalcular el jitter de
// los ítems cada vez que activeIdx cambia en otro lado.
const ScatterText = memo(function ScatterText({ text }) {
  const chars = [...text].map((ch, i) => {
    const rot = (Math.random() * 16) - 8
    const scale = 0.9 + Math.random() * 0.2
    const ty = (Math.random() * 6) - 3
    return <span key={i} style={{ transform: `rotate(${rot}deg) scale(${scale}) translateY(${ty}px)` }}>{ch === ' ' ? ' ' : ch}</span>
  })
  return <>{chars}</>
})

// Un color de acento distinto por ítem — el lavado de color sobre el fondo
// de estrellas cambia de paleta según lo que esté en foco.
const ACCENTS = ['#c8102e', '#7b3ff2', '#00b0c8', '#c89010', '#0f9e6e']

// Una posición/rotación distinta por ítem para el texto gigante de fondo.
const BG_POSITIONS = [
  { top: 'auto', bottom: '0%', left: 'auto', right: '0%', align: 'right', rot: -8 },
  { top: '2%', bottom: 'auto', left: '-2%', right: 'auto', align: 'left', rot: -6 },
  { top: '30%', bottom: 'auto', left: 'auto', right: '-4%', align: 'right', rot: 6 },
  { top: 'auto', bottom: '2%', left: '-4%', right: 'auto', align: 'left', rot: 8 },
  { top: '4%', bottom: 'auto', left: 'auto', right: '10%', align: 'right', rot: -5 },
]

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
  const [settledAccent, setSettledAccent] = useState(ACCENTS[0])
  const [wipeOrigin, setWipeOrigin] = useState({ x: '50%', y: '50%' })
  const activeIdxRef = useRef(0)
  const bgRotRef = useRef(BG_POSITIONS[0].rot)
  const containerRef = useRef(null)
  const menuRef = useRef(null)
  const slabRef = useRef(null)
  const bgTextRef = useRef(null)

  activeIdxRef.current = activeIdx
  bgRotRef.current = BG_POSITIONS[activeIdx % BG_POSITIONS.length].rot

  useEffect(() => {
    if (!open) return
    setOpenCount((n) => n + 1)
    setActiveIdx(0)
    document.body.style.overflow = 'hidden'
    blip(220, 0.09)
    return () => { document.body.style.overflow = '' }
  }, [open])

  function activate(i, e) {
    setActiveIdx(i)
    let x = '50%', y = '50%'
    if (e && typeof e.clientX === 'number' && (e.clientX || e.clientY)) {
      x = (e.clientX / window.innerWidth * 100).toFixed(1) + '%'
      y = (e.clientY / window.innerHeight * 100).toFixed(1) + '%'
    } else if (e?.currentTarget?.getBoundingClientRect) {
      const r = e.currentTarget.getBoundingClientRect()
      x = ((r.left + r.width / 2) / window.innerWidth * 100).toFixed(1) + '%'
      y = ((r.top + r.height / 2) / window.innerHeight * 100).toFixed(1) + '%'
    }
    setWipeOrigin({ x, y })
  }

  // Sin `activeIdx` en las dependencias a propósito: si no, este listener se
  // desmonta y remonta en cada hover. Lee el valor actual desde el ref.
  useEffect(() => {
    if (!open) return
    function onKey(e) {
      if (e.key === 'Escape') { onClose(); return }
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); activate((activeIdxRef.current + 1) % items.length); blip(340, 0.04) }
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); activate((activeIdxRef.current - 1 + items.length) % items.length); blip(340, 0.04) }
      if (e.key === 'Enter') {
        const it = items[activeIdxRef.current]
        if (it && !it.href) { e.preventDefault(); setFlash(activeIdxRef.current); setTimeout(() => setFlash(-1), 700) }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, items, onClose])

  useEffect(() => {
    if (!open || !window.matchMedia('(pointer: fine)').matches) return
    function onMove(e) {
      const xAxis = (window.innerWidth / 2 - e.pageX) / 25
      const yAxis = (window.innerHeight / 2 - e.pageY) / 25
      if (menuRef.current) menuRef.current.style.transform = `rotateY(${-xAxis}deg) rotateX(${yAxis}deg) translateZ(10px)`
      if (slabRef.current) slabRef.current.style.transform = `translateX(${xAxis * 1.2}px) translateY(${yAxis * 1.2}px)`
      if (bgTextRef.current) bgTextRef.current.style.transform = `rotate(${bgRotRef.current}deg) translateX(${xAxis * -1}px) translateY(${yAxis * -1}px)`
    }
    const el = containerRef.current
    el?.addEventListener('pointermove', onMove)
    return () => el?.removeEventListener('pointermove', onMove)
  }, [open])

  function pick(i, item, e) {
    activate(i, e)
    if (!item.href) { e.preventDefault(); setFlash(i); blip(180, 0.12); setTimeout(() => setFlash(-1), 700) }
    else { blip(520, 0.05); if (item.internal) onClose() }
  }

  const activeItem = items[activeIdx]
  const accent = ACCENTS[activeIdx % ACCENTS.length]
  const pos = BG_POSITIONS[activeIdx % BG_POSITIONS.length]

  return (
    <div ref={containerRef} className={`pmenu ${open ? 'open' : ''}`} role="dialog" aria-modal="true"
      aria-hidden={!open} aria-label="Menú de navegación">

      {/* El mismo fondo de estrellas del sitio; los lavados de color van
          encima en semitransparente para que se sigan viendo. */}
      <Starfield className="pmenu-stars" variant={0} red={settledAccent} paused={!open} />

      <div className="pmenu-basecolor" style={{ background: settledAccent }} aria-hidden="true" />
      <div key={activeIdx} className="pmenu-wipe" aria-hidden="true"
        style={{ background: accent, '--wx': wipeOrigin.x, '--wy': wipeOrigin.y }}
        onAnimationEnd={() => setSettledAccent(accent)} />

      {/* Panel de papel roto: rectángulo regular con el filo izquierdo rasgado */}
      <div className="pmenu-slab" ref={slabRef} aria-hidden="true">
        <span className="pmenu-slab-base" />
        <span className="pmenu-slab-top" />
      </div>

      <div key={`t${activeIdx}`} className="pmenu-bgtext" ref={bgTextRef} aria-hidden="true"
        style={{ top: pos.top, bottom: pos.bottom, left: pos.left, right: pos.right, textAlign: pos.align, '--bgrot': `${pos.rot}deg` }}>
        {activeItem?.key}
      </div>

      <div className="pmenu-ribbon"><span>MENU</span></div>

      <button className="pmenu-close" onClick={onClose} aria-label="Cerrar menú">
        <Icon name="close" size={16} /> ESC
      </button>

      {/* Ficha lateral tipo pantalla de pausa: el ítem enfocado se lee aquí */}
      <div className="pmenu-info">
        <span className="eyebrow">HAYFEL</span>
        <span className="sub">navegación</span>
        <span className="big">{activeItem?.key?.toUpperCase()}</span>
        <span className="foot">
          {activeItem?.internal ? 'IR A LA PÁGINA' : activeItem?.href ? 'ABRE EN PESTAÑA NUEVA' : 'PRÓXIMAMENTE'}
        </span>
        <span className="count">¤ {String(visits).padStart(6, '0')} VISITAS</span>
      </div>

      <nav className="pmenu-items" ref={menuRef} key={openCount}>
        {items.map((item, i) => {
          const body = (
            <>
              <div className="pmenu-layer-1" /><div className="pmenu-layer-2" />
              <div className="pmenu-text"><ScatterText text={item.key.toUpperCase()} /></div>
              <span className="pmenu-subtext">
                {item.internal ? 'entrar →' : item.href ? 'abrir ↗' : (flash === i ? '¡próximamente!' : 'próximamente')}
              </span>
            </>
          )
          const shared = {
            className: `pmenu-item ${item.internal ? 'internal' : ''} ${flash === i ? 'flash' : ''}`,
            style: { '--item-accent': ACCENTS[i % ACCENTS.length] },
            onMouseEnter: (e) => { activate(i, e); blip(340, 0.04) },
            onFocus: (e) => activate(i, e),
            onClick: (e) => pick(i, item, e),
          }
          if (item.href && item.internal) return <a key={item.key} {...shared} href={item.href}>{body}</a>
          if (item.href) return <a key={item.key} {...shared} href={item.href} target="_blank" rel="noreferrer">{body}</a>
          return <span key={item.key} {...shared} tabIndex={0}>{body}</span>
        })}
      </nav>
    </div>
  )
}
