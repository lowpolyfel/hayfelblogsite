import { useEffect, useRef, useState } from 'react'
import { Icon } from '../../shared/assets/icons/Icon'
import { PixelSprite } from '../../shared/assets/sprites/PixelSprite'
import { Starfield } from '../../shared/assets/patterns/Starfield'
import { PersonaMenu } from '../../shared/ui/PersonaMenu'
import {
  badges, bio, bootLines, initialGuests, moods, navLinks, notice, posts, songs, tags,
} from './data/content'
import './legacy.css'

// Las 3 variantes de movimiento del fondo (deriva/lluvia/galaxia), cada una
// con su propio color — para que ciclar entre ellas se sienta como cambiar
// a un fondo distinto.
const BG_PRESETS = [
  { variant: 0, red: '#c8102e', label: 'crimson · deriva' },
  { variant: 1, red: '#1450c8', label: 'azul · lluvia' },
  { variant: 2, red: '#c89010', label: 'dorado · galaxia' },
]

function Sticker({ className, style, children }) {
  const [pos, setPos] = useState(null)
  const dragging = useRef(false)
  const offset = useRef({ x: 0, y: 0 })
  return (
    <div className={`sticker ${className}`} style={pos ? { ...style, left: pos.x, top: pos.y, right: 'auto' } : style}
      onPointerDown={(e) => {
        dragging.current = true
        e.currentTarget.setPointerCapture(e.pointerId)
        const r = e.currentTarget.getBoundingClientRect()
        offset.current = { x: e.clientX - r.left, y: e.clientY - r.top }
      }}
      onPointerMove={(e) => {
        if (!dragging.current) return
        const stage = e.currentTarget.closest('.stage').getBoundingClientRect()
        setPos({ x: e.clientX - offset.current.x - stage.left, y: e.clientY - offset.current.y - stage.top + window.scrollY })
      }}
      onPointerUp={() => { dragging.current = false }}>
      {children}
    </div>
  )
}

