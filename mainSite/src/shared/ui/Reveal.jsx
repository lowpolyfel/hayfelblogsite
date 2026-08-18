import { useEffect, useRef, useState } from 'react'
import './reveal.css'

const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Envoltorio genérico para animaciones "al entrar en vista" tipo página de
// producto de Apple: cada sección se observa por separado y se revela una
// vez (fade + subida) cuando cruza el viewport. `variant` cambia el efecto
// de entrada, `delay`/`duration` en ms. Respeta prefers-reduced-motion.
export function Reveal({ as: Tag = 'div', variant = 'up', delay = 0, duration, className = '', children, ...props }) {
  const ref = useRef(null)
  const [inView, setInView] = useState(reduced)

  useEffect(() => {
    if (reduced) return
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setInView(true); io.disconnect() }
    }, { threshold: 0.18, rootMargin: '0px 0px -8% 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const style = { transitionDelay: `${delay}ms`, ...(duration ? { transitionDuration: `${duration}ms` } : {}) }

  return (
    <Tag ref={ref} className={`reveal reveal-${variant} ${inView ? 'reveal-in' : ''} ${className}`} style={style} {...props}>
      {children}
    </Tag>
  )
}
