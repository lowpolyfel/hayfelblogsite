import { useCallback, useEffect } from 'react'
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
  useEffect(() => {
    if (!cfg || !bandera('demo')) return
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
