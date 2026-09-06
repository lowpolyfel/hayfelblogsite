import { useEffect, useState } from 'react'
import { Marco } from './Marco'
import { URL_ENTRAR, quienSoy } from '../../services/api/puntos'

// Entrada al panel. Si ya hay sesión no tiene sentido quedarse aquí: manda
// al panel directo, que es lo que hace que la siguiente página ya salga
// iniciada sin volver a pasar por Twitch.
export function EntrarPage() {
  const [comprobando, setComprobando] = useState(true)
  const [error, setError] = useState(
    () => new URLSearchParams(window.location.search).get('error') || '',
  )

  useEffect(() => {
    let vivo = true
    quienSoy()
      .then((s) => { if (vivo && s.sesion) window.location.replace('/puntos') })
      .catch(() => {})
      .finally(() => { if (vivo) setComprobando(false) })
    return () => { vivo = false }
  }, [])

  return (
    <Marco
      titulo="Panel de puntos de canal"
      sub="La ruleta y el lector de voz, en un solo sitio."
    >
      {error && <p className="rp-aviso">{error}</p>}

      <p className="rp-nota">
        Se te pedirá un solo permiso, <code>channel:read:redemptions</code>, que
        sirve para leer los canjes de puntos de tu canal. No puede escribir en tu
        canal, ni ver mensajes, ni tocar nada más.
      </p>

      {comprobando ? (
        <p className="rp-nota">Comprobando si ya habías entrado…</p>
      ) : (
        <a className="rp-btn primario grande" href={URL_ENTRAR}>Entrar con Twitch</a>
      )}

      <p className="rp-nota tenue">
        Solo hay que hacerlo una vez. A partir de ahí la sesión se mantiene y los
        enlaces de OBS se renuevan solos.
      </p>
    </Marco>
  )
}
