import { useEffect, useRef, useState } from 'react'
import './hiddenTools.css'

// Barra de salida de las secciones ocultas. Arranca invisible, aparece al
// mover el ratón y se esconde a los cinco segundos sin movimiento. En OBS
// (Browser Source) no hay puntero, así que nunca sale en la transmisión.
export function HiddenTools({ links }) {
  const [visible, setVisible] = useState(false)
  const timer = useRef(0)

  useEffect(() => {
    const despertar = () => {
      setVisible(true)
      clearTimeout(timer.current)
      timer.current = setTimeout(() => setVisible(false), 5000)
    }
    window.addEventListener('mousemove', despertar)
    return () => {
      window.removeEventListener('mousemove', despertar)
      clearTimeout(timer.current)
    }
  }, [])

  return (
    <nav className={`hidden-tools ${visible ? 'on' : ''}`}>
      {links.map((l) => <a key={l.href + l.label} href={l.href}>{l.label}</a>)}
    </nav>
  )
}
