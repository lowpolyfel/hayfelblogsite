import { useEffect, useState } from 'react'
import { Marco } from './Marco'
import { EnlaceObs } from './EnlaceObs'
import { GEMAS, premiosPorDefecto } from '../../features/ruleta/gemas'
import { guardarConfig, quienSoy } from '../../services/api/puntos'

// Los valores de la ruleta. No cambian la skin —siguen siendo las ocho
// gemas—: son lo que se canta al final, en el "esto te ha tocado".
export function RuletaPage() {
  const [premios, setPremios] = useState(premiosPorDefecto)
  const [rewardId, setRewardId] = useState(null)
  const [widgetUrl, setWidgetUrl] = useState('')
  const [cargando, setCargando] = useState(true)
  const [aviso, setAviso] = useState('')
  const [estado, setEstado] = useState('')

  useEffect(() => {
    let vivo = true
    quienSoy()
      .then((s) => {
        if (!vivo) return
        if (!s.sesion) { window.location.replace('/puntos/entrar'); return }
        if (s.ruleta?.premios?.length === 8) setPremios(s.ruleta.premios)
        setRewardId(s.ruleta?.rewardId ?? null)
        setWidgetUrl(s.ruleta?.widgetUrl || '')
      })
      .catch(() => setAviso('No se pudo cargar la configuración'))
      .finally(() => { if (vivo) setCargando(false) })
    return () => { vivo = false }
  }, [])

  // Se guarda al salir del campo, no en cada tecla: escribir no debería
  // disparar una petición por letra.
  async function guardar(lista) {
    setEstado('guardando')
    try {
      await guardarConfig({ premios: lista })
      setEstado('guardado')
      setTimeout(() => setEstado(''), 1600)
    } catch (e) {
      setEstado('')
      setAviso(e?.message || 'No se pudo guardar')
    }
  }

  function editar(i, valor) {
    const copia = [...premios]
    copia[i] = valor
    setPremios(copia)
  }

  if (cargando) return <Marco activa="ruleta" titulo="Ruleta"><p className="rp-nota">Cargando…</p></Marco>

  return (
    <Marco
      activa="ruleta"
      titulo="Los premios de la ruleta"
      sub="La ruleta sigue enseñando las ocho gemas de siempre. Esto es lo que se canta al parar."
    >
      {aviso && <p className="rp-aviso">{aviso}</p>}
      {!rewardId && (
        <p className="rp-alerta">
          No has elegido todavía la recompensa que gira la ruleta.{' '}
          <a href="/puntos">Elígela en Recompensas</a>.
        </p>
      )}

      <section className="rp-bloque">
        <div className="rp-premios">
          {GEMAS.map((g, i) => (
            <label key={g.id} className="rp-premio">
              <span className="rp-gema" style={{ background: g.base }} aria-hidden="true" />
              <span className="rp-gemanombre">{g.id}</span>
              <input
                className="rp-input" value={premios[i] ?? ''} maxLength={60}
                onChange={(e) => editar(i, e.target.value)}
                onBlur={() => guardar(premios)}
                placeholder={`Premio de la gema ${g.id.toLowerCase()}`}
              />
            </label>
          ))}
        </div>

        <div className="rp-acciones">
          <button className="rp-btn" onClick={() => { const d = premiosPorDefecto(); setPremios(d); guardar(d) }}>
            Restablecer
          </button>
          {estado === 'guardando' && <span className="rp-nota tenue">Guardando…</span>}
          {estado === 'guardado' && <span className="rp-ok">Guardado</span>}
        </div>
      </section>

      <EnlaceObs
        url={widgetUrl}
        titulo="El enlace para OBS"
        nota="Pégalo en un Browser Source de 1920×1080."
        onCambiado={(u) => setWidgetUrl(u.ruletaUrl)}
      />
    </Marco>
  )
}
