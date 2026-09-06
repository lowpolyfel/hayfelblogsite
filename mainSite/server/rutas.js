import express from 'express'
import { env } from './env.js'
import {
  borrarUsuario, buscarPorId, buscarPorWidgetKey,
  guardarConfig, guardarSesion, rotarWidgetKey,
} from './db.js'
import { abrirSesion, cerrarSesion, comprobarState, exigirSesion, ponerState } from './sesion.js'
import { tokenFresco, olvidarToken } from './tokens.js'
import { SCOPE, intercambiarCodigo, obtenerRecompensas, obtenerUsuario, urlDeAutorizacion } from './twitch.js'
import { normalizarAjustesVoz } from './voz.js'

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

  const alPanel = (msg) => res.redirect(`/puntos/entrar?error=${encodeURIComponent(msg)}`)

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
    return alPanel(`Este panel es solo del canal ${env.canalPermitido}`)
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
  res.redirect('/puntos')
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
    ruleta: {
      rewardId: u.reward_id,
      premios: u.premios?.length === 8 ? u.premios : PREMIOS_POR_DEFECTO,
      widgetUrl: `${env.publicUrl}/overlay/ruleta?k=${u.widget_key}`,
    },
    voz: {
      rewardId: u.reward_tts_id,
      ajustes: normalizarAjustesVoz(u.tts_ajustes),
      widgetUrl: `${env.publicUrl}/overlay/voz?k=${u.widget_key}`,
    },
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
  const { rewardId, premios, rewardTtsId, ttsAjustes } = req.body ?? {}

  if (premios !== undefined) {
    const bien = Array.isArray(premios) && premios.length === 8
      && premios.every((p) => typeof p === 'string' && p.length <= 60)
    if (!bien) return res.status(400).json({ error: 'Los premios tienen que ser ocho textos de 60 caracteres o menos' })
  }
  for (const [nombre, valor] of [['rewardId', rewardId], ['rewardTtsId', rewardTtsId]]) {
    if (valor !== undefined && valor !== null && typeof valor !== 'string') {
      return res.status(400).json({ error: `${nombre} inválido` })
    }
  }
  // Una misma recompensa no puede hacer dos cosas: girar y hablar a la vez
  // dejaría la ruleta narrando encima de sí misma.
  //
  // Se compara contra lo que ya hay guardado, no solo contra lo que llega en
  // esta petición: el panel guarda cada desplegable por separado, así que
  // mirar únicamente el cuerpo dejaba pasar la repetición en dos pasos.
  if (rewardId !== undefined || rewardTtsId !== undefined) {
    const actual = await buscarPorId(req.twitchUserId)
    const finalRuleta = rewardId !== undefined ? (rewardId || null) : (actual?.reward_id ?? null)
    const finalVoz = rewardTtsId !== undefined ? (rewardTtsId || null) : (actual?.reward_tts_id ?? null)
    if (finalRuleta && finalVoz && finalRuleta === finalVoz) {
      return res.status(400).json({
        error: 'Esa recompensa ya está asignada a la otra función. Elige una distinta o pon la otra en «apagado».',
      })
    }
  }

  const u = await guardarConfig(req.twitchUserId, {
    rewardId, premios, rewardTtsId,
    ttsAjustes: ttsAjustes === undefined ? undefined : normalizarAjustesVoz(ttsAjustes),
  })
  res.json({
    ruleta: { rewardId: u?.reward_id ?? null, premios: u?.premios ?? PREMIOS_POR_DEFECTO },
    voz: { rewardId: u?.reward_tts_id ?? null, ajustes: normalizarAjustesVoz(u?.tts_ajustes) },
  })
}))

rutas.post('/widget-key/rotar', exigirSesion, async_(async (req, res) => {
  const u = await rotarWidgetKey(req.twitchUserId)
  res.json({
    ruletaUrl: `${env.publicUrl}/overlay/ruleta?k=${u.widget_key}`,
    vozUrl: `${env.publicUrl}/overlay/voz?k=${u.widget_key}`,
  })
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
    // Los dos widgets comparten clave y respuesta: cada uno coge lo suyo.
    ruleta: {
      rewardId: u.reward_id,
      premios: u.premios?.length === 8 ? u.premios : PREMIOS_POR_DEFECTO,
    },
    voz: {
      rewardId: u.reward_tts_id,
      ajustes: normalizarAjustesVoz(u.tts_ajustes),
    },
    // Cuándo volver a pedir. El widget se relee solo, sin recargar OBS.
    revalidarEnSegundos: 45 * 60,
  })
}))
