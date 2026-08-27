import { useMemo, useState } from 'react'
import { Icon } from '../../shared/assets/icons/Icon'
import { Starfield } from '../../shared/assets/patterns/Starfield'
import { Reveal } from '../../shared/ui/Reveal'
import { TornPaper } from '../../shared/ui/TornPaper'
import { Y2kCorners, Y2kDivider } from '../../shared/ui/Y2kBits'
import { PersonaMenu } from '../../shared/ui/PersonaMenu'
import { navLinks } from '../legacy/data/content'
import { DIAS, MESES, TIPOS, copy, jpLine, marcas, marquee } from './data/content'
import './calendario.css'

// Rejilla del mes con la semana empezando en lunes. getDay() devuelve 0 para
// domingo, así que se corre para que lunes sea 0.
function construirMes(anio, mes) {
  const primero = new Date(anio, mes, 1)
  const desplazamiento = (primero.getDay() + 6) % 7
  const diasDelMes = new Date(anio, mes + 1, 0).getDate()
  const celdas = []
  for (let i = 0; i < desplazamiento; i++) celdas.push(null)
  for (let d = 1; d <= diasDelMes; d++) celdas.push(d)
  // Se completa la última semana para que la rejilla no quede coja
  while (celdas.length % 7 !== 0) celdas.push(null)
  return celdas
}

export function CalendarioPage() {
  const [navOpen, setNavOpen] = useState(false)
  const hoy = useMemo(() => new Date(), [])
  const [anio, setAnio] = useState(hoy.getFullYear())
  const [mes, setMes] = useState(hoy.getMonth())

  const celdas = useMemo(() => construirMes(anio, mes), [anio, mes])
  const delMes = useMemo(() => marcas.filter((m) => m.mes === mes), [mes])
  const porDia = useMemo(() => {
    const mapa = new Map()
    for (const m of delMes) mapa.set(m.dia, m)
    return mapa
  }, [delMes])

  function mover(paso) {
    const d = new Date(anio, mes + paso, 1)
    setAnio(d.getFullYear()); setMes(d.getMonth())
  }
  function volverAHoy() { setAnio(hoy.getFullYear()); setMes(hoy.getMonth()) }

  const esMesActual = anio === hoy.getFullYear() && mes === hoy.getMonth()

  return (
    <div className="cal">
      <Starfield className="cal-bg" variant={0} red="#c8102e" paused={navOpen} />

      <header className="cal-nav">
        <a className="cal-back" href="#"><Icon name="arrowDown" size={14} /> <span>VOLVER AL BLOG</span></a>
        <span className="cal-navmeta y2k-jp">{jpLine}</span>
        <button className="cal-hamburger" aria-label={navOpen ? 'Cerrar menú' : 'Abrir menú'} aria-expanded={navOpen}
          onClick={() => setNavOpen((v) => !v)}>
          <Icon name={navOpen ? 'close' : 'menu'} size={18} />
        </button>
      </header>

      {/* ---------- CABECERA ---------- */}
      <section className="cal-hero">
        <Reveal as="div" variant="scale" className="cal-card torn-host">
          <TornPaper cut="both" base="crimson" top="ink2" />
          <span className="cal-kicker">{copy.kicker}</span>
          <h1 className="cal-title">{copy.title}</h1>
          <p className="cal-intro">{copy.intro}</p>
        </Reveal>
      </section>

      <div className="cal-marquee" aria-hidden="true">
        <span>{marquee.repeat(6)}</span>
      </div>

      {/* ---------- REJILLA ---------- */}
      <section className="cal-gridwrap torn-host">
        <TornPaper cut="both" base="paper" top="ink2" />

        <Reveal as="div" variant="up" className="cal-monthbar">
          <button onClick={() => mover(-1)} aria-label="Mes anterior">←</button>
          <div className="cal-monthname">
            <b>{MESES[mes]}</b><em>{anio}</em>
          </div>
          <button onClick={() => mover(1)} aria-label="Mes siguiente">→</button>
          {!esMesActual && <button className="cal-today" onClick={volverAHoy}>HOY</button>}
        </Reveal>

        <Reveal as="div" variant="up" className="cal-grid y2k-frame dark">
          <Y2kCorners />
          <div className="y2k-inner flush">
            <div className="cal-week" aria-hidden="true">
              {DIAS.map((d, i) => <span key={i}>{d}</span>)}
            </div>
            <div className="cal-days" role="grid" aria-label={`${MESES[mes]} ${anio}`}>
              {celdas.map((d, i) => {
                if (d === null) return <span key={i} className="cal-day empty" aria-hidden="true" />
                const marca = porDia.get(d)
                const esHoy = esMesActual && d === hoy.getDate()
                return (
                  <span key={i} role="gridcell"
                    className={`cal-day ${marca ? `marked tone-${TIPOS[marca.tipo].tone}` : ''} ${esHoy ? 'today' : ''}`}
                    title={marca ? marca.titulo : undefined}>
                    <b>{d}</b>
                    {marca && <i className="cal-dot" aria-hidden="true" />}
                  </span>
                )
              })}
            </div>
          </div>
        </Reveal>

        <div className="cal-legend">
          {Object.entries(TIPOS).map(([k, v]) => (
            <span key={k} className={`cal-legenditem tone-${v.tone}`}><i />{v.label}</span>
          ))}
        </div>

        <Y2kDivider jp={jpLine} />

        {/* ---------- LO MARCADO ESTE MES ---------- */}
        <div className="cal-listwrap">
          <h2 className="cal-listtitle">EN {MESES[mes].toUpperCase()}</h2>
          {delMes.length === 0 ? (
            <p className="cal-empty">{copy.vacio}</p>
          ) : (
            <div className="cal-list">
              {delMes.map((m, i) => (
                <Reveal as="article" key={`${m.mes}-${m.dia}`} variant="up" delay={i * 70}
                  className={`cal-item y2k-frame ${i % 2 ? 'dark' : ''}`}>
                  <Y2kCorners />
                  <div className="y2k-inner flush cal-iteminner">
                    <span className={`cal-itemday tone-${TIPOS[m.tipo].tone}`}>
                      <b>{String(m.dia).padStart(2, '0')}</b>
                      <em>{MESES[m.mes].slice(0, 3)}</em>
                    </span>
                    <span className="cal-itemtext">
                      <b>{m.titulo}</b>
                      <em>{m.nota}</em>
                    </span>
                    <span className="cal-itemtag">{TIPOS[m.tipo].label}</span>
                  </div>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      <footer className="cal-footer">
        <div className="cal-footerword">HAYFEL</div>
        <div className="cal-footmeta">
          <span>© 2026</span>
          <a href="#redes">REDES</a>
          <a href="#">VOLVER AL BLOG</a>
        </div>
      </footer>

      <PersonaMenu open={navOpen} onClose={() => setNavOpen(false)} items={navLinks} visits={13407} />
    </div>
  )
}
