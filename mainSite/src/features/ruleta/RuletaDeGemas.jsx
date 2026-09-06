import { useEffect, useRef, useState, useCallback } from "react";
import { GEMAS, premiosPorDefecto } from "./gemas";

/* ============================================================
   RULETA DE GEMAS — versión espectáculo
   · Gajos sombreados píxel a píxel como piedra pulida
   · Motion blur real, anticipación y rebote elástico
   · Flash, onda expansiva, confeti y rayos en el premio
   · Audio con reverb: riser, clacks, fanfarria

   Adaptada para OBS respecto al original:
   · Sin escena de fondo (cielo, nubes, cerros, pasto, tierra, viñeta),
     sin título y sin la botonera ni la bandeja: el widget va sobre la
     transmisión, transparente.
   · El giro lo dispara `girarSignal` desde fuera (un canje de Twitch),
     no un botón.
   · El texto del "esto te ha tocado" sale de `premios`, configurable en
     los ajustes; la skin de la ruleta no cambia.
   ============================================================ */

const N = GEMAS.length;
const SEG = (Math.PI * 2) / N;
const TAU = Math.PI * 2;
const REVEAL_MS = 3400;

const hex2rgb = (h) => {
  const s = h.replace("#", "");
  return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
};
const rgb2hex = (c) =>
  "#" + c.map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, "0")).join("");

const PALETA = GEMAS.map((g) => {
  const rgb = hex2rgb(g.base);
  const deep = rgb.map((v) => v * 0.15);
  const lightRgb = rgb.map((v) => Math.min(255, v * 0.42 + 255 * 0.64));
  return { ...g, rgb, deep, lightRgb, deepHex: rgb2hex(deep), lightHex: rgb2hex(lightRgb) };
});

const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
const ss = (a, b, x) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/* ---------------- textura: shader por píxel ---------------- */

function renderTexture(size, dpr) {
  const px = Math.round(size * dpr);
  const M = px / 2;
  const ringPx = Math.max(5, size * 0.021) * dpr;
  const Rp = M - 2 * dpr;
  const Ri = Rp - ringPx;

  const Lu = -0.14,
    Lv = 0.25,
    Lh = 0.96;
  const ln = Math.hypot(Lu, Lv, Lh);
  const lu = Lu / ln,
    lv = Lv / ln,
    lh = Lh / ln;
  let hx = lu,
    hy = lv,
    hz = lh + 1;
  const hn = Math.hypot(hx, hy, hz);
  hx /= hn;
  hy /= hn;
  hz /= hn;

  const SU = 0.9,
    SV = 0.55,
    AMB = 0.32,
    DIF = 0.92,
    HI = 0.55;

  const gemCv = document.createElement("canvas");
  gemCv.width = gemCv.height = px;
  const gctx = gemCv.getContext("2d");
  const img = gctx.createImageData(px, px);
  const d = img.data;

  for (let y = 0; y < px; y++) {
    const dy = y + 0.5 - M;
    for (let x = 0; x < px; x++) {
      const dx = x + 0.5 - M;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const o = (y * px + x) * 4;
      if (dist > Ri + 1) {
        d[o + 3] = 0;
        continue;
      }

      let a = Math.atan2(dy, dx);
      if (a < 0) a += TAU;
      let i = (a / SEG) | 0;
      if (i >= N) i = N - 1;

      let u = (a - (i * SEG + SEG / 2)) / (SEG / 2);
      u = u < -1 ? -1 : u > 1 ? 1 : u;
      const v = Math.min(1, dist / Ri);
      let rv = (v - 0.5) / 0.58;
      rv = rv < -1 ? -1 : rv > 1 ? 1 : rv;

      const A = Math.sqrt(Math.max(1 - u * u, 1e-4));
      const B = Math.sqrt(Math.max(1 - rv * rv, 1e-4));

      let nx = (u / A) * B * SU;
      let ny = (A * (rv / B) * SV) / 0.58;
      let nz = 1;
      const nl = Math.sqrt(nx * nx + ny * ny + 1);
      nx /= nl;
      ny /= nl;
      nz /= nl;

      const diff = Math.max(0, nx * lu + ny * lv + nz * lh);
      const dh = Math.max(0, nx * hx + ny * hy + nz * hz);
      const dh2 = dh * dh;
      const dh5 = dh2 * dh2 * dh;
      const spec = Math.pow(dh, 26) * 0.6 + dh5 * 0.05;

      let lum = AMB + DIF * diff;
      lum *= 1 - 0.3 * ss(0.9, 1, v);
      lum *= 1 - 0.28 * ss(0.2, 0.02, v);

      const p = PALETA[i];
      const low = clamp01(lum);
      const high = clamp01((lum - 1) / HI);
      const add = spec * 255;

      for (let k = 0; k < 3; k++) {
        const deep = p.deep[k];
        let c = deep + (p.rgb[k] - deep) * low;
        c += (p.lightRgb[k] - c) * high;
        c += add;
        d[o + k] = c > 255 ? 255 : c;
      }
      d[o + 3] = 255;
    }
  }
  gctx.putImageData(img, 0, 0);

  const cv = document.createElement("canvas");
  cv.width = cv.height = px;
  const c = cv.getContext("2d");
  const m = size / 2;
  const RiL = Ri / dpr;
  const RpL = Rp / dpr;
  const ringL = ringPx / dpr;
  c.scale(dpr, dpr);

  c.save();
  c.beginPath();
  c.arc(m, m, RiL, 0, TAU);
  c.clip();
  c.drawImage(gemCv, 0, 0, size, size);
  c.restore();

  c.lineWidth = Math.max(2, size * 0.0075);
  c.strokeStyle = "#0c0c0c";
  c.lineCap = "round";
  for (let i = 0; i < N; i++) {
    const a = i * SEG;
    c.beginPath();
    c.moveTo(m, m);
    c.lineTo(m + Math.cos(a) * RiL, m + Math.sin(a) * RiL);
    c.stroke();
  }

  c.lineWidth = ringL;
  c.strokeStyle = "#0d0d0d";
  c.beginPath();
  c.arc(m, m, RpL - ringL / 2, 0, TAU);
  c.stroke();

  c.lineWidth = Math.max(1.5, ringL * 0.32);
  c.strokeStyle = "rgba(255,255,255,0.28)";
  c.beginPath();
  c.arc(m, m, RpL - ringL * 0.78, Math.PI * 1.08, Math.PI * 1.92);
  c.stroke();

  return { canvas: cv, Ri: RiL, R: RpL };
}

