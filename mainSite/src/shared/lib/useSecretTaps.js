import { useEffect, useRef } from 'react'

// Entrada a las secciones ocultas: N toques seguidos sobre un elemento. Si
// se deja de picar más de la ventana indicada la cuenta se reinicia, para
// que no se abran por acumular clicks sueltos a lo largo del rato.
//
// Devuelve el manejador que hay que colgar del onClick del elemento.
export function useSecretTaps(count, destino, ventana = 1500) {
  const toques = useRef(0)
  const timer = useRef(0)

  useEffect(() => () => clearTimeout(timer.current), [])

  return function tocar() {
    clearTimeout(timer.current)
    toques.current += 1
    if (toques.current >= count) {
      toques.current = 0
      window.location.hash = destino
      return
    }
    timer.current = setTimeout(() => { toques.current = 0 }, ventana)
  }
}
