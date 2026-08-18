import { useCallback, useState } from 'react'
import { Icon } from '../../shared/assets/icons/Icon'
import { PixelSprite } from '../../shared/assets/sprites/PixelSprite'
import { Starfield } from '../../shared/assets/patterns/Starfield'
import { Reveal } from '../../shared/ui/Reveal'
import { BootScreen } from '../../shared/ui/BootScreen'
import { confetti } from '../../shared/lib/confetti'
import { PersonaMenu } from '../../shared/ui/PersonaMenu'
import {
  badges, bio, bootLines, footerWord, gallery, glassCopy, glassSlots, initialGuests,
  navLinks, notice, posts, socialLinks, statement, tags, tapeLines,
} from './data/content'
import './scrapbook.css'

const BG_PRESETS = [
  { variant: 0, red: '#c8102e', label: 'crimson · deriva' },
  { variant: 1, red: '#1450c8', label: 'azul · lluvia' },
  { variant: 2, red: '#c89010', label: 'dorado · galaxia' },
]

export function ScrapbookPage() {
  const [booting, setBooting] = useState(true)
  const [navOpen, setNavOpen] = useState(false)
  const [bgIdx, setBgIdx] = useState(0)
  const [visits, setVisits] = useState(13407)
  const [guests, setGuests] = useState(initialGuests)
  const [gname, setGname] = useState('')
  const [gmsg, setGmsg] = useState('')

  const bg = BG_PRESETS[bgIdx % BG_PRESETS.length]
  const bootDone = useCallback(() => setBooting(false), [])

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
      <BootScreen lines={bootLines} onDone={bootDone} />

      <Starfield className="scb-bg" variant={bg.variant} red={bg.red} paused={navOpen || booting} />

      <button className="scb-bgswitch" onClick={() => setBgIdx((i) => (i + 1) % BG_PRESETS.length)} aria-label="Cambiar fondo">
        <Icon name="sparkle" size={11} /> {bg.label}
      </button>

      {/* Barra fija: acompaña el scroll de punta a punta */}
      <header className="scb-nav">
        <span className="scb-logo">HAYFEL</span>
        <span className="scb-navmeta">BLOG PERSONAL — SIN ALGORITMO</span>
        <button className="scb-hamburger" aria-label={navOpen ? 'Cerrar menú' : 'Abrir menú'} aria-expanded={navOpen}
          onClick={() => setNavOpen((v) => !v)}>
          <Icon name={navOpen ? 'close' : 'menu'} size={18} />
          <b>MENÚ</b>
        </button>
      </header>

      {/* ---------- HERO: panel roto + título con relleno de imagen ---------- */}
      <section className="scb-hero">
        <Reveal as="div" variant="scale" className="scb-heropanel scb-band">
          {/* Capa lista para una foto: basta definir --hero-photo sobre .scb */}
          <div className="scb-herophoto" aria-hidden="true" />
          <div className="scb-heroinner">
            <span className="scb-kicker">00 — INICIO</span>
            {/* El relleno del texto sale de --hero-word-img (imagen a futuro) */}
            <h1 className="scb-title">HAYFEL</h1>
            <p className="scb-tagline">blog personal · escrito a mano · sin editar</p>
            <div className="scb-herochips">
              {badges.slice(0, 3).map((b) => <span key={b}>{b}</span>)}
            </div>
          </div>
          <span className="scb-pin p1" aria-hidden="true" />
          <span className="scb-pin p2" aria-hidden="true" />
        </Reveal>
      </section>

      {/* ---------- CINTAS INCLINADAS tipo "no pase" ---------- */}
      <div className="scb-tapezone" aria-hidden="true">
        <div className="scb-tape t1"><span>{tapeLines[0].repeat(4)}</span></div>
        <div className="scb-tape t2"><span>{tapeLines[1].repeat(4)}</span></div>
      </div>

      {/* ---------- STATEMENT ---------- */}
      <Reveal as="section" variant="up" className="scb-statement scb-band">
        <span className="scb-sticker star" aria-hidden="true" />
        <span className="scb-kicker on-crimson">01 — MANIFIESTO</span>
        <h2>{statement}</h2>
        <span className="scb-sticker boom" aria-hidden="true">¡!</span>
      </Reveal>

      {/* ---------- SOBRE MI ---------- */}
      <section className="scb-aboutwrap scb-band">
        <Reveal as="div" variant="left" className="scb-about">
          <div className="scb-about-photo torn-a">
            <PixelSprite accent="#c8102e" eye="#ffffff" />
          </div>
          <div className="scb-about-copy">
            <span className="scb-kicker">02 — SOBRE MI</span>
            <h3>¿LA RAZÓN?</h3>
            {bio.map((p, i) => <p key={i}>{p}</p>)}
            <div className="scb-chips">{badges.map((b) => <span key={b}>{b}</span>)}</div>
            <div className="scb-tags">{tags.map((t) => <span key={t}>{t}</span>)}</div>
          </div>
        </Reveal>
      </section>

      {/* ---------- ENTRADAS RECIENTES ---------- */}
      <section className="scb-posts scb-band" id="posts">
        <Reveal as="div" variant="up" className="scb-sectionhead">
          <div><span className="scb-kicker on-paper">03 — BITÁCORA</span><h3>ENTRADAS RECIENTES</h3></div>
          <span className="scb-sectionnote">sin feed, sin algoritmo</span>
        </Reveal>
        <div className="scb-postgrid">
          {posts.map((p, i) => (
            <Reveal as="article" key={p.title} variant="up" delay={i * 90} className={`scb-postcard torn-${'abcd'[i % 4]} rot-${i % 4}`}>
              <span className="cat">{p.category}</span>
              <h4>{p.title}</h4>
              <span className="date">{p.date}</span>
              <span className="go">LEER →</span>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------- VITRINA DE CRISTAL (huecos listos para imágenes) ---------- */}
      <section className="scb-glass">
        <Reveal as="div" variant="up" className="scb-glasspanel">
          <div className="scb-glassrail">
            {['search', 'tiktok', 'youtube', 'instagram', 'twitch'].map((n) => (
              <span key={n} className="scb-railbtn"><Icon name={n} size={15} /></span>
            ))}
          </div>

          <div className="scb-glassmain">
            <div className="scb-glasshead">
              <div>
                <span className="scb-kicker on-glass">04 — {glassCopy.kicker}</span>
                <h3>{glassCopy.title}</h3>
              </div>
              <span className="scb-glasstime">MON · 23:02</span>
            </div>

            <div className="scb-slots">
              {glassSlots.map((s, i) => (
                <Reveal as="figure" key={s.id} variant="scale" delay={i * 80}
                  className={`scb-slot ${s.span ? `slot-${s.span}` : ''}`}
                  style={{ '--img': `var(--slot-${s.id}, none)` }}>
                  <span className="scb-slotlabel">{s.label}</span>
                  <span className="scb-slotplus" aria-hidden="true">+</span>
                </Reveal>
              ))}
            </div>

            <div className="scb-glasscard">
              <b>descripción.</b>
              <p>{glassCopy.body}</p>
              <span className="scb-glassmeta">{glassCopy.meta}</span>
            </div>
          </div>

          <span className="scb-glassword" aria-hidden="true">HAYFEL</span>
        </Reveal>
      </section>

      {/* ---------- HISTORIAS (guestbook) ---------- */}
      <section className="scb-stories scb-band" id="firmas">
        <Reveal as="div" variant="up" className="scb-sectionhead on-dark">
          <div><span className="scb-kicker">05 — VISITAS</span><h3>HISTORIAS</h3></div>
          <span className="scb-sectionnote">lo que dejó la gente al pasar</span>
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
          <button onClick={sign}><Icon name="send" size={13} /> FIRMAR</button>
        </Reveal>
      </section>

      {/* ---------- GALERÍA ---------- */}
      <section className="scb-gallery scb-band">
        <Reveal as="div" variant="up" className="scb-sectionhead on-dark">
          <div><span className="scb-kicker">06 — GALERÍA</span><h3>PEDAZOS SUELTOS</h3></div>
          <span className="scb-sectionnote">recortes sin orden</span>
        </Reveal>
        <div className="scb-gallerygrid">
          {gallery.map((t, i) => (
            <Reveal as="div" key={i} variant="scale" delay={i * 60} className={`tile tone-${t.tone}`}>
              <Icon name={t.icon} size={20} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------- SÍGUEME ---------- */}
      <section className="scb-social scb-band">
        <Reveal as="div" variant="up" className="scb-sectionhead on-dark">
          <div><span className="scb-kicker">07 — REDES</span><h3>SÍGUEME</h3></div>
          <span className="scb-sectionnote">{notice}</span>
        </Reveal>
        <div className="scb-sociallist">
          {socialLinks.map((s, i) => {
            const body = <><Icon name={s.icon} size={18} /><span>{s.name}</span><em>{s.handle}</em></>
            return s.href ? (
              <Reveal as="a" key={s.name} variant="up" delay={i * 60} className="scb-sociallink"
                href={s.href} target="_blank" rel="noreferrer">{body}</Reveal>
            ) : (
              <Reveal as="span" key={s.name} variant="up" delay={i * 60} className="scb-sociallink soon"
                aria-disabled="true">{body}<i>PRONTO</i></Reveal>
            )
          })}
        </div>
      </section>

      {/* ---------- FOOTER ---------- */}
      <footer className="scb-footer">
        <div className="scb-footerword">{footerWord}</div>
        <div className="scb-footmeta">
          <span>© 2026</span>
          <button onClick={bumpVisits}>{String(visits).padStart(6, '0')} VISITAS</button>
          <a href="#legacy">VERSIÓN LEGACY ↗</a>
        </div>
      </footer>

      <PersonaMenu open={navOpen} onClose={() => setNavOpen(false)} items={navLinks} visits={visits} />
    </div>
  )
}
