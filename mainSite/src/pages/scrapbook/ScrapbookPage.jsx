import { useState } from 'react'
import { Icon } from '../../shared/assets/icons/Icon'
import { PixelSprite } from '../../shared/assets/sprites/PixelSprite'
import { Starfield } from '../../shared/assets/patterns/Starfield'
import { Reveal } from '../../shared/ui/Reveal'
import { confetti } from '../../shared/lib/confetti'
import { PersonaMenu } from '../../shared/ui/PersonaMenu'
import {
  badges, bio, footerWord, gallery, initialGuests, navLinks, notice, posts, socialLinks, statement, tags,
} from './data/content'
import './scrapbook.css'

const BG_PRESETS = [
  { variant: 0, red: '#c8102e', label: 'crimson · deriva' },
  { variant: 1, red: '#1450c8', label: 'azul · lluvia' },
  { variant: 2, red: '#c89010', label: 'dorado · galaxia' },
]

export function ScrapbookPage() {
  const [navOpen, setNavOpen] = useState(false)
  const [bgIdx, setBgIdx] = useState(0)
  const [visits, setVisits] = useState(13407)
  const [guests, setGuests] = useState(initialGuests)
  const [gname, setGname] = useState('')
  const [gmsg, setGmsg] = useState('')

  const bg = BG_PRESETS[bgIdx % BG_PRESETS.length]

  function bumpVisits(e) {
    setVisits((v) => v + 1)
    confetti(e.clientX, e.clientY)
  }

  function sign() {
    if (!gmsg.trim()) return
    setGuests([{ name: gname.trim() || 'anon', message: gmsg.trim() }, ...guests])
    setGname(''); setGmsg('')
  }

  return (
    <div className="scb">
      <Starfield className="scb-bg" variant={bg.variant} red={bg.red} paused={navOpen} />

      <button className="scb-bgswitch" onClick={() => setBgIdx((i) => (i + 1) % BG_PRESETS.length)} aria-label="Cambiar fondo">
        <Icon name="sparkle" size={11} /> {bg.label}
      </button>

      <header className="scb-nav">
        <span className="scb-logo">HAYFEL<i>.</i></span>
        <button className="scb-hamburger" aria-label={navOpen ? 'Cerrar menú' : 'Abrir menú'} aria-expanded={navOpen}
          onClick={() => setNavOpen((v) => !v)}>
          <Icon name={navOpen ? 'close' : 'menu'} size={17} />
        </button>
      </header>

      {/* ---------- HERO: collage + título ---------- */}
      <Reveal as="section" variant="scale" className="scb-hero">
        <div className="scb-collage">
          <div className="scb-card torn-a tone-crimson c1"><PixelSprite accent="#1a1a1a" eye="#f3f0e6" /></div>
          <div className="scb-card torn-b tone-paper c2"><Icon name="sparkle" size={26} /></div>
          <div className="scb-card torn-c tone-ink c3"><Icon name="heart" size={24} /></div>
          <span className="scb-pin p1" aria-hidden="true" />
          <span className="scb-pin p2" aria-hidden="true" />
          <h1 className="scb-title">HAYFEL<span>SPACE</span></h1>
          <span className="scb-tagline">scrapbook de un blog <em>sin editar</em></span>
        </div>
      </Reveal>

      <div className="scb-marquee" aria-hidden="true">
        <span>{notice} ~ {notice} ~ {notice} ~</span>
      </div>

      {/* ---------- STATEMENT gigante ---------- */}
      <Reveal as="section" variant="up" className="scb-statement torn-both">
        <span className="scb-sticker star" aria-hidden="true" />
        <h2>{statement}</h2>
        <span className="scb-sticker boom" aria-hidden="true">¡!</span>
      </Reveal>

      {/* ---------- SOBRE MI ---------- */}
      <Reveal as="section" variant="left" className="scb-about">
        <div className="scb-about-photo torn-a">
          <PixelSprite accent="#c8102e" eye="#ffffff" />
        </div>
        <div className="scb-about-copy">
          <h3>SOBRE MI <span>¿la razón?</span></h3>
          {bio.map((p, i) => <p key={i}>{p}</p>)}
          <div className="scb-chips">{badges.map((b) => <span key={b}>{b}</span>)}</div>
          <div className="scb-tags">{tags.map((t) => <span key={t}>{t}</span>)}</div>
        </div>
      </Reveal>

      {/* ---------- ENTRADAS RECIENTES ---------- */}
      <section className="scb-posts" id="posts">
        <Reveal as="div" variant="up" className="scb-sectionhead">
          <h3>ENTRADAS RECIENTES</h3><span>sin feed, sin algoritmo</span>
        </Reveal>
        <div className="scb-postgrid">
          {posts.map((p, i) => (
            <Reveal as="article" key={p.title} variant="up" delay={i * 90} className={`scb-postcard torn-${'abcd'[i % 4]} rot-${i % 4}`}>
              <span className="cat">{p.category}</span>
              <h4>{p.title}</h4>
              <span className="date">{p.date}</span>
              <span className="go">leer →</span>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------- HISTORIAS (guestbook) ---------- */}
      <section className="scb-stories" id="firmas">
        <Reveal as="div" variant="up" className="scb-sectionhead on-dark">
          <h3>HISTORIAS</h3><span>lo que dejó la gente al pasar</span>
        </Reveal>
        <div className="scb-storylist">
          {guests.map((g, i) => (
            <Reveal as="div" key={i + g.message} variant={i % 2 ? 'right' : 'left'} className="scb-story">
              <div className="pfp" style={{ background: ['#c8102e', '#f3f0e6', '#ff3b52'][i % 3] }} />
              <div><b>{g.name}</b><p>{g.message}</p></div>
            </Reveal>
          ))}
        </div>
        <Reveal as="div" variant="up" className="scb-signcard torn-b">
          <input value={gname} onChange={(e) => setGname(e.target.value)} placeholder="tu nombre" maxLength={18} aria-label="Tu nombre" />
          <input value={gmsg} onChange={(e) => setGmsg(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sign()}
            placeholder="deja tu historia..." maxLength={140} aria-label="Tu mensaje" />
          <button onClick={sign}><Icon name="send" size={13} /> firmar</button>
        </Reveal>
      </section>

      {/* ---------- GALERÍA ---------- */}
      <Reveal as="section" variant="up" className="scb-gallery">
        <h3>GALERÍA</h3>
        <div className="scb-gallerygrid">
          {gallery.map((t, i) => (
            <Reveal as="div" key={i} variant="scale" delay={i * 60} className={`tile tone-${t.tone}`}>
              <Icon name={t.icon} size={20} />
            </Reveal>
          ))}
        </div>
      </Reveal>

      {/* ---------- SÍGUEME ---------- */}
      <Reveal as="section" variant="up" className="scb-social">
        <h3>SÍGUEME</h3>
        <div className="scb-sociallist">
          {socialLinks.map((s) => {
            const body = <><Icon name={s.icon} size={17} /><span>{s.name}</span></>
            return s.href ? (
              <a key={s.name} className="scb-sociallink" href={s.href} target="_blank" rel="noreferrer">{body}</a>
            ) : (
              <span key={s.name} className="scb-sociallink soon" aria-disabled="true">{body}<i>pronto</i></span>
            )
          })}
        </div>
      </Reveal>

      {/* ---------- FOOTER ---------- */}
      <footer className="scb-footer">
        <div className="scb-footerword">{footerWord}</div>
        <div className="scb-footmeta">
          <span>© 2026</span>
          <button onClick={bumpVisits}>{String(visits).padStart(6, '0')} visitas</button>
          <a href="#legacy">versión legacy ↗</a>
        </div>
      </footer>

      <PersonaMenu open={navOpen} onClose={() => setNavOpen(false)} items={navLinks} visits={visits} />
    </div>
  )
}
