import { CLIENT_ID, SCOPE, TWITCH_AUTH_URL } from './twitchConfig'
import { almacen } from './twitchStorage'

// El sitio rutea por hash (#redes, #overlays...) y el Implicit Grant de
// Twitch devuelve el token TAMBIÉN en el hash (#access_token=...). Chocan:
// al volver de Twitch el router vería "#access_token=..." como si fuera una
// ruta desconocida y caería en la portada.
//
// Por eso el token se consume ANTES de que React monte y el hash se
// reescribe a #config, dejando la URL limpia y sin el token a la vista.

export function hayClientId(): boolean {
  return Boolean(CLIENT_ID)
}

// La URI de redirección no puede llevar fragmento (#) — Twitch lo prohíbe —
// así que siempre se vuelve a la raíz del sitio y desde ahí se reencamina.
export function uriDeRedireccion(): string {
  return `${window.location.origin}${window.location.pathname}`
}

export function urlDeAutorizacion(): string {
  const q = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: uriDeRedireccion(),
    response_type: 'token',
    scope: SCOPE,
    // Vuelve a pedir permiso cada vez: si no, cambiar de cuenta es imposible.
    force_verify: 'true',
  })
  return `${TWITCH_AUTH_URL}?${q}`
}

/**
 * Se llama una sola vez desde main.tsx, antes de renderizar.
 * Devuelve true si la URL venía de Twitch.
 */
export function consumirTokenDeLaUrl(): boolean {
  const bruto = window.location.hash.replace(/^#/, '')
  const vieneDeTwitch = /(^|&)access_token=/.test(bruto) || /(^|&)error=/.test(bruto)

  if (!vieneDeTwitch) {
    // Twitch no siempre es la única forma de volver: si el usuario recarga o
    // el hash se pierde por el camino, la marca de sessionStorage recuerda
    // que había una sesión de login en curso y devuelve a los ajustes en vez
    // de dejarlo tirado en la portada.
    if (almacen.volviendoDeLogin) {
      almacen.volviendoDeLogin = false
      if (!window.location.hash) {
        window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#config`)
        return true
      }
    }
    return false
  }

  almacen.volviendoDeLogin = false

  const p = new URLSearchParams(bruto)
  const token = p.get('access_token')
  if (token) almacen.token = token

  const err = p.get('error_description') || p.get('error')
  const destino = err ? `#config?error=${encodeURIComponent(err)}` : '#config'
  window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}${destino}`)
  return true
}
