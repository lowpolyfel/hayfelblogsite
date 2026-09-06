// Variables de entorno. Se validan al arrancar y no al usarlas: si falta
// algo, el servidor se niega a levantar con un mensaje claro, en vez de
// fallar a mitad de un login con un error incomprensible.

function pedir(nombre, { obligatoria = true, porDefecto = '' } = {}) {
  const v = process.env[nombre] ?? porDefecto
  if (!v && obligatoria) faltantes.push(nombre)
  return v
}

const faltantes = []

export const env = {
  // Twitch
  clientId: pedir('TWITCH_CLIENT_ID'),
  clientSecret: pedir('TWITCH_CLIENT_SECRET'),

  // Supabase. La service_role se salta el RLS de la tabla: es la única que
  // puede leer los refresh tokens, y por eso jamás sale del servidor.
  supabaseUrl: pedir('SUPABASE_URL'),
  supabaseKey: pedir('SUPABASE_SERVICE_ROLE_KEY'),

  // Firma de la cookie de sesión. Cualquier cadena larga y aleatoria.
  sessionSecret: pedir('SESSION_SECRET'),

  // Dirección pública del sitio. Tiene que coincidir carácter por carácter
  // con la URL de redirección registrada en Twitch.
  publicUrl: pedir('PUBLIC_URL').replace(/\/$/, ''),

  // La aplicación queda cerrada a este canal. Si se deja vacío, entra
  // cualquiera con cuenta de Twitch.
  canalPermitido: pedir('TWITCH_ALLOWED_LOGIN', { obligatoria: false }).toLowerCase(),

  puerto: Number(pedir('PORT', { obligatoria: false, porDefecto: '3000' })),
  produccion: process.env.NODE_ENV === 'production',
}

// Antes esto hacía process.exit(1). Mal: una variable mal puesta tiraba el
// sitio entero y el hosting devolvía un 503 sin explicar nada. Ahora el
// servidor arranca igual, el blog se sigue viendo, y es /api quien avisa de
// lo que falta, tanto en el registro como al abrirlo en el navegador.
export const configIncompleta = faltantes

if (faltantes.length) {
  console.error(
    `\n[config] Faltan variables de entorno: ${faltantes.join(', ')}\n` +
    `[config] El sitio se sirve igual, pero /api no funcionará hasta ponerlas.\n` +
    `[config] Se ponen en Hostinger: Sitios web > hayfel.com > Variables de entorno.\n`,
  )
}

export const REDIRECT_URI = `${env.publicUrl}/api/auth/callback`
