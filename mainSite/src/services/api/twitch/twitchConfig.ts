// Constantes de la integración con Twitch. Todo el flujo es de cliente: no
// hay servidor, así que se usa Implicit Grant y el token vive en el
// navegador (y en la URL del widget de OBS, ver twitchStorage).

// ---------------------------------------------------------------------------
// EL ÚNICO VALOR QUE HAY QUE TOCAR A MANO, Y UNA SOLA VEZ.
//
// Twitch no permite iniciar sesión sin una aplicación registrada: el
// client_id es obligatorio en su OAuth, no hay forma de saltárselo. Lo que
// sí se puede es que no lo pida la interfaz, y eso es lo que hace esto.
//
// Cómo se rellena, una vez y para siempre:
//   1. Entra en https://dev.twitch.tv/console/apps y crea una aplicación
//   2. Tipo: Public
//   3. URL de redirección: la que muestra la página de ajustes (#config)
//   4. Copia el Client ID y pégalo abajo, o ponlo en un archivo .env como
//      VITE_TWITCH_CLIENT_ID=xxxxxxxx (mejor, así no viaja en el repositorio)
//
// El Client ID no es un secreto: va a la vista en cualquier aplicación de
// navegador y Twitch lo da por hecho. El que no se comparte es el token.
const CLIENT_ID_FIJO = ''

export const CLIENT_ID: string =
  (import.meta.env?.VITE_TWITCH_CLIENT_ID as string | undefined) || CLIENT_ID_FIJO
// ---------------------------------------------------------------------------

export const TWITCH_AUTH_URL = 'https://id.twitch.tv/oauth2/authorize'
export const TWITCH_HELIX = 'https://api.twitch.tv/helix'
export const EVENTSUB_WS = 'wss://eventsub.wss.twitch.tv/ws'

// Único permiso que hace falta para leer los canjes de puntos de canal.
export const SCOPE = 'channel:read:redemptions'

export const EVENT_REDENCION = 'channel.channel_points_custom_reward_redemption.add'

// Claves de localStorage. Con prefijo para no chocar con nada más del sitio.
export const K = {
  token: 'hayfel.twitch.token',
  broadcasterId: 'hayfel.twitch.broadcasterId',
  broadcasterLogin: 'hayfel.twitch.broadcasterLogin',
  rewardId: 'hayfel.twitch.rewardId',
  premios: 'hayfel.ruleta.premios',
} as const

// La misma clave, abreviada, para viajar en la URL del widget. Hace falta
// porque OBS no comparte el localStorage con el navegador de escritorio.
export const PARAM = {
  token: 't',
  broadcasterId: 'b',
  rewardId: 'r',
  premios: 'p',
} as const
