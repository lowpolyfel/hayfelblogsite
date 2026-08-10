import { useEffect, useRef, useState } from 'react'
import { Icon } from '../../shared/assets/icons/Icon'
import { PixelSprite } from '../../shared/assets/sprites/PixelSprite'
import { Wordmark } from '../../shared/assets/logos/Wordmark'
import { useBlipSound } from '../../shared/assets/sounds/useBlipSound'
import { makePattern, makeGrain } from '../../shared/assets/patterns/backgroundPatterns'
import { Window } from '../../shared/ui/Window'
import {
  badges, bio, coolLinks, downloadz, entries, externalSites, initialGuests,
  moods, playlist, socialLinks, thingsILove,
} from './data/content'
import './void.css'

const BG_STYLES = [
  { id: 'stars', label: 'stars' },
  { id: 'bolt', label: 'lightning' },
  { id: 'heart', label: 'hearts' },
]
const BG_PATTERNS = {
  stars: makePattern('star', 42, '#12061f', 'rgba(216,182,255,.55)'),
  bolt: makePattern('bolt', 90, '#12061f', 'rgba(255,111,192,.5)'),
  heart: makePattern('heart', 40, '#12061f', 'rgba(201,166,245,.45)'),
}
const grainPattern = makeGrain(7)

const NAV = [
  ['home', '#top', 'home'], ['about', '#about', 'heart'], ['diary', '#entry', 'sparkle'],
  ['guestbook', '#board', 'chain'], ['linkz', '#linkz', 'external'],
]

const GALLERY_TILES = [
  { icon: 'heart', bg: 'pink' }, { icon: 'eye', bg: 'lilac' }, { icon: 'sparkle', bg: 'purple' },
  { icon: 'skull', bg: 'ink' }, { icon: 'chain', bg: 'lilac' }, { icon: 'flame', bg: 'pink' },
]

