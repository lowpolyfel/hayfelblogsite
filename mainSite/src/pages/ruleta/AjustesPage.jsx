import { useEffect, useState } from 'react'
import { Marco, Migas } from './Marco'
import { GEMAS, premiosPorDefecto } from '../../features/ruleta/gemas'
import { guardarConfig, quienSoy, rotarWidget } from '../../services/api/ruleta'

// Página 3 de 4: los valores de la ruleta y el enlace para OBS.
//
// Los premios no cambian la skin —siguen siendo las ocho gemas—: son lo que
// se canta al final, en el "esto te ha tocado".
export function AjustesPage() {
  const [premios, setPremios] = useState(premiosPorDefecto)
  const [widgetUrl, setWidgetUrl] = useState('')
  const [cargando, setCargando] = useState(true)
  const [aviso, setAviso] = useState('')
  const [estado, setEstado] = useState('')

  useEffect(() => {
    let vivo = true
    quienSoy()
      .then((s) => {
        if (!vivo) return
        if (!s.sesion) { window.location.replace('/ruleta/entrar'); return }
        if (s.premios?.length === 8) setPremios(s.premios)
        setWidgetUrl(s.widgetUrl || '')
        if (!s.rewardId) setAviso('Todavía no has elegido la recompensa que gira la ruleta.')
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
      setTimeout(() => setEstado(''), 1800)
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

  async function rotar() {
    if (!window.confirm('Se invalidará el enlace actual y habrá que pegar el nuevo en OBS. ¿Seguir?')) return
    try {
      const { widgetUrl: nueva } = await rotarWidget()
      setWidgetUrl(nueva)
    } catch (e) {
      setAviso(e?.message || 'No se pudo rotar el enlace')
    }
  }

  const [copiado, setCopiado] = useState(false)
  async function copiar() {
    try {
      await navigator.clipboard.writeText(widgetUrl)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      setAviso('No se pudo copiar. Selecciona el enlace y cópialo a mano.')
    }
  }

  if (cargando) return <Marco paso="3 de 3" titulo="Los premios"><p className="rp-nota">Cargando…</p></Marco>

  return (
    <Marco paso="3 de 3" titulo="Los premios">
      <Migas actual="ajustes" />

      {aviso && <p className="rp-aviso">{aviso}</p>}

      <p className="rp-nota">
        La ruleta sigue enseñando las ocho gemas de siempre. Esto es lo que se
        canta al parar, en el «esto te ha tocado».
      </p>

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

      {/* ---------- el enlace de OBS ---------- */}
      <section className="rp-obs">
        <h2>El enlace para OBS</h2>
        <p className="rp-nota">
          Pégalo en un <b>Browser Source</b> de 1920×1080. <b>Se pega una sola vez
          y no hay que volver a tocarlo</b>: el enlace no caduca y el permiso de
          Twitch se renueva solo por detrás.
        </p>
        <code className="rp-code">{widgetUrl}</code>
        <div className="rp-acciones">
          <button className="rp-btn primario" onClick={copiar}>{copiado ? '¡Copiado!' : 'Copiar enlace'}</button>
          <a className="rp-btn" href={`${widgetUrl}&demo=1`} target="_blank" rel="noreferrer">Probar</a>
          <button className="rp-btn peligro" onClick={rotar}>Cambiar el enlace</button>
        </div>
        <p className="rp-nota tenue">
          No lleva ninguna contraseña dentro, pero sí identifica a tu ruleta: si
          se te escapa en pantalla, cámbialo con el botón de arriba.
        </p>
      </section>
    </Marco>
  )
}
