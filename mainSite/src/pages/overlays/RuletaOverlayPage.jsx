import { useCallback, useEffect, useRef, useState } from 'react'
import RuletaDeGemas from '../../features/ruleta/RuletaDeGemas'
import { premiosPorDefecto } from '../../features/ruleta/gemas'
import { almacen, adoptarConfigDeUrl } from '../../services/api/twitch/twitchStorage'
import { useTwitchEventSub } from '../../services/api/twitch/useTwitchEventSub'
import './ruleta-overlay.css'

// Tiempo que tarda la ruleta en bajar desde arriba. Tiene que coincidir con
// la transición de .ruleta-ov-carro en el CSS.
const ENTRADA_MS = 750

/**
 * Widget para el Browser Source de OBS. Fondo transparente.
 *
 * Al canjear la recompensa elegida, la ruleta baja desde el centro superior,
 * gira, canta el premio y se vuelve por arriba por el mismo camino. Los
 * canjes que lleguen mientras hay uno en curso se guardan en cola.
 */
export function RuletaOverlayPage() {
  // La config puede venir en la URL (OBS no comparte el localStorage del
  // navegador de escritorio), así que se adopta antes de leer nada.
  const [cfg] = useState(() => {
    adoptarConfigDeUrl()
    return {
      token: almacen.token,
      clientId: almacen.clientId,
      broadcasterId: almacen.broadcasterId,
      rewardId: almacen.rewardId,
      premios: almacen.premios.length ? almacen.premios : premiosPorDefecto(),
    }
  })

  const [visible, setVisible] = useState(false)
  const [girarSignal, setGirarSignal] = useState(0)
  const ocupado = useRef(false)
  const cola = useRef(0)
  const timers = useRef([])

  const apuntar = (id) => { timers.current.push(id); return id }
  useEffect(() => () => { timers.current.forEach(clearTimeout); timers.current = [] }, [])

  const atender = useCallback(() => {
    if (ocupado.current) return
    if (cola.current <= 0) return
    cola.current -= 1
    ocupado.current = true
    setVisible(true)
    // Se espera a que termine de bajar antes de lanzar el giro, para que la
    // entrada se vea entera y no empiece a girar en el aire.
    apuntar(setTimeout(() => setGirarSignal((n) => n + 1), ENTRADA_MS + 120))
  }, [])

  const alCanjear = useCallback(() => {
    cola.current += 1
    atender()
  }, [atender])

  const alTerminar = useCallback(() => {
    // Se va por donde vino, y solo entonces se atiende el siguiente canje.
    setVisible(false)
    apuntar(setTimeout(() => {
      ocupado.current = false
      atender()
    }, ENTRADA_MS + 100))
  }, [atender])

  const { estado, error } = useTwitchEventSub({
    token: cfg.token,
    clientId: cfg.clientId,
    broadcasterId: cfg.broadcasterId,
    rewardId: cfg.rewardId,
    onCanje: alCanjear,
  })

  // Prueba manual sin gastar puntos: ?demo=1 en la URL del widget.
  useEffect(() => {
    if (!new URLSearchParams(window.location.search).has('demo')) return
    const t = setTimeout(alCanjear, 600)
    return () => clearTimeout(t)
  }, [alCanjear])

  const faltaConfig = !cfg.token || !cfg.clientId || !cfg.broadcasterId

  return (
    <div className="ruleta-ov">
      <div className={`ruleta-ov-carro ${visible ? 'dentro' : ''}`}>
        <RuletaDeGemas
          girarSignal={girarSignal}
          premios={cfg.premios}
          onTerminar={alTerminar}
        />
      </div>

      {/* Solo se ve al abrir el widget en el navegador: en OBS conviene
          saber si conectó sin tener que abrir la consola. Se apaga con
          ?silencioso=1 si estorba en la escena. */}
      {!new URLSearchParams(window.location.search).has('silencioso') && (
        <div className={`ruleta-ov-estado est-${estado}`}>
          {faltaConfig
            ? 'Sin configurar · abre #config y pega aquí el enlace del widget'
            : error || {
              inactivo: 'inactivo',
              conectando: 'conectando con Twitch…',
              suscrito: 'escuchando canjes',
              reconectando: 'reconectando…',
              error: 'error',
            }[estado]}
        </div>
      )}
    </div>
  )
}
