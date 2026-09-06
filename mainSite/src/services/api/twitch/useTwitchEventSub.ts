import { useCallback, useEffect, useRef, useState } from 'react'
const EVENTSUB_WS = 'wss://eventsub.wss.twitch.tv/ws'
const EVENT_REDENCION = 'channel.channel_points_custom_reward_redemption.add'

// Suscripción por transporte WebSocket. El token lo sirve nuestro backend,
// recién refrescado, así que aquí no hay nada que renovar.
async function suscribirARedenciones(
  token: string, clientId: string, broadcasterId: string, sessionId: string,
): Promise<void> {
  const r = await fetch('https://api.twitch.tv/helix/eventsub/subscriptions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Client-Id': clientId,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type: EVENT_REDENCION,
      version: '1',
      condition: { broadcaster_user_id: broadcasterId },
      transport: { method: 'websocket', session_id: sessionId },
    }),
  })
  if (!r.ok) {
    const cuerpo: any = await r.json().catch(() => ({}))
    const e: any = new Error(cuerpo?.message || `Twitch respondió ${r.status}`)
    e.status = r.status
    throw e
  }
}

export type EstadoEventSub = 'inactivo' | 'conectando' | 'suscrito' | 'reconectando' | 'error'

export interface Canje {
  id: string
  rewardId: string
  rewardTitle: string
  usuario: string
  input: string
}

interface Opciones {
  token: string
  clientId: string
  broadcasterId: string
  /**
   * Solo se avisa de los canjes de esta recompensa.
   *
   * Vacío = NINGUNA, no "todas". Cada widget escucha lo mismo de Twitch y se
   * queda con lo suyo, así que aceptar todo cuando no hay recompensa
   * asignada hacía que un widget sin configurar reaccionara a los canjes de
   * los demás: se mandaba un mensaje de voz y giraba la ruleta.
   */
  rewardId?: string
  onCanje: (canje: Canje) => void
}

const RECONEXION_MAX = 30000

/**
 * Conexión a EventSub por WebSocket, sin servidor.
 *
 * Ciclo: se abre el socket, Twitch manda `session_welcome` con el id de
 * sesión, y con ese id se hace el POST de suscripción. A partir de ahí los
 * canjes llegan como mensajes `notification`.
 *
 * Twitch cierra la sesión si no se suscribe nada en ~10 s, y manda
 * `session_reconnect` cuando quiere mover la conexión: ese caso se atiende
 * conectando a la URL que indica sin rehacer la suscripción.
 */
export function useTwitchEventSub({ token, clientId, broadcasterId, rewardId, onCanje }: Opciones) {
  const [estado, setEstado] = useState<EstadoEventSub>('inactivo')
  const [error, setError] = useState('')

  const wsRef = useRef<WebSocket | null>(null)
  const reintentoRef = useRef<number>(0)
  const timerRef = useRef<number | undefined>(undefined)
  const cerradoRef = useRef(false)

  // En refs para que cambiar de recompensa o de callback no reabra el socket.
  const onCanjeRef = useRef(onCanje)
  onCanjeRef.current = onCanje
  const rewardRef = useRef(rewardId)
  rewardRef.current = rewardId

  const conectar = useCallback((url: string, esReconexion: boolean) => {
    if (cerradoRef.current) return
    setEstado(esReconexion ? 'reconectando' : 'conectando')

    let ws: WebSocket
    try {
      ws = new WebSocket(url)
    } catch (e) {
      setEstado('error')
      setError(e instanceof Error ? e.message : 'No se pudo abrir el WebSocket')
      return
    }
    wsRef.current = ws

    ws.onmessage = async (ev) => {
      let msg: any
      try { msg = JSON.parse(ev.data) } catch { return }
      const tipo = msg?.metadata?.message_type

      if (tipo === 'session_welcome') {
        const sessionId = msg.payload?.session?.id
        if (!sessionId) return
        // En una reconexión ordenada la suscripción se conserva: repetir el
        // POST daría 409 y dejaría el estado en error sin motivo.
        if (esReconexion) { setEstado('suscrito'); reintentoRef.current = 0; return }
        try {
          await suscribirARedenciones(token, clientId, broadcasterId, sessionId)
          setEstado('suscrito')
          setError('')
          reintentoRef.current = 0
        } catch (e: any) {
          setEstado('error')
          setError(e?.status === 401
            ? 'El token no vale. Vuelve a entrar con Twitch en el panel.'
            : e?.message || 'No se pudo crear la suscripción')
          cerradoRef.current = true // sin suscripción no hay nada que reintentar
          ws.close()
        }
        return
      }

      if (tipo === 'session_reconnect') {
        const nueva = msg.payload?.session?.reconnect_url
        if (nueva) {
          const viejo = wsRef.current
          conectar(nueva, true)
          viejo?.close()
        }
        return
      }

      if (tipo === 'revocation') {
        setEstado('error')
        setError('Twitch revocó la suscripción (¿se retiró el permiso?)')
        return
      }

      if (tipo === 'notification') {
        if (msg.payload?.subscription?.type !== EVENT_REDENCION) return
        const e = msg.payload.event
        const filtro = rewardRef.current
        // Sin recompensa asignada no hay nada que hacer, y desde luego no
        // atender la de otro widget.
        if (!filtro) return
        if (e?.reward?.id !== filtro) return
        onCanjeRef.current({
          id: e?.id ?? '',
          rewardId: e?.reward?.id ?? '',
          rewardTitle: e?.reward?.title ?? '',
          usuario: e?.user_name ?? e?.user_login ?? '',
          input: e?.user_input ?? '',
        })
      }
    }

    ws.onerror = () => {
      // El error siempre viene seguido de onclose: allí se reintenta.
      if (!cerradoRef.current) setError('Se perdió la conexión con Twitch')
    }

    ws.onclose = () => {
      if (cerradoRef.current) return
      if (wsRef.current !== ws) return // cierre del socket viejo tras reconectar
      // Espera creciente con algo de azar, para no golpear a Twitch en bucle.
      const espera = Math.min(1000 * 2 ** reintentoRef.current, RECONEXION_MAX)
      reintentoRef.current += 1
      setEstado('reconectando')
      timerRef.current = window.setTimeout(() => conectar(EVENTSUB_WS, false), espera + Math.random() * 500)
    }
  }, [token, clientId, broadcasterId])

  useEffect(() => {
    if (!token || !clientId || !broadcasterId) {
      setEstado('inactivo')
      return
    }
    cerradoRef.current = false
    reintentoRef.current = 0
    conectar(EVENTSUB_WS, false)

    return () => {
      cerradoRef.current = true
      clearTimeout(timerRef.current)
      wsRef.current?.close()
      wsRef.current = null
    }
  }, [token, clientId, broadcasterId, conectar])

  return { estado, error }
}
