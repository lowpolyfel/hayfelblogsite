import { useEffect, useState } from 'react'
import { configDelWidget } from '../../services/api/puntos'

/**
 * Config y token de un widget de OBS. La comparten la ruleta y la voz: los
 * dos se identifican con la misma clave de la URL (?k=...) y reciben la
 * misma respuesta, cada uno coge lo suyo.
 *
 * Antes de que el token de Twitch caduque se vuelve a pedir solo, sin
 * recargar nada. Eso es lo que permite pegar el enlace en OBS una vez y no
 * volver a tocarlo.
 */
export function useWidget() {
  const clave = new URLSearchParams(window.location.search).get('k') || ''
  const [cfg, setCfg] = useState(null)
  const [fallo, setFallo] = useState('')

  useEffect(() => {
    if (!clave) { setFallo('Falta la clave del widget en la URL'); return }
    let vivo = true
    let reloj

    const traer = async () => {
      try {
        const c = await configDelWidget(clave)
        if (!vivo) return
        setCfg(c)
        setFallo('')
        reloj = setTimeout(traer, Math.max(60, c.revalidarEnSegundos) * 1000)
      } catch (e) {
        if (!vivo) return
        setFallo(
          e?.status === 404 ? 'Widget desconocido: el enlace cambió. Copia el nuevo desde el panel.'
          : e?.status === 409 ? 'Hay que volver a entrar con Twitch en el panel.'
          : 'Sin conexión con el servidor. Reintentando…',
        )
        // Reintento tranquilo: si el servidor está caído, ya volverá.
        reloj = setTimeout(traer, 30000)
      }
    }
    traer()
    return () => { vivo = false; clearTimeout(reloj) }
  }, [clave])

  return { cfg, fallo, clave }
}

// Bandera suelta para las dos: ?demo=1 prueba sin gastar puntos y
// ?silencioso=1 esconde el aviso de estado durante el directo.
export const bandera = (nombre) =>
  new URLSearchParams(window.location.search).has(nombre)
