import { useCallback, useEffect, useState } from 'react'
import { Marco, Migas } from './Marco'
import { guardarConfig, listarRecompensas, quienSoy, salir } from '../../services/api/ruleta'

// Página 2 de 4: ya entrado, salen tus recompensas de puntos de canal y se
// elige cuál gira la ruleta.
export function PanelPage() {
  const [sesion, setSesion] = useState(null)
  const [recompensas, setRecompensas] = useState([])
  const [rewardId, setRewardId] = useState('')
  const [cargando, setCargando] = useState(true)
  const [aviso, setAviso] = useState('')
  const [guardado, setGuardado] = useState(false)

  const cargar = useCallback(async () => {
    setCargando(true)
    setAviso('')
    try {
      const s = await quienSoy()
      if (!s.sesion) { window.location.replace('/ruleta/entrar'); return }
      setSesion(s)
      setRewardId(s.rewardId || '')
      const r = await listarRecompensas()
      setRecompensas(r)
      if (!r.length) {
        setAviso('Tu canal no tiene recompensas de puntos. Créalas en Twitch (hace falta ser afiliado o socio) y recarga.')
      }
    } catch (e) {
      if (e?.status === 401) { window.location.replace('/ruleta/entrar'); return }
      setAviso(e?.message || 'No se pudo hablar con Twitch')
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  async function elegir(id) {
    setRewardId(id)
    setGuardado(false)
    try {
      await guardarConfig({ rewardId: id || null })
      setGuardado(true)
      setTimeout(() => setGuardado(false), 2000)
    } catch (e) {
      setAviso(e?.message || 'No se pudo guardar')
    }
  }

  async function cerrar() {
    await salir().catch(() => {})
    window.location.replace('/ruleta/entrar')
  }

  return (
    <Marco
      paso="2 de 3"
      titulo="Elige la recompensa"
      acciones={
        <>
          <a className={`rp-btn primario ${rewardId ? '' : 'inerte'}`} href="/ruleta/ajustes">
            Siguiente: los premios →
          </a>
          <button className="rp-btn" onClick={cerrar}>Cerrar sesión</button>
        </>
      }
    >
      <Migas actual="panel" />

      {sesion && (
        <p className="rp-ok">Conectado como <b>{sesion.displayName}</b></p>
      )}
      {aviso && <p className="rp-aviso">{aviso}</p>}

      <p className="rp-nota">
        Cuando alguien canjee esta recompensa, la ruleta bajará en OBS y girará.
      </p>

      {cargando ? (
        <p className="rp-nota">Cargando tus recompensas…</p>
      ) : (
        <>
          <div className="rp-lista">
            {recompensas.map((r) => (
              <label key={r.id} className={`rp-opcion ${rewardId === r.id ? 'act' : ''}`}>
                <input
                  type="radio" name="recompensa" value={r.id}
                  checked={rewardId === r.id}
                  onChange={() => elegir(r.id)}
                />
                <span className="rp-opcion-texto">
                  <b>{r.title}</b>
                  <em>{r.cost} puntos{r.is_enabled ? '' : ' · desactivada en Twitch'}</em>
                </span>
              </label>
            ))}
          </div>
          <div className="rp-acciones">
            <button className="rp-btn" onClick={cargar}>Recargar lista</button>
            {guardado && <span className="rp-ok">Guardado</span>}
          </div>
        </>
      )}
    </Marco>
  )
}
