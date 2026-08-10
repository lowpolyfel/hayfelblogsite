import { useRef, useState } from 'react'
import { paperPositions, paperSnippets } from '../data/decorations'

function Sticker({ children, x, y, className = '' }) {
  const [position, setPosition] = useState({ x, y })
  const pointerOffset = useRef({ x: 0, y: 0 })
  const dragging = useRef(false)
  return (
    <div className={`stick ${className}`} style={{ left: position.x, top: position.y }}
      onPointerDown={(event) => {
        dragging.current = true
        event.currentTarget.setPointerCapture(event.pointerId)
        const bounds = event.currentTarget.getBoundingClientRect()
        pointerOffset.current = { x: event.clientX - bounds.left, y: event.clientY - bounds.top }
      }}
      onPointerMove={(event) => {
        if (!dragging.current) return
        const parent = event.currentTarget.offsetParent?.getBoundingClientRect() || { left: 0, top: 0 }
        setPosition({ x: event.clientX - pointerOffset.current.x - parent.left, y: event.clientY - pointerOffset.current.y - parent.top })
      }}
      onPointerUp={() => { dragging.current = false }}>
      {children}
    </div>
  )
}

export function FloatingPapers() {
  return <div className="papers-bg" aria-hidden="true">
    {paperPositions.map((position, index) => {
      const snippet = paperSnippets[index % paperSnippets.length]
      return <div key={snippet.key} className="paperfloat" style={{
        left: position.x, top: position.y, '--pr': `${position.rotation}deg`,
        animationDuration: `${position.duration}s`, animationDelay: `${position.delay}s`,
      }}><b>{snippet.key}</b>{snippet.text}</div>
    })}
  </div>
}

export function DraggableStickers() {
  return <>
    <Sticker x={14} y={250}><div className="star" /></Sticker>
    <Sticker x={2} y={640}><div className="boom">POW!</div></Sticker>
    <Sticker x={24} y={920}><div className="note"><b>NOTA AL MARGEN</b>arrástrame. sí, en serio, agárrame con el mouse.</div></Sticker>
  </>
}
