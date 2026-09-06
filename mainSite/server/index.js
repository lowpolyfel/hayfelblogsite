import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import { configIncompleta, env } from './env.js'
import { rutas } from './rutas.js'
import { usuarioDeLaSesion } from './sesion.js'

const aqui = path.dirname(fileURLToPath(import.meta.url))
const DIST = path.join(aqui, '..', 'dist')

const app = express()

// Hostinger sirve detrás de un proxy: sin esto, las cookies `secure` no se
// mandan porque Express cree que la conexión es http.
app.set('trust proxy', 1)
app.disable('x-powered-by')

app.use(express.json({ limit: '32kb' }))

// El id de la sesión se resuelve una vez y queda a mano para /api/me, que
// tiene que poder responder tanto con sesión como sin ella.
app.use((req, _res, next) => {
  req.twitchUserIdOpcional = usuarioDeLaSesion(req)
  next()
})

// Diagnóstico. Responde siempre, aunque falte configuración: es lo primero
// que hay que mirar cuando algo no va.
app.get('/api/salud', (_req, res) => {
  res.json({
    ok: configIncompleta.length === 0,
    faltan: configIncompleta,
    sitioConstruido: fs.existsSync(path.join(DIST, 'index.html')),
  })
})

// Sin configuración no se puede hablar ni con Twitch ni con la base, así que
// se corta aquí con un mensaje claro en vez de dejar fallar cada ruta a su
// manera.
app.use('/api', (req, res, siguiente) => {
  if (!configIncompleta.length) return siguiente()
  res.status(503).json({
    error: 'Falta configuración en el servidor',
    faltan: configIncompleta,
    pista: 'Hostinger > Sitios web > hayfel.com > Variables de entorno',
  })
})

app.use('/api', rutas)

// ---------------------------------------------------------------------------
// El sitio construido. Los archivos con huella en el nombre (los de
// /assets) se pueden cachear para siempre; el index.html nunca, o el
// navegador seguiría sirviendo una versión vieja tras cada despliegue.
// ---------------------------------------------------------------------------
app.use('/assets', express.static(path.join(DIST, 'assets'), {
  immutable: true, maxAge: '1y',
}))
app.use(express.static(DIST, { index: false, maxAge: '1h' }))

// Todo lo demás lo resuelve el router del navegador: /ruleta/panel y
// compañía no son archivos, así que se devuelve el index y ya decide React.
app.get(/^(?!\/api\/).*/, (_req, res) => {
  res.set('Cache-Control', 'no-store')
  res.sendFile(path.join(DIST, 'index.html'))
})

// ---------------------------------------------------------------------------
app.use((err, _req, res, _next) => {
  // Al registro va el detalle; al navegador, lo justo. Los mensajes de
  // Twitch y Supabase pueden llevar dentro trozos de credenciales.
  console.error('[error]', err)
  const status = err?.status && err.status >= 400 && err.status < 600 ? err.status : 500
  res.status(status).json({ error: status === 500 ? 'Error del servidor' : err.message })
})

// 0.0.0.0 explícito: algunos hospedajes solo enrutan al proceso si escucha
// en todas las interfaces, y si no, el proxy devuelve 503 sin más pistas.
app.listen(env.puerto, '0.0.0.0', () => {
  console.log(`[arranque] Escuchando en el puerto ${env.puerto}`)
  console.log(`[arranque] Sitio público: ${env.publicUrl || '(sin PUBLIC_URL)'}`)
  if (env.canalPermitido) console.log(`[arranque] Cerrada al canal: ${env.canalPermitido}`)
  if (!fs.existsSync(path.join(DIST, 'index.html'))) {
    console.error(`[arranque] No existe ${DIST}/index.html: falta ejecutar "npm run build".`)
  }
  if (configIncompleta.length) {
    console.error(`[arranque] /api está apagada hasta que se pongan: ${configIncompleta.join(', ')}`)
  }
})

// Un fallo suelto no debe tumbar el proceso y dejar el sitio en 503: se
// registra y se sigue sirviendo.
process.on('unhandledRejection', (e) => console.error('[promesa sin capturar]', e))
process.on('uncaughtException', (e) => console.error('[excepción sin capturar]', e))
