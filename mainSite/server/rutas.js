import express from 'express'
import { env } from './env.js'
import {
  borrarUsuario, buscarPorId, buscarPorWidgetKey,
  guardarConfig, guardarSesion, rotarWidgetKey,
} from './db.js'
import { abrirSesion, cerrarSesion, comprobarState, exigirSesion, ponerState } from './sesion.js'
import { tokenFresco, olvidarToken } from './tokens.js'
import { SCOPE, intercambiarCodigo, obtenerRecompensas, obtenerUsuario, urlDeAutorizacion } from './twitch.js'

export const rutas = express.Router()

const PREMIOS_POR_DEFECTO = [
  'Gema cian', 'Gema verde', 'Gema amarilla', 'Gema naranja',
  'Gema roja', 'Gema rosa', 'Gema morada', 'Gema azul',
]

// Envuelve un manejador asíncrono para que un fallo acabe en el manejador
// de errores en vez de tumbar el proceso.
const async_ = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

/* ============================= LOGIN ============================= */

rutas.get('/auth/login', (req, res) => {
  res.redirect(urlDeAutorizacion(ponerState(res)))
})

rutas.get('/auth/callback', async_(async (req, res) => {
  const { code, state, error, error_description: detalle } = req.query

  const alPanel = (msg) => res.redirect(`/ruleta/entrar?error=${encodeURIComponent(msg)}`)

  if (error) return alPanel(detalle || error)
  if (!code) return alPanel('Twitch no devolvió el código de autorización')
  // Sin esta comprobación, alguien podría hacerte completar un login que
  // empezó él, y acabar con su cuenta enlazada en tu navegador.
  if (!comprobarState(req, res, state)) return alPanel('La respuesta de Twitch no coincide con la petición')

  const tokens = await intercambiarCodigo(code)
  const usuario = await obtenerUsuario(tokens.access_token)

  // La aplicación está cerrada a un canal: si no, cualquiera con cuenta de
  // Twitch podría usarla y acabaríamos guardando sus tokens.
  if (env.canalPermitido && usuario.login.toLowerCase() !== env.canalPermitido) {
    return alPanel(`Esta ruleta es solo del canal ${env.canalPermitido}`)
  }

  await guardarSesion({
    twitchUserId: usuario.id,
    login: usuario.login,
    displayName: usuario.display_name || usuario.login,
    refreshToken: tokens.refresh_token,
    scope: Array.isArray(tokens.scope) ? tokens.scope.join(' ') : (tokens.scope || SCOPE),
  })
  olvidarToken(usuario.id)
  abrirSesion(res, usuario.id)
  res.redirect('/ruleta/panel')
}))

rutas.post('/auth/logout', (req, res) => {
  cerrarSesion(res)
  res.json({ ok: true })
})

/* ============================= SESIÓN ============================= */

// Con qué cuenta estoy. Es lo que hace que la segunda página ya salga
// iniciada sin volver a pasar por Twitch.
rutas.get('/me', async_(async (req, res) => {
  const id = req.twitchUserIdOpcional
  if (!id) return res.json({ sesion: false })
  const u = await buscarPorId(id)
  if (!u) return res.json({ sesion: false })
  res.json({
    sesion: true,
    login: u.twitch_login,
    displayName: u.display_name,
    rewardId: u.reward_id,
    premios: u.premios?.length === 8 ? u.premios : PREMIOS_POR_DEFECTO,
    widgetUrl: `${env.publicUrl}/ruleta/overlay?k=${u.widget_key}`,
  })
}))

/* =========================== RECOMPENSAS =========================== */

rutas.get('/rewards', exigirSesion, async_(async (req, res) => {
  const u = await buscarPorId(req.twitchUserId)
  if (!u) return res.status(401).json({ error: 'Sin sesión' })
  const token = await tokenFresco(u)
  res.json({ recompensas: await obtenerRecompensas(token, u.twitch_user_id) })
}))

/* ============================ CONFIG ============================ */

rutas.put('/config', exigirSesion, async_(async (req, res) => {
  const { rewardId, premios } = req.body ?? {}

  if (premios !== undefined) {
    const bien = Array.isArray(premios) && premios.length === 8
      && premios.every((p) => typeof p === 'string' && p.length <= 60)
    if (!bien) return res.status(400).json({ error: 'Los premios tienen que ser ocho textos de 60 caracteres o menos' })
  }
  if (rewardId !== undefined && rewardId !== null && typeof rewardId !== 'string') {
    return res.status(400).json({ error: 'rewardId inválido' })
  }

  const u = await guardarConfig(req.twitchUserId, { rewardId, premios })
  res.json({ rewardId: u?.reward_id ?? null, premios: u?.premios ?? PREMIOS_POR_DEFECTO })
}))

rutas.post('/widget-key/rotar', exigirSesion, async_(async (req, res) => {
  const u = await rotarWidgetKey(req.twitchUserId)
  res.json({ widgetUrl: `${env.publicUrl}/ruleta/overlay?k=${u.widget_key}` })
}))

rutas.delete('/cuenta', exigirSesion, async_(async (req, res) => {
  await borrarUsuario(req.twitchUserId)
  olvidarToken(req.twitchUserId)
  cerrarSesion(res)
  res.json({ ok: true })
}))

/* ============================ WIDGET ============================ */

// Lo que pide el Browser Source de OBS. No hay cookies ni sesión: OBS tiene
// su propio perfil de navegador. Se identifica con su clave y recibe un
// token de acceso recién hecho, con el que se conecta él mismo a EventSub.
//
// Aquí es donde se cumple lo de no volver a tocar OBS: la URL no cambia
// nunca y el token se renueva solo por detrás.
rutas.get('/widget/:clave', async_(async (req, res) => {
  const u = await buscarPorWidgetKey(req.params.clave)
  if (!u) return res.status(404).json({ error: 'Widget desconocido' })

  let token
  try {
    token = await tokenFresco(u)
  } catch {
    // El refresh token dejó de valer: el dueño tiene que volver a entrar.
    return res.status(409).json({ error: 'reautenticar', mensaje: 'Vuelve a entrar con Twitch en el panel' })
  }

  res.set('Cache-Control', 'no-store')
  res.json({
    accessToken: token,
    clientId: env.clientId,
    broadcasterId: u.twitch_user_id,
    rewardId: u.reward_id,
    premios: u.premios?.length === 8 ? u.premios : PREMIOS_POR_DEFECTO,
    // Cuándo volver a pedir. El widget se relee solo, sin recargar OBS.
    revalidarEnSegundos: 45 * 60,
  })
}))
