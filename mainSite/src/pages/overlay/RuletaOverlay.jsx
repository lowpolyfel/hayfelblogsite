import { useCallback, useEffect, useRef, useState } from 'react'
import RuletaDeGemas from '../../features/ruleta/RuletaDeGemas'
import { premiosPorDefecto } from '../../features/ruleta/gemas'
import { useTwitchEventSub } from '../../services/api/twitch/useTwitchEventSub'
import { bandera, useWidget } from './useWidget'
import './overlay.css'

// Tiempo que tarda la ruleta en bajar. Coincide con la transición del CSS.
const ENTRADA_MS = 750

/**
 * Widget de la ruleta para el Browser Source de OBS. Fondo transparente.
 *
 * Se identifica con la clave de la URL (?k=...), pide su configuración al
 * backend y recibe un token de Twitch recién hecho. Antes de que ese token
 * caduque vuelve a pedirlo solo, sin recargar nada: por eso el enlace se
 * pega una vez en OBS y no se toca nunca más.
 */
export function RuletaOverlay() {
  const { cfg, fallo } = useWidget()

  const timers = useRef([])
  const apuntar = (id) => { timers.current.push(id); return id }
  useEffect(() => () => { timers.current.forEach(clearTimeout); timers.current = [] }, [])

  /* ---------- entrada, giro y salida ---------- */
  const [visible, setVisible] = useState(false)
  const [girarSignal, setGirarSignal] = useState(0)
  const ocupado = useRef(false)
  const cola = useRef(0)

  const atender = useCallback(() => {
    if (ocupado.current || cola.current <= 0) return
    cola.current -= 1
    ocupado.current = true
    setVisible(true)
    // Se espera a que acabe de bajar: si no, empezaría a girar en el aire.
    apuntar(setTimeout(() => setGirarSignal((n) => n + 1), ENTRADA_MS + 120))
  }, [])

  const alCanjear = useCallback(() => { cola.current += 1; atender() }, [atender])

  const alTerminar = useCallback(() => {
    setVisible(false) // se va por donde vino
    apuntar(setTimeout(() => { ocupado.current = false; atender() }, ENTRADA_MS + 100))
  }, [atender])

  const { estado, error } = useTwitchEventSub({
    token: cfg?.accessToken ?? '',
    clientId: cfg?.clientId ?? '',
    broadcasterId: cfg?.broadcasterId ?? '',
    rewardId: cfg?.ruleta?.rewardId ?? '',
    onCanje: alCanjear,
  })

  // Prueba sin gastar puntos: añade &demo=1 al enlace.
  useEffect(() => {
    if (!cfg || !bandera('demo')) return
    const t = setTimeout(alCanjear, 600)
    return () => clearTimeout(t)
  }, [cfg, alCanjear])

  const silencioso = bandera('silencioso')
  const leyenda = fallo || error || {
    inactivo: 'esperando configuración…',
    conectando: 'conectando con Twitch…',
    suscrito: 'escuchando canjes',
    reconectando: 'reconectando…',
    error: 'error',
  }[estado]
  const tono = fallo || error ? 'error' : estado

  return (
    <div className="ov-ruleta">
      <div className={`ov-carro ${visible ? 'dentro' : ''}`}>
        <RuletaDeGemas
          girarSignal={girarSignal}
          premios={cfg?.ruleta?.premios?.length === 8 ? cfg.ruleta.premios : premiosPorDefecto()}
          onTerminar={alTerminar}
        />
      </div>

      {/* Sirve para saber de un vistazo si conectó, sin abrir la consola de
          OBS. Añade &silencioso=1 al enlace para esconderlo en directo. */}
      {!silencioso && <div className={`ov-estado est-${tono}`}>{leyenda}</div>}
    </div>
  )
}