/* ---------------- audio ---------------- */

function useAudio() {
  const acRef = useRef(null);
  const dryRef = useRef(null);
  const wetRef = useRef(null);
  const noiseRef = useRef(null);

  const get = () => {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    if (!acRef.current) {
      const ac = new AC();
      const master = ac.createGain();
      master.gain.value = 0.72;
      master.connect(ac.destination);

      /* reverb con impulso sintético */
      const len = ac.sampleRate * 1.8;
      const imp = ac.createBuffer(2, len, ac.sampleRate);
      for (let ch = 0; ch < 2; ch++) {
        const dd = imp.getChannelData(ch);
        for (let i = 0; i < len; i++) dd[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
      }
      const conv = ac.createConvolver();
      conv.buffer = imp;
      const wet = ac.createGain();
      wet.gain.value = 0.35;
      wet.connect(conv).connect(master);

      acRef.current = ac;
      dryRef.current = master;
      wetRef.current = wet;
    }
    if (acRef.current.state === "suspended") acRef.current.resume();
    return acRef.current;
  };

  const noiseBuf = (ac) => {
    if (!noiseRef.current) {
      const b = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
      const dd = b.getChannelData(0);
      for (let i = 0; i < dd.length; i++) dd[i] = Math.random() * 2 - 1;
      noiseRef.current = b;
    }
    return noiseRef.current;
  };

  const send = (node, wetAmt = 0) => {
    node.connect(dryRef.current);
    if (wetAmt > 0) {
      const g = acRef.current.createGain();
      g.gain.value = wetAmt;
      node.connect(g).connect(wetRef.current);
    }
  };

  /* whoosh de lanzamiento */
  const whoosh = useCallback(() => {
    const ac = get();
    if (!ac) return;
    const t = ac.currentTime;
    const src = ac.createBufferSource();
    src.buffer = noiseBuf(ac);
    const bp = ac.createBiquadFilter();
    bp.type = "bandpass";
    bp.Q.value = 0.9;
    bp.frequency.setValueAtTime(400, t);
    bp.frequency.exponentialRampToValueAtTime(4200, t + 0.35);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.22, t + 0.09);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
    src.connect(bp).connect(g);
    send(g, 0.4);
    src.start(t);
    src.stop(t + 0.55);
  }, []);

  const riser = useCallback((dur) => {
    const ac = get();
    if (!ac) return;
    const t = ac.currentTime;

    const src = ac.createBufferSource();
    src.buffer = noiseBuf(ac);
    src.loop = true;
    const bp = ac.createBiquadFilter();
    bp.type = "bandpass";
    bp.Q.value = 1.4;
    bp.frequency.setValueAtTime(320, t);
    bp.frequency.exponentialRampToValueAtTime(3600, t + dur * 0.64);
    bp.frequency.exponentialRampToValueAtTime(480, t + dur);
    const gn = ac.createGain();
    gn.gain.setValueAtTime(0.0001, t);
    gn.gain.exponentialRampToValueAtTime(0.1, t + 0.5);
    gn.gain.setValueAtTime(0.1, t + dur * 0.62);
    gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(bp).connect(gn);
    send(gn, 0.25);
    src.start(t);
    src.stop(t + dur + 0.1);

    const o = ac.createOscillator();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(55, t);
    o.frequency.exponentialRampToValueAtTime(230, t + dur * 0.68);
    o.frequency.exponentialRampToValueAtTime(80, t + dur);
    const lp = ac.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 640;
    const go = ac.createGain();
    go.gain.setValueAtTime(0.0001, t);
    go.gain.exponentialRampToValueAtTime(0.085, t + 0.6);
    go.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(lp).connect(go);
    send(go, 0.15);
    o.start(t);
    o.stop(t + dur + 0.1);
  }, []);

  const tick = useCallback((s = 1) => {
    const ac = get();
    if (!ac) return;
    const t = ac.currentTime;
    const src = ac.createBufferSource();
    src.buffer = noiseBuf(ac);
    const bp = ac.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 1500 + s * 1800;
    bp.Q.value = 3.2;
    const g = ac.createGain();
    g.gain.setValueAtTime(0.17 * s, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);
    src.connect(bp).connect(g);
    send(g, 0.18);
    src.start(t);
    src.stop(t + 0.06);
  }, []);

  const fanfare = useCallback(() => {
    const ac = get();
    if (!ac) return;
    const t0 = ac.currentTime;

    const boom = ac.createOscillator();
    const bg = ac.createGain();
    boom.type = "sine";
    boom.frequency.setValueAtTime(180, t0);
    boom.frequency.exponentialRampToValueAtTime(38, t0 + 0.55);
    bg.gain.setValueAtTime(0.4, t0);
    bg.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.9);
    boom.connect(bg);
    send(bg, 0.2);
    boom.start(t0);
    boom.stop(t0 + 0.95);

    const crash = ac.createBufferSource();
    crash.buffer = noiseBuf(ac);
    const chp = ac.createBiquadFilter();
    chp.type = "highpass";
    chp.frequency.value = 2400;
    const cg = ac.createGain();
    cg.gain.setValueAtTime(0.16, t0);
    cg.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.6);
    crash.connect(chp).connect(cg);
    send(cg, 0.5);
    crash.start(t0);
    crash.stop(t0 + 1.7);

    const note = (f, at, dur, gain, type, wet = 0.4, detune = 0) => {
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = type;
      o.frequency.value = f;
      o.detune.value = detune;
      g.gain.setValueAtTime(0.0001, at);
      g.gain.exponentialRampToValueAtTime(gain, at + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
      o.connect(g);
      send(g, wet);
      o.start(at);
      o.stop(at + dur + 0.05);
    };

    [392, 523.25, 659.25, 783.99].forEach((f, i) => {
      const at = t0 + i * 0.08;
      note(f, at, 0.34, 0.15, "square", 0.3);
      note(f * 2, at, 0.28, 0.055, "triangle", 0.35);
    });

    const at = t0 + 0.34;
    [523.25, 659.25, 783.99, 1046.5].forEach((f) => {
      note(f, at, 1.8, 0.12, "triangle", 0.5);
      note(f, at, 1.8, 0.05, "sawtooth", 0.4, 8);
      note(f, at, 1.8, 0.05, "sawtooth", 0.4, -8);
    });
    note(130.81, at, 1.9, 0.15, "triangle", 0.2);
    note(196, at, 1.9, 0.09, "triangle", 0.2);

    for (let i = 0; i < 8; i++) {
      note(1568 + Math.random() * 1400, t0 + 0.5 + i * 0.1, 0.3, 0.045, "sine", 0.7);
    }
  }, []);

  return { whoosh, riser, tick, fanfare };
}

