import { SCOPE, TWITCH_AUTH_URL } from './twitchConfig'
import { almacen } from './twitchStorage'

// El sitio rutea por hash (#redes, #overlays...) y el Implicit Grant de
// Twitch devuelve el token TAMBIÉN en el hash (#access_token=...). Chocan:
// al volver de Twitch el router vería "#access_token=..." como si fuera una
// ruta. Por eso el token se consume ANTES de que React monte y el hash se
// reescribe a #config, dejando la URL limpia y sin el token a la vista.

export function urlDeAutorizacion(clientId: string): string {
  const redirect = `${window.location.origin}${window.location.pathname}`
  const q = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirect,
    response_type: 'token',
    scope: SCOPE,
    // Vuelve a pedir permiso cada vez: si no, cambiar de cuenta es imposible.
    force_verify: 'true',
  })
  return `${TWITCH_AUTH_URL}?${q}`
}

// La URI exacta que hay que registrar en la consola de Twitch. Tiene que
// coincidir carácter por carácter con la que se manda al autorizar.
export function uriDeRedireccion(): string {
  return `${window.location.origin}${window.location.pathname}`
}

// Se llama una sola vez, desde main.tsx, antes de renderizar.
export function consumirTokenDeLaUrl(): boolean {
  const bruto = window.location.hash.slice(1)
  if (!bruto.includes('access_token=') && !bruto.includes('error=')) return false

  const p = new URLSearchParams(bruto)
  const token = p.get('access_token')
  if (token) almacen.token = token

  // Deja la URL presentable y manda a los ajustes en cualquiera de los dos
  // casos (con token o con error), para poder mostrar el mensaje allí.
  const err = p.get('error_description') || p.get('error')
  const destino = err ? `#config?error=${encodeURIComponent(err)}` : '#config'
  window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}${destino}`)
  return true
}
