import { useCallback, useEffect, useRef, useState } from 'react'
import { prepararMensaje } from './moderacion'

// Lector de voz sobre speechSynthesis, que viene de serie en el navegador.
// Sin API de pago, sin clave y sin coste.
//
// Dos rarezas de esa API que hay que atender o no funciona:
//
//  1. Las voces cargan tarde. getVoices() devuelve una lista vacía en el
//     primer instante y hay que esperar al evento voiceschanged.
//  2. El navegador que lleva OBS dentro puede no traer ninguna voz. No es un
//     fallo del código: viene así compilado. Por eso se expone la lista, para
//     poder verlo en pantalla en vez de quedarse adivinando por qué no suena.

export function useVoces() {
  const [voces, setVoces] = useState([])
  useEffect(() => {
    if (!('speechSynthesis' in window)) return
    const leer = () => setVoces(window.speechSynthesis.getVoices() ?? [])
    leer()
    window.speechSynthesis.addEventListener('voiceschanged', leer)
    // Algunos navegadores no llegan a emitir el evento: se reintenta un par
    // de veces y se deja estar.
    const t1 = setTimeout(leer, 400)
    const t2 = setTimeout(leer, 1500)
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', leer)
      clearTimeout(t1); clearTimeout(t2)
    }
  }, [])
  return voces
}

/**
 * Cola de lectura. Los canjes seguidos se leen uno detrás de otro: si se
 * lanzaran a la vez el navegador los solapa y no se entiende ninguno.
 */
export function useLector(ajustes) {
  const voces = useVoces()
  const [hablando, setHablando] = useState(null)   // { usuario, texto }
  const [historial, setHistorial] = useState([])   // últimos, para el panel

  const cola = useRef([])
  const ocupado = useRef(false)
  const ajustesRef = useRef(ajustes)
  ajustesRef.current = ajustes
  const vocesRef = useRef(voces)
  vocesRef.current = voces

  const apuntar = useCallback((entrada) => {
    setHistorial((h) => [{ ...entrada, en: Date.now() }, ...h].slice(0, 8))
  }, [])

  const siguiente = useCallback(() => {
    if (ocupado.current) return
    const item = cola.current.shift()
    if (!item) { setHablando(null); return }

    const a = ajustesRef.current ?? {}
    const frase = a.leerNombre !== false ? `${item.usuario} dice: ${item.texto}` : item.texto

    const u = new SpeechSynthesisUtterance(frase)
    u.rate = Number(a.velocidad) || 1
    u.pitch = Number(a.tono) || 1
    u.volume = a.volumen === undefined ? 1 : Number(a.volumen)
    const elegida = vocesRef.current.find((v) => v.name === a.voz)
    if (elegida) { u.voice = elegida; u.lang = elegida.lang }

    ocupado.current = true
    setHablando(item)

    const acabar = () => {
      ocupado.current = false
      setHablando(null)
      siguiente()
    }
    u.onend = acabar
    // Si la voz falla a medias, la cola no puede quedarse colgada para siempre.
    u.onerror = acabar

    try {
      window.speechSynthesis.speak(u)
    } catch {
      acabar()
    }
  }, [])

  const encolar = useCallback(({ usuario, texto }) => {
    const r = prepararMensaje(texto, ajustesRef.current)
    if (!r.ok) {
      apuntar({ usuario, texto: String(texto ?? ''), descartado: r.motivo })
      return
    }
    apuntar({ usuario, texto: r.texto })
    cola.current.push({ usuario, texto: r.texto })
    siguiente()
  }, [apuntar, siguiente])

  // Botón de pánico: corta lo que se esté leyendo y vacía lo que espera.
  const callar = useCallback(() => {
    cola.current = []
    try { window.speechSynthesis.cancel() } catch { /* da igual */ }
    ocupado.current = false
    setHablando(null)
  }, [])

  // Saltar solo lo actual y seguir con la cola.
  const saltar = useCallback(() => {
    try { window.speechSynthesis.cancel() } catch { /* da igual */ }
    // cancel() dispara onend/onerror, y de ahí sale el siguiente.
  }, [])

  useEffect(() => () => { try { window.speechSynthesis?.cancel() } catch { /* al desmontar */ } }, [])

  return {
    voces,
    hablando,
    historial,
    enCola: cola.current.length,
    encolar,
    callar,
    saltar,
    soportado: typeof window !== 'undefined' && 'speechSynthesis' in window,
  }
}
