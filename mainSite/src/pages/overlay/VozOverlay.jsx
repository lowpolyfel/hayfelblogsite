import { useCallback, useEffect, useRef } from 'react'
import { useLector } from '../../features/voz/useLector'
import { useTwitchEventSub } from '../../services/api/twitch/useTwitchEventSub'
import { bandera, useWidget } from './useWidget'
import './overlay.css'

/**
 * Widget del lector de voz para OBS. No dibuja nada en la escena: solo
 * suena. Va en su propio Browser Source, aparte del de la ruleta, para
 * poder ponerlo en las escenas que se quiera.
 *
 * En OBS el tamaño da igual y puede quedarse fuera de cuadro; lo que hace
 * falta es que la fuente esté activa y con el audio encaminado a la mezcla.
 */
export function VozOverlay() {
  const { cfg, fallo } = useWidget()
  const lector = useLector(cfg?.voz?.ajustes)

  const alCanjear = useCallback((canje) => {
    // Sin texto no hay nada que leer: pasa cuando la recompensa se creó sin
    // marcar "requerir que el espectador introduzca texto".
    if (!canje.input?.trim()) return
    lector.encolar({ usuario: canje.usuario, texto: canje.input })
  }, [lector])

  const { estado, error } = useTwitchEventSub({
    token: cfg?.accessToken ?? '',
    clientId: cfg?.clientId ?? '',
    broadcasterId: cfg?.broadcasterId ?? '',
    rewardId: cfg?.voz?.rewardId ?? '',
    onCanje: alCanjear,
  })

  // Prueba sin gastar puntos: &demo=1 en el enlace.
  //
  // Una sola vez por carga. El efecto depende de `cfg`, y `cfg` se renueva
  // cada vez que se pide token fresco: sin este cerrojo, cada renovación
  // volvía a soltar la frase de prueba, y en OBS sonaba en bucle.
  const demoHecha = useRef(false)
  useEffect(() => {
    if (!cfg || !bandera('demo') || demoHecha.current) return
    demoHecha.current = true
    const t = setTimeout(
      () => lector.encolar({ usuario: 'Alguien', texto: 'Prueba del lector de voz del canal.' }),
      800,
    )
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cfg])

  const sinRecompensa = cfg && !cfg.voz?.rewardId
  const sinVoces = lector.soportado && lector.voces.length === 0

  const leyenda =
    fallo || error
    || (sinRecompensa ? 'sin recompensa asignada · elígela en el panel' : '')
    || (!lector.soportado ? 'este navegador no tiene lector de voz' : '')
    || (sinVoces ? 'sin voces instaladas — mira la nota de abajo' : '')
    || { inactivo: 'esperando configuración…', conectando: 'conectando con Twitch…',
         suscrito: 'escuchando canjes', reconectando: 'reconectando…', error: 'error' }[estado]

  const tono = fallo || error || sinVoces || sinRecompensa || !lector.soportado ? 'error' : estado

  if (bandera('silencioso')) return null

  return (
    <div className="ov-voz">
      {/* Si esto aparece encima del directo es que la URL pegada en OBS
          lleva &demo=1. Se avisa a gritos en vez de dejar que se note solo
          porque algo habla sin que nadie canjee nada. */}
      {bandera('demo') && <div className="ov-demo">MODO PRUEBA · quita &demo=1 de la URL de OBS</div>}
      <div className={`ov-estado est-${tono}`}>voz · {leyenda}</div>

      {/* Este panel no sale en el directo si se añade &silencioso=1. Está
          aquí para poder ver qué pasa sin abrir la consola de OBS. */}
      {sinVoces && (
        <div className="ov-nota">
          El navegador de OBS suele venir sin voces instaladas. Si te pasa,
          abre este mismo enlace en una ventana de Chrome normal y captura su
          audio desde OBS: funciona igual y no cuesta nada.
        </div>
      )}

      {lector.hablando && (
        <div className="ov-hablando">
          <b>{lector.hablando.usuario}</b>
          <span>{lector.hablando.texto}</span>
        </div>
      )}

      {lector.historial.length > 0 && (
        <ul className="ov-historial">
          {lector.historial.slice(0, 4).map((h, i) => (
            <li key={h.en + i} className={h.descartado ? 'fuera' : ''}>
              <b>{h.usuario}</b> {h.descartado ? `— descartado (${h.descartado})` : h.texto}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