export function LegacyPage() {
  const [booting, setBooting] = useState(true)
  const [bootP, setBootP] = useState(0)
  const [bgIdx, setBgIdx] = useState(0)
  const [navOpen, setNavOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [openIdx, setOpenIdx] = useState(-1)
  const [typed, setTyped] = useState('')
  const [tick, setTick] = useState(0)
  const [meter, setMeter] = useState(0)
  const [visits, setVisits] = useState(13407)
  const [ticks, setTicks] = useState('bienvenido a mi rincón del internet ~ sin algoritmo, sin ads, puro yo ~ arrastra los stickers ~ firma el libro de visitas abajo ~')
  const [guests, setGuests] = useState(initialGuests)
  const [gname, setGname] = useState('')
  const [gmsg, setGmsg] = useState('')
  const stageRef = useRef(null)

  const q = query.trim().toLowerCase()
  const shown = posts.filter((p) => !q || (p.title + p.body + p.category).toLowerCase().includes(q))

  useEffect(() => {
    const t = setInterval(() => {
      setBootP((p) => {
        const n = Math.min(100, p + 9 + Math.random() * 14)
        if (n >= 100) { clearInterval(t); setTimeout(() => { setBooting(false); setMeter(62) }, 420) }
        return n
      })
    }, 160)
    return () => clearInterval(t)
  }, [])

  useEffect(() => { const t = setInterval(() => setTick((n) => n + 1), 3200); return () => clearInterval(t) }, [])

  useEffect(() => {
    if (openIdx < 0) return
    const full = posts[openIdx].body
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setTyped(full); return }
    setTyped(''); let n = 0
    const t = setInterval(() => {
      n += 4; setTyped(full.slice(0, n))
      if (n >= full.length) clearInterval(t)
    }, 12)
    return () => clearInterval(t)
  }, [openIdx])

  function confetti(x, y) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const cols = ['#1a1a1a', '#e0122c', '#ff3b52', '#f3f0e6']
    for (let i = 0; i < 22; i++) {
      const d = document.createElement('div')
      d.style.cssText = `position:fixed;width:9px;height:9px;z-index:8000;pointer-events:none;left:${x}px;top:${y}px;background:${cols[i % cols.length]}`
      document.body.appendChild(d)
      d.animate([{ transform: 'translate(0,0) rotate(0)', opacity: 1 },
      { transform: `translate(${(Math.random() - .5) * 260}px,${120 + Math.random() * 220}px) rotate(${Math.random() * 720}deg)`, opacity: 0 }],
        { duration: 900 + Math.random() * 500, easing: 'cubic-bezier(.2,.7,.3,1)' }).onfinish = () => d.remove()
    }
  }

  function bumpVisits(e) {
    const n = visits + 1
    setVisits(n)
    confetti(e.clientX, e.clientY)
    setTicks(`gracias por el click ~ van ${n} visitas ~ vuelve mañana ~ `.repeat(3))
  }

  function sign() {
    if (!gmsg.trim()) return
    setGuests([{ name: gname.trim() || 'anon', message: gmsg.trim() }, ...guests])
    setGname(''); setGmsg('')
  }

  const bg = BG_PRESETS[bgIdx % BG_PRESETS.length]

  return (
    <div className="lobby">
      <Starfield className="lobby-bg" variant={bg.variant} red={bg.red} paused={navOpen} />
      <div className="crt" aria-hidden="true" />

      <div className={`boot ${booting ? '' : 'done'}`} role="status">
        <div className="logo">HAYFEL</div>
        <div className="bar"><div className="fill" style={{ width: `${Math.min(100, bootP)}%` }} /></div>
        <small>{bootLines[Math.min(bootLines.length - 1, Math.floor(bootP / 28))]}</small>
      </div>

      <button className="bgswitch" onClick={() => setBgIdx((i) => (i + 1) % BG_PRESETS.length)} aria-label="Cambiar fondo">
        <Icon name="sparkle" size={12} /> FONDO: {bg.label}
      </button>

      <main className="stage" ref={stageRef}>
        <div className="frame">

          {/* ---------- TOPBAR ---------- */}
          <div className="topbar">
            <span>ACTUALIZADO: 09 AGO 2026</span>
            <div className="ticker"><span>{ticks}</span></div>
            <div className="chips"><i /><i /><i /></div>
          </div>

          {/* ---------- HERO: logo grande + disparador del menú, listo para bg futuro ---------- */}
          <section className="hero" id="hero">
            <button className="hamburger" aria-label={navOpen ? 'Cerrar menú' : 'Abrir menú'} aria-expanded={navOpen}
              onClick={() => setNavOpen((v) => !v)}>
              <Icon name={navOpen ? 'close' : 'menu'} size={18} />
            </button>
            <h1 className="bubble">HAYFEL</h1>
          </section>

          {/* ---------- PERFIL.EXE ---------- */}
          <section className="win">
            <div className="bar">PERFIL.EXE <div className="dots"><i /><i /></div></div>
            <div className="body profile">
              <div className="avatar"><PixelSprite accent="#e0122c" eye="#ffffff" /><div className="tag">&gt;&gt; <b>LOREM</b>/IPSUM</div></div>
              <div className="bio">
                <div className="kicker">HOLA!! <span className="blink">▮</span></div>
                {bio.map((p, i) => <p key={i}>{p}</p>)}
                <div className="badges">{badges.map((b) => <span key={b} className="badge">{b}</span>)}</div>
              </div>
            </div>
          </section>

          {/* ---------- ENTRADAS RECIENTES + SIDEBAR ---------- */}
          <div className="cols">
            <section className="win" id="posts">
              <div className="bar">&gt;&gt; ENTRADAS RECIENTES
                <div className="search">
                  <Icon name="search" size={12} />
                  <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="busca algo raro..." aria-label="Buscar entradas" />
                </div>
              </div>
              <div className="body">
                {shown.map((p) => {
                  const i = posts.indexOf(p)
                  const open = openIdx === i
                  return (
                    <article key={p.title} className="post" tabIndex={0} role="button" aria-expanded={open}
                      onClick={() => setOpenIdx(open ? -1 : i)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpenIdx(open ? -1 : i) } }}>
                      <div className="meta"><span className={`cat ${p.tone}`}>{p.category}</span><span>{p.date}</span></div>
                      <h3>{p.title}</h3>
                      {open && <div className="txt">{typed}</div>}
                      <div className="more">{open ? '[ cerrar ]' : '[ leer ]'}</div>
                    </article>
                  )
                })}
                {shown.length === 0 && <div className="hint">nada con esa palabra. prueba con otra.</div>}
              </div>
            </section>

            <div className="sidebar">
              <section className="win now">
                <div className="bar">AHORA MISMO <div className="dots"><i /></div></div>
                <div className="body">
                  <ul>
                    <li><b>leyendo</b><span>lorem ipsum dolor</span></li>
                    <li><b>sonando</b><span>{songs[tick % songs.length]}</span></li>
                    <li><b>humor</b><span>{moods[tick % moods.length]}</span></li>
                  </ul>
                  <div className="progresslabel">capítulo 4</div>
                  <div className="meter"><i style={{ width: `${meter}%` }} /></div>
                  <div className="hint">62% escrito · 100% ansiedad</div>
                </div>
              </section>

              <section className="win">
                <div className="bar">OBSESIONES <div className="dots"><i /></div></div>
                <div className="body">
                  <div className="tags">{tags.map((t) => <span key={t}>{t}</span>)}</div>
                </div>
              </section>

              <section className="win">
                <div className="bar">AVISO <div className="dots"><i /></div></div>
                <div className="body notice">{notice} <span className="blink">▮</span></div>
              </section>
            </div>
          </div>

          {/* ---------- GUESTBOOK ---------- */}
          <section className="win" id="firmas">
            <div className="bar">LIBRO DE VISITAS <div className="dots"><i /><i /></div></div>
            <div className="body">
              <div className="gbform">
                <input value={gname} onChange={(e) => setGname(e.target.value)} placeholder="tu nombre" maxLength={18} aria-label="Tu nombre" />
                <input value={gmsg} onChange={(e) => setGmsg(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sign()}
                  placeholder="deja algo escrito..." maxLength={140} aria-label="Tu mensaje" />
                <button onClick={sign}>FIRMAR</button>
              </div>
              <div className="gblist">
                {guests.map((g, i) => (
                  <div className="gbitem" key={i + g.message}>
                    <div className="pfp" style={{ background: ['#e0122c', '#1a1a1a', '#ff3b52', '#f3f0e6'][i % 4] }} />
                    <div><div className="who">&gt;&gt; {g.name}</div><p>{g.message}</p></div>
                  </div>
                ))}
              </div>
              <div className="hint">las firmas se borran al recargar (prototipo, todavía sin base de datos)</div>
            </div>
          </section>

          {/* ---------- FOOTER ---------- */}
          <div className="footer" id="pie">
            <div>
              <div className="vlabel">VISITAS</div>
              <button className="counter" aria-label="Sumar una visita" onClick={bumpVisits}>
                {String(visits).padStart(6, '0').split('').map((n, i) => <i key={i}>{n}</i>)}
              </button>
            </div>
            <div className="webring">
              <span className="btn88">CÓDIGO<br />ABIERTO</span>
              <span className="btn88 b2">SIN<br />ADS</span>
              <span className="btn88 b3">HECHO<br />A MANO</span>
            </div>
            <div className="finetext">
              HAYFELSPACE © 2026<br /><span>se ve mejor con la ventana grande</span>
            </div>
          </div>
        </div>

        <Sticker className="star" style={{ left: -34, top: 120 }} />
        <Sticker className="star w" style={{ right: -30, top: 420 }} />
        <Sticker className="note" style={{ right: -72, top: 180 }}>
          <b>NOTA AL MARGEN</b>arrástrame. sí, en serio, agárrame con el mouse.
        </Sticker>
      </main>

      <PersonaMenu open={navOpen} onClose={() => setNavOpen(false)} items={navLinks} visits={visits} />
    </div>
  )
}
