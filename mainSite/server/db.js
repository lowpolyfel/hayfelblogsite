import { env } from './env.js'

// Acceso a la tabla por la API REST de Supabase, con la clave service_role.
// Sin cliente ni driver: son cuatro consultas y fetch basta.
//
// La tabla tiene RLS activado y ninguna política, así que esta clave es la
// única que la ve. Por eso no puede salir del servidor jamás.

const TABLA = 'ruleta_usuario'
const base = `${env.supabaseUrl.replace(/\/$/, '')}/rest/v1/${TABLA}`

const cabeceras = (extra = {}) => ({
  apikey: env.supabaseKey,
  Authorization: `Bearer ${env.supabaseKey}`,
  'Content-Type': 'application/json',
  ...extra,
})

async function pedir(url, init) {
  const r = await fetch(url, init)
  if (!r.ok) {
    const detalle = await r.text().catch(() => '')
    throw new Error(`Supabase ${r.status}: ${detalle.slice(0, 300)}`)
  }
  if (r.status === 204) return null
  const texto = await r.text()
  return texto ? JSON.parse(texto) : null
}

const uno = (filas) => (Array.isArray(filas) ? filas[0] ?? null : filas)

export async function buscarPorId(twitchUserId) {
  const url = `${base}?twitch_user_id=eq.${encodeURIComponent(twitchUserId)}&limit=1`
  return uno(await pedir(url, { headers: cabeceras() }))
}

// El widget de OBS solo conoce su clave: ni sesión ni cookies, porque el
// Browser Source no comparte nada con el navegador de escritorio.
export async function buscarPorWidgetKey(widgetKey) {
  const url = `${base}?widget_key=eq.${encodeURIComponent(widgetKey)}&limit=1`
  return uno(await pedir(url, { headers: cabeceras() }))
}

// Alta o actualización tras el login. Se conserva a propósito lo que ya
// estuviera configurado (recompensa, premios y clave del widget): volver a
// entrar no debe deshacer los ajustes ni invalidar la URL pegada en OBS.
export async function guardarSesion({ twitchUserId, login, displayName, refreshToken, scope }) {
  const filas = await pedir(base, {
    method: 'POST',
    headers: cabeceras({
      Prefer: 'resolution=merge-duplicates,return=representation',
    }),
    body: JSON.stringify([{
      twitch_user_id: twitchUserId,
      twitch_login: login,
      display_name: displayName,
      refresh_token: refreshToken,
      scope,
    }]),
  })
  return uno(filas)
}

// Twitch rota el refresh token al usarlo: si no se guarda el nuevo, el
// siguiente refresco falla y se acabó el "no volver a tocar OBS".
export async function guardarRefreshToken(twitchUserId, refreshToken) {
  await pedir(`${base}?twitch_user_id=eq.${encodeURIComponent(twitchUserId)}`, {
    method: 'PATCH',
    headers: cabeceras({ Prefer: 'return=minimal' }),
    body: JSON.stringify({ refresh_token: refreshToken }),
  })
}

export async function guardarConfig(twitchUserId, { rewardId, premios }) {
  const cambios = {}
  if (rewardId !== undefined) cambios.reward_id = rewardId || null
  if (premios !== undefined) cambios.premios = premios
  if (!Object.keys(cambios).length) return buscarPorId(twitchUserId)

  const filas = await pedir(`${base}?twitch_user_id=eq.${encodeURIComponent(twitchUserId)}`, {
    method: 'PATCH',
    headers: cabeceras({ Prefer: 'return=representation' }),
    body: JSON.stringify(cambios),
  })
  return uno(filas)
}

// Para cuando la URL del widget se haya enseñado sin querer: cambiarla
// invalida la vieja sin tocar la sesión.
export async function rotarWidgetKey(twitchUserId) {
  const filas = await pedir(`${base}?twitch_user_id=eq.${encodeURIComponent(twitchUserId)}`, {
    method: 'PATCH',
    headers: cabeceras({ Prefer: 'return=representation' }),
    body: JSON.stringify({ widget_key: crypto.randomUUID() }),
  })
  return uno(filas)
}

export async function borrarUsuario(twitchUserId) {
  await pedir(`${base}?twitch_user_id=eq.${encodeURIComponent(twitchUserId)}`, {
    method: 'DELETE',
    headers: cabeceras({ Prefer: 'return=minimal' }),
  })
}
