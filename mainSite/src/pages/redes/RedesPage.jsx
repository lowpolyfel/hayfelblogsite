import { useState } from 'react'
import { Icon } from '../../shared/assets/icons/Icon'
import { Starfield } from '../../shared/assets/patterns/Starfield'
import { Reveal } from '../../shared/ui/Reveal'
import { TornPaper } from '../../shared/ui/TornPaper'
import { PersonaMenu } from '../../shared/ui/PersonaMenu'
import { navLinks } from '../legacy/data/content'
import { headCopy, jpLine, links } from './data/content'
import './redes.css'

// Sitio alterno tipo linktree. Ya no hay ficha de perfil ni accesos al resto
// del sitio: la página es solo los enlaces, en un panel de cristal que flota
// sobre el fondo de estrellas y queda encajado entre dos filos rasgados.
export function RedesPage() {
  const [navOpen, setNavOpen] = useState(false)

  return (
    <div className="rds">
      <Starfield className="rds-bg" variant={0} red="#c8102e" paused={navOpen} />

      <header className="rds-nav">
        <a className="rds-back" href="#"><Icon name="arrowDown" size={14} /> VOLVER AL BLOG</a>
        <span className="rds-navmeta y2k-jp">{jpLine}</span>
        <button className="rds-hamburger" aria-label={navOpen ? 'Cerrar menú' : 'Abrir menú'} aria-expanded={navOpen}
          onClick={() => setNavOpen((v) => !v)}>
          <Icon name={navOpen ? 'close' : 'menu'} size={18} />
        </button>
      </header>

      {/* ---------- ENLACES ---------- */}
      {/* Los filos rasgados van sueltos arriba y abajo en vez de rellenar la
          sección entera: así el fondo de estrellas se sigue viendo por
          detrás del panel, que es lo que lo hace flotar. */}
      <section className="rds-linkswrap">
        <div className="rds-cut torn-host" aria-hidden="true">
          <TornPaper cut="bottom" base="crimson" top="ink" />
        </div>

        <Reveal as="div" variant="up" className="rds-glass">
          <div className="rds-glasshead">
            <h1>{headCopy.title}</h1>
            <span className="rds-note">{headCopy.note}</span>
          </div>

          <div className="rds-links">
            {links.map((l, i) => {
              const body = (
                <>
                  <span className={`rds-linkicon tone-${l.tone}`}><Icon name={l.icon} size={22} /></span>
                  <span className="rds-linktext">
                    <b>{l.name}</b>
                    <em>{l.handle}</em>
                    <i>{l.note}</i>
                  </span>
                  <span className="rds-linkgo">{l.href ? '↗' : 'PRONTO'}</span>
                </>
              )
              const cls = `rds-link ${l.href ? '' : 'soon'}`
              return l.href ? (
                <Reveal as="a" key={l.name} variant="up" delay={i * 60} className={cls}
                  href={l.href} target="_blank" rel="noreferrer">{body}</Reveal>
              ) : (
                <Reveal as="span" key={l.name} variant="up" delay={i * 60} className={cls}
                  aria-disabled="true">{body}</Reveal>
              )
            })}
          </div>
        </Reveal>

        <div className="rds-cut torn-host" aria-hidden="true">
          <TornPaper cut="top" base="crimson" top="ink" />
        </div>
      </section>

      <footer className="rds-footer">
        <div className="rds-footerword">HAYFEL</div>
        <div className="rds-footmeta">
          <span>© 2026</span>
          <a href="#">VOLVER AL BLOG</a>
        </div>
      </footer>

      <PersonaMenu open={navOpen} onClose={() => setNavOpen(false)} items={navLinks} visits={13407} />
    </div>
  )
}
