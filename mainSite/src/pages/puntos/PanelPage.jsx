import { useCallback, useEffect, useState } from 'react'
import { Marco } from './Marco'
import { guardarConfig, listarRecompensas, quienSoy, salir } from '../../services/api/puntos'

// Qué recompensa hace qué. Cada función coge una distinta: son dos listas
// sobre las mismas recompensas del canal.
const FUNCIONES = [
  {
    id: 'ruleta', campo: 'rewardId', titulo: 'Ruleta',
    que: 'Baja la ruleta en OBS, gira y canta el premio.',
    ajustes: '/puntos/ruleta',
  },
  {
    id: 'voz', campo: 'rewardTtsId', titulo: 'Leer en voz alta',
    que: 'Lee por el audio del directo lo que escriba quien canjea.',
    // Sin texto no hay nada que leer, y es el fallo más común al crearla.
    aviso: 'Esta recompensa tiene que pedir texto: al crearla en Twitch, marca «Requerir que el espectador introduzca texto».',
    ajustes: '/puntos/voz',
  },
]

export function PanelPage() {
  const [sesion, setSesion] = useState(null)
  const [recompensas, setRecompensas] = useState([])
  const [elegidas, setElegidas] = useState({ ruleta: '', voz: '' })
  const [cargando, setCargando] = useState(true)
  const [aviso, setAviso] = useState('')
  const [guardado, setGuardado] = useState('')

  const cargar = useCallback(async () => {
    setCargando(true)
    setAviso('')
    try {
      const s = await quienSoy()
      if (!s.sesion) { window.location.replace('/puntos/entrar'); return }
      setSesion(s)
      setElegidas({ ruleta: s.ruleta?.rewardId || '', voz: s.voz?.rewardId || '' })
      const r = await listarRecompensas()
      setRecompensas(r)
      if (!r.length) {
        setAviso('Tu canal no tiene recompensas de puntos. Créalas en Twitch (hace falta ser afiliado o socio) y recarga.')
      }
    } catch (e) {
      if (e?.status === 401) { window.location.replace('/puntos/entrar'); return }
      setAviso(e?.message || 'No se pudo hablar con Twitch')
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  async function elegir(funcion, campo, id) {
    const antes = elegidas
    setElegidas((e) => ({ ...e, [funcion]: id }))
    setAviso('')
    try {
      await guardarConfig({ [campo]: id || null })
      setGuardado(funcion)
      setTimeout(() => setGuardado(''), 2000)
    } catch (e) {
      setElegidas(antes) // el servidor mandó: se deshace lo que se veía
      setAviso(e?.message || 'No se pudo guardar')
    }
  }

  async function cerrar() {
    await salir().catch(() => {})
    window.location.replace('/puntos/entrar')
  }

  return (
    <Marco
      activa="panel"
      titulo="Recompensas"
      sub="Elige qué recompensa de puntos dispara cada cosa."
      acciones={<button className="rp-btn" onClick={cerrar}>Cerrar sesión</button>}
    >
      {sesion && <p className="rp-ok">Conectado como <b>{sesion.displayName}</b></p>}
      {aviso && <p className="rp-aviso">{aviso}</p>}

      {cargando ? (
        <p className="rp-nota">Cargando tus recompensas…</p>
      ) : (
        FUNCIONES.map((f) => (
          <section key={f.id} className="rp-funcion">
            <div className="rp-funcion-cab">
              <div>
                <h2>{f.titulo}</h2>
                <p className="rp-nota">{f.que}</p>
              </div>
              <a className="rp-btn" href={f.ajustes}>Ajustes →</a>
            </div>

            {f.aviso && <p className="rp-alerta">{f.aviso}</p>}

            <select
              className="rp-select"
              value={elegidas[f.id]}
              onChange={(e) => elegir(f.id, f.campo, e.target.value)}
            >
              <option value="">— apagado —</option>
              {recompensas.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title} · {r.cost} pts{r.is_enabled ? '' : ' (desactivada en Twitch)'}
                </option>
              ))}
            </select>
            {guardado === f.id && <span className="rp-ok">Guardado</span>}
          </section>
        ))
      )}

      <div className="rp-acciones">
        <button className="rp-btn" onClick={cargar}>Recargar recompensas</button>
      </div>
    </Marco>
  )
}
