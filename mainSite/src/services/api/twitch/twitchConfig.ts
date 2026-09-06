// Constantes de la integración con Twitch. Todo el flujo es de cliente: no
// hay servidor, así que se usa Implicit Grant y el token vive en el
// navegador (y en la URL del widget de OBS, ver twitchStorage).

export const TWITCH_AUTH_URL = 'https://id.twitch.tv/oauth2/authorize'
export const TWITCH_HELIX = 'https://api.twitch.tv/helix'
export const EVENTSUB_WS = 'wss://eventsub.wss.twitch.tv/ws'

// Único permiso que hace falta para leer los canjes de puntos de canal.
export const SCOPE = 'channel:read:redemptions'

export const EVENT_REDENCION = 'channel.channel_points_custom_reward_redemption.add'

// Claves de localStorage. Con prefijo para no chocar con nada más del sitio.
export const K = {
  clientId: 'hayfel.twitch.clientId',
  token: 'hayfel.twitch.token',
  broadcasterId: 'hayfel.twitch.broadcasterId',
  broadcasterLogin: 'hayfel.twitch.broadcasterLogin',
  rewardId: 'hayfel.twitch.rewardId',
  premios: 'hayfel.ruleta.premios',
} as const

// La misma clave, abreviada, para viajar en la URL del widget. Hace falta
// porque OBS no comparte el localStorage con el navegador de escritorio.
export const PARAM = {
  clientId: 'c',
  token: 't',
  broadcasterId: 'b',
  rewardId: 'r',
  premios: 'p',
} as const
