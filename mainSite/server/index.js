import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import { env } from './env.js'
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

app.use('/api', rutas)

app.get('/api/salud', (_req, res) => res.json({ ok: true }))

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

app.listen(env.puerto, () => {
  console.log(`Ruleta en marcha en el puerto ${env.puerto}`)
  console.log(`Sitio público: ${env.publicUrl}`)
  if (env.canalPermitido) console.log(`Cerrada al canal: ${env.canalPermitido}`)
})
