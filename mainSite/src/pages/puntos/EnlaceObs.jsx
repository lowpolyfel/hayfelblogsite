import { useState } from 'react'
import { rotarWidget } from '../../services/api/puntos'

// El enlace que se pega en OBS. Lo comparten la ruleta y la voz, así que
// vive aquí en vez de repetirse en las dos páginas.
export function EnlaceObs({ url, titulo, nota, onCambiado }) {
  const [copiado, setCopiado] = useState(false)
  const [aviso, setAviso] = useState('')

  async function copiar() {
    try {
      await navigator.clipboard.writeText(url)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      setAviso('No se pudo copiar. Selecciona el enlace y cópialo a mano.')
    }
  }

  async function rotar() {
    // La clave es la misma para los dos widgets: cambiarla invalida los dos.
    if (!window.confirm('Se invalidarán los enlaces actuales de la ruleta y de la voz, y habrá que pegar los nuevos en OBS. ¿Seguir?')) return
    try {
      onCambiado?.(await rotarWidget())
    } catch (e) {
      setAviso(e?.message || 'No se pudo cambiar el enlace')
    }
  }

  if (!url) return null

  return (
    <section className="rp-obs">
      <h2>{titulo}</h2>
      <p className="rp-nota">{nota}</p>
      <p className="rp-nota">
        <b>Se pega una sola vez y no hay que volver a tocarlo</b>: el enlace no
        caduca y el permiso de Twitch se renueva solo por detrás.
      </p>
      <code className="rp-code">{url}</code>
      {aviso && <p className="rp-aviso">{aviso}</p>}
      <div className="rp-acciones">
        <button className="rp-btn primario" onClick={copiar}>{copiado ? '¡Copiado!' : 'Copiar enlace'}</button>
        <a className="rp-btn" href={`${url}&demo=1`} target="_blank" rel="noreferrer">Probar</a>
        <button className="rp-btn peligro" onClick={rotar}>Cambiar el enlace</button>
      </div>
      <p className="rp-nota tenue">
        No lleva ninguna contraseña dentro, pero sí identifica a tu canal: si se
        te escapa en pantalla, cámbialo con el botón de arriba.
      </p>
    </section>
  )
}
