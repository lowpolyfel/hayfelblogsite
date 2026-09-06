import { useEffect, useState } from 'react'
import { Marco, Migas } from './Marco'
import { URL_ENTRAR, quienSoy } from '../../services/api/ruleta'

// Página 1 de 4: entrar con Twitch.
//
// Si ya hay sesión, no tiene sentido quedarse aquí: manda al panel. Eso es
// lo que hace que "la siguiente página ya salga iniciada".
export function EntrarPage() {
  const [comprobando, setComprobando] = useState(true)
  const [error, setError] = useState(
    () => new URLSearchParams(window.location.search).get('error') || '',
  )

  useEffect(() => {
    let vivo = true
    quienSoy()
      .then((s) => { if (vivo && s.sesion) window.location.replace('/ruleta/panel') })
      .catch(() => {})
      .finally(() => { if (vivo) setComprobando(false) })
    return () => { vivo = false }
  }, [])

  return (
    <Marco paso="1 de 3" titulo="Entra con Twitch">
      <Migas actual="entrar" />

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
        Solo hay que hacerlo una vez. A partir de ahí la sesión se mantiene y el
        widget de OBS se renueva solo.
      </p>
    </Marco>
  )
}