export function VoidPage() {
  const [entryIdx, setEntryIdx] = useState(0)
  const [typed, setTyped] = useState('')
  const [trackIdx, setTrackIdx] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [moodIdx, setMoodIdx] = useState(0)
  const [visits, setVisits] = useState(1337)
  const [bgIdx, setBgIdx] = useState(0)
  const [helloOpen, setHelloOpen] = useState(true)
  const [guests, setGuests] = useState(initialGuests)
  const [gname, setGname] = useState('')
  const [gmsg, setGmsg] = useState('')
  const [loginHint, setLoginHint] = useState(false)
  const rootRef = useRef(null)
  const { enabled: sound, toggle: toggleSound, blip } = useBlipSound()

  const entry = entries[entryIdx]
  const bgStyle = BG_STYLES[bgIdx % BG_STYLES.length]
  const clockStr = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setTyped(entry.body); return }
    setTyped(''); let n = 0
    const t = setInterval(() => {
      n += 4; setTyped(entry.body.slice(0, n))
      if (n >= entry.body.length) clearInterval(t)
    }, 14)
    return () => clearInterval(t)
  }, [entry])

  useEffect(() => {
    if (!playing) return
    const t = setInterval(() => setTrackIdx((i) => (i + 1) % playlist.length), 12000)
    return () => clearInterval(t)
  }, [playing])

  useEffect(() => { const t = setInterval(() => setMoodIdx((n) => n + 1), 4200); return () => clearInterval(t) }, [])

  function sparkleBurst(x, y) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const cols = ['#ff6fc0', '#c9a6f5', '#e8dcff', '#ff2f9e']
    for (let i = 0; i < 18; i++) {
      const d = document.createElement('div')
      d.style.cssText = `position:fixed;width:9px;height:9px;z-index:900;pointer-events:none;left:${x}px;top:${y}px;background:${cols[i % cols.length]};clip-path:polygon(50% 0,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)`
      document.body.appendChild(d)
      d.animate([{ transform: 'translate(0,0) scale(1) rotate(0)', opacity: 1 },
      { transform: `translate(${(Math.random() - .5) * 220}px,${(Math.random() - .8) * 220}px) scale(.3) rotate(${Math.random() * 500}deg)`, opacity: 0 }],
        { duration: 700 + Math.random() * 400, easing: 'cubic-bezier(.2,.7,.3,1)' }).onfinish = () => d.remove()
    }
  }

  function pickEntry(i, e) {
    setEntryIdx((i + entries.length) % entries.length); blip('E6')
    if (e) sparkleBurst(e.clientX, e.clientY)
  }

  function sign() {
    if (!gmsg.trim()) return
    setGuests([{ name: gname.trim() || 'anon', message: gmsg.trim() }, ...guests])
    setGname(''); setGmsg(''); blip('A5')
  }

  function fakeLogin(e) {
    e.preventDefault()
    setLoginHint(true)
    blip('D5')
    setTimeout(() => setLoginHint(false), 2200)
  }

  return (
    <div className="vx" ref={rootRef} id="top">
      <div className="vx-bg" style={{ backgroundImage: BG_PATTERNS[bgStyle.id] }} aria-hidden="true" />
      <div className="vx-grain" style={{ backgroundImage: grainPattern }} aria-hidden="true" />

      <div className="chrome">
        <div className="chrome-bar">
          <span className="chrome-title">welcome 2 hayfel.exe</span>
          <span className="chrome-btns">
            <i><Icon name="minimize" size={10} /></i>
            <i><Icon name="maximize" size={9} /></i>
            <i className="danger"><Icon name="close" size={10} /></i>
          </span>
        </div>

        <header className="topnav">
          <a className="brand" href="#top">
            <Icon name="flame" size={16} />
            <Wordmark name="hayfel" suffix=".exe" className="wm" />
            <span className="pulse" aria-hidden="true" /> online now!
          </a>
          <nav aria-label="Navegación principal">
            {NAV.map(([label, href, icon]) => (
              <a key={label} href={href} onClick={() => blip('C6')}><Icon name={icon} size={13} />{label}</a>
            ))}
          </nav>
        </header>

        <div className="layout">
          {/* ---------- SIDEBAR ---------- */}
          <aside className="sidebar">
            <Window title="member login" className="loginbox">
              <form onSubmit={fakeLogin}>
                <label>username<input type="text" placeholder="•••••••" /></label>
                <label>password<input type="password" placeholder="•••••••" /></label>
                <label className="remember"><input type="checkbox" /> remember me</label>
                <button type="submit">go →</button>
                {loginHint && <p className="loginhint">(⌐■_■) decorativo — no hace nada de verdad</p>}
              </form>
            </Window>

            <Window title="navigation" className="navbox">
              <ul>
                {[['home sweet home', '#top'], ['about me', '#about'], ['thoughts', '#entry'],
                ['photo gallery', '#gallery'], ['my playlist', '#playlist'], ['cool links', '#linkz'],
                ['contact me', '#board']].map(([label, href]) => (
                  <li key={label}><a href={href}>› {label}</a></li>
                ))}
              </ul>
            </Window>

            <Window title="visitors" className="visitorbox">
              <button className="counter" aria-label="Sumar una visita"
                onClick={(e) => { setVisits((v) => v + 1); sparkleBurst(e.clientX, e.clientY); blip('E6') }}>
                {String(visits).padStart(6, '0').split('').map((n, i) => <i key={i}>{n}</i>)}
              </button>
              <p className="dim">online now!</p>
            </Window>

            <Window title="status" className="statusbox">
              <div className="statusrow"><PixelSprite accent="#ff2f9e" eye="#e8dcff" variant={1} /><span>too cute to care</span></div>
              <div className="chips">{badges.map((b) => <span key={b}>{b}</span>)}</div>
            </Window>

            <Window title="downloadz" className="dlbox">
              <ul>{downloadz.map((d) => <li key={d}>› {d}</li>)}</ul>
            </Window>
          </aside>

          {/* ---------- MAIN ---------- */}
          <main className="main">
            <section className="hero">
              {helloOpen && (
                <div className="hellobox">
                  <div className="bar"><span>hello there...</span>
                    <button onClick={() => setHelloOpen(false)} aria-label="Cerrar"><Icon name="close" size={10} /></button>
                  </div>
                  <div className="body">
                    <p>you have reached the void.</p>
                    <button className="enter" onClick={() => { setHelloOpen(false); blip('G5') }}>enter ✷</button>
                  </div>
                </div>
              )}

              <Window title="now playing" tag={`${trackIdx + 1}/${playlist.length}`} className="nowplaying">
                <p className="track">{playlist[trackIdx].artist} – {playlist[trackIdx].title}</p>
                <div className="transport">
                  <button onClick={() => { setTrackIdx((i) => (i - 1 + playlist.length) % playlist.length); blip('D5') }}><Icon name="previous" size={13} /></button>
                  <button onClick={() => { setPlaying(!playing); blip('G5') }}>{playing ? <Icon name="pause" size={13} /> : <Icon name="play" size={13} />}</button>
                  <button onClick={() => { setTrackIdx((i) => (i + 1) % playlist.length); blip('F5') }}><Icon name="next" size={13} /></button>
                </div>
              </Window>

              <PixelSprite accent="#ff2f9e" eye="#e8dcff" variant={0} />
              <h1 className="bubble">welcome to my world</h1>
              <p className="tagline">a digital diary from somewhere on the internet</p>
              <a className="scrollcue" href="#about" onClick={() => blip('B5')}><Icon name="arrowDown" size={14} /> scroll down</a>
            </section>

            <section className="grid3" id="about">
              <Window title="about me" accent="pink">
                <div className="aboutrow">
                  <div className="heartimg"><Icon name="heart" size={26} /><span>fragile inside</span></div>
                  <p>{bio}</p>
                </div>
              </Window>
              <Window title="current mood" accent="lilac">
                <div className="moodrow">
                  <PixelSprite accent="#c9a6f5" eye="#ff2f9e" variant={2} />
                  <p>{moods[moodIdx % moods.length]}</p>
                </div>
              </Window>
              <Window title="things i love">
                <ul className="loves">{thingsILove.map((t) => <li key={t}><Icon name="heart" size={11} />{t}</li>)}</ul>
              </Window>
            </section>

            <button className="glitterbanner" onClick={(e) => { sparkleBurst(e.clientX, e.clientY); blip('E6') }}>
              <Icon name="eye" size={16} /> click 4 glitter <Icon name="sparkle" size={14} /> free glitter for your site! <Icon name="eye" size={16} />
            </button>

            <section className="grid3b">
              <Window title="photo gallery" className="gallerybox" id="gallery">
                <div className="tiles">
                  {GALLERY_TILES.map((t, i) => (
                    <div key={i} className={`tile tile-${t.bg}`}><Icon name={t.icon} size={18} /></div>
                  ))}
                </div>
              </Window>

              <Window title="latest entry" tag={entry.date} className="entrybox" id="entry">
                <span className="cat">{entry.category}</span>
                <h3>{entry.title}</h3>
                <div className="entrybody">{typed}</div>
                <div className="entrynav">
                  <button onClick={(e) => pickEntry(entryIdx - 1, e)}><Icon name="previous" size={12} /></button>
                  <button onClick={(e) => pickEntry(entryIdx + 1, e)}>next <Icon name="next" size={12} /></button>
                </div>
              </Window>

              <Window title="playlist" className="playlistbox" id="playlist">
                <ul className="tracks">
                  {playlist.map((s, i) => (
                    <li key={s.title} className={i === trackIdx ? 'on' : ''} onClick={() => { setTrackIdx(i); blip('F5') }}>
                      <span>{i + 1}. {s.artist} – {s.title}</span><em>{s.duration}</em>
                    </li>
                  ))}
                </ul>
              </Window>
            </section>

            <section className="grid2" id="linkz">
              <Window title="cool links">
                <p className="linkrow">{coolLinks.join('  //  ')}</p>
                <div className="pillrow">
                  {externalSites.map((s) => (
                    <span key={s.key} className={`pill ${s.href ? '' : 'soon'}`}>{s.key}{!s.href && <i>soon</i>}</span>
                  ))}
                </div>
              </Window>

              <Window title="find me elsewhere" tag="webring" accent="pink">
                <div className="webringnav">
                  <button><Icon name="previous" size={11} /> prev</button>
                  <Icon name="eye" size={20} />
                  <button>next <Icon name="next" size={11} /></button>
                </div>
                <div className="redgrid">
                  {socialLinks.map((s) => {
                    const body = <><Icon name={s.icon} size={15} /><span>{s.name}</span></>
                    return s.href ? (
                      <a key={s.name} className="redchip" href={s.href} target="_blank" rel="noreferrer">{body}</a>
                    ) : (
                      <span key={s.name} className="redchip soon" aria-disabled="true">{body}<i>soon</i></span>
                    )
                  })}
                </div>
              </Window>
            </section>

            <Window title="message board" tag="don't be shy!" className="boardbox" id="board">
              <div className="gbform">
                <input value={gname} onChange={(e) => setGname(e.target.value)} placeholder="your name" maxLength={18} aria-label="Tu nombre" />
                <input value={gmsg} onChange={(e) => setGmsg(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sign()}
                  placeholder="leave a message..." maxLength={140} aria-label="Tu mensaje" />
                <button onClick={sign}><Icon name="send" size={13} /> sign</button>
              </div>
              <div className="gblist">
                {guests.map((g, i) => (
                  <div className="gbitem" key={i + g.message}>
                    <div className="who">xx {g.name}</div><p>{g.message}</p>
                  </div>
                ))}
              </div>
            </Window>
          </main>
        </div>

        <footer className="footerbar">
          <span>© 2026 hayfel.exe</span><span>best viewed in 1280×800</span><span>made with &lt;3 and glitter</span>
        </footer>
      </div>

      <div className="taskbar">
        <button className="start" onClick={() => document.querySelector('#top')?.scrollIntoView({ behavior: 'smooth' })}>
          <Icon name="sparkle" size={13} /> start
        </button>
        <div className="tabs">
          <span>about_me.html</span><span>i_love_you.txt</span><span>untitled.png</span>
        </div>
        <div className="tray">
          <button aria-label="Cambiar patrón de fondo" onClick={() => { setBgIdx((i) => (i + 1) % BG_STYLES.length); blip('D6') }}>
            <Icon name="sparkle" size={12} /> {bgStyle.label}
          </button>
          <button aria-label="Silenciar sonido" className={sound ? 'on' : ''} onClick={toggleSound}>
            {sound ? <Icon name="volume" size={12} /> : <Icon name="muted" size={12} />}
          </button>
          <span className="clock">{clockStr}</span>
        </div>
      </div>
    </div>
  )
}
