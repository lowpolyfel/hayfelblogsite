import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

// Hostinger arranca la aplicación ejecutando el archivo de entrada
// (server/index.js) directamente, sin pasar por npm. Eso deja fuera tanto el
// comando de compilación del panel como el hook `prestart` del package.json,
// así que el sitio se quedaba sin construir y el servidor no tenía nada que
// servir.
//
// La comprobación se hace aquí, en el propio arranque: si falta el build, se
// construye. En marcha normal no cuesta nada, porque dist/ ya existe.

const aqui = path.dirname(fileURLToPath(import.meta.url))
const RAIZ = path.join(aqui, '..')
const INDEX = path.join(RAIZ, 'dist', 'index.html')

export function asegurarBuild() {
  if (fs.existsSync(INDEX)) return true

  // Se llama al binario de Vite por su ruta y con el mismo Node que nos
  // ejecuta: npm y npx no siempre están en el PATH del proceso del hosting.
  const vite = path.join(RAIZ, 'node_modules', 'vite', 'bin', 'vite.js')
  if (!fs.existsSync(vite)) {
    console.error('[build] No está instalado vite: no se puede construir el sitio.')
    return false
  }

  console.log('[build] Falta dist/: construyendo el sitio antes de arrancar…')
  try {
    execFileSync(process.execPath, [vite, 'build'], { cwd: RAIZ, stdio: 'inherit' })
    console.log('[build] Sitio construido.')
    return true
  } catch (e) {
    // Que falle el build no debe impedir que /api levante: la ruleta en OBS
    // puede seguir funcionando aunque el sitio no se vea.
    console.error('[build] El build falló:', e?.message)
    return false
  }
}