/* ============================================================ */

/**
 * @param girarSignal  número que, al cambiar, lanza un giro. Cada canje lo sube.
 * @param premios      ocho textos, uno por gema, para el "esto te ha tocado".
 * @param sonido       si false, gira en silencio.
 * @param oscurecer    velo oscuro detrás del premio. Apagado en OBS por
 *                     defecto: taparía la transmisión entera.
 * @param onTerminar   se llama al desaparecer el premio, con el índice ganador.
 */
export default function RuletaDeGemas({
  girarSignal = 0,
  premios,
  sonido = true,
  oscurecer = false,
  onTerminar,
}) {
  const stageRef = useRef(null);
  const sceneRef = useRef(null);
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const fxRef = useRef(null);
  const pointerRef = useRef(null);
  const texRef = useRef(null);
  const sizeRef = useRef(420);
  const fxSize = useRef({ w: 0, h: 0, cx: 0, cy: 0 });

  const rot = useRef(0);
  const prevRot = useRef(0);
  const omega = useRef(0);
  const spin = useRef(null);
  const settle = useRef(null);
  const lastSeg = useRef(0);
  const pointer = useRef({ a: 0, v: 0 });
  const sparks = useRef([]);
  const shards = useRef([]);
  const confetti = useRef([]);
  const waves = useRef([]);
  const flash = useRef(0);
  const shake = useRef(0);
  const emit = useRef(0);
  const glow = useRef(0);
  const winRef = useRef(null);
  const spinRef = useRef(false);
  const revealTimer = useRef(null);

  const [size, setSize] = useState(420);
  const [spinning, setSpinning] = useState(false);
  const [prize, setPrize] = useState(null);
  const soundRef = useRef(sonido);
  soundRef.current = sonido;
  spinRef.current = spinning;

  const onTerminarRef = useRef(onTerminar);
  onTerminarRef.current = onTerminar;

  const { whoosh, riser, tick, fanfare } = useAudio();

  /* medidas */
  useEffect(() => {
    const el = wrapRef.current;
    const st = stageRef.current;
    if (!el || !st) return;
    const ro = new ResizeObserver(() => {
      const w = Math.max(240, Math.min(el.clientWidth, 460));
      if (Math.abs(w - sizeRef.current) >= 2) {
        sizeRef.current = w;
        setSize(w);
      }
      const r = st.getBoundingClientRect();
      const c = el.getBoundingClientRect();
      fxSize.current = {
        w: r.width,
        h: r.height,
        cx: c.left - r.left + c.width / 2,
        cy: c.top - r.top + Math.min(c.width, 460) / 2,
      };
      const fx = fxRef.current;
      if (fx) {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        fx.width = r.width * dpr;
        fx.height = r.height * dpr;
        fx.style.width = `${r.width}px`;
        fx.style.height = `${r.height}px`;
      }
    });
    ro.observe(el);
    ro.observe(st);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    texRef.current = renderTexture(size, dpr);
    const cv = canvasRef.current;
    if (cv) {
      cv.width = size * dpr;
      cv.height = size * dpr;
      cv.style.width = `${size}px`;
      cv.style.height = `${size}px`;
    }
  }, [size]);

  useEffect(() => () => clearTimeout(revealTimer.current), []);

  const winnerIndex = (r) => {
    let a = (Math.PI - r) % TAU;
    if (a < 0) a += TAU;
    return Math.floor(a / SEG) % N;
  };

  /* ---------------- loop ---------------- */
  useEffect(() => {
    let raf;
    let prev = performance.now();
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    const frame = (now) => {
      const dt = Math.min((now - prev) / 1000, 0.05);
      prev = now;
      const t = now / 1000;
      const S = sizeRef.current;
      const Ri = texRef.current?.Ri ?? S / 2;

      /* --- giro: anticipación → lanzamiento → asentado --- */
      const s = spin.current;
      if (s) {
        const el = now - s.t0;
        if (el < s.windup) {
          const p = el / s.windup;
          rot.current = s.from - s.back * (p * p * (3 - 2 * p));
        } else {
          const p = Math.min((el - s.windup) / s.dur, 1);
          const start = s.from - s.back;
          rot.current = start + (s.to - start) * (1 - Math.pow(1 - p, 5));

          const seg = Math.floor(rot.current / SEG);
          if (seg !== lastSeg.current) {
            const k = Math.abs(seg - lastSeg.current);
            lastSeg.current = seg;
            pointer.current.v -= 8 * Math.min(1, 0.25 + (1 - p));
            if (soundRef.current && k < 3) tick(0.3 + (1 - p) * 0.7);
          }

          if (p >= 1) {
            spin.current = null;
            const final = ((s.to % TAU) + TAU) % TAU;
            rot.current = final;
            lastSeg.current = Math.floor(final / SEG);
            settle.current = { t0: now, final };
            const idx = winnerIndex(final);
            winRef.current = idx;
            glow.current = 1;
            win(idx);
          }
        }
      } else if (settle.current) {
        const e = (now - settle.current.t0) / 1000;
        if (e > 1.1) {
          rot.current = settle.current.final;
          settle.current = null;
        } else {
          rot.current = settle.current.final + 0.045 * Math.exp(-5.5 * e) * Math.sin(26 * e);
        }
      }

      omega.current = dt > 0 ? (rot.current - prevRot.current) / dt : 0;
      prevRot.current = rot.current;

      /* --- chispas del borde --- */
      const w = Math.abs(omega.current);
      if (!reduced && w > 1.2) {
        emit.current += Math.min(w * 1.8, 12) * dt * 60;
        const m = S / 2;
        while (emit.current >= 1) {
          emit.current -= 1;
          const a = Math.random() * TAU;
          const r = Ri * (0.72 + Math.random() * 0.3);
          const dir = Math.sign(omega.current);
          const speed = Math.min(w, 26) * r * 0.16;
          const out = 40 + Math.random() * 140;
          sparks.current.push({
            x: m + Math.cos(a) * r,
            y: m + Math.sin(a) * r,
            vx: -Math.sin(a) * speed * dir + Math.cos(a) * out,
            vy: Math.cos(a) * speed * dir + Math.sin(a) * out,
            size: (2.5 + Math.random() * 5) * (S / 420),
            life: 0.35 + Math.random() * 0.55,
            max: 0.9,
            hue: Math.random() > 0.45 ? "#ffffff" : "#ffe27a",
          });
        }
      }
      const step = (p) => {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
      };
      sparks.current = sparks.current.filter((p) => {
        step(p);
        p.vx *= 1 - 2.4 * dt;
        p.vy *= 1 - 2.4 * dt;
        return p.life > 0;
      });
      shards.current = shards.current.filter((p) => {
        p.vy += 900 * dt;
        step(p);
        p.r += p.vr * dt;
        return p.life > 0;
      });
      confetti.current = confetti.current.filter((p) => {
        p.vy += 520 * dt;
        p.vx += Math.sin(t * 3 + p.seed) * 28 * dt;
        step(p);
        p.r += p.vr * dt;
        p.vx *= 1 - 0.5 * dt;
        return p.life > 0 && p.y < fxSize.current.h + 60;
      });
      waves.current = waves.current.filter((v) => {
        v.t += dt;
        return v.t < v.dur;
      });
      if (flash.current > 0) flash.current = Math.max(0, flash.current - dt * 3.2);
      if (shake.current > 0) shake.current = Math.max(0, shake.current - dt * 26);

      /* --- puntero elástico --- */
      const pt = pointer.current;
      pt.v += (-pt.a * 200 - pt.v * 13) * dt;
      pt.a += pt.v * dt;
      if (pointerRef.current) pointerRef.current.style.transform = `translateY(-50%) rotate(${pt.a.toFixed(2)}deg)`;

      /* --- sacudida de cámara --- */
      if (sceneRef.current) {
        const k = shake.current;
        const sx = k ? (Math.random() - 0.5) * k : 0;
        const sy = k ? (Math.random() - 0.5) * k : 0;
        sceneRef.current.style.transform = `translate(${sx.toFixed(2)}px, ${sy.toFixed(2)}px)`;
      }

      if (glow.current > 0) glow.current = Math.max(0, glow.current - dt * 0.26);

      drawWheel(t);
      drawFx(t);
      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size]);

  /* ---------------- eventos de victoria ---------------- */

  const win = (idx) => {
    const p = PALETA[idx];
    const S = sizeRef.current;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    setSpinning(false);
    setPrize(idx);
    if (soundRef.current) fanfare();
    clearTimeout(revealTimer.current);
    revealTimer.current = setTimeout(() => {
      setPrize(null);
      onTerminarRef.current?.(idx);
    }, REVEAL_MS);

    if (reduced) return;

    flash.current = 1;
    shake.current = 16;
    waves.current.push({ t: 0, dur: 0.9, color: p.lightHex });
    waves.current.push({ t: -0.14, dur: 1.1, color: "#ffffff" });

    for (let i = 0; i < 34; i++) {
      const ang = Math.PI + (Math.random() - 0.5) * 1.5;
      const sp = 180 + Math.random() * 380;
      shards.current.push({
        x: S * 0.06,
        y: S / 2,
        vx: Math.cos(ang) * sp,
        vy: Math.sin(ang) * sp - 250,
        r: Math.random() * TAU,
        vr: (Math.random() - 0.5) * 12,
        size: (4 + Math.random() * 7) * (S / 420),
        life: 1 + Math.random() * 0.7,
        color: Math.random() > 0.4 ? p.lightHex : p.base,
      });
    }

    const { w, h, cx, cy } = fxSize.current;
    const cols = [p.base, p.lightHex, "#ffd83d", "#ffffff"];
    for (let i = 0; i < 90; i++) {
      const ang = Math.random() * TAU;
      const sp = 220 + Math.random() * 620;
      confetti.current.push({
        x: cx,
        y: cy,
        vx: Math.cos(ang) * sp,
        vy: Math.sin(ang) * sp - 260,
        r: Math.random() * TAU,
        vr: (Math.random() - 0.5) * 16,
        w: 6 + Math.random() * 9,
        h: 9 + Math.random() * 14,
        life: 2.6 + Math.random() * 1.2,
        seed: Math.random() * 10,
        color: cols[(Math.random() * cols.length) | 0],
      });
    }
    for (let i = 0; i < 50; i++) {
      confetti.current.push({
        x: Math.random() * w,
        y: -30 - Math.random() * 260,
        vx: (Math.random() - 0.5) * 90,
        vy: 90 + Math.random() * 160,
        r: Math.random() * TAU,
        vr: (Math.random() - 0.5) * 12,
        w: 6 + Math.random() * 8,
        h: 9 + Math.random() * 13,
        life: 4,
        seed: Math.random() * 10,
        color: cols[(Math.random() * cols.length) | 0],
      });
    }
  };

  /* ---------------- dibujo ---------------- */

  const star = (ctx, r) => {
    ctx.beginPath();
    for (let k = 0; k < 4; k++) {
      const a = (k * Math.PI) / 2;
      ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      ctx.quadraticCurveTo(0, 0, Math.cos(a + Math.PI / 2) * r, Math.sin(a + Math.PI / 2) * r);
    }
    ctx.closePath();
  };

  const drawWheel = (t) => {
    const cv = canvasRef.current;
    const tex = texRef.current;
    if (!cv || !tex) return;
    const ctx = cv.getContext("2d");
    const S = sizeRef.current;
    const dpr = cv.width / S;
    const m = S / 2;
    const Ri = tex.Ri;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, S, S);

    /* motion blur: varias copias desfasadas según la velocidad real */
    const w = Math.abs(omega.current);
    const steps = w > 3 ? Math.min(7, 2 + Math.round(w / 3)) : 1;
    const spread = Math.min(w * 0.016, 0.13);
    ctx.save();
    ctx.translate(m, m);
    for (let i = 0; i < steps; i++) {
      const off = steps === 1 ? 0 : -spread * (i / (steps - 1));
      ctx.save();
      ctx.rotate(rot.current + off * Math.sign(omega.current || 1));
      ctx.globalAlpha = steps === 1 ? 1 : (1 - i / steps) / (steps * 0.55);
      ctx.drawImage(tex.canvas, -m, -m, S, S);
      ctx.restore();
    }
    ctx.globalAlpha = 1;

    /* gajo ganador encendido */
    if (winRef.current !== null && glow.current > 0 && !spinRef.current) {
      const pulse = 0.14 + 0.14 * Math.sin(t * 6);
      ctx.save();
      ctx.rotate(rot.current);
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = glow.current * pulse;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, Ri, winRef.current * SEG, winRef.current * SEG + SEG);
      ctx.closePath();
      ctx.fillStyle = "#fff";
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();

    /* cúpula de vidrio, fija en pantalla */
    ctx.save();
    ctx.beginPath();
    ctx.arc(m, m, Ri, 0, TAU);
    ctx.clip();
    const gl = ctx.createLinearGradient(m - Ri, m - Ri, m + Ri * 0.1, m + Ri * 0.5);
    gl.addColorStop(0, "rgba(255,255,255,0.22)");
    gl.addColorStop(0.45, "rgba(255,255,255,0.03)");
    gl.addColorStop(0.65, "rgba(255,255,255,0)");
    ctx.fillStyle = gl;
    ctx.fillRect(0, 0, S, S);
    ctx.restore();

    /* esfera dorada con destello periódico */
    const cr = S * 0.062;
    ctx.save();
    ctx.beginPath();
    ctx.arc(m, m + 3, cr * 1.05, 0, TAU);
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.fill();
    const sph = ctx.createRadialGradient(m - cr * 0.35, m - cr * 0.4, cr * 0.05, m, m, cr);
    sph.addColorStop(0, "#ffffff");
    sph.addColorStop(0.22, "#ffe75e");
    sph.addColorStop(0.65, "#c98f04");
    sph.addColorStop(1, "#4a3200");
    ctx.beginPath();
    ctx.arc(m, m, cr, 0, TAU);
    ctx.fillStyle = sph;
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = "#141414";
    ctx.stroke();

    const gleam = Math.max(0, Math.sin(t * 0.9) - 0.86) / 0.14;
    if (gleam > 0) {
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = gleam;
      ctx.translate(m - cr * 0.3, m - cr * 0.35);
      ctx.fillStyle = "#fff";
      star(ctx, cr * 1.5);
      ctx.fill();
    }
    ctx.restore();

    /* chispas */
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const p of sparks.current) {
      const k = Math.max(0, p.life / p.max);
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.globalAlpha = k;
      ctx.fillStyle = p.hue;
      star(ctx, p.size * (0.5 + k));
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();

    /* esquirlas */
    for (const p of shards.current) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, p.life);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.r);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.moveTo(0, -p.size);
      ctx.lineTo(p.size * 0.7, 0);
      ctx.lineTo(0, p.size);
      ctx.lineTo(-p.size * 0.7, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  };

  const drawFx = () => {
    const cv = fxRef.current;
    if (!cv || !cv.width) return;
    const ctx = cv.getContext("2d");
    const { w, h, cx, cy } = fxSize.current;
    const dpr = cv.width / Math.max(w, 1);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    /* ondas expansivas */
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const v of waves.current) {
      if (v.t < 0) continue;
      const p = v.t / v.dur;
      const r = 40 + p * Math.max(w, h) * 0.75;
      ctx.globalAlpha = (1 - p) * 0.55;
      ctx.lineWidth = 22 * (1 - p) + 2;
      ctx.strokeStyle = v.color;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();

    /* confeti */
    for (const p of confetti.current) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, p.life);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.r);
      ctx.scale(1, Math.max(0.25, Math.abs(Math.cos(p.r * 1.3))));
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }

    /* flash */
    if (flash.current > 0) {
      ctx.save();
      ctx.globalAlpha = flash.current * 0.55;
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }
  };

  /* ---------------- disparo desde fuera ---------------- */

  const girar = useCallback(() => {
    if (spinRef.current) return;
    clearTimeout(revealTimer.current);
    setPrize(null);
    winRef.current = null;
    glow.current = 0;
    settle.current = null;
    setSpinning(true);
    shake.current = 7;

    const target = Math.floor(Math.random() * N);
    const want = Math.PI - (target + 0.5) * SEG - (Math.random() - 0.5) * SEG * 0.55;
    const from = rot.current;
    let to = want;
    const turns = 6 + Math.floor(Math.random() * 3);
    while (to < from + TAU * turns) to += TAU;
    const dur = 5000 + Math.random() * 1600;
    spin.current = { from, back: 0.3, windup: 420, to, t0: performance.now(), dur };
    lastSeg.current = Math.floor(from / SEG);
    if (soundRef.current) {
      whoosh();
      riser(dur / 1000 + 0.42);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [whoosh, riser]);

  // Cada vez que sube la señal, gira. Se ignora el valor inicial: montar el
  // widget no debe lanzar un giro fantasma.
  const señalPrevia = useRef(girarSignal);
  useEffect(() => {
    if (girarSignal === señalPrevia.current) return;
    señalPrevia.current = girarSignal;
    girar();
  }, [girarSignal, girar]);

  const g = prize !== null ? PALETA[prize] : null;
  const lista = premios?.length === N ? premios : premiosPorDefecto();
  const textoPremio = prize !== null ? lista[prize] : "";

  return (
    <div ref={stageRef} style={styles.stage}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@600;700&display=swap');
        @keyframes prizePop {
          0%   { transform: translate(-50%,-50%) scale(.02) rotate(-18deg); opacity: 0 }
          12%  { opacity: 1 }
          32%  { transform: translate(-50%,-52%) scale(1.18) rotate(4deg) }
          44%  { transform: translate(-50%,-50%) scale(.94) rotate(-2deg) }
          54%  { transform: translate(-50%,-51%) scale(1.04) rotate(1deg) }
          64%  { transform: translate(-50%,-50%) scale(1) rotate(0deg) }
          86%  { transform: translate(-50%,-53%) scale(1.02); opacity: 1 }
          100% { transform: translate(-50%,-58%) scale(1.55); opacity: 0 }
        }
        @keyframes gemFloat { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-10px) } }
        @keyframes shineSweep { 0% { transform: translateX(-140%) } 55%,100% { transform: translateX(180%) } }
        @keyframes rayTurn { to { transform: translate(-50%,-50%) rotate(360deg) } }
        @keyframes rayFade { 0% { opacity: 0 } 16% { opacity: .9 } 78% { opacity: .72 } 100% { opacity: 0 } }
        @keyframes dim { 0%,100% { opacity: 0 } 16%,80% { opacity: 1 } }
        @keyframes nameIn {
          0%,22% { transform: scale(.4); opacity: 0 }
          38% { transform: scale(1.15); opacity: 1 }
          48% { transform: scale(1) }
          88% { opacity: 1 } 100% { opacity: 0 }
        }
        @keyframes orbit { to { transform: rotate(360deg) } }
        @keyframes idleBob { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-5px) } }
        .rg-wheel { animation: idleBob 4.5s ease-in-out infinite }
        .rg-wheel.is-spinning { animation: none }
        @media (prefers-reduced-motion: reduce) {
          .rg-anim, .rg-wheel { animation: none !important }
        }
      `}</style>

      <div ref={sceneRef} style={styles.scene}>
        <div ref={wrapRef} style={styles.wrap}>
          <div
            className={`rg-wheel${spinning ? " is-spinning" : ""}`}
            style={{ position: "relative", width: size, height: size, margin: "0 auto" }}
            aria-hidden="true"
          >
            <div style={{ ...styles.shadow, width: size * 0.7, left: size * 0.15, top: size + 4 }} />
            <canvas ref={canvasRef} style={styles.canvas} />

            <svg
              ref={pointerRef}
              viewBox="0 0 60 62"
              style={{ ...styles.pointer, width: size * 0.15, left: -size * 0.075, transformOrigin: "18% 50%" }}
            >
              <defs>
                <linearGradient id="rgOro" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fff5b0" />
                  <stop offset="42%" stopColor="#ffc400" />
                  <stop offset="100%" stopColor="#a06f00" />
                </linearGradient>
              </defs>
              <path d="M6 8 L56 31 L6 54 Z" fill="url(#rgOro)" stroke="#101010" strokeWidth="5" strokeLinejoin="round" />
              <path d="M14 18 L40 30 L14 40 Z" fill="#fff8cf" opacity=".55" />
            </svg>
          </div>
        </div>

        <canvas ref={fxRef} style={styles.fx} />

        {g && (
          <>
            {oscurecer && (
              <div className="rg-anim" style={{ ...styles.dim, animation: `dim ${REVEAL_MS}ms ease-in-out forwards` }} />
            )}
            <div
              className="rg-anim"
              style={{
                ...styles.rays,
                width: size * 2.4,
                height: size * 2.4,
                background: `repeating-conic-gradient(from 0deg, ${g.lightHex}77 0deg 8deg, transparent 8deg 20deg)`,
                animation: `rayTurn 8s linear infinite, rayFade ${REVEAL_MS}ms ease-in-out forwards`,
              }}
            />
            <div
              className="rg-anim"
              style={{ ...styles.prize, animation: `prizePop ${REVEAL_MS}ms cubic-bezier(.2,1.1,.3,1) forwards` }}
            >
              <div style={{ position: "relative", animation: "gemFloat 2.6s ease-in-out infinite" }}>
                <div style={{ ...styles.orbitBox, animation: "orbit 5s linear infinite" }}>
                  {[0, 1, 2, 3, 4].map((i) => (
                    <span
                      key={i}
                      style={{
                        ...styles.orbitDot,
                        transform: `rotate(${i * 72}deg) translateY(-52%)`,
                        background: i % 2 ? "#fff" : g.lightHex,
                        boxShadow: `0 0 12px ${g.lightHex}`,
                      }}
                    />
                  ))}
                </div>
                <svg
                  viewBox="0 0 100 116"
                  style={{ width: "min(62vw, 330px)", display: "block", filter: `drop-shadow(0 0 34px ${g.lightHex})` }}
                >
                  <defs>
                    <linearGradient id="rgGemA" x1="0" y1="0" x2="0.4" y2="1">
                      <stop offset="0%" stopColor={g.lightHex} />
                      <stop offset="55%" stopColor={g.base} />
                      <stop offset="100%" stopColor={g.deepHex} />
                    </linearGradient>
                    <clipPath id="rgGemClip">
                      <path d="M30 4 H70 L96 40 L50 112 L4 40 Z" />
                    </clipPath>
                  </defs>
                  <path
                    d="M30 4 H70 L96 40 L50 112 L4 40 Z"
                    fill="url(#rgGemA)"
                    stroke="#101010"
                    strokeWidth="5"
                    strokeLinejoin="round"
                  />
                  <g clipPath="url(#rgGemClip)">
                    <path d="M30 4 L50 40 L70 4 Z" fill="#fff" opacity=".4" />
                    <path d="M4 40 L50 40 L50 112 Z" fill="#fff" opacity=".16" />
                    <path d="M96 40 L50 40 L50 112 Z" fill="#000" opacity=".2" />
                    <path d="M36 14 L44 14 L30 40 L22 40 Z" fill="#fff" opacity=".62" />
                  </g>
                </svg>
                <div style={styles.sweepMask}>
                  <div style={{ ...styles.sweep, animation: `shineSweep ${REVEAL_MS}ms ease-out forwards` }} />
                </div>
              </div>
              {/* Aquí sale el valor configurado en los ajustes, no la gema */}
              <div className="rg-anim" style={{ ...styles.prizeName, animation: `nameIn ${REVEAL_MS}ms ease-out forwards` }}>
                {textoPremio}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const stroke = "-2px -2px 0 #101010, 2px -2px 0 #101010, -2px 2px 0 #101010, 2px 2px 0 #101010";

const styles = {
  stage: {
    position: "relative",
    width: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    boxSizing: "border-box",
    fontFamily: "'Fredoka', 'Comic Sans MS', system-ui, sans-serif",
    userSelect: "none",
  },
  scene: { position: "relative", width: "100%", display: "flex", justifyContent: "center", willChange: "transform" },
  wrap: { position: "relative", width: "100%", maxWidth: 460 },
  canvas: { position: "relative", display: "block", zIndex: 2 },
  fx: { position: "absolute", left: 0, top: 0, zIndex: 7, pointerEvents: "none" },
  shadow: { position: "absolute", height: 20, borderRadius: "50%", background: "rgba(0,0,0,.4)", filter: "blur(10px)", zIndex: 0 },
  pointer: { position: "absolute", top: "50%", zIndex: 6, filter: "drop-shadow(3px 5px 3px rgba(0,0,0,.5))", willChange: "transform" },
  dim: {
    position: "fixed",
    left: "50%",
    top: "50%",
    width: "300vw",
    height: "300vh",
    transform: "translate(-50%,-50%)",
    background: "radial-gradient(circle, rgba(0,0,0,.5) 0%, rgba(0,0,0,.78) 60%)",
    zIndex: 8,
    pointerEvents: "none",
  },
  rays: {
    position: "absolute",
    left: "50%",
    top: "50%",
    transform: "translate(-50%,-50%)",
    borderRadius: "50%",
    zIndex: 9,
    pointerEvents: "none",
    maskImage: "radial-gradient(circle, #000 22%, transparent 70%)",
    WebkitMaskImage: "radial-gradient(circle, #000 22%, transparent 70%)",
  },
  prize: {
    position: "absolute",
    left: "50%",
    top: "50%",
    zIndex: 10,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
    pointerEvents: "none",
  },
  orbitBox: { position: "absolute", inset: "-8%", zIndex: 1, pointerEvents: "none" },
  orbitDot: {
    position: "absolute",
    left: "50%",
    top: "50%",
    width: 12,
    height: 12,
    marginLeft: -6,
    borderRadius: "50%",
    transformOrigin: "50% 50%",
  },
  sweepMask: {
    position: "absolute",
    inset: 0,
    overflow: "hidden",
    pointerEvents: "none",
    maskImage: "radial-gradient(circle at 50% 45%, #000 60%, transparent 78%)",
    WebkitMaskImage: "radial-gradient(circle at 50% 45%, #000 60%, transparent 78%)",
  },
  sweep: {
    position: "absolute",
    top: "-30%",
    left: 0,
    width: "45%",
    height: "160%",
    background: "linear-gradient(100deg, transparent, rgba(255,255,255,.75), transparent)",
    filter: "blur(2px)",
  },
  // El valor configurado se lee sobre lo que haya en la transmisión, así que
  // lleva placa oscura detrás además del contorno: sin ella se pierde en
  // cuanto el juego de fondo es claro.
  prizeName: {
    marginTop: 6,
    padding: "8px 22px",
    borderRadius: 14,
    background: "rgba(10,10,10,.72)",
    border: "3px solid rgba(0,0,0,.9)",
    color: "#ffd83d",
    fontSize: "clamp(30px, 3.4vw, 62px)",
    lineHeight: 1.1,
    textShadow: `${stroke}, 0 5px 0 rgba(0,0,0,.5), 0 0 24px rgba(255,216,61,.6)`,
    maxWidth: "min(80vw, 760px)",
    textAlign: "center",
  },
};
