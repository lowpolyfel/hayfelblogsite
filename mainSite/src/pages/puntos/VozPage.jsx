import { useEffect, useMemo, useRef, useState } from 'react'
import { Marco } from './Marco'
import { EnlaceObs } from './EnlaceObs'
import { useLector } from '../../features/voz/useLector'
import { guardarConfig, quienSoy } from '../../services/api/puntos'

const POR_DEFECTO = {
  voz: '', velocidad: 1, tono: 1, volumen: 1,
  maxCaracteres: 200, leerNombre: true, colapsarRepetidos: true, bloqueadas: [],
}

export function VozPage() {
  const [ajustes, setAjustes] = useState(POR_DEFECTO)
  const [rewardId, setRewardId] = useState(null)
  const [widgetUrl, setWidgetUrl] = useState('')
  const [cargando, setCargando] = useState(true)
  const [aviso, setAviso] = useState('')
  const [estado, setEstado] = useState('')
  const [bloqueadasTexto, setBloqueadasTexto] = useState('')

  const lector = useLector(ajustes)
  const guardarTimer = useRef(null)

  useEffect(() => {
    let vivo = true
    quienSoy()
      .then((s) => {
        if (!vivo) return
        if (!s.sesion) { window.location.replace('/puntos/entrar'); return }
        if (s.voz?.ajustes) setAjustes({ ...POR_DEFECTO, ...s.voz.ajustes })
        setBloqueadasTexto((s.voz?.ajustes?.bloqueadas ?? []).join('\n'))
        setRewardId(s.voz?.rewardId ?? null)
        setWidgetUrl(s.voz?.widgetUrl || '')
      })
      .catch(() => setAviso('No se pudo cargar la configuración'))
      .finally(() => { if (vivo) setCargando(false) })
    return () => { vivo = false }
  }, [])

  // Los deslizadores disparan muchos cambios seguidos: se espera a que la
  // mano se pare antes de guardar, en vez de una petición por píxel.
  function cambiar(parcial) {
    const nuevos = { ...ajustes, ...parcial }
    setAjustes(nuevos)
    setEstado('guardando')
    clearTimeout(guardarTimer.current)
    guardarTimer.current = setTimeout(async () => {
      try {
        const r = await guardarConfig({ ttsAjustes: nuevos })
        // El servidor recorta a rango: se adopta lo que él diga, que es lo
        // que de verdad va a usar el widget.
        setAjustes({ ...POR_DEFECTO, ...r.voz.ajustes })
        setEstado('guardado')
        setTimeout(() => setEstado(''), 1600)
      } catch (e) {
        setEstado('')
        setAviso(e?.message || 'No se pudo guardar')
      }
    }, 500)
  }
  useEffect(() => () => clearTimeout(guardarTimer.current), [])

  function guardarBloqueadas() {
    const lista = bloqueadasTexto.split('\n').map((s) => s.trim()).filter(Boolean)
    cambiar({ bloqueadas: lista })
  }

  const vocesEs = useMemo(
    () => [...lector.voces].sort((a, b) => {
      // Las de español primero: es lo que se va a leer casi siempre.
      const ea = a.lang?.startsWith('es') ? 0 : 1
      const eb = b.lang?.startsWith('es') ? 0 : 1
      return ea - eb || a.name.localeCompare(b.name)
    }),
    [lector.voces],
  )

  if (cargando) return <Marco activa="voz" titulo="Voz"><p className="rp-nota">Cargando…</p></Marco>

  return (
    <Marco
      activa="voz"
      titulo="Leer en voz alta"
      sub="Lee por el audio del directo lo que escriba quien canjea la recompensa."
    >
      {aviso && <p className="rp-aviso">{aviso}</p>}
      {!rewardId && (
        <p className="rp-alerta">
          No has elegido todavía la recompensa que activa la voz.{' '}
          <a href="/puntos">Elígela en Recompensas</a>.
        </p>
      )}

      {/* ---------- la voz ---------- */}
      <section className="rp-bloque">
        <h2>La voz</h2>

        {!lector.soportado ? (
          <p className="rp-alerta">Este navegador no tiene lector de voz.</p>
        ) : lector.voces.length === 0 ? (
          <p className="rp-alerta">
            No se encontró ninguna voz instalada. Si esto te sale <b>dentro de OBS</b>,
            es normal: el navegador que lleva OBS suele venir sin voces. En ese caso
            abre el enlace de abajo en una ventana de Chrome normal y captura su
            audio desde OBS.
          </p>
        ) : (
          <>
            <label className="rp-label" htmlFor="voz">Voz ({lector.voces.length} disponibles)</label>
            <select id="voz" className="rp-select" value={ajustes.voz}
              onChange={(e) => cambiar({ voz: e.target.value })}>
              <option value="">— la que tenga el sistema por defecto —</option>
              {vocesEs.map((v) => (
                <option key={v.name} value={v.name}>{v.name} · {v.lang}</option>
              ))}
            </select>
          </>
        )}

        <Deslizador etiqueta="Velocidad" valor={ajustes.velocidad} min={0.5} max={2} paso={0.1}
          onChange={(v) => cambiar({ velocidad: v })} />
        <Deslizador etiqueta="Tono" valor={ajustes.tono} min={0.5} max={2} paso={0.1}
          onChange={(v) => cambiar({ tono: v })} />
        <Deslizador etiqueta="Volumen" valor={ajustes.volumen} min={0} max={1} paso={0.05}
          onChange={(v) => cambiar({ volumen: v })} />

        <label className="rp-check">
          <input type="checkbox" checked={ajustes.leerNombre}
            onChange={(e) => cambiar({ leerNombre: e.target.checked })} />
          Decir quién lo canjeó antes del mensaje
        </label>

        <div className="rp-acciones">
          <button className="rp-btn primario"
            onClick={() => lector.encolar({ usuario: 'Alguien', texto: 'Esto es una prueba de la voz del canal.' })}>
            Probar la voz
          </button>
          <button className="rp-btn" onClick={lector.callar}>Callar</button>
          {estado === 'guardando' && <span className="rp-nota tenue">Guardando…</span>}
          {estado === 'guardado' && <span className="rp-ok">Guardado</span>}
        </div>
      </section>

      {/* ---------- moderación ---------- */}
      <section className="rp-bloque">
        <h2>Moderación</h2>
        <p className="rp-nota">
          Esto lee en directo lo que escriba cualquiera. Los filtros se aplican
          en el widget antes de hablar, no después.
        </p>

        <Deslizador etiqueta="Máximo de caracteres" valor={ajustes.maxCaracteres}
          min={20} max={400} paso={10} onChange={(v) => cambiar({ maxCaracteres: Math.round(v) })} />

        <label className="rp-check">
          <input type="checkbox" checked={ajustes.colapsarRepetidos}
            onChange={(e) => cambiar({ colapsarRepetidos: e.target.checked })} />
          Colapsar letras repetidas (<code>AAAAAAA</code> → <code>AAA</code>)
        </label>

        <label className="rp-label" htmlFor="bloq">Palabras bloqueadas, una por línea</label>
        <textarea id="bloq" className="rp-input rp-area" rows={5}
          value={bloqueadasTexto}
          onChange={(e) => setBloqueadasTexto(e.target.value)}
          onBlur={guardarBloqueadas}
          placeholder="una por línea" />
        <p className="rp-nota tenue">
          Si el mensaje contiene alguna, no se lee entero. La comparación ignora
          mayúsculas y tildes. Las direcciones web se quitan siempre.
        </p>
      </section>

      <EnlaceObs
        url={widgetUrl}
        titulo="El enlace para OBS"
        nota="Va en su propio Browser Source, aparte del de la ruleta, así puedes ponerlo en las escenas que quieras. No necesita tamaño ni verse: solo suena."
        onCambiado={(u) => setWidgetUrl(u.vozUrl)}
      />
    </Marco>
  )
}

function Deslizador({ etiqueta, valor, min, max, paso, onChange }) {
  return (
    <label className="rp-desliza">
      <span>{etiqueta}<b>{valor}</b></span>
      <input type="range" min={min} max={max} step={paso} value={valor}
        onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  )
}
