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

if (faltantes.length) {
  console.error(
    `\nFaltan variables de entorno: ${faltantes.join(', ')}\n` +
    `Ponlas en el panel de Node.js de Hostinger o en un archivo .env.\n`,
  )
  process.exit(1)
}

export const REDIRECT_URI = `${env.publicUrl}/api/auth/callback`
