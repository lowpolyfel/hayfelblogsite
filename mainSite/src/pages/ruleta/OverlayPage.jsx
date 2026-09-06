import { useCallback, useEffect, useRef, useState } from 'react'
import RuletaDeGemas from '../../features/ruleta/RuletaDeGemas'
import { premiosPorDefecto } from '../../features/ruleta/gemas'
import { configDelWidget } from '../../services/api/ruleta'
import { useTwitchEventSub } from '../../services/api/twitch/useTwitchEventSub'
import './overlay.css'

// Tiempo que tarda la ruleta en bajar. Coincide con la transición del CSS.
const ENTRADA_MS = 750

/**
 * Página 4 de 4: el widget del Browser Source de OBS. Fondo transparente.
 *
 * Se identifica con la clave de la URL (?k=...), pide su configuración al
 * backend y recibe un token de Twitch recién hecho. Antes de que ese token
 * caduque vuelve a pedirlo solo, sin recargar nada: por eso el enlace se
 * pega una vez en OBS y no se toca nunca más.
 */
export function OverlayPage() {
  const clave = new URLSearchParams(window.location.search).get('k') || ''

  const [cfg, setCfg] = useState(null)
  const [fallo, setFallo] = useState('')
  const timers = useRef([])
  const apuntar = (id) => { timers.current.push(id); return id }
  useEffect(() => () => { timers.current.forEach(clearTimeout); timers.current = [] }, [])

  // Config y token, renovados antes de que caduquen.
  useEffect(() => {
    if (!clave) { setFallo('Falta la clave del widget en la URL'); return }
    let vivo = true
    let reloj

    const traer = async () => {
      try {
        const c = await configDelWidget(clave)
        if (!vivo) return
        setCfg(c)
        setFallo('')
        reloj = setTimeout(traer, Math.max(60, c.revalidarEnSegundos) * 1000)
      } catch (e) {
        if (!vivo) return
        setFallo(e?.status === 404
          ? 'Widget desconocido: el enlace cambió. Copia el nuevo desde los ajustes.'
          : e?.status === 409
            ? 'Hay que volver a entrar con Twitch en el panel.'
            : 'Sin conexión con el servidor. Reintentando…')
        // Reintento tranquilo: si el servidor está caído, ya volverá.
        reloj = setTimeout(traer, 30000)
      }
    }
    traer()
    return () => { vivo = false; clearTimeout(reloj) }
  }, [clave])

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
    rewardId: cfg?.rewardId ?? '',
    onCanje: alCanjear,
  })

  // Prueba sin gastar puntos: añade &demo=1 al enlace.
  useEffect(() => {
    if (!cfg || !new URLSearchParams(window.location.search).has('demo')) return
    const t = setTimeout(alCanjear, 600)
    return () => clearTimeout(t)
  }, [cfg, alCanjear])

  const silencioso = new URLSearchParams(window.location.search).has('silencioso')
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
          premios={cfg?.premios?.length === 8 ? cfg.premios : premiosPorDefecto()}
          onTerminar={alTerminar}
        />
      </div>

      {/* Sirve para saber de un vistazo si conectó, sin abrir la consola de
          OBS. Añade &silencioso=1 al enlace para esconderlo en directo. */}
      {!silencioso && <div className={`ov-estado est-${tono}`}>{leyenda}</div>}
    </div>
  )
}
