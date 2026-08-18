import { useState } from 'react'
import { Icon } from '../../shared/assets/icons/Icon'
import { PixelSprite } from '../../shared/assets/sprites/PixelSprite'
import { Starfield } from '../../shared/assets/patterns/Starfield'
import { Reveal } from '../../shared/ui/Reveal'
import { TornPaper } from '../../shared/ui/TornPaper'
import { Y2kCorners, Y2kDivider } from '../../shared/ui/Y2kBits'
import { PersonaMenu } from '../../shared/ui/PersonaMenu'
import { navLinks } from '../legacy/data/content'
import { jpLine, links, marquee, profile, siteLinks } from './data/content'
import './redes.css'

// Sitio alterno tipo linktree: misma paleta, mismo fondo de estrellas y las
// mismas piezas (papel roto para separar, marcos Y2K para las piezas).
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

      {/* ---------- PERFIL ---------- */}
      <section className="rds-hero">
        <Reveal as="div" variant="scale" className="rds-card torn-host">
          <TornPaper cut="both" base="crimson" top="ink2" />

          <div className="rds-avatar y2k-frame dark">
            <Y2kCorners />
            <div className="y2k-inner flush">
              <PixelSprite accent="#c8102e" eye="#ffffff" />
              <span className="y2k-tint" aria-hidden="true" />
            </div>
          </div>

          <h1 className="rds-name">{profile.name}</h1>
          <span className="rds-handle">{profile.handle}</span>
          <p className="rds-bio">{profile.bio}</p>
          <span className="rds-meta">{profile.meta}</span>
        </Reveal>
      </section>

      <div className="rds-marquee" aria-hidden="true">
        <span>{marquee.repeat(6)}</span>
      </div>

      {/* ---------- ENLACES ---------- */}
      <section className="rds-linkswrap torn-host">
        <TornPaper cut="both" base="paper" top="ink2" />

        <Reveal as="div" variant="up" className="rds-sectionhead">
          <div><span className="rds-kicker">01 — ENLACES</span><h2>DÓNDE MÁS ESTOY</h2></div>
          <span className="rds-note">todavía sin enlazar, pero ahí van</span>
        </Reveal>

        <div className="rds-links">
          {links.map((l, i) => {
            const body = (
              <>
                <span className={`rds-linkicon tone-${l.tone}`}><Icon name={l.icon} size={20} /></span>
                <span className="rds-linktext">
                  <b>{l.name}</b>
                  <em>{l.handle} · {l.note}</em>
                </span>
                <span className="rds-linkgo">{l.href ? '↗' : 'PRONTO'}</span>
              </>
            )
            const cls = `rds-link y2k-frame ${i % 2 ? 'dark' : ''} ${l.href ? '' : 'soon'}`
            return l.href ? (
              <Reveal as="a" key={l.name} variant="up" delay={i * 70} className={cls}
                href={l.href} target="_blank" rel="noreferrer">
                <Y2kCorners />
                <div className="y2k-inner flush rds-linkinner">{body}</div>
              </Reveal>
            ) : (
              <Reveal as="span" key={l.name} variant="up" delay={i * 70} className={cls} aria-disabled="true">
                <Y2kCorners />
                <div className="y2k-inner flush rds-linkinner">{body}</div>
              </Reveal>
            )
          })}
        </div>

        <Y2kDivider jp={jpLine} />

        <div className="rds-site">
          {siteLinks.map((s, i) => (
            <Reveal as="a" key={s.label} variant="up" delay={i * 80} className="rds-sitelink" href={s.href}>
              <b>{s.label}</b><em>{s.note}</em><span>→</span>
            </Reveal>
          ))}
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
