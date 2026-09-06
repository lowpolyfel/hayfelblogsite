import crypto from 'node:crypto'
import { env } from './env.js'

// Cookie de sesión firmada, sin dependencias ni almacén de sesiones.
//
// Dentro solo va el id de Twitch del usuario, nunca un token. La firma HMAC
// impide que alguien se fabrique una cookie con el id de otro; el contenido
// se puede leer, pero eso da igual porque no es secreto.

const COOKIE = 'hayfel_sesion'
const DIAS = 30

function firmar(valor) {
  const mac = crypto.createHmac('sha256', env.sessionSecret).update(valor).digest('base64url')
  return `${valor}.${mac}`
}

function verificar(firmado) {
  if (typeof firmado !== 'string') return null
  const corte = firmado.lastIndexOf('.')
  if (corte < 1) return null
  const valor = firmado.slice(0, corte)
  const esperado = firmar(valor)
  // Comparación en tiempo constante: comparar con === filtra información
  // sobre cuántos caracteres del principio acertó quien lo intenta.
  const a = Buffer.from(firmado)
  const b = Buffer.from(esperado)
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null
  return valor
}

function leerCookies(req) {
  const crudo = req.headers.cookie
  if (!crudo) return {}
  return Object.fromEntries(
    crudo.split(';').map((p) => {
      const i = p.indexOf('=')
      return i === -1 ? [p.trim(), ''] : [p.slice(0, i).trim(), decodeURIComponent(p.slice(i + 1).trim())]
    }),
  )
}

export function abrirSesion(res, twitchUserId) {
  const valor = firmar(twitchUserId)
  res.cookie(COOKIE, valor, {
    httpOnly: true,                 // fuera del alcance de cualquier script
    sameSite: 'lax',                // sobrevive a la vuelta desde Twitch
    secure: env.produccion,         // en local no hay https
    maxAge: DIAS * 24 * 60 * 60 * 1000,
    path: '/',
  })
}

export function cerrarSesion(res) {
  res.clearCookie(COOKIE, { path: '/' })
}

export function usuarioDeLaSesion(req) {
  return verificar(leerCookies(req)[COOKIE])
}

// Puerta para las rutas que exigen haber entrado.
export function exigirSesion(req, res, siguiente) {
  const id = usuarioDeLaSesion(req)
  if (!id) return res.status(401).json({ error: 'Sin sesión' })
  req.twitchUserId = id
  siguiente()
}

// Valor de un solo uso para el `state` del OAuth, con su cookie corta.
const COOKIE_STATE = 'hayfel_state'

export function ponerState(res) {
  const state = crypto.randomBytes(16).toString('base64url')
  res.cookie(COOKIE_STATE, firmar(state), {
    httpOnly: true, sameSite: 'lax', secure: env.produccion,
    maxAge: 10 * 60 * 1000, path: '/',
  })
  return state
}

export function comprobarState(req, res, recibido) {
  const guardado = verificar(leerCookies(req)[COOKIE_STATE])
  res.clearCookie(COOKIE_STATE, { path: '/' })
  return Boolean(guardado) && guardado === recibido
}
