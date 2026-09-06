import { CLIENT_ID, EVENT_REDENCION, TWITCH_HELIX } from './twitchConfig'

export interface Recompensa {
  id: string
  title: string
  cost: number
  is_enabled: boolean
}

export interface Usuario {
  id: string
  login: string
  display_name: string
}

// Twitch responde 401 con un cuerpo que explica el motivo. Se conserva el
// estado para que quien llame distinga "token caducado" de "algo se rompió".
export class ErrorTwitch extends Error {
  status: number
  constructor(status: number, mensaje: string) {
    super(mensaje)
    this.name = 'ErrorTwitch'
    this.status = status
  }
}

async function helix<T>(ruta: string, token: string, init?: RequestInit): Promise<T> {
  const r = await fetch(`${TWITCH_HELIX}${ruta}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Client-Id': CLIENT_ID,
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })
  if (!r.ok) {
    let detalle = ''
    try {
      const cuerpo = await r.json()
      detalle = cuerpo?.message || ''
    } catch { /* respuesta sin JSON */ }
    throw new ErrorTwitch(r.status, detalle || `Twitch respondió ${r.status}`)
  }
  return r.status === 204 ? (undefined as T) : ((await r.json()) as T)
}

// Quién es el dueño del token. De aquí sale el broadcaster_id, así no hay
// que pedirle al usuario que lo busque a mano.
export async function obtenerUsuario(token: string): Promise<Usuario> {
  const r = await helix<{ data: Usuario[] }>('/users', token)
  const u = r.data?.[0]
  if (!u) throw new ErrorTwitch(404, 'El token no corresponde a ningún usuario')
  return u
}

// Devuelve todas las recompensas de puntos del canal, no solo las creadas
// por esta aplicación (only_manageable_rewards se queda en false).
export async function obtenerRecompensas(
  token: string, broadcasterId: string,
): Promise<Recompensa[]> {
  const r = await helix<{ data: Recompensa[] }>(
    `/channel_points/custom_rewards?broadcaster_id=${encodeURIComponent(broadcasterId)}`,
    token,
  )
  return r.data ?? []
}

// Suscripción al canje por transporte WebSocket. No se filtra por reward_id
// en la condición a propósito: así cambiar de recompensa en los ajustes no
// obliga a rehacer la suscripción, y el filtro se hace al recibir.
export async function suscribirARedenciones(
  token: string, broadcasterId: string, sessionId: string,
): Promise<void> {
  await helix('/eventsub/subscriptions', token, {
    method: 'POST',
    body: JSON.stringify({
      type: EVENT_REDENCION,
      version: '1',
      condition: { broadcaster_user_id: broadcasterId },
      transport: { method: 'websocket', session_id: sessionId },
    }),
  })
}
