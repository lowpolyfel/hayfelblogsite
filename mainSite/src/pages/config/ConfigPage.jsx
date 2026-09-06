import { useCallback, useEffect, useState } from 'react'
import { GEMAS, premiosPorDefecto } from '../../features/ruleta/gemas'
import { obtenerRecompensas, obtenerUsuario } from '../../services/api/twitch/twitchApi'
import { hayClientId, uriDeRedireccion, urlDeAutorizacion } from '../../services/api/twitch/twitchAuth'
import { almacen, urlDelWidget } from '../../services/api/twitch/twitchStorage'
import './config.css'

// Panel de ajustes de la ruleta. Todo pasa en el navegador: no hay servidor,
// así que se usa Implicit Grant y el token se queda aquí.
export function ConfigPage() {
  const [token, setToken] = useState(() => almacen.token)
  const [usuario, setUsuario] = useState(() =>
    almacen.broadcasterId ? { id: almacen.broadcasterId, display_name: almacen.broadcasterLogin } : null)
  const [recompensas, setRecompensas] = useState([])
  const [rewardId, setRewardId] = useState(() => almacen.rewardId)
  const [premios, setPremios] = useState(() => {
    const g = almacen.premios
    return g.length === GEMAS.length ? g : premiosPorDefecto()
  })
  const [cargando, setCargando] = useState(false)
  const [aviso, setAviso] = useState('')
  const [copiado, setCopiado] = useState(false)

  // Si la vuelta de Twitch trajo un error, viene en el hash como #config?error=
  useEffect(() => {
    const i = window.location.hash.indexOf('?')
    if (i === -1) return
    const err = new URLSearchParams(window.location.hash.slice(i + 1)).get('error')
    if (err) setAviso(`Twitch rechazó el permiso: ${err}`)
  }, [])

  const cargarDatos = useCallback(async (tk) => {
    setCargando(true)
    setAviso('')
    try {
      const u = await obtenerUsuario(tk)
      almacen.broadcasterId = u.id
      almacen.broadcasterLogin = u.display_name || u.login
      setUsuario(u)
      const r = await obtenerRecompensas(tk, u.id)
      setRecompensas(r)
      if (!r.length) {
        setAviso('La cuenta no tiene recompensas de puntos de canal. Créalas en Twitch (hace falta ser afiliado o socio) y recarga.')
      }
    } catch (e) {
      if (e?.status === 401) {
        setAviso('El token caducó o no vale. Vuelve a iniciar sesión.')
        almacen.token = ''
        setToken('')
      } else if (e?.status === 403) {
        setAviso('Twitch respondió 403: la cuenta necesita ser afiliado o socio para tener puntos de canal.')
      } else {
        setAviso(e?.message || 'No se pudo hablar con Twitch')
      }
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    if (token && !usuario) cargarDatos(token)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  function entrar() {
    // La marca sobrevive al viaje a Twitch y sirve para volver aquí aunque
    // el hash se pierda por el camino.
    almacen.volviendoDeLogin = true
    window.location.href = urlDeAutorizacion()
  }

  function salir() {
    almacen.limpiar()
    setToken(''); setUsuario(null); setRecompensas([]); setRewardId('')
    setPremios(premiosPorDefecto())
    setAviso('Sesión cerrada.')
  }

  function elegirRecompensa(id) {
    setRewardId(id)
    almacen.rewardId = id
  }

  function editarPremio(i, valor) {
    const copia = [...premios]
    copia[i] = valor
    setPremios(copia)
    almacen.premios = copia
  }

  const listo = Boolean(token && usuario && rewardId)
  const enlace = listo ? urlDelWidget(premios) : ''

  async function copiar() {
    try {
      await navigator.clipboard.writeText(enlace)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      setAviso('No se pudo copiar. Selecciona el enlace y cópialo a mano.')
    }
  }

  return (
    <div className="cfg">
      <header className="cfg-nav">
        <a className="cfg-back" href="#">← volver al blog</a>
        <span className="cfg-navtitle">RULETA · AJUSTES</span>
      </header>

      <main className="cfg-main">
        {aviso && <p className="cfg-aviso">{aviso}</p>}

        {/* ---------- 1. entrar ---------- */}
        <section className="cfg-card">
          <h2><i>1</i> Entra con Twitch</h2>

          {hayClientId() ? (
            <>
              <div className="cfg-acciones">
                <button className="cfg-btn primario grande" onClick={entrar}>
                  {token ? 'Volver a entrar con Twitch' : 'Entrar con Twitch'}
                </button>
                {token && <button className="cfg-btn" onClick={salir}>Cerrar sesión</button>}
              </div>
              {usuario && (
                <p className="cfg-ok">Conectado como <b>{usuario.display_name}</b> · ID {usuario.id}</p>
              )}
            </>
          ) : (
            /* Sin Client ID no hay OAuth posible: Twitch lo exige. Se pide una
               sola vez, en el código, y esta tarjeta desaparece para siempre. */
            <>
              <p className="cfg-aviso">
                Falta configurar el Client ID de la aplicación. Es cosa de una vez.
              </p>
              <ol className="cfg-pasos">
                <li>Crea una aplicación en <a href="https://dev.twitch.tv/console/apps" target="_blank" rel="noreferrer">dev.twitch.tv/console/apps</a>, tipo <b>Public</b>.</li>
                <li>Pon exactamente esta URL de redirección:<code className="cfg-code">{uriDeRedireccion()}</code></li>
                <li>Copia el Client ID y ponlo en un archivo <code>.env</code> junto al <code>package.json</code>:<code className="cfg-code">VITE_TWITCH_CLIENT_ID=tu_client_id</code></li>
                <li>Reinicia el servidor y vuelve aquí. Este paso se convierte en un botón y no vuelve a aparecer.</li>
              </ol>
            </>
          )}
        </section>

        {/* ---------- 2. recompensa ---------- */}
        <section className={`cfg-card ${usuario ? '' : 'apagada'}`}>
          <h2><i>2</i> Recompensa que gira la ruleta</h2>
          {cargando && <p className="cfg-nota">Cargando recompensas…</p>}
          {!cargando && !usuario && <p className="cfg-nota">Entra con Twitch para ver tus recompensas.</p>}
          {!cargando && usuario && (
            <>
              <select className="cfg-select" value={rewardId} onChange={(e) => elegirRecompensa(e.target.value)}>
                <option value="">— elige una recompensa —</option>
                {recompensas.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title} · {r.cost} pts{r.is_enabled ? '' : ' (desactivada)'}
                  </option>
                ))}
              </select>
              <button className="cfg-btn" onClick={() => cargarDatos(token)}>Recargar lista</button>
            </>
          )}
        </section>

        {/* ---------- 3. premios ---------- */}
        <section className="cfg-card">
          <h2><i>3</i> Valores de la ruleta</h2>
          <p className="cfg-nota">
            La skin de la ruleta no cambia: siguen siendo las ocho gemas. Esto es lo
            que se canta al final, en el «esto te ha tocado».
          </p>
          <div className="cfg-premios">
            {GEMAS.map((g, i) => (
              <label key={g.id} className="cfg-premio">
                <span className="cfg-gema" style={{ background: g.base }} aria-hidden="true" />
                <span className="cfg-gemanombre">{g.id}</span>
                <input
                  className="cfg-input" value={premios[i] ?? ''} maxLength={40}
                  onChange={(e) => editarPremio(i, e.target.value)}
                  placeholder={`Premio de la gema ${g.id.toLowerCase()}`}
                />
              </label>
            ))}
          </div>
          <button className="cfg-btn" onClick={() => { setPremios(premiosPorDefecto()); almacen.premios = premiosPorDefecto() }}>
            Restablecer
          </button>
        </section>

        {/* ---------- 4. OBS ---------- */}
        <section className={`cfg-card ${listo ? '' : 'apagada'}`}>
          <h2><i>4</i> Enlace para OBS</h2>
          {listo ? (
            <>
              <p className="cfg-nota">
                Pégalo en un <b>Browser Source</b> de OBS, 1920×1080, con
                «Apagar la fuente cuando no esté visible» desactivado.
              </p>
              <code className="cfg-code cfg-enlace">{enlace}</code>
              <div className="cfg-acciones">
                <button className="cfg-btn primario" onClick={copiar}>{copiado ? '¡Copiado!' : 'Copiar enlace'}</button>
                <a className="cfg-btn" href={`${enlace}&demo=1`} target="_blank" rel="noreferrer">Probar en una pestaña</a>
              </div>
              <p className="cfg-alerta">
                El enlace lleva tu token dentro: no lo enseñes en directo ni lo compartas.
                El token de Twitch caduca solo, y cuando pase habrá que volver a entrar
                aquí y pegar el enlace nuevo en OBS.
              </p>
            </>
          ) : (
            <p className="cfg-nota">Completa los pasos 1 y 2 y aquí aparecerá el enlace.</p>
          )}
        </section>
      </main>
    </div>
  )
}
