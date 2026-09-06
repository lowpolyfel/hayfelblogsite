import { env, REDIRECT_URI } from './env.js'

// Se pueden apuntar a otro sitio para poder probar el servidor sin tocar
// Twitch de verdad. En producción no se definen y valen las de siempre.
const ID = process.env.TWITCH_ID_URL || 'https://id.twitch.tv/oauth2'
const HELIX = process.env.TWITCH_HELIX_URL || 'https://api.twitch.tv/helix'

export const SCOPE = 'channel:read:redemptions'

export class ErrorTwitch extends Error {
  constructor(status, mensaje) {
    super(mensaje)
    this.name = 'ErrorTwitch'
    this.status = status
  }
}

// URL a la que se manda al usuario para que autorice. `state` viaja de ida
// y vuelta y sirve para comprobar que la respuesta es de la petición que
// hicimos nosotros y no de una fabricada por otro (CSRF).
export function urlDeAutorizacion(state) {
  const q = new URLSearchParams({
    client_id: env.clientId,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: SCOPE,
    state,
    force_verify: 'true',
  })
  return `${ID}/authorize?${q}`
}

async function pedirToken(cuerpo) {
  const r = await fetch(`${ID}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(cuerpo),
  })
  const datos = await r.json().catch(() => ({}))
  if (!r.ok) throw new ErrorTwitch(r.status, datos.message || `Twitch respondió ${r.status}`)
  return datos // { access_token, refresh_token, expires_in, scope, token_type }
}

// Primer paso tras el login: el código de un solo uso se cambia por un par
// de tokens. El refresh_token es el que hay que guardar.
export function intercambiarCodigo(code) {
  return pedirToken({
    client_id: env.clientId,
    client_secret: env.clientSecret,
    code,
    grant_type: 'authorization_code',
    redirect_uri: REDIRECT_URI,
  })
}

// Esto es lo que evita volver a tocar OBS: con el refresh_token guardado se
// consiguen tokens de acceso nuevos sin que nadie inicie sesión otra vez.
// Twitch puede devolver un refresh_token distinto: hay que guardarlo.
export function refrescar(refreshToken) {
  return pedirToken({
    client_id: env.clientId,
    client_secret: env.clientSecret,
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  })
}

async function helix(ruta, accessToken) {
  const r = await fetch(`${HELIX}${ruta}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Client-Id': env.clientId,
    },
  })
  const datos = await r.json().catch(() => ({}))
  if (!r.ok) throw new ErrorTwitch(r.status, datos.message || `Twitch respondió ${r.status}`)
  return datos
}

export async function obtenerUsuario(accessToken) {
  const { data } = await helix('/users', accessToken)
  const u = data?.[0]
  if (!u) throw new ErrorTwitch(404, 'El token no corresponde a ningún usuario')
  return u
}

// Todas las recompensas del canal, no solo las creadas por esta aplicación.
export async function obtenerRecompensas(accessToken, broadcasterId) {
  const { data } = await helix(
    `/channel_points/custom_rewards?broadcaster_id=${encodeURIComponent(broadcasterId)}`,
    accessToken,
  )
  return (data ?? []).map((r) => ({
    id: r.id,
    title: r.title,
    cost: r.cost,
    is_enabled: r.is_enabled,
  }))
}
