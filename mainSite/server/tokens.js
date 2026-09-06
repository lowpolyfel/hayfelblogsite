import { guardarRefreshToken } from './db.js'
import { refrescar } from './twitch.js'

// Los tokens de acceso de Twitch duran unas horas. Refrescarlos en cada
// petición sería absurdo y acabaría topando con los límites de Twitch, así
// que se guardan en memoria hasta poco antes de que caduquen.
//
// En memoria y no en la base a propósito: si el proceso se reinicia, lo
// único que se pierde es la caché, y el refresh_token —que sí está en la
// base— vuelve a generar uno al instante.

const cache = new Map() // twitch_user_id -> { accessToken, caducaEn }
const MARGEN_MS = 5 * 60 * 1000 // se pide uno nuevo 5 min antes de caducar

// Si dos peticiones piden token a la vez, solo se hace un refresco: el
// segundo espera al mismo trabajo en curso.
const enCurso = new Map()

export async function tokenFresco(usuario) {
  const id = usuario.twitch_user_id
  const guardado = cache.get(id)
  if (guardado && guardado.caducaEn - MARGEN_MS > Date.now()) return guardado.accessToken

  if (enCurso.has(id)) return enCurso.get(id)

  const trabajo = (async () => {
    const datos = await refrescar(usuario.refresh_token)
    cache.set(id, {
      accessToken: datos.access_token,
      caducaEn: Date.now() + (datos.expires_in ?? 3600) * 1000,
    })
    // Twitch rota el refresh token al usarlo. Si no se guarda el nuevo, el
    // siguiente refresco falla y se acabó lo de no tocar OBS.
    if (datos.refresh_token && datos.refresh_token !== usuario.refresh_token) {
      await guardarRefreshToken(id, datos.refresh_token)
      usuario.refresh_token = datos.refresh_token
    }
    return datos.access_token
  })()

  enCurso.set(id, trabajo)
  try {
    return await trabajo
  } finally {
    enCurso.delete(id)
  }
}

export function olvidarToken(twitchUserId) {
  cache.delete(twitchUserId)
}
