import { useState, useEffect, useRef, useCallback } from "react";

/* ============================================================
   HAYFEL BROADCAST SYSTEM  ·  v2
   Loop de arranque para Twitch. OBS: Browser Source 1920x1080 @ 60fps.
   Teclas: espacio = pausa · ← → = escena · M = audio · F = fullscreen
   ============================================================ */

const CONFIG = {
  channel: "HAYFEL",
  url: "twitch.tv/hayfel",
  channelNo: "03",
  est: "2026",
  standbyTitle: "TRANSMISIÓN INICIANDO",
  standbySub: "EN VIVO EN BREVE",
  katakana: "ハイフェル・エンタテインメント・システム",
  system: "VIDEO BROADCAST SYSTEM",
  tagline: "WE RUN DIFFERENTLY",
  warnJP:
    "本放送の無断転載・再配信は固く禁じられています。すべての権利は配信者に留保されています。",
  warnEN:
    "Unauthorized rebroadcast, reupload or reproduction of this stream is strictly prohibited. All rights reserved.",
  index: [
    ["01", "CUENTA REGRESIVA", "AHORA"],
    ["02", "APERTURA", "00:05"],
    ["03", "SESIÓN PRINCIPAL", "00:20"],
    ["04", "CHARLA / CHAT", "01:40"],
    ["05", "CIERRE", "02:10"],
  ],
};

const SCENES = [
  { id: "boot", ms: 5400 },
  { id: "bars", ms: 4600 },
  { id: "warning", ms: 7000 },
  { id: "globe", ms: 7800 },
  { id: "grid", ms: 6400 },
  { id: "logo", ms: 6600 },
  { id: "lockup", ms: 7200 },
  { id: "index", ms: 6400 },
  { id: "standby", ms: 6600 },
];

const BOOT_LINES = [
  { k: "SYSTEM", v: `${CONFIG.channel} BROADCAST SYSTEM` },
  { k: "FORMAT", v: "NTSC · SP · 4:3" },
  { k: "TAPE", v: "E-180 · REMAIN 47MIN" },
  { k: "TRACKING", v: "AUTO ····· ADJUSTING" },
  { k: "SIGNAL", v: "LOCKED" },
  { k: "CHANNEL", v: `CH ${CONFIG.channelNo} — ${CONFIG.url.toUpperCase()}` },
];

const dayOfYear = () => {
  const now = new Date();
  return Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
};

/* --- revela N elementos de golpe, uno por uno --- */
function useSteps(count, step, start = 0) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const ids = [];
    for (let i = 1; i <= count; i++) {
      ids.push(setTimeout(() => setN(i), start + i * step));
    }
    return () => ids.forEach(clearTimeout);
  }, [count, step, start]);
  return n;
}

