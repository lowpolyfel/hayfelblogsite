import { useCallback, useState } from 'react'
import { Icon } from '../../shared/assets/icons/Icon'
import { PixelSprite } from '../../shared/assets/sprites/PixelSprite'
import { Starfield } from '../../shared/assets/patterns/Starfield'
import { Reveal } from '../../shared/ui/Reveal'
import { BootScreen } from '../../shared/ui/BootScreen'
import { TornPaper } from '../../shared/ui/TornPaper'
import { Globe3D, Y2kCorners, Y2kDivider } from '../../shared/ui/Y2kBits'
import { confetti } from '../../shared/lib/confetti'
import { useSecretTaps } from '../../shared/lib/useSecretTaps'
import { PersonaMenu } from '../../shared/ui/PersonaMenu'
import {
  aboutTitle, badges, bio, bootLines, footerWord, gallery, glassCopy, glassSlots,
  heroLinks, initialGuests, jpLines, navLinks, notice, posts, statement, tags,
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

  // Entradas a las secciones ocultas: cinco toques en el logo de la barra
  // llevan a los overlays del directo, seis en el HAYFEL grande del centro
  // de la portada llevan a las olas.
  const tocarLogo = useSecretTaps(5, '#overlays')
  const tocarTitulo = useSecretTaps(6, '#waves')

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
        <span className="scb-logo" onClick={tocarLogo}>HAYFEL</span>
        <span className="scb-navmeta y2k-jp">{jpLines[2]}</span>
        <button className="scb-hamburger" aria-label={navOpen ? 'Cerrar menú' : 'Abrir menú'} aria-expanded={navOpen}
          onClick={() => setNavOpen((v) => !v)}>
          <Icon name={navOpen ? 'close' : 'menu'} size={18} />
          <b>MENÚ</b>
        </button>
      </header>

      {/* ---------- HERO ---------- */}
      <section className="scb-hero">
        <Reveal as="div" variant="scale" className="scb-heropanel torn-host">
          <TornPaper cut="both" base="crimson" top="ink2" />
          {/* Capa lista para una foto: basta definir --hero-photo sobre .scb */}
          <div className="scb-herophoto" aria-hidden="true" />

          <div className="scb-heroinner">
            <span className="scb-kicker">EST. 2020</span>
            <h1 className="scb-title" onClick={tocarTitulo}>HAYFEL</h1>
            <p className="scb-tagline">blog personal</p>
            {/* Accesos directos a los otros sitios del web. Son la única
                acción de la portada, así que pesan a propósito: bloque
                grande, sombra dura y flecha que se despega al pasar. */}
            <div className="scb-herolinks">
              {heroLinks.map((l) => (
                <a key={l.label} className="scb-herolink" href={l.href}>
                  <span className="scb-herolink-icon" aria-hidden="true">
                    <Icon name={l.icon} size={20} />
                  </span>
                  <span className="scb-herolink-text">
                    <b>{l.label}</b>
                    <em>{l.note}</em>
                  </span>
                  <span className="scb-herolink-go" aria-hidden="true">→</span>
                </a>
              ))}
            </div>
            <p className="y2k-jp scb-herojp">{jpLines[0]}</p>
          </div>

          <span className="scb-pin p1" aria-hidden="true" />
          <span className="scb-pin p2" aria-hidden="true" />
        </Reveal>
      </section>

      {/* ---------- STATEMENT ---------- */}
      <Reveal as="section" variant="up" className="scb-statement torn-host">
        <TornPaper cut="both" base="paper" top="crimson" />
        <span className="scb-sticker star" aria-hidden="true" />
        <h2>{statement}</h2>
        <span className="scb-sticker boom" aria-hidden="true">✚</span>
      </Reveal>

      {/* ---------- SOBRE MI ---------- */}
      <section className="scb-aboutwrap torn-host">
        <TornPaper cut="top" base="crimson" top="ink2" />
        <Reveal as="div" variant="left" className="scb-about">
          <div className="scb-about-photo y2k-frame dark">
            <Y2kCorners />
            <div className="y2k-inner flush">
              <PixelSprite accent="#c8102e" eye="#ffffff" />
              <span className="y2k-tint" aria-hidden="true" />
            </div>
          </div>
          <div className="scb-about-copy">
            <h3>{aboutTitle}</h3>
            {bio.map((p, i) => <p key={i}>{p}</p>)}
            <div className="scb-chips">{badges.map((b) => <span key={b}>{b}</span>)}</div>
            <div className="scb-tags">{tags.map((t) => <span key={t}>{t}</span>)}</div>
          </div>
        </Reveal>
        <Y2kDivider jp={jpLines[1]} />
      </section>

      {/* ---------- ENTRADAS RECIENTES (marcos Y2K, no papel roto) ---------- */}
      <section className="scb-posts torn-host" id="posts">
        <TornPaper cut="both" base="crimson" top="paper" />
        <Reveal as="div" variant="up" className="scb-sectionhead">
          <div><h3>ÚLTIMAS PUBLICACIONES</h3></div>
        </Reveal>
        {/* Fichas de billete troquelado: talón numerado a la izquierda y
            perforado en medio. Nada de contenido todavía, solo el hueco. */}
        <div className="scb-postgrid">
          {posts.map((p, i) => (
            <Reveal as="article" key={p.n} variant="up" delay={i * 90} className="scb-ticket">
              <span className="scb-ticket-stub" aria-hidden="true">{p.n}</span>
              <span className="scb-ticket-perf" aria-hidden="true" />
              <span className="scb-ticket-body">{p.label}</span>
            </Reveal>
          ))}
        </div>
        <Y2kDivider jp={jpLines[0]} flip />
        <Reveal as="p" variant="up" className="y2k-pill">{notice}</Reveal>
      </section>

      {/* ---------- LO ÚLTIMO DE HAYFEL (vitrina de cristal) ---------- */}
      <section className="scb-glass">
        <Reveal as="div" variant="up" className="scb-glasspanel">
          <div className="scb-glasshead">
            <h3>{glassCopy.title}</h3>
            <span className="scb-glasstag">{glassCopy.tag}</span>
          </div>

          <div className="scb-slots">
            {glassSlots.map((s, i) => (
              <Reveal as="figure" key={s.id} variant="scale" delay={i * 70}
                className="scb-slot" style={{ '--img': `var(--slot-${s.id}, none)` }}>
                <span className="y2k-tint" aria-hidden="true" />
                <span className="scb-slot-plat">
                  <Icon name={s.icon} size={14} /> {s.platform}
                </span>
                <span className="scb-slot-soon">PRÓXIMAMENTE</span>
              </Reveal>
            ))}
          </div>

          <div className="scb-glasscard">
            <p>{glassCopy.body}</p>
            <div className="scb-glassfoot">
              <span className="scb-glassmeta">{glassCopy.meta}</span>
              <button type="button" className="scb-glasscta" disabled>
                {glassCopy.cta} <span aria-hidden="true">→</span>
              </button>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ---------- HISTORIAS (guestbook) ---------- */}
      <section className="scb-stories torn-host" id="firmas">
        <TornPaper cut="bottom" base="paper" top="ink2" />
        <Reveal as="div" variant="up" className="scb-sectionhead on-dark">
          <div><h3>HISTORIAS</h3></div>
          <span className="scb-sectionnote">lo que dejó la gente al pasar</span>
        </Reveal>
        <div className="scb-storylist">
          {guests.map((g, i) => (
            <Reveal as="div" key={i + g.message} variant={i % 2 ? 'right' : 'left'} className="scb-story">
              <div><b>{g.name}</b><p>{g.message}</p></div>
            </Reveal>
          ))}
        </div>
        <Reveal as="div" variant="up" className="scb-signcard y2k-frame">
          <Y2kCorners />
          <div className="y2k-inner flush scb-signgrid">
            <input value={gname} onChange={(e) => setGname(e.target.value)} placeholder="tu nombre" maxLength={18} aria-label="Tu nombre" />
            <input value={gmsg} onChange={(e) => setGmsg(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sign()}
              placeholder="deja tu historia..." maxLength={140} aria-label="Tu mensaje" />
            <button onClick={sign}><Icon name="send" size={13} /> FIRMAR</button>
          </div>
        </Reveal>
      </section>

      {/* ---------- GALERÍA ---------- */}
      <section className="scb-gallery torn-host">
        <TornPaper cut="top" base="crimson" top="ink" />
        <Globe3D className="scb-globe g3" rings={5} duration={26} reverse />
        <Reveal as="div" variant="up" className="scb-sectionhead on-dark">
          <div><h3>PEDAZOS SUELTOS</h3></div>
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

      {/* La sección SÍGUEME se quitó: los enlaces ya viven en #redes, al que
          se llega desde el botón de la portada y desde el menú. */}

      {/* ---------- FOOTER ---------- */}
      <footer className="scb-footer">
        <div className="scb-footerword">{footerWord}</div>
        {/* La versión legacy sigue viva en #legacy y su código no se toca:
            solo se quita el enlace mientras ese sitio está en espera. */}
        <div className="scb-footmeta">
          <span>© 2026</span>
          <button onClick={bumpVisits}>{String(visits).padStart(6, '0')} VISITAS</button>
        </div>
      </footer>

      <PersonaMenu open={navOpen} onClose={() => setNavOpen(false)} items={navLinks} visits={visits} />
    </div>
  )
}
