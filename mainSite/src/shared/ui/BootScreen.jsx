import { useEffect, useState } from 'react'
import './boot-screen.css'

// La pantalla de carga del sitio anterior, extraída para reusarse tal cual en
// la home actual: logo + barra que se llena a saltos + la línea de texto que
// va cambiando. Avisa con `onDone` cuando termina, para que la página sepa
// cuándo arrancar lo suyo.
export function BootScreen({ lines, onDone }) {
  const [progress, setProgress] = useState(0)
  const [done, setDone] = useState(false)

  useEffect(() => {
    const t = setInterval(() => {
      setProgress((p) => {
        const n = Math.min(100, p + 9 + Math.random() * 14)
        if (n >= 100) {
          clearInterval(t)
          setTimeout(() => { setDone(true); onDone?.() }, 420)
        }
        return n
      })
    }, 160)
    return () => clearInterval(t)
  }, [onDone])

  return (
    <div className={`boots ${done ? 'boots-done' : ''}`} role="status" aria-live="polite">
      <div className="boots-logo">HAYFEL</div>
      <div className="boots-bar"><div className="boots-fill" style={{ width: `${progress}%` }} /></div>
      <small className="boots-line">{lines[Math.min(lines.length - 1, Math.floor(progress / (100 / lines.length)))]}</small>
    </div>
  )
}