/* --- grano de cinta: ruido correlacionado en horizontal + dropouts --- */
function Grain({ opacity = 0.075, harsh = false }) {
  const ref = useRef(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d", { alpha: true });
    const W = harsh ? 240 : 360;
    const H = harsh ? 60 : 200;
    cv.width = W;
    cv.height = H;
    const img = ctx.createImageData(W, H);
    const buf = new Uint32Array(img.data.buffer);
    let raf = 0;
    let last = 0;
    const fps = harsh ? 24 : 15;

    const draw = (t) => {
      raf = requestAnimationFrame(draw);
      if (t - last < 1000 / fps) return;
      last = t;

      if (harsh) {
        for (let i = 0; i < buf.length; i++) {
          const v = (Math.random() * 255) | 0;
          buf[i] = (255 << 24) | (v << 16) | (v << 8) | v;
        }
      } else {
        // el ruido de cinta se arrastra a lo largo de la línea, no salta píxel a píxel
        for (let y = 0; y < H; y++) {
          let v = 0;
          let run = 0;
          for (let x = 0; x < W; x++) {
            if (run <= 0) {
              run = 1 + ((Math.random() * 5) | 0);
              v = Math.random() < 0.5 ? 0 : (140 + Math.random() * 115) | 0;
            }
            run--;
            const a = v === 0 ? 0 : 255;
            buf[y * W + x] = (a << 24) | (v << 16) | (v << 8) | v;
          }
        }
        // dropouts: rayitas blancas que cruzan la imagen
        ctx.putImageData(img, 0, 0);
        ctx.fillStyle = "rgba(255,255,255,.85)";
        const hits = Math.random() < 0.35 ? 1 + ((Math.random() * 2) | 0) : 0;
        for (let i = 0; i < hits; i++) {
          const y = (Math.random() * H) | 0;
          const x = (Math.random() * W) | 0;
          ctx.fillRect(x, y, 6 + Math.random() * 40, 1);
        }
        return;
      }
      ctx.putImageData(img, 0, 0);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [harsh]);
  return <canvas ref={ref} className="hb-grain" style={{ opacity }} />;
}

/* --- separación RGB en tres capas --- */
function Chroma({ children, className = "", amount = 3 }) {
  const vars = { "--dx": `${amount}px`, "--dy": `${(amount * 0.4).toFixed(1)}px` };
  return (
    <span className={`hb-chroma ${className}`} style={vars}>
      <span className="hb-ch hb-ch-c" aria-hidden="true">{children}</span>
      <span className="hb-ch hb-ch-m" aria-hidden="true">{children}</span>
      <span className="hb-ch hb-ch-base">{children}</span>
    </span>
  );
}

/* --- globo alámbrico girando, proyección ortográfica a mano --- */
function Globe() {
  const ref = useRef(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    const S = 900;
    cv.width = S;
    cv.height = S;
    const R = S * 0.46;
    const c = S / 2;
    const TILT = (-16 * Math.PI) / 180;
    const ct = Math.cos(TILT);
    const st = Math.sin(TILT);

    const project = (latDeg, lonDeg) => {
      const la = (latDeg * Math.PI) / 180;
      const lo = (lonDeg * Math.PI) / 180;
      const x = Math.cos(la) * Math.sin(lo);
      const y0 = Math.sin(la);
      const z0 = Math.cos(la) * Math.cos(lo);
      const y = y0 * ct - z0 * st;
      const z = y0 * st + z0 * ct;
      return [c + x * R, c - y * R, z];
    };

    const stroke = (pts, front) => {
      ctx.strokeStyle = front ? "rgba(10,10,10,.92)" : "rgba(10,10,10,.30)";
      ctx.lineWidth = front ? 3 : 2.2;
      ctx.beginPath();
      let pen = false;
      for (const [x, y, z] of pts) {
        const vis = z > 0 === front;
        if (!vis) { pen = false; continue; }
        if (!pen) { ctx.moveTo(x, y); pen = true; } else ctx.lineTo(x, y);
      }
      ctx.stroke();
    };

    let raf = 0;
    let last = 0;
    const t0 = performance.now();
    const draw = (t) => {
      raf = requestAnimationFrame(draw);
      if (t - last < 1000 / 30) return;
      last = t;
      const rot = ((t - t0) * 0.022) % 360;

      ctx.clearRect(0, 0, S, S);
      ctx.fillStyle = "#CF1331";
      ctx.beginPath();
      ctx.arc(c, c, R, 0, Math.PI * 2);
      ctx.fill();

      const parallels = [];
      for (let lat = -75; lat <= 75; lat += 15) {
        const pts = [];
        for (let lon = 0; lon <= 360; lon += 4) pts.push(project(lat, lon + rot));
        parallels.push(pts);
      }
      const meridians = [];
      for (let lon = 0; lon < 360; lon += 15) {
        const pts = [];
        for (let lat = -90; lat <= 90; lat += 4) pts.push(project(lat, lon + rot));
        meridians.push(pts);
      }

      for (const p of [...parallels, ...meridians]) stroke(p, false);
      for (const p of [...parallels, ...meridians]) stroke(p, true);

      ctx.strokeStyle = "#0A0A0A";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(c, c, R - 1, 0, Math.PI * 2);
      ctx.stroke();
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);
  return <canvas ref={ref} className="hb-globe-cv" />;
}

/* ===================== ESCENAS ===================== */

function SceneBoot() {
  const n = useSteps(BOOT_LINES.length + 2, 380, 400);
  const bar = Math.min(100, Math.max(0, (n - BOOT_LINES.length + 1) * 34));
  return (
    <div className="hb-scene hb-boot">
      <div className="hb-boot-head">
        {n > 0 && <span className="hb-blk">■</span>}
        {n > 0 && <span className="hb-boot-title">PLAY ▶ AUTO</span>}
      </div>
      <ul className="hb-boot-list">
        {BOOT_LINES.map((l, i) => (
          <li key={l.k} className={`hb-boot-row ${n > i ? "on" : ""}`}>
            <span className="hb-boot-k">{l.k}</span>
            <span className="hb-boot-dots" />
            <span className="hb-boot-v">{l.v}</span>
          </li>
        ))}
      </ul>
      {n >= BOOT_LINES.length && (
        <div className="hb-boot-bar">
          <div className="hb-boot-bar-fill" style={{ width: `${bar}%` }} />
        </div>
      )}
      {n >= BOOT_LINES.length + 2 && <div className="hb-boot-ok">SYSTEM READY</div>}
    </div>
  );
}

/* carta de ajuste — barras y tono */
function SceneBars() {
  const BARS = ["#D9D5C5", "#FD1348", "#1C1C1C", "#CF1331", "#D9D5C5", "#BF1F3C", "#1C1C1C"];
  const n = useSteps(BARS.length + 2, 90, 200);
  return (
    <div className="hb-scene hb-bars">
      <div className="hb-bars-row">
        {BARS.map((c, i) => (
          <i key={i} className={n > i ? "on" : ""} style={{ background: c }} />
        ))}
      </div>
      <div className={`hb-bars-plate ${n > BARS.length ? "on" : ""}`}>
        <div className="hb-bars-block">
          <b>{CONFIG.channel}</b>
          <span>BARS &amp; TONE</span>
        </div>
        <div className="hb-bars-block">
          <b>1 kHz</b>
          <span>−20 dBFS</span>
        </div>
        <div className="hb-bars-block">
          <b>29.97</b>
          <span>FPS NTSC</span>
        </div>
        <div className="hb-bars-block">
          <b>CH {CONFIG.channelNo}</b>
          <span>SP MODE</span>
        </div>
      </div>
      <div className={`hb-bars-strip ${n > BARS.length + 1 ? "on" : ""}`}>
        {Array.from({ length: 22 }).map((_, i) => (
          <i key={i} style={{ opacity: i / 21 }} />
        ))}
      </div>
    </div>
  );
}

function SceneWarning() {
  const n = useSteps(4, 300, 240);
  return (
    <div className="hb-scene hb-warn">
      <div className={`hb-warn-en ${n > 3 ? "on" : ""}`}>{CONFIG.warnEN}</div>
      <div className={`hb-warn-word ${n > 2 ? "on" : ""}`}>
        <Chroma amount={4}>WARNING</Chroma>
      </div>
      <div className={`hb-warn-jp ${n > 1 ? "on" : ""}`}>{CONFIG.warnJP}</div>
      <div className={`hb-warn-kanji ${n > 0 ? "on" : ""}`}>
        <Chroma amount={6}>警告</Chroma>
      </div>
      <div className={`hb-seal ${n > 3 ? "on" : ""}`}>
        <span>{CONFIG.channel.slice(0, 2)}</span>
      </div>
    </div>
  );
}

/* globo relleno + nombre en contorno */
function SceneGlobe() {
  const n = useSteps(4, 300, 260);
  return (
    <div className="hb-scene hb-globe">
      <div className={`hb-globe-wrap ${n > 0 ? "on" : ""}`}>
        <Globe />
      </div>
      <div className={`hb-globe-word ${n > 1 ? "on" : ""}`}>{CONFIG.channel}</div>
      <div className={`hb-globe-sub ${n > 2 ? "on" : ""}`}>{CONFIG.system}</div>
      <div className={`hb-globe-data ${n > 3 ? "on" : ""}`}>
        <span>ORB 01 / R 0.46</span>
        <span>ROT 22°·SEC</span>
        <span>ORTOGRÁFICA</span>
      </div>
    </div>
  );
}

/* horizonte en perspectiva */
function SceneGrid() {
  const n = useSteps(4, 280, 220);
  const glyphs = ["b", "b", "s", "b", "s", "s", "b", "c", "b", "c"];
  return (
    <div className="hb-scene hb-grid">
      <div className={`hb-grid-floor ${n > 0 ? "on" : ""}`}>
        <div className="hb-grid-lines" />
      </div>
      <div className="hb-grid-fade" />
      <div className={`hb-grid-word ${n > 1 ? "on" : ""}`}>
        <Chroma amount={3}>{CONFIG.channel}</Chroma>
      </div>
      <div className={`hb-grid-glyphs ${n > 2 ? "on" : ""}`}>
        {glyphs.map((g, i) => (
          <i key={i} className={`g-${g}`} />
        ))}
      </div>
      <div className={`hb-grid-sub ${n > 3 ? "on" : ""}`}>{CONFIG.system}</div>
    </div>
  );
}

function SceneLogo() {
  const n = useSteps(6, 250, 180);
  const swatches = ["#D9D5C5", "#FD1348", "#BF1F3C", "#1C1C1C"];
  return (
    <div className="hb-scene hb-logo">
      <div className={`hb-logo-tag ${n > 0 ? "on" : ""}`}>VIDEO {CONFIG.channelNo}</div>
      <div className="hb-logo-core">
        <div className={`hb-pill ${n > 1 ? "on" : ""}`}>{CONFIG.channel}</div>
        <div className={`hb-logo-big ${n > 2 ? "on" : ""}`}>
          <Chroma amount={3}>SUPER {CONFIG.channel}</Chroma>
        </div>
        <div className={`hb-kana ${n > 3 ? "on" : ""}`}>{CONFIG.katakana}</div>
      </div>
      <div className={`hb-swatches ${n > 4 ? "on" : ""}`}>
        {swatches.map((c) => (
          <i key={c} style={{ background: c }} />
        ))}
      </div>
      <div className={`hb-dither ${n > 5 ? "on" : ""}`}>
        <div className="hb-dither-glitch" />
      </div>
      <div className={`hb-logo-foot ${n > 5 ? "on" : ""}`}>
        <span>© {new Date().getFullYear()} {CONFIG.channel}</span>
        <span>ENTERTAINMENT SYSTEM</span>
      </div>
    </div>
  );
}

/* lockup tipográfico con código de barras */
function SceneLockup() {
  const n = useSteps(5, 260, 200);
  const bars = useRef(
    Array.from({ length: 68 }).map(() => 1 + Math.floor(Math.random() * 4))
  ).current;
  return (
    <div className="hb-scene hb-lock">
      <div className="hb-lock-inner">
        <div className={`hb-lock-top ${n > 0 ? "on" : ""}`}>
          <span className="hb-lock-diamonds">◆◆◆◆◆◆◆◆◆</span>
          <span>{CONFIG.tagline}™</span>
          <span className="hb-jp">放送中</span>
          <span className="hb-jp">配信は毎晩</span>
        </div>
        <div className={`hb-lock-name ${n > 1 ? "on" : ""}`}>{CONFIG.channel}</div>
        <div className={`hb-lock-bottom ${n > 2 ? "on" : ""}`}>
          <div className="hb-lock-est">
            <span>est. {CONFIG.est}</span>
            <span>{dayOfYear()}/365</span>
          </div>
          <div className={`hb-barcode ${n > 3 ? "on" : ""}`}>
            {bars.map((w, i) => (
              <i key={i} style={{ width: `${w}px` }} />
            ))}
          </div>
          <div className={`hb-lock-badge ${n > 4 ? "on" : ""}`}>
            <span>SEÑAL AUTÉNTICA</span>
            <span className="hb-jp">認証済み放送</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* índice de cinta */
function SceneIndex() {
  const n = useSteps(CONFIG.index.length + 2, 220, 220);
  return (
    <div className="hb-scene hb-idx">
      <div className={`hb-idx-head ${n > 0 ? "on" : ""}`}>
        <span>TAPE INDEX</span>
        <span className="hb-jp">収録内容</span>
      </div>
      <ul className="hb-idx-list">
        {CONFIG.index.map((row, i) => (
          <li key={row[0]} className={`${n > i + 1 ? "on" : ""} ${i === 0 ? "cur" : ""}`}>
            <span className="hb-idx-n">{row[0]}</span>
            <span className="hb-idx-t">{row[1]}</span>
            <span className="hb-idx-rule" />
            <span className="hb-idx-time">{row[2]}</span>
          </li>
        ))}
      </ul>
      <div className={`hb-idx-foot ${n > CONFIG.index.length + 1 ? "on" : ""}`}>
        E-180 · SP · REMAIN 47 MIN
      </div>
    </div>
  );
}

function SceneStandby() {
  const n = useSteps(4, 300, 220);
  const [dots, setDots] = useState(1);
  useEffect(() => {
    const id = setInterval(() => setDots((d) => (d % 3) + 1), 520);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="hb-scene hb-standby">
      <div className={`hb-sb-live ${n > 0 ? "on" : ""}`}>
        <i className="hb-dot" />
        {CONFIG.standbySub}
      </div>
      <h1 className={`hb-sb-title ${n > 1 ? "on" : ""}`}>
        <Chroma amount={4}>{CONFIG.standbyTitle}</Chroma>
      </h1>
      <div className={`hb-sb-jp ${n > 2 ? "on" : ""}`}>まもなく放送開始{".".repeat(dots)}</div>
      <div className={`hb-sb-url ${n > 3 ? "on" : ""}`}>{CONFIG.url}</div>
    </div>
  );
}

/* ===================== APP ===================== */

export default function HayfelBroadcast() {
  const [idx, setIdx] = useState(0);
  const [pass, setPass] = useState(0);
  const [paused, setPaused] = useState(false);
  const [glitch, setGlitch] = useState(false);
  const [sound, setSound] = useState(false);
  const [uiVisible, setUiVisible] = useState(true);
  const [clock, setClock] = useState(0);
  const rootRef = useRef(null);
  const audioRef = useRef(null);

  const scene = SCENES[idx];

  useEffect(() => {
    const l = document.createElement("link");
    l.rel = "stylesheet";
    l.href =
      "https://fonts.googleapis.com/css2?family=Anton&family=Bodoni+Moda:ital,wght@1,700;1,900&family=DotGothic16&family=Noto+Sans+JP:wght@400;700;900&display=swap";
    document.head.appendChild(l);
    return () => {
      if (l.parentNode) l.parentNode.removeChild(l);
    };
  }, []);

  useEffect(() => {
    if (paused) return;
    const t = setTimeout(() => {
      setIdx((v) => (v + 1) % SCENES.length);
      setPass((p) => p + 1);
    }, scene.ms);
    return () => clearTimeout(t);
  }, [idx, paused, scene.ms]);

  useEffect(() => {
    setGlitch(true);
    const t = setTimeout(() => setGlitch(false), 420);
    return () => clearTimeout(t);
  }, [idx, pass]);

  useEffect(() => {
    const id = setInterval(() => setClock((c) => c + 1), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let t;
    const wake = () => {
      setUiVisible(true);
      clearTimeout(t);
      t = setTimeout(() => setUiVisible(false), 4000);
    };
    wake();
    window.addEventListener("mousemove", wake);
    return () => {
      window.removeEventListener("mousemove", wake);
      clearTimeout(t);
    };
  }, []);

  const jump = useCallback((dir) => {
    setIdx((v) => (v + dir + SCENES.length) % SCENES.length);
    setPass((p) => p + 1);
  }, []);

  const toggleSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.ctx.close();
      audioRef.current = null;
      setSound(false);
      return;
    }
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      const ctx = new Ctx();
      const len = ctx.sampleRate * 2;
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * 0.5;
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 1300;
      const g = ctx.createGain();
      g.gain.value = 0.03;
      src.connect(lp).connect(g).connect(ctx.destination);
      const osc = ctx.createOscillator();
      osc.frequency.value = 59.94;
      const og = ctx.createGain();
      og.gain.value = 0.028;
      osc.connect(og).connect(ctx.destination);
      src.start();
      osc.start();
      audioRef.current = { ctx };
      setSound(true);
    } catch (e) {
      setSound(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (audioRef.current) audioRef.current.ctx.close();
    };
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.code === "Space") {
        e.preventDefault();
        setPaused((p) => !p);
      } else if (e.code === "ArrowRight") jump(1);
      else if (e.code === "ArrowLeft") jump(-1);
      else if (e.key.toLowerCase() === "m") toggleSound();
      else if (e.key.toLowerCase() === "f") {
        const el = rootRef.current;
        if (!document.fullscreenElement) el?.requestFullscreen?.();
        else document.exitFullscreen?.();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [jump, toggleSound]);

  const mmss = `${String(Math.floor(clock / 60)).padStart(2, "0")}:${String(clock % 60).padStart(2, "0")}`;

  return (
    <div className={`hb-root ${glitch ? "glitching" : ""}`} ref={rootRef}>
      <style>{CSS}</style>

      <div className="hb-screen">
        <div className="hb-warp">
          <div className="hb-jitter">
            <div className="hb-content" key={`${scene.id}-${pass}`}>
              {scene.id === "boot" && <SceneBoot />}
              {scene.id === "bars" && <SceneBars />}
              {scene.id === "warning" && <SceneWarning />}
              {scene.id === "globe" && <SceneGlobe />}
              {scene.id === "grid" && <SceneGrid />}
              {scene.id === "logo" && <SceneLogo />}
              {scene.id === "lockup" && <SceneLockup />}
              {scene.id === "index" && <SceneIndex />}
              {scene.id === "standby" && <SceneStandby />}
            </div>
          </div>

          <div className="hb-bug hb-bug-tl">
            <span className="hb-rec" /> REC<em>{mmss}</em>
          </div>
          <div className="hb-bug hb-bug-tr">CH {CONFIG.channelNo} · SP</div>
          <div className="hb-bug hb-bug-bl">{CONFIG.url}</div>
          <div className="hb-bug hb-bug-br">{paused ? "❚❚ PAUSE" : "▶ PLAY"}</div>

          <div className="hb-scan" />
          <div className="hb-aperture" />
          <Grain opacity={glitch ? 0.22 : 0.075} />
          <div className="hb-smear" />
          <div className="hb-track" />
          <div className="hb-headswitch">
            <Grain opacity={0.7} harsh />
          </div>
          <div className="hb-vig" />
          <div className="hb-flick" />
        </div>
      </div>

      <div className={`hb-help ${uiVisible ? "on" : ""}`}>
        <b>espacio</b> pausa <b>← →</b> escena <b>M</b> audio {sound ? "on" : "off"} <b>F</b> pantalla completa
      </div>
    </div>
  );
}

/* ===================== CSS ===================== */

const CSS = `
.hb-root{
  --hot:#FD1348; --mid:#CF1331; --deep:#BF1F3C;
  --ink:#1C1C1C; --bone:#D9D5C5;
  --cyan:#2B5CFF; --mag:#FF2FD6;
  --black:#0A0A0A;
  position:relative; width:100%; height:100vh; height:100dvh;
  background:var(--black); overflow:hidden; color:var(--bone);
  font-family:"DotGothic16","Noto Sans JP",monospace;
  -webkit-font-smoothing:none;
}
.hb-jp{font-family:"Noto Sans JP",sans-serif; font-weight:700;}
.hb-screen{position:absolute; inset:0;
  background:radial-gradient(120% 100% at 50% 45%, #1F1F1F 0%, #0E0E0E 58%, #050505 100%);}
.hb-warp{position:absolute; inset:0; overflow:hidden;
  border-radius:1.6vmin/2.6vmin;
  box-shadow:inset 0 0 11vmin rgba(0,0,0,.92), inset 0 0 2vmin rgba(0,0,0,.75);}
.hb-jitter{position:absolute; inset:0; animation:hbJitter 9s steps(1,end) infinite;}
.hb-content{position:absolute; inset:0;}
.hb-scene{position:absolute; inset:0;}

@keyframes hbJitter{
  0%,92%{transform:translate(0,0)}
  93%{transform:translate(-3px,1px)}
  94%{transform:translate(2px,-1px)}
  95%,100%{transform:translate(0,0)}
}

/* ---------- capas de cinta ---------- */
.hb-grain{position:absolute; inset:0; width:100%; height:100%;
  image-rendering:pixelated; mix-blend-mode:screen; pointer-events:none;}
.hb-scan{position:absolute; inset:0; pointer-events:none; z-index:40;
  background:repeating-linear-gradient(to bottom,
    rgba(0,0,0,.30) 0 1px, rgba(0,0,0,0) 1px 3px);
  animation:hbScanDrift 9s linear infinite;}
@keyframes hbScanDrift{to{background-position:0 3px}}
.hb-aperture{position:absolute; inset:0; pointer-events:none; z-index:41; opacity:.18;
  background:repeating-linear-gradient(to right,
    rgba(253,19,72,.5) 0 1px, rgba(43,92,255,.4) 1px 2px, rgba(0,0,0,0) 2px 3px);}
/* arrastre de luminancia hacia la derecha, el borrón típico de la cinta */
.hb-smear{position:absolute; inset:0; pointer-events:none; z-index:39; opacity:.5;
  background:repeating-linear-gradient(to bottom,
    rgba(217,213,197,.045) 0 2px, rgba(0,0,0,0) 2px 9px);
  animation:hbSmear 13s linear infinite;}
@keyframes hbSmear{to{background-position:0 -60px}}
.hb-vig{position:absolute; inset:0; pointer-events:none; z-index:45;
  background:radial-gradient(105% 90% at 50% 50%, rgba(0,0,0,0) 46%, rgba(0,0,0,.55) 84%, rgba(0,0,0,.94) 100%);}
.hb-flick{position:absolute; inset:0; pointer-events:none; z-index:46;
  background:var(--bone); mix-blend-mode:overlay; opacity:0;
  animation:hbFlick 7s steps(1,end) infinite;}
@keyframes hbFlick{0%,95%{opacity:0}96%{opacity:.045}97%,100%{opacity:0}}

.hb-track{position:absolute; left:0; right:0; height:14vmin; z-index:42; pointer-events:none;
  background:linear-gradient(to bottom, rgba(255,255,255,0) 0%,
    rgba(255,255,255,.045) 40%, rgba(255,255,255,.075) 50%, rgba(255,255,255,.03) 68%, rgba(255,255,255,0) 100%);
  animation:hbTrack 14s linear infinite;}
@keyframes hbTrack{0%{top:-16vmin}100%{top:108vmin}}

.hb-headswitch{position:absolute; left:0; right:0; bottom:0; height:1.6vmin; z-index:43;
  overflow:hidden; opacity:.65; filter:contrast(1.5);
  animation:hbHead 4.3s steps(1,end) infinite;}
@keyframes hbHead{0%,92%{transform:translateX(0)}94%{transform:translateX(-5%)}96%{transform:translateX(2%)}100%{transform:translateX(0)}}

.hb-root.glitching .hb-jitter{animation:hbCut .42s steps(1,end) 1;}
@keyframes hbCut{
  0%{transform:translate(0,0) scaleY(1); filter:none}
  14%{transform:translate(-12px,-5px) scaleY(1.05); filter:invert(1) contrast(1.9)}
  28%{transform:translate(9px,3px) scaleY(.95)}
  42%{transform:translate(-5px,0); filter:saturate(2.2)}
  56%{transform:translate(0,-14px) scaleY(1.08)}
  70%{transform:translate(4px,1px)}
  100%{transform:translate(0,0) scaleY(1); filter:none}
}
.hb-root.glitching .hb-scan{opacity:.8}

/* ---------- bugs de canal ---------- */
.hb-bug{position:absolute; z-index:44; font-size:1.5vmin; letter-spacing:.14em;
  color:var(--bone); opacity:.58; text-shadow:1px 0 var(--mag), -1px 0 var(--cyan);
  display:flex; align-items:center; gap:.7vmin; white-space:nowrap;}
.hb-bug em{font-style:normal; opacity:.8; margin-left:.7vmin}
.hb-bug-tl{top:3vmin; left:3.4vmin}
.hb-bug-tr{top:3vmin; right:3.4vmin}
.hb-bug-bl{bottom:3.4vmin; left:3.4vmin}
.hb-bug-br{bottom:3.4vmin; right:3.4vmin}
.hb-rec{width:1.1vmin; height:1.1vmin; border-radius:50%; background:var(--hot);
  box-shadow:0 0 1.2vmin var(--hot); animation:hbBlink 1.1s steps(1,end) infinite;}
@keyframes hbBlink{0%,55%{opacity:1}56%,100%{opacity:.15}}

/* ---------- separación cromática ---------- */
.hb-chroma{position:relative; display:inline-block;}
.hb-ch{display:block}
.hb-ch-c,.hb-ch-m{position:absolute; inset:0; mix-blend-mode:screen; pointer-events:none;
  background:none; -webkit-text-fill-color:currentColor;}
.hb-ch-c{color:var(--cyan); opacity:.5;
  transform:translate(calc(var(--dx) * -1), var(--dy));
  animation:hbShiftA 5.4s steps(1,end) infinite;}
.hb-ch-m{color:var(--mag); opacity:.45;
  transform:translate(var(--dx), calc(var(--dy) * -1));
  animation:hbShiftB 4.1s steps(1,end) infinite;}
.hb-ch-base{position:relative;}
@keyframes hbShiftA{
  0%,90%{transform:translate(calc(var(--dx) * -1), var(--dy))}
  91%{transform:translate(calc(var(--dx) * -4), 3px)}
  93%{transform:translate(calc(var(--dx) * 2), -2px)}
  94%,100%{transform:translate(calc(var(--dx) * -1), var(--dy))}
}
@keyframes hbShiftB{
  0%,93%{transform:translate(var(--dx), calc(var(--dy) * -1))}
  94%{transform:translate(calc(var(--dx) * 4), -4px)}
  96%{transform:translate(calc(var(--dx) * -2), 2px)}
  97%,100%{transform:translate(var(--dx), calc(var(--dy) * -1))}
}

/* ================= BOOT ================= */
.hb-boot{padding:11vmin 8vmin; display:flex; flex-direction:column; justify-content:center;}
.hb-boot-head{display:flex; align-items:center; gap:1.4vmin; margin-bottom:3.4vmin;
  font-size:2.4vmin; letter-spacing:.3em; color:var(--bone);}
.hb-blk{color:var(--hot); animation:hbBlink .8s steps(1,end) infinite;}
.hb-boot-title{text-shadow:2px 0 var(--mid);}
.hb-boot-list{list-style:none; margin:0; padding:0; max-width:82vmin;}
.hb-boot-row{display:flex; align-items:baseline; gap:1.2vmin; font-size:2.5vmin;
  line-height:2; opacity:0; transform:translateX(-1.4vmin); color:var(--bone);}
.hb-boot-row.on{opacity:1; transform:none;}
.hb-boot-k{color:var(--hot); letter-spacing:.22em; min-width:20vmin;
  text-shadow:1px 0 var(--mag);}
.hb-boot-dots{flex:1; border-bottom:2px dotted rgba(217,213,197,.26); transform:translateY(-.5vmin);}
.hb-boot-v{letter-spacing:.1em; text-shadow:1px 0 rgba(43,92,255,.45), -1px 0 rgba(255,47,214,.4);}
.hb-boot-bar{margin-top:4vmin; height:2.2vmin; width:min(70vmin,80%);
  border:2px solid rgba(217,213,197,.42); padding:.5vmin;}
.hb-boot-bar-fill{height:100%; background:var(--hot); transition:width .34s steps(6,end);}
.hb-boot-ok{margin-top:2.6vmin; font-size:2.8vmin; letter-spacing:.4em; color:var(--hot);
  animation:hbBlink 1s steps(1,end) infinite;}

/* ================= BARRAS ================= */
.hb-bars{display:flex; flex-direction:column;}
.hb-bars-row{flex:1; display:flex;}
.hb-bars-row i{flex:1; display:block; opacity:0;}
.hb-bars-row i.on{opacity:1}
.hb-bars-plate{height:24%; display:grid; grid-template-columns:repeat(4,1fr);
  border-top:.6vmin solid var(--black); background:var(--black); opacity:0;}
.hb-bars-plate.on{opacity:1}
.hb-bars-block{display:flex; flex-direction:column; justify-content:center;
  padding:0 3vmin; border-right:.35vmin solid rgba(217,213,197,.22);}
.hb-bars-block:last-child{border-right:0}
.hb-bars-block b{font-family:"Anton",Impact,sans-serif; font-size:5vmin;
  color:var(--bone); letter-spacing:.02em; line-height:1;}
.hb-bars-block span{font-size:1.7vmin; letter-spacing:.28em; color:var(--hot); margin-top:.8vmin;}
.hb-bars-strip{height:7%; display:flex; background:var(--black); opacity:0;}
.hb-bars-strip.on{opacity:1}
.hb-bars-strip i{flex:1; display:block; background:var(--bone);}

/* ================= 警告 ================= */
.hb-warn{display:flex; align-items:stretch; justify-content:flex-end;
  padding:6vmin 4vmin 6vmin 6vmin; gap:3vmin;}
.hb-warn > *{opacity:0}
.hb-warn > .on{opacity:1}
.hb-warn-kanji{order:4; display:flex; align-items:center; margin-left:auto;
  font-family:"Noto Sans JP",sans-serif; font-weight:900; color:var(--hot);
  font-size:46vmin; line-height:.82; letter-spacing:-.04em;
  writing-mode:vertical-rl; text-orientation:upright;
  transform:translateX(4vmin);}
.hb-warn-jp{order:3; writing-mode:vertical-rl; font-family:"Noto Sans JP",sans-serif;
  font-weight:700; font-size:3.2vmin; line-height:1.5; letter-spacing:.06em;
  color:var(--bone); max-height:100%;
  text-shadow:2px 0 var(--mid), -1px 0 rgba(43,92,255,.55);}
.hb-warn-word{order:2; writing-mode:vertical-rl;
  font-family:"Anton",Impact,sans-serif; font-size:13vmin; line-height:.9;
  letter-spacing:.02em; color:var(--hot); text-transform:uppercase;
  align-self:flex-start; transform:scaleY(1.06);}
.hb-warn-en{order:1; writing-mode:vertical-rl; font-family:"Anton",Impact,sans-serif;
  font-size:2.4vmin; letter-spacing:.05em; line-height:1.35; color:var(--bone);
  max-height:100%; opacity:0;}
.hb-warn-en.on{opacity:.9}
.hb-seal{position:absolute; right:5vmin; bottom:5vmin; width:9vmin; height:9vmin;
  border:.5vmin solid var(--deep); display:grid; place-items:center;
  color:var(--deep); font-family:"Anton",Impact,sans-serif; font-size:3.4vmin;
  letter-spacing:.06em; transform:rotate(-4deg); opacity:0;}
.hb-seal.on{opacity:.85}

/* ================= GLOBO ================= */
.hb-globe{display:grid; place-items:center;}
.hb-globe-wrap{position:absolute; top:50%; left:50%; width:78vmin; height:78vmin;
  transform:translate(-50%,-50%); opacity:0;}
.hb-globe-wrap.on{opacity:1}
.hb-globe-cv{width:100%; height:100%; display:block;}
.hb-globe-word{position:relative; z-index:3; font-family:"Anton",Impact,sans-serif;
  font-size:19vmin; letter-spacing:.02em; line-height:1; color:transparent;
  -webkit-text-stroke:.75vmin var(--bone); opacity:0;
  filter:drop-shadow(.5vmin .5vmin 0 rgba(10,10,10,.7));}
.hb-globe-word.on{opacity:1}
.hb-globe-sub{position:absolute; z-index:3; right:9vmin; top:calc(50% + 9vmin);
  font-size:2.4vmin; letter-spacing:.38em; color:var(--bone); text-align:right;
  max-width:22vmin; line-height:1.5; opacity:0;}
.hb-globe-sub.on{opacity:1}
.hb-globe-data{position:absolute; z-index:3; left:6vmin; top:50%; transform:translateY(-50%);
  display:flex; flex-direction:column; gap:1.4vmin; font-size:1.7vmin;
  letter-spacing:.22em; color:var(--bone); opacity:0;}
.hb-globe-data.on{opacity:.75}
.hb-globe-data span{border-left:.4vmin solid var(--hot); padding-left:1.2vmin;}

/* ================= REJILLA ================= */
.hb-grid{overflow:hidden;}
.hb-grid-floor{position:absolute; left:-60%; right:-60%; bottom:-6%; height:62%;
  perspective:26vmin; perspective-origin:50% 0%; opacity:0;}
.hb-grid-floor.on{opacity:1}
.hb-grid-lines{position:absolute; inset:0; transform:rotateX(74deg);
  transform-origin:50% 0%;
  background-image:
    repeating-linear-gradient(to right, var(--bone) 0 2px, transparent 2px 5vmin),
    repeating-linear-gradient(to bottom, var(--bone) 0 2px, transparent 2px 5vmin);
  animation:hbGridRun 1.5s linear infinite;}
@keyframes hbGridRun{to{background-position:0 5vmin, 0 5vmin}}
.hb-grid-fade{position:absolute; inset:0; z-index:2; pointer-events:none;
  background:linear-gradient(to bottom, var(--black) 34%, rgba(10,10,10,.1) 58%, rgba(10,10,10,.75) 100%);}
.hb-grid-word{position:absolute; z-index:3; left:0; right:0; top:20%; text-align:center;
  font-family:"Anton",Impact,sans-serif; font-size:23vmin; line-height:.86;
  color:var(--hot); letter-spacing:-.01em; transform:scaleY(1.18); opacity:0;}
.hb-grid-word.on{opacity:1}
.hb-grid-glyphs{position:absolute; z-index:4; left:0; right:0; bottom:14vmin;
  display:flex; align-items:center; justify-content:center; gap:1.6vmin; opacity:0;}
.hb-grid-glyphs.on{opacity:1}
.hb-grid-glyphs i{display:block; background:var(--hot); height:4.4vmin;}
.hb-grid-glyphs .g-b{width:4.4vmin}
.hb-grid-glyphs .g-s{width:1.5vmin}
.hb-grid-glyphs .g-c{width:4.4vmin; border-radius:50%}
.hb-grid-sub{position:absolute; z-index:4; left:0; right:0; bottom:7vmin; text-align:center;
  font-size:2.4vmin; letter-spacing:.5em; color:var(--bone); opacity:0;}
.hb-grid-sub.on{opacity:1}

/* ================= SUPER HAYFEL ================= */
.hb-logo{display:flex; flex-direction:column; justify-content:center;
  padding:8vmin 9vmin; gap:1vmin;}
.hb-logo-tag{position:absolute; top:8vmin; left:9vmin; font-size:3vmin;
  letter-spacing:.28em; color:var(--bone); opacity:0; transform:translateY(-1vmin);
  text-shadow:2px 0 rgba(253,19,72,.6);}
.hb-logo-tag.on{opacity:1; transform:none;}
.hb-logo-core{position:relative;}
.hb-pill{display:inline-block; background:var(--hot); color:var(--black);
  font-family:"Anton",Impact,sans-serif; font-size:3.4vmin; letter-spacing:.06em;
  padding:.5vmin 2.4vmin .8vmin; margin-bottom:1.4vmin;
  opacity:0; transform:scale(.82); transition:transform .2s steps(4,end);}
.hb-pill.on{opacity:1; transform:none;}
.hb-logo-big{font-family:"Anton",Impact,sans-serif; font-size:14vmin; line-height:.86;
  letter-spacing:-.01em; transform:skewX(-9deg) translateY(1vmin); opacity:0;
  filter:drop-shadow(.7vmin .7vmin 0 rgba(0,0,0,.85));}
.hb-logo-big.on{opacity:1; transform:skewX(-9deg);}
.hb-logo-big .hb-ch-base{
  background:linear-gradient(to bottom,#FF6E85 0 46%, var(--hot) 46% 74%, var(--deep) 74% 100%);
  -webkit-background-clip:text; background-clip:text;
  color:transparent; -webkit-text-fill-color:transparent;}
.hb-kana{font-family:"Noto Sans JP",sans-serif; font-weight:700; font-size:3.4vmin;
  letter-spacing:.42em; color:var(--hot); margin-top:1.6vmin; opacity:0;
  border-top:.4vmin solid var(--deep); border-bottom:.4vmin solid var(--deep);
  padding:.6vmin 0; display:inline-block;}
.hb-kana.on{opacity:1}
.hb-swatches{position:absolute; top:8vmin; right:9vmin; display:flex; gap:1.1vmin; opacity:0;}
.hb-swatches.on{opacity:1}
.hb-swatches i{width:3.2vmin; height:3.2vmin; display:block;
  outline:.3vmin solid rgba(217,213,197,.3); outline-offset:-.3vmin;}
.hb-dither{position:absolute; left:9vmin; right:9vmin; bottom:9vmin; height:20vmin;
  opacity:0; overflow:hidden;
  background:repeating-linear-gradient(to bottom,
    rgba(217,213,197,.5) 0 2px, rgba(0,0,0,0) 2px 5px);
  -webkit-mask-image:linear-gradient(to bottom, #000 0%, #000 62%, transparent 100%);
  mask-image:linear-gradient(to bottom, #000 0%, #000 62%, transparent 100%);}
.hb-dither.on{opacity:.45}
.hb-dither-glitch{position:absolute; left:18%; right:26%; bottom:14%; height:26%;
  background:repeating-linear-gradient(to right,
    var(--hot) 0 6px, var(--bone) 6px 11px, var(--deep) 11px 15px, transparent 15px 34px);
  opacity:.5; animation:hbDither 1.6s steps(4,end) infinite;}
@keyframes hbDither{0%{transform:translateX(0)}100%{transform:translateX(-34px)}}
.hb-logo-foot{position:absolute; left:9vmin; right:9vmin; bottom:4vmin;
  display:flex; justify-content:space-between; font-size:1.7vmin;
  letter-spacing:.2em; color:rgba(217,213,197,.5); opacity:0;}
.hb-logo-foot.on{opacity:1}

/* ================= LOCKUP ================= */
.hb-lock{display:grid; place-items:center; padding:8vmin;}
.hb-lock-inner{width:min(118vmin,92%);}
.hb-lock-top{display:flex; align-items:baseline; gap:3vmin; flex-wrap:wrap;
  font-size:1.9vmin; letter-spacing:.16em; color:var(--hot); opacity:0;
  margin-bottom:.6vmin; padding-left:1vmin;}
.hb-lock-top.on{opacity:1}
.hb-lock-diamonds{letter-spacing:.5em}
.hb-lock-name{font-family:"Bodoni Moda",Didot,Georgia,serif; font-style:italic;
  font-weight:900; font-size:24vmin; line-height:.92; color:var(--bone);
  letter-spacing:-.005em; opacity:0;
  text-shadow:
    .9vmin .9vmin 0 var(--black),
    1.5vmin 1.5vmin 0 var(--deep),
    -.35vmin 0 0 rgba(43,92,255,.55),
    .35vmin 0 0 rgba(253,19,72,.6);}
.hb-lock-name.on{opacity:1}
.hb-lock-bottom{display:flex; align-items:stretch; gap:1.6vmin; margin-top:.8vmin;
  padding-left:1vmin; opacity:0;}
.hb-lock-bottom.on{opacity:1}
.hb-lock-est{display:flex; flex-direction:column; justify-content:center;
  font-size:2vmin; letter-spacing:.1em; color:var(--bone); line-height:1.25;}
.hb-barcode{flex:1; display:flex; align-items:stretch; gap:2px; height:5.6vmin;
  background:var(--bone); padding:.5vmin .8vmin; opacity:0;}
.hb-barcode.on{opacity:1}
.hb-barcode i{display:block; background:var(--black); height:100%;}
.hb-lock-badge{display:flex; flex-direction:column; justify-content:center;
  background:var(--hot); color:var(--black); padding:.6vmin 1.4vmin;
  font-size:1.5vmin; letter-spacing:.1em; line-height:1.4; opacity:0;}
.hb-lock-badge.on{opacity:1}

/* ================= ÍNDICE ================= */
.hb-idx{padding:10vmin 9vmin; display:flex; flex-direction:column; justify-content:center;}
.hb-idx-head{display:flex; align-items:baseline; gap:2.4vmin; font-size:3.4vmin;
  letter-spacing:.34em; color:var(--hot); border-bottom:.5vmin solid var(--deep);
  padding-bottom:1.6vmin; margin-bottom:2.4vmin; opacity:0;}
.hb-idx-head.on{opacity:1}
.hb-idx-head .hb-jp{font-size:2.4vmin; letter-spacing:.24em; color:var(--bone);}
.hb-idx-list{list-style:none; margin:0; padding:0;}
.hb-idx-list li{display:flex; align-items:baseline; gap:2vmin; font-size:2.9vmin;
  line-height:2.05; color:var(--bone); opacity:0; padding:0 1.4vmin;}
.hb-idx-list li.on{opacity:1}
.hb-idx-list li.cur.on{background:var(--hot); color:var(--black);
  animation:hbRowBlink 1.4s steps(1,end) infinite;}
@keyframes hbRowBlink{0%,72%{opacity:1}73%,100%{opacity:.45}}
.hb-idx-n{font-family:"Anton",Impact,sans-serif; min-width:5vmin;}
.hb-idx-t{letter-spacing:.16em;}
.hb-idx-rule{flex:1; border-bottom:2px dotted rgba(217,213,197,.3); transform:translateY(-.6vmin);}
.hb-idx-list li.cur.on .hb-idx-rule{border-color:rgba(10,10,10,.4)}
.hb-idx-time{letter-spacing:.14em;}
.hb-idx-foot{margin-top:3vmin; font-size:1.8vmin; letter-spacing:.3em;
  color:rgba(217,213,197,.55); opacity:0;}
.hb-idx-foot.on{opacity:1}

/* ================= STANDBY ================= */
.hb-standby{display:flex; flex-direction:column; justify-content:center; align-items:center;
  text-align:center; padding:8vmin; gap:2vmin;}
.hb-standby > *{opacity:0}
.hb-standby > .on{opacity:1}
.hb-sb-live{display:flex; align-items:center; gap:1.4vmin; font-size:2.6vmin;
  letter-spacing:.4em; color:var(--bone); border:.35vmin solid var(--deep);
  padding:.8vmin 2.6vmin;}
.hb-dot{width:1.4vmin; height:1.4vmin; border-radius:50%; background:var(--hot);
  animation:hbBlink 1.1s steps(1,end) infinite;}
.hb-sb-title{margin:1vmin 0 0; font-family:"Anton",Impact,sans-serif;
  font-size:11vmin; line-height:.92; max-width:92%; letter-spacing:-.005em;
  color:var(--hot); text-transform:uppercase; transform:scaleY(1.08);
  filter:drop-shadow(.5vmin .5vmin 0 rgba(0,0,0,.8));}
.hb-sb-jp{font-family:"Noto Sans JP",sans-serif; font-weight:700; font-size:3.4vmin;
  letter-spacing:.5em; color:var(--bone); text-shadow:2px 0 var(--mid);}
.hb-sb-url{margin-top:2.4vmin; font-size:2.8vmin; letter-spacing:.34em;
  color:var(--black); background:var(--bone); padding:.7vmin 2.6vmin;
  transform:skewX(-9deg);}

/* ---------- ayuda ---------- */
.hb-help{position:absolute; left:50%; bottom:1.6vmin; transform:translateX(-50%);
  z-index:60; font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-size:11px;
  letter-spacing:.08em; color:rgba(217,213,197,.55); background:rgba(0,0,0,.65);
  padding:6px 12px; opacity:0; transition:opacity .35s ease;
  pointer-events:none; white-space:nowrap;}
.hb-help.on{opacity:1}
.hb-help b{color:var(--hot); font-weight:400}

@media (max-width:760px){
  .hb-warn-kanji{font-size:36vmin}
  .hb-boot-row{font-size:3.2vmin}
  .hb-boot-k{min-width:26vmin}
  .hb-logo-big{font-size:16vmin}
  .hb-lock-name{font-size:26vmin}
  .hb-globe-word{font-size:22vmin}
  .hb-globe-sub{display:none}
  .hb-grid-word{font-size:26vmin}
  .hb-bug{font-size:2.2vmin}
  .hb-idx-list li{font-size:3.4vmin}
}

@media (prefers-reduced-motion:reduce){
  .hb-jitter,.hb-flick,.hb-track,.hb-headswitch,.hb-scan,.hb-smear,
  .hb-ch-c,.hb-ch-m,.hb-dither-glitch,.hb-grid-lines{animation:none!important}
  .hb-root.glitching .hb-jitter{animation:none!important}
}
`;
