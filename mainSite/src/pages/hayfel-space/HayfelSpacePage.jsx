import { useEffect, useRef, useState } from 'react'
import { Icon } from '../../shared/assets/icons/Icon'
import { PixelSprite } from '../../shared/assets/sprites/PixelSprite'
import { Wordmark } from '../../shared/assets/logos/Wordmark'
import { useBlipSound } from '../../shared/assets/sounds/useBlipSound'
import { backgroundStyles, grainPattern, patterns, televisionPattern, tileSizes } from '../../shared/assets/patterns/backgroundPatterns'
import { DraggableStickers, FloatingPapers } from './components/Decorations'
import { Slab } from './components/Slab'
import { Window } from './components/Window'
import { bootLog, externalSites, initialGuests, moods, posts, schedule, socialLinks, songs } from './data/content'
import './hayfel-space.css'


export function HayfelSpacePage() {
  const [booting, setBooting] = useState(true);
  const [bootP, setBootP] = useState(0);
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [typed, setTyped] = useState("");
  const [visits, setVisits] = useState(13407);
  const [tick, setTick] = useState(0);
  const [meter, setMeter] = useState(0);
  const [bgIdx, setBgIdx] = useState(0);
  const [guests, setGuests] = useState([
    ...initialGuests
  ]);
  const [gname, setGname] = useState("");
  const [gmsg, setGmsg] = useState("");
  const rootRef = useRef(null);
  const { enabled: sound, toggle: toggleSound, blip } = useBlipSound();

  const featured = posts[idx % posts.length] || posts[0];
  const bgStyle = backgroundStyles[bgIdx % backgroundStyles.length];

  function cycleBg() {
    setBgIdx((i) => (i + 1) % backgroundStyles.length);
    blip("D6");
  }

  useEffect(() => {
    const t = setInterval(() => {
      setBootP((p) => {
        const n = Math.min(100, p + 9 + Math.random() * 14);
        if (n >= 100) { clearInterval(t); setTimeout(() => { setBooting(false); setMeter(62); }, 420); }
        return n;
      });
    }, 160);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (booting) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setTyped(featured.body); return; }
    setTyped(""); let n = 0;
    const t = setInterval(() => {
      n += 5; setTyped(featured.body.slice(0, n));
      if (n >= featured.body.length) clearInterval(t);
    }, 12);
    return () => clearInterval(t);
  }, [featured, booting]);

  useEffect(() => {
    if (!playing || booting) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % posts.length), 9000);
    return () => clearInterval(t);
  }, [playing, booting]);

  useEffect(() => { const t = setInterval(() => setTick((n) => n + 1), 3200); return () => clearInterval(t); }, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let last = 0;
    const h = (e) => {
      const now = performance.now(); if (now - last < 55) return; last = now;
      const d = document.createElement("div");
      d.style.cssText = `position:fixed;width:8px;height:8px;z-index:800;pointer-events:none;left:${e.clientX - 4}px;top:${e.clientY - 4}px;background:${Math.random() > .5 ? "#ff1f3f" : "#0b0708"}`;
      document.body.appendChild(d);
      d.animate([{ opacity: .9, transform: "scale(1)" }, { opacity: 0, transform: "scale(0)" }],
        { duration: 480, easing: "ease-out" }).onfinish = () => d.remove();
    };
    window.addEventListener("pointermove", h, { passive: true });
    return () => window.removeEventListener("pointermove", h);
  }, []);

  function confetti(x, y) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const cols = ["#0b0708", "#d40e31", "#ff1f3f", "#f5ede2", "#ffc300", "#6e0a1c"];
    for (let i = 0; i < 26; i++) {
      const d = document.createElement("div");
      const star = i % 3 === 0;
      d.style.cssText = `position:fixed;width:11px;height:11px;z-index:800;pointer-events:none;left:${x}px;top:${y}px;background:${cols[i % cols.length]};${star ? "clip-path:polygon(50% 0,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%);" : ""}`;
      document.body.appendChild(d);
      d.animate([{ transform: "translate(0,0) rotate(0)", opacity: 1 },
      { transform: `translate(${(Math.random() - .5) * 300}px,${120 + Math.random() * 240}px) rotate(${Math.random() * 900}deg)`, opacity: 0 }],
        { duration: 950 + Math.random() * 500, easing: "cubic-bezier(.2,.7,.3,1)" }).onfinish = () => d.remove();
    }
  }

  function pick(post, e) {
    const i = posts.indexOf(post);
    setIdx(i < 0 ? 0 : i); setPlaying(false); blip("E6");
    if (e) confetti(e.clientX, e.clientY);
    rootRef.current?.querySelector(".tv")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function sign() {
    if (!gmsg.trim()) return;
    setGuests([{ name: gname.trim() || "anon", message: gmsg.trim() }, ...guests]);
    setGname(""); setGmsg(""); blip("A5");
  }

  const AV = ["#d40e31", "#0b0708", "#ff1f3f", "#ffc300", "#6e0a1c"];
  const hour = new Date().getHours();
  const clockStr = new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
  const bootFill = Math.round(bootP / 5);

  return (
    <div className="hs" ref={rootRef}>
      <div className="bglayer" style={{ backgroundImage: patterns[bgStyle.id], "--tsize": `${tileSizes[bgStyle.id]}px` }} aria-hidden="true" />
      <div className="grainlayer" style={{ backgroundImage: grainPattern }} aria-hidden="true" />
      <FloatingPapers />
      <div className="vig" aria-hidden="true" />

      <div className={`boot ${booting ? "" : "off"}`} role="status">
        <div className="bgp" style={{ backgroundImage: patterns.grid }} aria-hidden="true" />
        <div className="bootwin">
          <div className="bbar"><i /><i /><i /><span style={{ marginLeft: 6 }}>SISTEMA.BOOT</span></div>
          <div className="bbody">
            <Wordmark variant="boot" suffix="SPACE" />
            <div className="sub">iniciando interfaz personal</div>
            <div className="bootlog">
              {bootLog.map((l, i) => {
                const threshold = ((i + 1) / bootLog.length) * 100;
                if (bootP < threshold - 25) return null;
                const done = bootP >= threshold;
                return <div key={l}><span className={done ? "ok" : ""}>{done ? "> " : "· "}{l}</span></div>;
              })}
              <span className="cur" />
            </div>
            <div className="bootgrid">
              {Array.from({ length: 20 }).map((_, i) => <i key={i} className={i < bootFill ? "fill" : ""} />)}
            </div>
            <div className="bootpct"><span>CARGANDO</span><span>{Math.min(100, Math.round(bootP))}%</span></div>
          </div>
        </div>
      </div>

      <div className="wrap">

        {/* ---------- CABECERA: taskbar + menú de sitios hermanos ---------- */}
        <header className="head">
          <Slab rotation={-4} clip="shard" face="shadow" className="stamp hover">
            <Wordmark suffix="TRANSMITE" />
          </Slab>

          <div className="win taskbar">
            <span className="wdots"><i /><i /><i /></span>
            <span className="wname">HAYFELSPACE.EXE</span>
            <nav className="tabs" aria-label="Otros sitios de Hayfel">
              {externalSites.map((s, i) => {
                const Body = <>
                  <PixelSprite accent={s.accent} eye={i % 2 ? "#f5ede2" : "#ff1f3f"} variant={i} />
                  {s.key}
                  {s.href && <Icon name="external" size={11} />}
                </>;
                return s.href ? (
                  <a key={s.key} className="tabbtn" href={s.href} target="_blank" rel="noreferrer" onClick={() => blip("C6")}>{Body}</a>
                ) : (
                  <span key={s.key} className="tabbtn soon" aria-disabled="true">{Body}<i className="soontag">PRONTO</i></span>
                );
              })}
            </nav>
            <span className="clock">{clockStr}</span>
            <button className={`snd2 ${sound ? "on" : ""}`} onClick={toggleSound}>
              {sound ? <Icon name="volume" size={13} /> : <Icon name="muted" size={13} />} {sound ? "ON" : "OFF"}
            </button>
          </div>

          <nav className="quicknav">
            {[["ENTRADAS", "#banners"], ["PROGRAMA", "#prog"], ["VISITAS", "#gb"], ["REDES", "#redes"], ["LINKS", "#pie"]].map(([txt, href]) => (
              <button key={txt} className="qbtn" onClick={() => { blip("B5"); document.querySelector(href)?.scrollIntoView({ behavior: "smooth" }); }}>
                {txt}
              </button>
            ))}
          </nav>
        </header>

        {/* ---------- CONSOLA ---------- */}
        <section className="console">
          <Slab rotation={-1} clip="torn" face="crim" className="screen" delay={140}>
            <div className="tv">
              <div className="grain" style={{ backgroundImage: televisionPattern }} aria-hidden="true" />
              <span className="cat">{featured.category}</span>{" "}
              <span className="date">{featured.date}</span>
              <h2>{featured.title}</h2>
              <div className="body">{typed}</div>
            </div>
          </Slab>

          <Window title="REPRODUCTOR" tag={`${idx % posts.length + 1}/${posts.length}`} className="side">
            <div className="transport2">
              <button className="tbtn2" onClick={() => { setIdx((i) => (i - 1 + posts.length) % posts.length); setPlaying(false); blip("D5"); }}><Icon name="previous" size={15} /></button>
              <button className="tbtn2" onClick={() => { setPlaying(!playing); blip("G5"); }}>{playing ? <Icon name="pause" size={15} /> : <Icon name="play" size={15} />}</button>
              <button className="tbtn2" onClick={() => { setIdx((i) => (i + 1) % posts.length); setPlaying(false); blip("F5"); }}><Icon name="next" size={15} /></button>
            </div>
            <div>
              <div className="stat"><b>categoría</b><span>{featured.category}</span></div>
              <div className="stat"><b>sonando</b><span>{songs[tick % songs.length]}</span></div>
              <div className="stat"><b>humor</b><span>{moods[tick % moods.length]}</span></div>
            </div>
            <div className="hint">se avanza solo cada 9s, o usa los botones</div>
          </Window>
        </section>

        {/* ---------- DOS PANELES: horario + perfil (con "ahora mismo" integrado) ---------- */}
        <section className="row3" id="prog">
          <Window title="PROGRAMACIÓN DE HOY" crimsonBar>
            <div className="inset sched">
              {schedule.map(([t, w]) => {
                const h = parseInt(t, 10);
                const live = hour >= h && hour < h + 2;
                return <div key={t}><b>{t}</b><span className={live ? "live" : ""}>{w}</span></div>;
              })}
            </div>
            <div className="hint">en rojo = lo que debería estar haciendo</div>
          </Window>

          <Window title="PERFIL.EXE" goldBar>
            <div className="pfp">
              <PixelSprite accent="#d40e31" eye="#ff1f3f" />
              <div>
                <div className="kick">HOLA!! soy Hayfel</div>
                <div className="bio">
                  <p style={{ margin: "0 0 8px" }}>Estudio ingeniería en la UACJ y ahorita vivo dentro de mi tesis: un sistema de varios agentes que se pelean entre ellos para limpiar requisitos ambiguos.</p>
                  <p style={{ margin: 0 }}>Fuera de eso: fierros por la tarde, cocinar con demasiada especia, y dibujar cuando el compilador me deja en paz.</p>
                </div>
                <div className="badges">
                  <span>CIUDAD JUÁREZ</span><span>UACJ</span><span>GYM 5PM</span><span>LANGGRAPH</span>
                </div>
              </div>
            </div>
            <div className="now">
              <div className="nowtitle">AHORA MISMO</div>
              <ul className="nowl">
                <li><b>leyendo</b><span>papers de RE</span></li>
                <li><b>comiendo</b><span>pollo, otra vez</span></li>
                <li><b>tesis</b><span>capítulo 4</span></li>
              </ul>
              <div className="meter"><i style={{ width: `${meter}%` }} /></div>
              <div className="hint">62% escrito · 100% ansiedad</div>
            </div>
          </Window>
        </section>

        {/* ---------- BANNERS: bento, mezcla de tamaños y formas ---------- */}
        <section className="banners" id="banners">
          {posts.slice(0, 4).map((p, i) => (
            i === 0 ? (
              <Window key={p.title} title={p.category} tag={p.date} crimsonBar className={`ban lg hover`} onClick={(e) => pick(p, e)}>
                <div className="n">DESTACADO · N°01</div>
                <h4>{p.title}</h4>
                <span className="go">LEER YA!</span>
              </Window>
            ) : (
              <Slab key={p.title} rotation={i % 2 ? 2.4 : -2.4} clip={i % 2 ? "b" : "torn"} face={p.face}
                className="ban hover" delay={420 + i * 80} onClick={(e) => pick(p, e)}>
                <div className="k">{p.category} · {p.date}</div>
                <h4>{p.title}</h4>
                <span className="go">LEER YA!</span>
              </Slab>
            )
          ))}
        </section>

        {/* ---------- PANELES DE PAPEL ---------- */}
        <section className="row2" id="gb">
          <Window title="LIBRO DE VISITAS">
            <div className="gbform">
              <input value={gname} onChange={(e) => setGname(e.target.value)} placeholder="tu nombre" maxLength={18} aria-label="Tu nombre" />
              <input value={gmsg} onChange={(e) => setGmsg(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sign()}
                placeholder="deja algo escrito..." maxLength={140} aria-label="Tu mensaje" />
              <button onClick={sign}>FIRMAR</button>
            </div>
            <div className="gblist">
              {guests.map((g, i) => (
                <div className="gbitem" key={i + g.message}>
                  <div className="av" style={{ background: AV[i % AV.length] }} />
                  <div><div className="who">&gt;&gt; {g.name}</div><p>{g.message}</p></div>
                </div>
              ))}
            </div>
            <div className="hint">las firmas se borran al recargar (prototipo, todavía sin base de datos)</div>
          </Window>

          <Window title="ARCHIVO">
            <ul className="arch">
              {posts.map((p) => (
                <li key={p.title} onClick={(e) => pick(p, e)}>
                  <em>{p.date}</em><span>{p.title}</span>
                </li>
              ))}
            </ul>
            <div className="tags">
              <span>agentes LLM</span><span>pixel art</span><span>upper/lower</span>
              <span>curry</span><span>CSS plano a propósito</span><span>webrings</span>
            </div>
          </Window>
        </section>

        {/* ---------- REDES: estilo "link in bio" ---------- */}
        <section className="redwrap" id="redes">
          <Window title="REDES" tag="link in bio" crimsonBar>
            <div className="redgrid">
              {socialLinks.map((s) => {
                const Body = (
                  <>
                    <span className="ico"><Icon name={s.icon} size={18} /></span>
                    <span className="txt">
                      <span className="plat">{s.name}</span>
                      <span className="handle">{s.handle}</span>
                    </span>
                    <span className="tag">{s.href ? <Icon name="external" size={12} /> : "PRONTO"}</span>
                  </>
                );
                return s.href ? (
                  <a key={s.name} className="redcard" href={s.href} target="_blank" rel="noreferrer">{Body}</a>
                ) : (
                  <div key={s.name} className="redcard soon" aria-disabled="true">{Body}</div>
                );
              })}
            </div>
            <div className="hint">los links todavía no están puestos — solo falta rellenar el href de cada uno en socialLinks.</div>
          </Window>
        </section>

        {/* ---------- PIE: ventana regular con estampas irregulares dentro ---------- */}
        <Window title="HAYFELSPACE" tag="© 2026" className="foot" id="pie">
          <div className="inner">
            <div>
              <div style={{ letterSpacing: 2, marginBottom: 6 }}>VISITAS</div>
              <button className="counter" aria-label="Sumar una visita"
                onClick={(e) => { setVisits((v) => v + 1); confetti(e.clientX, e.clientY); blip("E6"); }}>
                {String(visits).padStart(6, "0").split("").map((n, i) => <i key={i}>{n}</i>)}
              </button>
            </div>
            <div className="ring">
              <span className="b88" style={{ "--r": "-4deg" }}>CÓDIGO<br />ABIERTO</span>
              <span className="b88 x" style={{ "--r": "3deg" }}>SIN<br />ADS</span>
              <span className="b88 y" style={{ "--r": "-2deg" }}>HECHO<br />A MANO</span>
            </div>
            <div style={{ textAlign: "right", lineHeight: 1.6, fontSize: 11 }}>
              se ve mejor con la ventana grande<br />
              <span style={{ opacity: .7 }}>fondo actual: {bgStyle.label.toLowerCase()}</span>
            </div>
          </div>
        </Window>
      </div>

      <DraggableStickers />

      <button className="bgswitch" onClick={cycleBg} aria-label="Cambiar fondo">
        <Icon name="refresh" size={13} />
        <span className="bglabel">FONDO: {bgStyle.label}</span>
        <span className="dotsrow">
          {backgroundStyles.map((b, i) => <i key={b.id} className={i === bgIdx ? "on" : ""} />)}
        </span>
      </button>
    </div>
  );
}
