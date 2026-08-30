import { useState, useEffect, useRef, useCallback, useMemo } from "react";

/* ============================================================
   HAYFEL BROADCAST SYSTEM · v3
   Loop de arranque y de cierre para Twitch.
   OBS: Browser Source 1920x1080 @ 60fps.
   Teclas: espacio pausa · ← → escena · B señal · P programa
           M audio · F pantalla completa
   ============================================================ */

const BASE = {
  channel: "HAYFEL",
  url: "twitch.tv/hayfel",
  channelNo: "02",
  est: "2020",
  katakana: "ハイフェル・エンタテインメント・システム",
};

const PROGRAMS = {
  start: {
    label: "INICIO",
    osd: "▶ PLAY",
    scenes: [
      { id: "boot", ms: 5400 },
      { id: "bars", ms: 4600 },
      { id: "kanji", ms: 7000 },
      { id: "globe", ms: 7600 },
      { id: "grid", ms: 6400 },
      { id: "logo", ms: 6600 },
      { id: "lockup", ms: 7000 },
      { id: "index", ms: 6400 },
      { id: "marquee", ms: 6800 },
    ],
    boot: [
      { k: "SYSTEM", v: `${BASE.channel} BROADCAST SYSTEM` },
      { k: "FORMAT", v: "NTSC · SP · 4:3" },
      { k: "TAPE", v: "E-180 · REMAIN 47MIN" },
      { k: "TRACKING", v: "AUTO ····· ADJUSTING" },
      { k: "SIGNAL", v: "LOCKED" },
      { k: "CHANNEL", v: `CH ${BASE.channelNo} — ${BASE.url.toUpperCase()}` },
    ],
    bootHead: "PLAY ▶ AUTO",
    bootOk: "SYSTEM READY",
    kanji: "警告",
    kanjiWord: "WARNING",
    kanjiJP:
      "本放送の無断転載・再配信は固く禁じられています。すべての権利は配信者に留保されています。",
    kanjiEN:
      "Unauthorized rebroadcast, reupload or reproduction of this stream is strictly prohibited. All rights reserved.",
    system: "VIDEO BROADCAST SYSTEM",
    globeData: ["ORB 01 / R 0.46", "ROT 22°·SEC", "ORTOGRÁFICA"],
    logoPrefix: "SUPER",
    logoFoot: "ENTERTAINMENT SYSTEM",
    tagline: "WE RUN DIFFERENTLY",
    lockTop: ["放送中", "配信は毎晩"],
    lockBadge: ["SEÑAL AUTÉNTICA", "認証済み放送"],
    indexTitle: "TAPE INDEX",
    indexJP: "収録内容",
    index: [
      ["01", "CUENTA REGRESIVA", "AHORA"],
      ["02", "APERTURA", "00:05"],
      ["03", "SESIÓN PRINCIPAL", "00:20"],
      ["04", "CHARLA / CHAT", "01:40"],
      ["05", "CIERRE", "02:10"],
    ],
    indexFoot: "E-180 · SP · REMAIN 47 MIN",
    marqueeKicker: "EN VIVO EN BREVE",
    marqueeTitle: "TRANSMISIÓN INICIANDO",
    marqueeJP: "まもなく放送開始",
    marqueeUrl: BASE.url,
  },
  end: {
    label: "CIERRE",
    osd: "■ STOP",
    scenes: [
      { id: "kanji", ms: 6800 },
      { id: "credits", ms: 9600 },
      { id: "globe", ms: 6400 },
      { id: "lockup", ms: 6600 },
      { id: "bars", ms: 4400 },
      { id: "rewind", ms: 6600 },
      { id: "marquee", ms: 6600 },
      { id: "eject", ms: 6800 },
    ],
    kanji: "終了",
    kanjiWord: "SIGN OFF",
    kanjiJP:
      "本日の放送はこれで終了です。またのご視聴を心よりお待ちしております。おやすみなさい。",
    kanjiEN:
      "Transmission complete. This channel will resume broadcasting at the next scheduled hour. Thank you for watching.",
    system: "HASTA LA PRÓXIMA",
    globeData: ["ORB 01 / SIGN OFF", "ROT 22°·SEC", "SEÑAL CERRADA"],
    logoPrefix: "GRACIAS",
    logoFoot: "ENTERTAINMENT SYSTEM",
    tagline: "SAME TIME NEXT NIGHT",
    lockTop: ["放送終了", "また明日"],
    lockBadge: ["FIN DE EMISIÓN", "本日は終了"],
    credits: [
      ["DIRECCIÓN Y JUEGO", BASE.channel],
      ["CÁMARA", BASE.channel],
      ["CONTROL DE SEÑAL", BASE.channel],
      ["MODERACIÓN", "EL CHAT"],
      ["MÚSICA", "LA PLAYLIST DE SIEMPRE"],
      ["ASISTENCIA TÉCNICA", "PACIENCIA"],
      ["GRABADO EN", "UN CUARTO CUALQUIERA"],
    ],
    creditsTitle: "CRÉDITOS",
    creditsJP: "スタッフ",
    creditsEnd: "GRACIAS A TODOS LOS QUE PASARON",
    rewindTitle: "REBOBINANDO",
    rewindJP: "巻き戻し中",
    marqueeKicker: "FIN DE LA TRANSMISIÓN",
    marqueeTitle: "GRACIAS POR VER",
    marqueeJP: "ご視聴ありがとう",
    marqueeUrl: BASE.url,
    ejectTitle: "EJECT",
    ejectJP: "テープを取り出してください",
  },
};

/* modos de señal sin sincronía */
const SIGNALS = [
  { id: "snow", label: "NIEVE RF", mode: 0, base: 0.15 },
  { id: "tape", label: "CINTA", mode: 1, base: 0.34 },
  { id: "roll", label: "SIN SYNC", mode: 2, base: 0.13 },
  { id: "beat", label: "INTERFERENCIA", mode: 3, base: 0.2 },
  { id: "off", label: "TV APAGADA", mode: 4, base: 1 },
];

const MONTHS = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];

const dayOfYear = () => {
  const now = new Date();
  return Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
};

const pad = (n, w = 2) => String(n).padStart(w, "0");

/* --- revela N elementos de golpe, uno por uno --- */
function useSteps(count, step, start = 0) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const ids = [];
    for (let i = 1; i <= count; i++) ids.push(setTimeout(() => setN(i), start + i * step));
    return () => ids.forEach(clearTimeout);
  }, [count, step, start]);
  return n;
}

/* ============================================================
   SEÑAL — fondo WebGL. Cinco modos de "sin señal".
   Se renderiza a 480 líneas, como una señal analógica real, y
   el navegador la escala: eso es lo que le da el tamaño de grano
   correcto en vez de nieve del tamaño del píxel del monitor.
   ============================================================ */

const VERT = `#version 300 es
in vec2 aPos;
void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }`;

const FRAG = `#version 300 es
precision highp float;
out vec4 fragColor;
uniform vec2  uRes;
uniform float uTime;
uniform int   uMode;

float h21(vec2 p){
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
float h11(float p){
  vec3 p3 = fract(vec3(p) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
float vnoise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  f = f*f*(3.0-2.0*f);
  return mix(mix(h21(i), h21(i+vec2(1.0,0.0)), f.x),
             mix(h21(i+vec2(0.0,1.0)), h21(i+vec2(1.0,1.0)), f.x), f.y);
}

/* una línea de barrido: el ancho de banda del canal limita el detalle
   horizontal, así que el ruido se interpola entre muestras */
float lineN(float x, float line, float frame){
  float xi = floor(x), f = fract(x);
  f = f*f*(3.0-2.0*f);
  float a = h21(vec2(xi,       line + frame*71.3));
  float b = h21(vec2(xi + 1.0, line + frame*71.3));
  return mix(a, b, f);
}
float lineStack(float x, float line, float frame){
  float s  = lineN(x,             line, frame);
        s += lineN(x*1.73 + 13.0, line, frame + 3.0);
        s += lineN(x*0.61 + 71.0, line, frame + 7.0);
  return s / 3.0;
}
/* tres octavas por línea; el haz del tubo tiene grosor, así que las
   scanlines vecinas se mezclan un poco en vez de cortarse en seco */
float rf(vec2 uv, float t, float bw){
  float frame = floor(t * 59.94);
  float ly = uv.y * 243.0;
  float l0 = floor(ly), lf = fract(ly);
  float x  = uv.x * bw;
  float a = lineStack(x, l0,       frame);
  float b = lineStack(x, l0 + 1.0, frame);
  return mix(a, b, smoothstep(0.28, 0.72, lf));
}

/* --- grano gaussiano de verdad (Box–Muller), con tamaño e interpolación --- */
float gcell(vec2 c, float seed){
  float u1 = max(1e-5, h21(c + seed));
  float u2 = h21(c * 1.37 + seed + 9.13);
  return sqrt(-2.0 * log(u1)) * cos(6.28318530718 * u2);
}
float gsmooth(vec2 p, float seed){
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(gcell(i,                seed), gcell(i + vec2(1.0,0.0), seed), f.x),
             mix(gcell(i + vec2(0.0,1.0), seed), gcell(i + vec2(1.0,1.0), seed), f.x), f.y);
}

/* --- 0 · nieve de radiofrecuencia --- */
vec3 mSnow(vec2 uv, float t){
  float n = rf(uv, t, uRes.x * 0.78);
  n = clamp((n - 0.5) * 2.9 + 0.52, 0.0, 1.0);
  float streak = vnoise(vec2(uv.y * 58.0 + t * 1.1, t * 2.2));
  n *= 0.72 + streak * 0.56;
  float field  = mod(floor(t * 59.94), 2.0);
  float parity = mod(floor(uv.y * 243.0), 2.0);
  n *= (abs(parity - field) < 0.5) ? 1.0 : 0.85;
  float cr = rf(uv + vec2(0.014, 0.0), t * 0.91, uRes.x * 0.11);
  float cb = rf(uv - vec2(0.014, 0.0), t * 1.13, uRes.x * 0.11);
  vec3 c = vec3(n);
  c.r += (cr - 0.5) * 0.24;
  c.b += (cb - 0.5) * 0.21;
  return c;
}

/* --- 1 · cinta gastada --- */
vec3 mTape(vec2 uv, float t){
  vec2 px = uv * uRes;
  float ft = floor(t * 24.0);
  vec3 c = vec3(0.052);
  c += gsmooth(vec2(px.x * 0.62, px.y * 1.20) + vec2(ft * 31.7, ft * 11.3),  2.0) * 0.052;
  c += gsmooth(vec2(px.x * 0.21, px.y * 0.34) + vec2(ft * 7.1,  ft * 19.7), 44.0) * 0.030;
  float bleed = vnoise(vec2(uv.x * 7.0 - t * 0.35, uv.y * 90.0));
  c.r += bleed * 0.080;
  c.b += bleed * 0.026;
  float line  = floor(uv.y * 243.0);
  float chunk = floor(t * 11.0);
  if (h21(vec2(line, chunk)) > 0.982){
    float dx = h11(line + chunk * 3.7);
    float w  = 0.03 + h11(line + 9.0) * 0.18;
    c += 0.55 * smoothstep(0.0, 0.015, uv.x - dx)
              * smoothstep(0.0, 0.015, dx + w - uv.x);
  }
  return c;
}

/* --- 2 · sin sincronía vertical --- */
vec3 mRoll(vec2 uv, float t){
  float yy = fract(uv.y + t * 0.19);
  vec2  p  = vec2(uv.x, yy);
  float n  = rf(p, t, uRes.x * 0.76);
  n = clamp((n - 0.5) * 2.3 + 0.5, 0.0, 1.0);
  float bar  = smoothstep(0.0, 0.006, yy) * (1.0 - smoothstep(0.070, 0.082, yy));
  float open = 1.0 - bar;
  vec3 c = vec3(n * (0.10 + 0.90 * open));
  c += exp(-abs(yy - 0.082) * 240.0) * 0.55;
  c += bar * rf(p * 3.1, t * 2.4, uRes.x) * 0.30;
  c.r += (rf(p + vec2(0.02,0.0), t, uRes.x*0.1) - 0.5) * 0.15 * open;
  return c;
}

/* --- 3 · portadora batiendo (espina de pez) --- */
vec3 mBeat(vec2 uv, float t){
  float n = rf(uv, t, uRes.x * 0.72);
  n = clamp((n - 0.5) * 1.5 + 0.5, 0.0, 1.0);
  float ph = uv.x * uRes.x * 0.26 + uv.y * uRes.y * 0.86 - t * 26.0;
  float bars = pow(sin(ph) * 0.5 + 0.5, 1.7);
  float drift = vnoise(vec2(uv.y * 12.0, t * 0.7));
  float lum = mix(n * 0.42, bars, 0.55 + drift * 0.2) * 0.82;
  vec3 c = vec3(lum);
  c.r += sin(ph * 0.5) * 0.07;
  c.b += cos(ph * 0.5) * 0.06;
  return c;
}

/* --- 4 · tubo apagado: fósforo muerto + reflejos del cuarto --- */
vec3 mOff(vec2 uv, float t){
  vec3 c = vec3(0.030, 0.031, 0.035);
  c += max(gsmooth(uv * uRes * 0.62, 12.0) - 2.1, 0.0) * 0.30;
  c += gsmooth(uv * uRes * 0.85, 3.0) * 0.006;
  vec2 a = (uv - vec2(0.30, 0.72)) * vec2(1.6, 1.0);
  c += exp(-dot(a, a) * 22.0) * 0.055;
  vec2 b = (uv - vec2(0.74, 0.26)) * vec2(2.4, 1.0);
  c += exp(-dot(b, b) * 46.0) * 0.020;
  c += smoothstep(0.72, 1.0, uv.y) * 0.014;
  c += gsmooth(uv * uRes * 0.7 + floor(t * 2.0) * 41.0, 8.0) * 0.006;
  return c;
}

void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  vec3 c;
  if      (uMode == 0) c = mSnow(uv, uTime);
  else if (uMode == 1) c = mTape(uv, uTime);
  else if (uMode == 2) c = mRoll(uv, uTime);
  else if (uMode == 3) c = mBeat(uv, uTime);
  else                 c = mOff (uv, uTime);

  /* el tubo nunca ilumina los bordes igual que el centro */
  vec2 v = uv - 0.5;
  c *= 1.0 - dot(v, v) * 0.85;
  fragColor = vec4(max(c, 0.0), 1.0);
}`;

function Signal({ mode, boost }) {
  const ref = useRef(null);
  const modeRef = useRef(mode);
  modeRef.current = mode;

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const gl = cv.getContext("webgl2", { antialias: false, alpha: false, depth: false });
    if (!gl) {
      cv.style.background = "#111";
      return;
    }

    const build = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.warn("[hb signal]", gl.getShaderInfoLog(s));
      }
      return s;
    };
    const prog = gl.createProgram();
    gl.attachShader(prog, build(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, build(gl.FRAGMENT_SHADER, FRAG));
    gl.bindAttribLocation(prog, 0, "aPos");
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.warn("[hb signal]", gl.getProgramInfoLog(prog));
      cv.style.background = "#0d0d0e";
      return;
    }
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, "uRes");
    const uTime = gl.getUniformLocation(prog, "uTime");
    const uMode = gl.getUniformLocation(prog, "uMode");

    const fit = () => {
      const H = 480; // líneas de una señal analógica
      const r = cv.clientWidth / Math.max(1, cv.clientHeight);
      cv.width = Math.round(H * r);
      cv.height = H;
      gl.viewport(0, 0, cv.width, cv.height);
    };
    fit();
    window.addEventListener("resize", fit);

    let raf = 0;
    const t0 = performance.now();
    const draw = (t) => {
      raf = requestAnimationFrame(draw);
      gl.uniform2f(uRes, cv.width, cv.height);
      gl.uniform1f(uTime, (t - t0) / 1000);
      gl.uniform1i(uMode, modeRef.current);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", fit);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, []);

  return <canvas ref={ref} className={`hb-signal ${boost ? "boost" : ""}`} />;
}

/* --- grano encima del contenido: gaussiano puro, en GPU ---
   Nada de canvas escalado con pixelado: eso es lo que producía bloques.
   Aquí cada grano vale ~1.3 px y tiene los bordes interpolados. --- */

const GRAIN_FRAG = `#version 300 es
precision highp float;
out vec4 fragColor;
uniform vec2  uRes;
uniform float uTime;
uniform float uAmp;

float h21(vec2 p){
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
/* Box–Muller: ruido con distribución normal, como el grano real */
float gcell(vec2 c, float seed){
  float u1 = max(1e-5, h21(c + seed));
  float u2 = h21(c * 1.37 + seed + 9.13);
  return sqrt(-2.0 * log(u1)) * cos(6.28318530718 * u2);
}
float gsmooth(vec2 p, float seed){
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(gcell(i,                 seed), gcell(i + vec2(1.0,0.0), seed), f.x),
             mix(gcell(i + vec2(0.0,1.0), seed), gcell(i + vec2(1.0,1.0), seed), f.x), f.y);
}

void main(){
  vec2 px = gl_FragCoord.xy;
  float ft = floor(uTime * 24.0);        /* el grano hierve, no se desliza */
  vec2  jt = vec2(ft * 37.1, ft * 61.7);

  /* luma: grano fino */
  float l = gsmooth(px * 0.78 + jt, 0.0);
  /* croma: más grueso y más débil, con su propia semilla por canal */
  vec2 cp = px * 0.30 + jt * 0.5;
  vec3 ch = vec3(gsmooth(cp, 5.0), gsmooth(cp, 29.0), gsmooth(cp, 61.0));

  vec3 n = vec3(l) * 0.82 + ch * 0.30;
  n = max(n, 0.0) * uAmp;

  /* conmutación de cabezas: la franja rota del borde inferior */
  float y = px.y / uRes.y;
  float head = 1.0 - smoothstep(0.0, 0.017, y);
  if (head > 0.001){
    float jit = floor(uTime * 14.0);
    vec2 hp = vec2(px.x * 0.5 + h21(vec2(jit, 3.0)) * 260.0, px.y * 1.6 + jit * 17.0);
    n += head * abs(gsmooth(hp, 5.0)) * 0.55;
  }
  fragColor = vec4(n, 1.0);
}`;

function FilmGrain({ amp }) {
  const ref = useRef(null);
  const ampRef = useRef(amp);
  ampRef.current = amp;

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const gl = cv.getContext("webgl2", { antialias: false, alpha: false, depth: false });
    if (!gl) return;

    const build = (type, src) => {
      const sh = gl.createShader(type);
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) console.warn("[hb grain]", gl.getShaderInfoLog(sh));
      return sh;
    };
    const prog = gl.createProgram();
    gl.attachShader(prog, build(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, build(gl.FRAGMENT_SHADER, GRAIN_FRAG));
    gl.bindAttribLocation(prog, 0, "aPos");
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.warn("[hb grain]", gl.getProgramInfoLog(prog));
      return;
    }
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, "uRes");
    const uTime = gl.getUniformLocation(prog, "uTime");
    const uAmp = gl.getUniformLocation(prog, "uAmp");

    const fit = () => {
      /* se renderiza algo por debajo de la resolución de pantalla: al
         escalarse queda un grano de ~1.3 px con el borde suave */
      const w = Math.min(1400, Math.max(320, Math.round(cv.clientWidth * 0.72)));
      const h = Math.max(180, Math.round(w * (cv.clientHeight / Math.max(1, cv.clientWidth))));
      cv.width = w;
      cv.height = h;
      gl.viewport(0, 0, w, h);
    };
    fit();
    window.addEventListener("resize", fit);

    let raf = 0;
    let last = 0;
    const t0 = performance.now();
    const draw = (t) => {
      raf = requestAnimationFrame(draw);
      if (t - last < 1000 / 30) return;
      last = t;
      gl.uniform2f(uRes, cv.width, cv.height);
      gl.uniform1f(uTime, (t - t0) / 1000);
      gl.uniform1f(uAmp, ampRef.current);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", fit);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, []);

  return <canvas ref={ref} className="hb-film" />;
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

/* --- globo alámbrico girando --- */
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
      return [c + x * R, c - (y0 * ct - z0 * st) * R, y0 * st + z0 * ct];
    };

    const stroke = (pts, front) => {
      ctx.strokeStyle = front ? "rgba(10,10,10,.92)" : "rgba(10,10,10,.28)";
      ctx.lineWidth = front ? 3 : 2.2;
      ctx.beginPath();
      let pen = false;
      for (const [x, y, z] of pts) {
        if (z > 0 !== front) { pen = false; continue; }
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

      const curves = [];
      for (let lat = -75; lat <= 75; lat += 15) {
        const pts = [];
        for (let lon = 0; lon <= 360; lon += 4) pts.push(project(lat, lon + rot));
        curves.push(pts);
      }
      for (let lon = 0; lon < 360; lon += 15) {
        const pts = [];
        for (let lat = -90; lat <= 90; lat += 4) pts.push(project(lat, lon + rot));
        curves.push(pts);
      }
      for (const p of curves) stroke(p, false);
      for (const p of curves) stroke(p, true);

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

function SceneBoot({ P }) {
  const rows = P.boot;
  const n = useSteps(rows.length + 2, 380, 400);
  const bar = Math.min(100, Math.max(0, (n - rows.length + 1) * 34));
  return (
    <div className="hb-scene hb-boot">
      <div className="hb-boot-head">
        {n > 0 && <span className="hb-blk">■</span>}
        {n > 0 && <span className="hb-boot-title">{P.bootHead}</span>}
      </div>
      <ul className="hb-boot-list">
        {rows.map((l, i) => (
          <li key={l.k} className={`hb-boot-row ${n > i ? "on" : ""}`}>
            <span className="hb-boot-k">{l.k}</span>
            <span className="hb-boot-dots" />
            <span className="hb-boot-v">{l.v}</span>
          </li>
        ))}
      </ul>
      {n >= rows.length && (
        <div className="hb-boot-bar">
          <div className="hb-boot-bar-fill" style={{ width: `${bar}%` }} />
        </div>
      )}
      {n >= rows.length + 2 && <div className="hb-boot-ok">{P.bootOk}</div>}
    </div>
  );
}

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
        <div className="hb-bars-block"><b>{BASE.channel}</b><span>BARS &amp; TONE</span></div>
        <div className="hb-bars-block"><b>1 kHz</b><span>−20 dBFS</span></div>
        <div className="hb-bars-block"><b>29.97</b><span>FPS NTSC</span></div>
        <div className="hb-bars-block"><b>CH {BASE.channelNo}</b><span>SP MODE</span></div>
      </div>
      <div className={`hb-bars-strip ${n > BARS.length + 1 ? "on" : ""}`}>
        {Array.from({ length: 22 }).map((_, i) => (
          <i key={i} style={{ opacity: i / 21 }} />
        ))}
      </div>
    </div>
  );
}

function SceneKanji({ P }) {
  const n = useSteps(4, 300, 240);
  return (
    <div className="hb-scene hb-warn">
      <div className={`hb-warn-en ${n > 3 ? "on" : ""}`}>{P.kanjiEN}</div>
      <div className={`hb-warn-word ${n > 2 ? "on" : ""}`}>
        <Chroma amount={4}>{P.kanjiWord}</Chroma>
      </div>
      <div className={`hb-warn-jp ${n > 1 ? "on" : ""}`}>{P.kanjiJP}</div>
      <div className={`hb-warn-kanji ${n > 0 ? "on" : ""}`}>
        <Chroma amount={6}>{P.kanji}</Chroma>
      </div>
      <div className={`hb-seal ${n > 3 ? "on" : ""}`}>
        <span>{BASE.channel.slice(0, 2)}</span>
      </div>
    </div>
  );
}

function SceneGlobe({ P }) {
  const n = useSteps(4, 300, 260);
  return (
    <div className="hb-scene hb-globe">
      <div className={`hb-globe-wrap ${n > 0 ? "on" : ""}`}><Globe /></div>
      <div className={`hb-globe-word ${n > 1 ? "on" : ""}`}>{BASE.channel}</div>
      <div className={`hb-globe-sub ${n > 2 ? "on" : ""}`}>{P.system}</div>
      <div className={`hb-globe-data ${n > 3 ? "on" : ""}`}>
        {P.globeData.map((d) => <span key={d}>{d}</span>)}
      </div>
    </div>
  );
}

function SceneGrid({ P }) {
  const n = useSteps(4, 280, 220);
  const glyphs = ["b", "b", "s", "b", "s", "s", "b", "c", "b", "c"];
  return (
    <div className="hb-scene hb-grid">
      <div className={`hb-grid-floor ${n > 0 ? "on" : ""}`}><div className="hb-grid-lines" /></div>
      <div className="hb-grid-fade" />
      <div className={`hb-grid-word ${n > 1 ? "on" : ""}`}>
        <Chroma amount={3}>{BASE.channel}</Chroma>
      </div>
      <div className={`hb-grid-glyphs ${n > 2 ? "on" : ""}`}>
        {glyphs.map((g, i) => <i key={i} className={`g-${g}`} />)}
      </div>
      <div className={`hb-grid-sub ${n > 3 ? "on" : ""}`}>{P.system}</div>
    </div>
  );
}

function SceneLogo({ P }) {
  const n = useSteps(6, 250, 180);
  const swatches = ["#D9D5C5", "#FD1348", "#BF1F3C", "#1C1C1C"];
  return (
    <div className="hb-scene hb-logo">
      <div className={`hb-logo-tag ${n > 0 ? "on" : ""}`}>VIDEO {BASE.channelNo}</div>
      <div className="hb-logo-core">
        <div className={`hb-pill ${n > 1 ? "on" : ""}`}>{BASE.channel}</div>
        <div className={`hb-logo-big ${n > 2 ? "on" : ""}`}>
          <Chroma amount={3}>{P.logoPrefix} {BASE.channel}</Chroma>
        </div>
        <div className={`hb-kana ${n > 3 ? "on" : ""}`}>{BASE.katakana}</div>
      </div>
      <div className={`hb-swatches ${n > 4 ? "on" : ""}`}>
        {swatches.map((c) => <i key={c} style={{ background: c }} />)}
      </div>
      <div className={`hb-dither ${n > 5 ? "on" : ""}`}><div className="hb-dither-glitch" /></div>
      <div className={`hb-logo-foot ${n > 5 ? "on" : ""}`}>
        <span>© {BASE.est}–{new Date().getFullYear()} {BASE.channel}</span>
        <span>{P.logoFoot}</span>
      </div>
    </div>
  );
}

function SceneLockup({ P }) {
  const n = useSteps(5, 260, 200);
  const bars = useMemo(
    () => Array.from({ length: 68 }).map(() => 1 + Math.floor(Math.random() * 4)),
    []
  );
  return (
    <div className="hb-scene hb-lock">
      <div className="hb-lock-inner">
        <div className={`hb-lock-top ${n > 0 ? "on" : ""}`}>
          <span className="hb-lock-diamonds">◆◆◆◆◆◆◆◆◆</span>
          <span>{P.tagline}™</span>
          {P.lockTop.map((s) => <span key={s} className="hb-jp">{s}</span>)}
        </div>
        <div className={`hb-lock-name ${n > 1 ? "on" : ""}`}>{BASE.channel}</div>
        <div className={`hb-lock-bottom ${n > 2 ? "on" : ""}`}>
          <div className="hb-lock-est">
            <span>est. {BASE.est}</span>
            <span>{dayOfYear()}/365</span>
          </div>
          <div className={`hb-barcode ${n > 3 ? "on" : ""}`}>
            {bars.map((w, i) => <i key={i} style={{ width: `${w}px` }} />)}
          </div>
          <div className={`hb-lock-badge ${n > 4 ? "on" : ""}`}>
            <span>{P.lockBadge[0]}</span>
            <span className="hb-jp">{P.lockBadge[1]}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function SceneIndex({ P }) {
  const n = useSteps(P.index.length + 2, 220, 220);
  return (
    <div className="hb-scene hb-idx">
      <div className={`hb-idx-head ${n > 0 ? "on" : ""}`}>
        <span>{P.indexTitle}</span>
        <span className="hb-jp">{P.indexJP}</span>
      </div>
      <ul className="hb-idx-list">
        {P.index.map((row, i) => (
          <li key={row[0]} className={`${n > i + 1 ? "on" : ""} ${i === 0 ? "cur" : ""}`}>
            <span className="hb-idx-n">{row[0]}</span>
            <span className="hb-idx-t">{row[1]}</span>
            <span className="hb-idx-rule" />
            <span className="hb-idx-time">{row[2]}</span>
          </li>
        ))}
      </ul>
      <div className={`hb-idx-foot ${n > P.index.length + 1 ? "on" : ""}`}>{P.indexFoot}</div>
    </div>
  );
}

/* créditos rodando */
function SceneCredits({ P }) {
  const n = useSteps(2, 300, 200);
  return (
    <div className="hb-scene hb-cred">
      <div className={`hb-cred-head ${n > 0 ? "on" : ""}`}>
        <span>{P.creditsTitle}</span>
        <span className="hb-jp">{P.creditsJP}</span>
      </div>
      <div className="hb-cred-window">
        <div className={`hb-cred-roll ${n > 1 ? "on" : ""}`}>
          {P.credits.map(([role, name]) => (
            <div className="hb-cred-row" key={role}>
              <span className="hb-cred-role">{role}</span>
              <span className="hb-cred-name">{name}</span>
            </div>
          ))}
          <div className="hb-cred-end">{P.creditsEnd}</div>
        </div>
      </div>
    </div>
  );
}

/* rebobinado con contador que baja */
function SceneRewind({ P }) {
  const n = useSteps(3, 280, 200);
  const [left, setLeft] = useState(2832); // segundos
  useEffect(() => {
    const id = setInterval(() => setLeft((v) => Math.max(0, v - 137)), 120);
    return () => clearInterval(id);
  }, []);
  const pctLeft = (left / 2832) * 100;
  return (
    <div className="hb-scene hb-rew">
      <div className={`hb-rew-icon ${n > 0 ? "on" : ""}`}>◄◄</div>
      <h2 className={`hb-rew-title ${n > 0 ? "on" : ""}`}>
        <Chroma amount={4}>{P.rewindTitle}</Chroma>
      </h2>
      <div className={`hb-rew-jp ${n > 1 ? "on" : ""}`}>{P.rewindJP}</div>
      <div className={`hb-rew-bar ${n > 2 ? "on" : ""}`}>
        <div className="hb-rew-fill" style={{ width: `${pctLeft}%` }} />
      </div>
      <div className={`hb-rew-count ${n > 2 ? "on" : ""}`}>
        {pad(Math.floor(left / 3600))}:{pad(Math.floor((left % 3600) / 60))}:{pad(left % 60)}
      </div>
    </div>
  );
}

/* expulsar cinta: el tubo colapsa al final */
function SceneEject({ P }) {
  const n = useSteps(3, 420, 300);
  const [collapse, setCollapse] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setCollapse(true), 4900);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="hb-scene hb-eject">
      <div className={`hb-eject-icon ${n > 0 ? "on" : ""}`}>▲</div>
      <h2 className={`hb-eject-title ${n > 1 ? "on" : ""}`}>{P.ejectTitle}</h2>
      <div className={`hb-eject-jp ${n > 2 ? "on" : ""}`}>{P.ejectJP}</div>
      {collapse && <div className="hb-collapse" />}
    </div>
  );
}

function SceneMarquee({ P }) {
  const n = useSteps(4, 300, 220);
  const [dots, setDots] = useState(1);
  useEffect(() => {
    const id = setInterval(() => setDots((d) => (d % 3) + 1), 520);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="hb-scene hb-standby">
      <div className={`hb-sb-live ${n > 0 ? "on" : ""}`}>
        <i className="hb-dot" />{P.marqueeKicker}
      </div>
      <h1 className={`hb-sb-title ${n > 1 ? "on" : ""}`}>
        <Chroma amount={4}>{P.marqueeTitle}</Chroma>
      </h1>
      <div className={`hb-sb-jp ${n > 2 ? "on" : ""}`}>{P.marqueeJP}{".".repeat(dots)}</div>
      <div className={`hb-sb-url ${n > 3 ? "on" : ""}`}>{P.marqueeUrl}</div>
    </div>
  );
}

/* ===================== APP ===================== */

// El programa (apertura o cierre) llega de fuera: cada uno vive en su propia
// dirección (#overlays y #overlays-fin), así que aquí ya no se cambia de uno
// a otro — el componente solo reproduce el que le toca.
export default function HayfelBroadcast({ program = "start" }) {
  const [idx, setIdx] = useState(0);
  const [pass, setPass] = useState(0);
  const [paused, setPaused] = useState(false);
  const [glitch, setGlitch] = useState(false);
  const [sound, setSound] = useState(false);
  const [uiVisible, setUiVisible] = useState(true);
  const [sig, setSig] = useState(0);
  const [clock, setClock] = useState(0);
  const [osd, setOsd] = useState("");
  const rootRef = useRef(null);
  const audioRef = useRef(null);

  const P = PROGRAMS[program];
  const scene = P.scenes[Math.min(idx, P.scenes.length - 1)];
  const signal = SIGNALS[sig];

  /* fuentes */
  useEffect(() => {
    const l = document.createElement("link");
    l.rel = "stylesheet";
    l.href =
      "https://fonts.googleapis.com/css2?family=Anton&family=Bodoni+Moda:ital,wght@1,700;1,900&family=DotGothic16&family=Noto+Sans+JP:wght@400;700;900&display=swap";
    document.head.appendChild(l);
    return () => { if (l.parentNode) l.parentNode.removeChild(l); };
  }, []);

  useEffect(() => {
    if (paused) return;
    const t = setTimeout(() => {
      setIdx((v) => (v + 1) % P.scenes.length);
      setPass((p) => p + 1);
    }, scene.ms);
    return () => clearTimeout(t);
  }, [idx, paused, scene.ms, P.scenes.length]);

  useEffect(() => {
    setGlitch(true);
    const t = setTimeout(() => setGlitch(false), 420);
    return () => clearTimeout(t);
  }, [idx, pass, program]);

  useEffect(() => { const id = setInterval(() => setClock((c) => c + 1), 1000); return () => clearInterval(id); }, []);

  /* OSD estilo videograbadora */
  const osdTimer = useRef(null);
  const flashOsd = useCallback((text) => {
    setOsd(text);
    clearTimeout(osdTimer.current);
    osdTimer.current = setTimeout(() => setOsd(""), 2600);
  }, []);
  useEffect(() => () => clearTimeout(osdTimer.current), []);
  useEffect(() => { flashOsd(P.osd); }, [program, flashOsd, P.osd]);

  useEffect(() => {
    let t;
    const wake = () => {
      setUiVisible(true);
      clearTimeout(t);
      t = setTimeout(() => setUiVisible(false), 5000);
    };
    wake();
    window.addEventListener("mousemove", wake);
    return () => { window.removeEventListener("mousemove", wake); clearTimeout(t); };
  }, []);

  const jump = useCallback((dir) => {
    setIdx((v) => (v + dir + P.scenes.length) % P.scenes.length);
    setPass((p) => p + 1);
  }, [P.scenes.length]);

  const cycleSignal = useCallback((i) => {
    setSig((v) => {
      const next = typeof i === "number" ? i : (v + 1) % SIGNALS.length;
      flashOsd(SIGNALS[next].label);
      return next;
    });
  }, [flashOsd]);

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
      src.buffer = buf; src.loop = true;
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass"; lp.frequency.value = 1300;
      const g = ctx.createGain(); g.gain.value = 0.03;
      src.connect(lp).connect(g).connect(ctx.destination);
      const osc = ctx.createOscillator(); osc.frequency.value = 59.94;
      const og = ctx.createGain(); og.gain.value = 0.028;
      osc.connect(og).connect(ctx.destination);
      src.start(); osc.start();
      audioRef.current = { ctx };
      setSound(true);
    } catch (e) { setSound(false); }
  }, []);

  useEffect(() => () => { if (audioRef.current) audioRef.current.ctx.close(); }, []);

  useEffect(() => {
    const onKey = (e) => {
      const k = e.key.toLowerCase();
      if (e.code === "Space") { e.preventDefault(); setPaused((p) => !p); flashOsd(paused ? "▶ PLAY" : "❚❚ PAUSE"); }
      else if (e.code === "ArrowRight") jump(1);
      else if (e.code === "ArrowLeft") jump(-1);
      else if (k === "b") cycleSignal();
      else if (k === "m") toggleSound();
      else if (k === "f") {
        if (!document.fullscreenElement) rootRef.current?.requestFullscreen?.();
        else document.exitFullscreen?.();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [jump, toggleSound, cycleSignal, paused, flashOsd]);

  const now = new Date();
  const stamp = `${MONTHS[now.getMonth()]} ${pad(now.getDate())} ${now.getFullYear()}  ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  const counter = `${pad(Math.floor(clock / 3600))}:${pad(Math.floor((clock % 3600) / 60))}:${pad(clock % 60)}`;

  return (
    <div className={`hb-root ${glitch ? "glitching" : ""}`} ref={rootRef}>
      <style>{CSS}</style>

      <div className="hb-screen">
        <div className="hb-warp">
          <Signal mode={signal.mode} boost={glitch} />
          <div className="hb-signal-veil" style={{ opacity: glitch ? 0 : 1 - signal.base }} />

          <div className="hb-jitter">
            <div className="hb-content" key={`${program}-${scene.id}-${pass}`}>
              {scene.id === "boot" && <SceneBoot P={P} />}
              {scene.id === "bars" && <SceneBars />}
              {scene.id === "kanji" && <SceneKanji P={P} />}
              {scene.id === "globe" && <SceneGlobe P={P} />}
              {scene.id === "grid" && <SceneGrid P={P} />}
              {scene.id === "logo" && <SceneLogo P={P} />}
              {scene.id === "lockup" && <SceneLockup P={P} />}
              {scene.id === "index" && <SceneIndex P={P} />}
              {scene.id === "credits" && <SceneCredits P={P} />}
              {scene.id === "rewind" && <SceneRewind P={P} />}
              {scene.id === "eject" && <SceneEject P={P} />}
              {scene.id === "marquee" && <SceneMarquee P={P} />}
            </div>
          </div>

          {/* OSD de videograbadora */}
          <div className={`hb-osd ${osd ? "on" : ""}`}>{osd}</div>

          <div className="hb-bug hb-bug-tl">
            <span className="hb-rec" /> REC<em>SP {counter}</em>
          </div>
          <div className="hb-bug hb-bug-tr">CH {BASE.channelNo}</div>
          <div className="hb-bug hb-bug-bl">{BASE.url}</div>
          <div className="hb-bug hb-bug-br hb-stamp">{stamp}</div>

          <div className="hb-scan" />
          <div className="hb-aperture" />
          <div className="hb-interlace" />
          <FilmGrain amp={glitch ? 0.30 : 0.115} />
          <div className="hb-smear" />
          <div className="hb-track" />
          <div className="hb-warmth" />
          <div className="hb-vig" />
          <div className="hb-bezel" />
          <div className="hb-flick" />
        </div>
      </div>

      <div className={`hb-panel ${uiVisible ? "on" : ""}`}>
        <div className="hb-pgroup">
          <span className="hb-plabel">SEÑAL</span>
          {SIGNALS.map((s, i) => (
            <button key={s.id} className={sig === i ? "act" : ""} onClick={() => cycleSignal(i)}>
              {s.label}
            </button>
          ))}
        </div>
        <div className="hb-phint">
          espacio pausa · ←→ escena · B señal · M audio {sound ? "on" : "off"} · F pantalla completa
        </div>
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
  background:#000; overflow:hidden; color:var(--bone);
  font-family:"DotGothic16","Noto Sans JP",monospace;
  -webkit-font-smoothing:none;
}
.hb-jp{font-family:"Noto Sans JP",sans-serif; font-weight:700;}
.hb-screen{position:absolute; inset:0; background:#000; padding:1.1vmin;}
.hb-warp{position:absolute; inset:1.1vmin; overflow:hidden;
  border-radius:2.6vmin/4.2vmin;
  filter:saturate(.94) contrast(1.05);
  box-shadow:inset 0 0 10vmin rgba(0,0,0,.85), 0 0 4vmin rgba(0,0,0,.9);}
.hb-jitter{position:absolute; inset:0; z-index:10; animation:hbJitter 9s steps(1,end) infinite;}
.hb-content{position:absolute; inset:0;}
.hb-scene{position:absolute; inset:0;}

@keyframes hbJitter{
  0%,92%{transform:translate(0,0)}
  93%{transform:translate(-3px,1px)}
  94%{transform:translate(2px,-1px)}
  95%,100%{transform:translate(0,0)}
}

/* ---------- señal de fondo ---------- */
.hb-signal{position:absolute; inset:0; width:100%; height:100%; display:block; z-index:1;}
.hb-signal.boost{filter:brightness(1.12) contrast(1.08);}
.hb-signal-veil{position:absolute; inset:0; z-index:2; background:#050505;
  transition:opacity .18s steps(3,end); pointer-events:none;}

/* ---------- capas de tubo ---------- */
.hb-film{position:absolute; inset:0; width:100%; height:100%; display:block;
  mix-blend-mode:screen; pointer-events:none; z-index:38;}
.hb-scan{position:absolute; inset:0; pointer-events:none; z-index:40;
  background:repeating-linear-gradient(to bottom,
    rgba(0,0,0,.30) 0 1px, rgba(0,0,0,0) 1px 3px);
  animation:hbScanDrift 9s linear infinite;}
@keyframes hbScanDrift{to{background-position:0 3px}}
.hb-aperture{position:absolute; inset:0; pointer-events:none; z-index:41; opacity:.11;
  background:repeating-linear-gradient(to right,
    rgba(253,19,72,.5) 0 1px, rgba(43,92,255,.4) 1px 2px, rgba(0,0,0,0) 2px 3px);}
/* campos alternos a 30 Hz */
.hb-interlace{position:absolute; inset:0; pointer-events:none; z-index:39; opacity:.5;
  background:repeating-linear-gradient(to bottom,
    rgba(0,0,0,.22) 0 2px, rgba(0,0,0,0) 2px 4px);
  animation:hbField .066s steps(2,end) infinite;}
@keyframes hbField{0%{background-position:0 0}100%{background-position:0 2px}}
.hb-smear{position:absolute; inset:0; pointer-events:none; z-index:37; opacity:.5;
  background:repeating-linear-gradient(to bottom,
    rgba(217,213,197,.04) 0 2px, rgba(0,0,0,0) 2px 9px);
  animation:hbSmear 13s linear infinite;}
@keyframes hbSmear{to{background-position:0 -60px}}
/* el fósforo viejo tiraba a ámbar */
.hb-warmth{position:absolute; inset:0; pointer-events:none; z-index:44;
  background:linear-gradient(180deg, rgba(255,196,120,.05), rgba(120,60,40,.045));
  mix-blend-mode:soft-light;}
.hb-vig{position:absolute; inset:0; pointer-events:none; z-index:45;
  background:radial-gradient(104% 90% at 50% 48%, rgba(0,0,0,0) 44%, rgba(0,0,0,.55) 82%, rgba(0,0,0,.96) 100%);}
/* bisel del tubo: las esquinas del vidrio comen imagen */
.hb-bezel{position:absolute; inset:-2px; pointer-events:none; z-index:47;
  border-radius:2.6vmin/4.2vmin;
  box-shadow:inset 0 0 0 .5vmin #000, inset 0 0 3vmin rgba(0,0,0,.85),
             inset 0 .4vmin 1.6vmin rgba(255,255,255,.05);}
.hb-flick{position:absolute; inset:0; pointer-events:none; z-index:46;
  background:var(--bone); mix-blend-mode:overlay; opacity:0;
  animation:hbFlick 7s steps(1,end) infinite;}
@keyframes hbFlick{0%,95%{opacity:0}96%{opacity:.045}97%,100%{opacity:0}}

.hb-track{position:absolute; left:0; right:0; height:14vmin; z-index:42; pointer-events:none;
  background:linear-gradient(to bottom, rgba(255,255,255,0) 0%,
    rgba(255,255,255,.045) 40%, rgba(255,255,255,.075) 50%, rgba(255,255,255,.03) 68%, rgba(255,255,255,0) 100%);
  animation:hbTrack 14s linear infinite;}
@keyframes hbTrack{0%{top:-16vmin}100%{top:108vmin}}

.hb-root.glitching .hb-jitter{animation:hbCut .42s steps(1,end) 1;}
@keyframes hbCut{
  0%{transform:translate(0,0) scaleY(1); filter:none; opacity:1}
  10%{opacity:0}
  14%{transform:translate(-12px,-5px) scaleY(1.05); filter:invert(1) contrast(1.9); opacity:1}
  28%{transform:translate(9px,3px) scaleY(.95)}
  36%{opacity:0}
  42%{transform:translate(-5px,0); filter:saturate(2.2); opacity:1}
  56%{transform:translate(0,-14px) scaleY(1.08)}
  70%{transform:translate(4px,1px)}
  100%{transform:translate(0,0) scaleY(1); filter:none; opacity:1}
}
.hb-root.glitching .hb-scan{opacity:.8}

/* ---------- OSD de videograbadora ---------- */
.hb-osd{position:absolute; top:8.5vmin; left:4.4vmin; z-index:48;
  font-family:"DotGothic16",monospace; font-size:5.4vmin; letter-spacing:.1em;
  color:#fff; opacity:0; transition:opacity .2s steps(2,end);
  text-shadow:.35vmin .35vmin 0 #000, -.35vmin .35vmin 0 #000,
              .35vmin -.35vmin 0 #000, -.35vmin -.35vmin 0 #000;}
.hb-osd.on{opacity:.95}

/* ---------- bugs de canal ---------- */
.hb-bug{position:absolute; z-index:44; font-size:1.5vmin; letter-spacing:.14em;
  color:var(--bone); opacity:.6; text-shadow:1px 0 var(--mag), -1px 0 var(--cyan), 0 0 .6vmin rgba(0,0,0,.9);
  display:flex; align-items:center; gap:.7vmin; white-space:nowrap;}
.hb-bug em{font-style:normal; opacity:.8; margin-left:.7vmin}
.hb-bug-tl{top:3.4vmin; left:4.4vmin}
.hb-bug-tr{top:3.4vmin; right:4.4vmin}
.hb-bug-bl{bottom:3.8vmin; left:4.4vmin}
.hb-bug-br{bottom:3.8vmin; right:4.4vmin}
.hb-stamp{opacity:.72; letter-spacing:.18em;}
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
.hb-boot{padding:12vmin 9vmin; display:flex; flex-direction:column; justify-content:center;}
.hb-boot-head{display:flex; align-items:center; gap:1.4vmin; margin-bottom:3.4vmin;
  font-size:2.4vmin; letter-spacing:.3em; color:var(--bone);}
.hb-blk{color:var(--hot); animation:hbBlink .8s steps(1,end) infinite;}
.hb-boot-title{text-shadow:2px 0 var(--mid);}
.hb-boot-list{list-style:none; margin:0; padding:0; max-width:82vmin;}
.hb-boot-row{display:flex; align-items:baseline; gap:1.2vmin; font-size:2.5vmin;
  line-height:2; opacity:0; transform:translateX(-1.4vmin); color:var(--bone);}
.hb-boot-row.on{opacity:1; transform:none;}
.hb-boot-k{color:var(--hot); letter-spacing:.22em; min-width:20vmin; text-shadow:1px 0 var(--mag);}
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

/* ================= KANJI ================= */
.hb-warn{display:flex; align-items:stretch; justify-content:flex-end;
  padding:7vmin 5vmin 7vmin 7vmin; gap:3vmin;}
.hb-warn > *{opacity:0}
.hb-warn > .on{opacity:1}
.hb-warn-kanji{order:4; display:flex; align-items:center; margin-left:auto;
  font-family:"Noto Sans JP",sans-serif; font-weight:900; color:var(--hot);
  font-size:42vmin; line-height:.82; letter-spacing:-.04em;
  writing-mode:vertical-rl; text-orientation:upright; transform:translateX(3vmin);}
.hb-warn-jp{order:3; writing-mode:vertical-rl; font-family:"Noto Sans JP",sans-serif;
  font-weight:700; font-size:3.2vmin; line-height:1.5; letter-spacing:.06em;
  color:var(--bone); max-height:100%;
  text-shadow:2px 0 var(--mid), -1px 0 rgba(43,92,255,.55);}
.hb-warn-word{order:2; writing-mode:vertical-rl;
  font-family:"Anton",Impact,sans-serif; font-size:12vmin; line-height:.9;
  letter-spacing:.02em; color:var(--hot); text-transform:uppercase;
  align-self:flex-start; transform:scaleY(1.06);}
.hb-warn-en{order:1; writing-mode:vertical-rl; font-family:"Anton",Impact,sans-serif;
  font-size:2.4vmin; letter-spacing:.05em; line-height:1.35; color:var(--bone); max-height:100%;}
.hb-warn-en.on{opacity:.9}
.hb-seal{position:absolute; right:6vmin; bottom:6vmin; width:9vmin; height:9vmin;
  border:.5vmin solid var(--deep); display:grid; place-items:center;
  color:var(--deep); font-family:"Anton",Impact,sans-serif; font-size:3.4vmin;
  letter-spacing:.06em; transform:rotate(-4deg);}
.hb-seal.on{opacity:.85}

/* ================= GLOBO ================= */
.hb-globe{display:grid; place-items:center;}
.hb-globe-wrap{position:absolute; top:50%; left:50%; width:76vmin; height:76vmin;
  transform:translate(-50%,-50%); opacity:0;}
.hb-globe-wrap.on{opacity:1}
.hb-globe-cv{width:100%; height:100%; display:block;}
.hb-globe-word{position:relative; z-index:3; font-family:"Anton",Impact,sans-serif;
  font-size:18vmin; letter-spacing:.02em; line-height:1; color:transparent;
  -webkit-text-stroke:.75vmin var(--bone); -webkit-text-fill-color:transparent; opacity:0;
  filter:drop-shadow(.5vmin .5vmin 0 rgba(10,10,10,.75));}
.hb-globe-word.on{opacity:1}
.hb-globe-sub{position:absolute; z-index:3; right:8vmin; top:calc(50% + 9vmin);
  font-size:2.4vmin; letter-spacing:.38em; color:var(--bone); text-align:right;
  max-width:24vmin; line-height:1.5; opacity:0;}
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
.hb-grid-lines{position:absolute; inset:0; transform:rotateX(74deg); transform-origin:50% 0%;
  background-image:
    repeating-linear-gradient(to right, var(--bone) 0 2px, transparent 2px 5vmin),
    repeating-linear-gradient(to bottom, var(--bone) 0 2px, transparent 2px 5vmin);
  animation:hbGridRun 1.5s linear infinite;}
@keyframes hbGridRun{to{background-position:0 5vmin, 0 5vmin}}
.hb-grid-fade{position:absolute; inset:0; z-index:2; pointer-events:none;
  background:linear-gradient(to bottom, rgba(5,5,5,.92) 34%, rgba(10,10,10,.1) 58%, rgba(10,10,10,.75) 100%);}
.hb-grid-word{position:absolute; z-index:3; left:0; right:0; top:20%; text-align:center;
  font-family:"Anton",Impact,sans-serif; font-size:22vmin; line-height:.86;
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
.hb-logo{display:flex; flex-direction:column; justify-content:center; padding:9vmin 10vmin; gap:1vmin;}
.hb-logo-tag{position:absolute; top:9vmin; left:10vmin; font-size:3vmin;
  letter-spacing:.28em; color:var(--bone); opacity:0; transform:translateY(-1vmin);
  text-shadow:2px 0 rgba(253,19,72,.6);}
.hb-logo-tag.on{opacity:1; transform:none;}
.hb-logo-core{position:relative;}
.hb-pill{display:inline-block; background:var(--hot); color:var(--black);
  font-family:"Anton",Impact,sans-serif; font-size:3.4vmin; letter-spacing:.06em;
  padding:.5vmin 2.4vmin .8vmin; margin-bottom:1.4vmin;
  opacity:0; transform:scale(.82); transition:transform .2s steps(4,end);}
.hb-pill.on{opacity:1; transform:none;}
.hb-logo-big{font-family:"Anton",Impact,sans-serif; font-size:13vmin; line-height:.86;
  letter-spacing:-.01em; transform:skewX(-9deg) translateY(1vmin); opacity:0;
  filter:drop-shadow(.7vmin .7vmin 0 rgba(0,0,0,.85));}
.hb-logo-big.on{opacity:1; transform:skewX(-9deg);}
.hb-logo-big .hb-ch-base{
  background:linear-gradient(to bottom,#FF6E85 0 46%, var(--hot) 46% 74%, var(--deep) 74% 100%);
  -webkit-background-clip:text; background-clip:text;
  color:transparent; -webkit-text-fill-color:transparent;}
.hb-kana{font-family:"Noto Sans JP",sans-serif; font-weight:700; font-size:3.2vmin;
  letter-spacing:.42em; color:var(--hot); margin-top:1.6vmin; opacity:0;
  border-top:.4vmin solid var(--deep); border-bottom:.4vmin solid var(--deep);
  padding:.6vmin 0; display:inline-block;}
.hb-kana.on{opacity:1}
.hb-swatches{position:absolute; top:9vmin; right:10vmin; display:flex; gap:1.1vmin; opacity:0;}
.hb-swatches.on{opacity:1}
.hb-swatches i{width:3.2vmin; height:3.2vmin; display:block;
  outline:.3vmin solid rgba(217,213,197,.3); outline-offset:-.3vmin;}
.hb-dither{position:absolute; left:10vmin; right:10vmin; bottom:10vmin; height:19vmin;
  opacity:0; overflow:hidden;
  background:repeating-linear-gradient(to bottom, rgba(217,213,197,.5) 0 2px, rgba(0,0,0,0) 2px 5px);
  -webkit-mask-image:linear-gradient(to bottom, #000 0%, #000 62%, transparent 100%);
  mask-image:linear-gradient(to bottom, #000 0%, #000 62%, transparent 100%);}
.hb-dither.on{opacity:.45}
.hb-dither-glitch{position:absolute; left:18%; right:26%; bottom:14%; height:26%;
  background:repeating-linear-gradient(to right,
    var(--hot) 0 6px, var(--bone) 6px 11px, var(--deep) 11px 15px, transparent 15px 34px);
  opacity:.5; animation:hbDither 1.6s steps(4,end) infinite;}
@keyframes hbDither{0%{transform:translateX(0)}100%{transform:translateX(-34px)}}
.hb-logo-foot{position:absolute; left:10vmin; right:10vmin; bottom:4.6vmin;
  display:flex; justify-content:space-between; font-size:1.7vmin;
  letter-spacing:.2em; color:rgba(217,213,197,.5); opacity:0;}
.hb-logo-foot.on{opacity:1}

/* ================= LOCKUP ================= */
.hb-lock{display:grid; place-items:center; padding:9vmin;}
.hb-lock-inner{width:min(116vmin,92%);}
.hb-lock-top{display:flex; align-items:baseline; gap:3vmin; flex-wrap:wrap;
  font-size:1.9vmin; letter-spacing:.16em; color:var(--hot); opacity:0;
  margin-bottom:.6vmin; padding-left:1vmin;}
.hb-lock-top.on{opacity:1}
.hb-lock-diamonds{letter-spacing:.5em}
.hb-lock-name{font-family:"Bodoni Moda",Didot,Georgia,serif; font-style:italic;
  font-weight:900; font-size:23vmin; line-height:.92; color:var(--bone);
  letter-spacing:-.005em; opacity:0;
  text-shadow:.9vmin .9vmin 0 var(--black), 1.5vmin 1.5vmin 0 var(--deep),
              -.35vmin 0 0 rgba(43,92,255,.55), .35vmin 0 0 rgba(253,19,72,.6);}
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
.hb-idx{padding:11vmin 10vmin; display:flex; flex-direction:column; justify-content:center;}
.hb-idx-head{display:flex; align-items:baseline; gap:2.4vmin; font-size:3.4vmin;
  letter-spacing:.34em; color:var(--hot); border-bottom:.5vmin solid var(--deep);
  padding-bottom:1.6vmin; margin-bottom:2.4vmin; opacity:0;}
.hb-idx-head.on{opacity:1}
.hb-idx-head .hb-jp{font-size:2.4vmin; letter-spacing:.24em; color:var(--bone);}
.hb-idx-list{list-style:none; margin:0; padding:0;}
.hb-idx-list li{display:flex; align-items:baseline; gap:2vmin; font-size:2.8vmin;
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

/* ================= CRÉDITOS ================= */
.hb-cred{padding:10vmin; display:flex; flex-direction:column;}
.hb-cred-head{display:flex; align-items:baseline; gap:2.4vmin; font-size:3vmin;
  letter-spacing:.42em; color:var(--hot); opacity:0;
  border-bottom:.4vmin solid var(--deep); padding-bottom:1.4vmin;}
.hb-cred-head.on{opacity:1}
.hb-cred-head .hb-jp{font-size:2.2vmin; letter-spacing:.3em; color:var(--bone)}
.hb-cred-window{flex:1; overflow:hidden; position:relative; margin-top:2vmin;
  -webkit-mask-image:linear-gradient(to bottom, transparent 0, #000 14%, #000 82%, transparent 100%);
  mask-image:linear-gradient(to bottom, transparent 0, #000 14%, #000 82%, transparent 100%);}
.hb-cred-roll{position:absolute; left:0; right:0; top:100%; opacity:0;}
.hb-cred-roll.on{opacity:1; animation:hbRoll 9s linear forwards;}
@keyframes hbRoll{from{transform:translateY(0)}to{transform:translateY(-190%)}}
.hb-cred-row{display:flex; align-items:baseline; gap:3vmin; font-size:2.7vmin;
  line-height:2.1; justify-content:center;}
.hb-cred-role{color:var(--hot); letter-spacing:.22em; text-align:right; flex:1;}
.hb-cred-name{color:var(--bone); letter-spacing:.14em; text-align:left; flex:1;}
.hb-cred-end{margin-top:5vmin; text-align:center; font-family:"Anton",Impact,sans-serif;
  font-size:5vmin; color:var(--bone); letter-spacing:.04em;}

/* ================= REBOBINAR ================= */
.hb-rew{display:flex; flex-direction:column; align-items:center; justify-content:center;
  gap:1.6vmin; padding:10vmin;}
.hb-rew > *{opacity:0}
.hb-rew > .on{opacity:1}
.hb-rew-icon{font-size:8vmin; color:var(--hot); letter-spacing:-.06em;
  animation:hbRew .5s steps(2,end) infinite;}
@keyframes hbRew{0%{transform:translateX(1.4vmin)}100%{transform:translateX(-1.4vmin)}}
.hb-rew-title{margin:0; font-family:"Anton",Impact,sans-serif; font-size:11vmin;
  line-height:.94; color:var(--hot); transform:scaleY(1.08);
  filter:drop-shadow(.5vmin .5vmin 0 rgba(0,0,0,.8));}
.hb-rew-jp{font-family:"Noto Sans JP",sans-serif; font-weight:700; font-size:3.2vmin;
  letter-spacing:.46em; color:var(--bone);}
.hb-rew-bar{width:min(80vmin,84%); height:2.6vmin; border:.35vmin solid rgba(217,213,197,.45);
  padding:.45vmin; margin-top:2vmin; display:flex; flex-direction:row-reverse;}
.hb-rew-fill{height:100%; background:var(--bone); transition:width .12s linear;}
.hb-rew-count{font-size:3.4vmin; letter-spacing:.3em; color:var(--bone); margin-top:.6vmin;}

/* ================= EJECT ================= */
.hb-eject{display:flex; flex-direction:column; align-items:center; justify-content:center;
  gap:2vmin; padding:10vmin;}
.hb-eject > *{opacity:0}
.hb-eject > .on{opacity:1}
.hb-eject-icon{font-size:9vmin; color:var(--hot);
  animation:hbUp 1.2s steps(3,end) infinite;}
@keyframes hbUp{0%{transform:translateY(1.4vmin)}100%{transform:translateY(-1.4vmin)}}
.hb-eject-title{margin:0; font-family:"Anton",Impact,sans-serif; font-size:15vmin;
  line-height:.94; color:var(--bone); letter-spacing:.08em;
  text-shadow:.7vmin .7vmin 0 var(--deep);}
.hb-eject-jp{font-family:"Noto Sans JP",sans-serif; font-weight:700; font-size:2.8vmin;
  letter-spacing:.34em; color:var(--bone);}
/* colapso del tubo al apagarse */
.hb-collapse{position:absolute; inset:0; z-index:50; background:#000; opacity:1;
  animation:hbCollapse 1.5s cubic-bezier(.6,0,.9,.4) forwards;}
@keyframes hbCollapse{
  0%{clip-path:inset(0 0 0 0); background:#000}
  32%{clip-path:inset(0 0 0 0); background:#000}
  33%{clip-path:inset(0 0 0 0); background:#fff}
  62%{clip-path:inset(49.6% 0 49.6% 0); background:#fff}
  86%{clip-path:inset(49.8% 48% 49.8% 48%); background:#fff}
  100%{clip-path:inset(50% 50% 50% 50%); background:#fff}
}

/* ================= MARQUESINA ================= */
.hb-standby{display:flex; flex-direction:column; justify-content:center; align-items:center;
  text-align:center; padding:9vmin; gap:2vmin;}
.hb-standby > *{opacity:0}
.hb-standby > .on{opacity:1}
.hb-sb-live{display:flex; align-items:center; gap:1.4vmin; font-size:2.6vmin;
  letter-spacing:.4em; color:var(--bone); border:.35vmin solid var(--deep); padding:.8vmin 2.6vmin;}
.hb-dot{width:1.4vmin; height:1.4vmin; border-radius:50%; background:var(--hot);
  animation:hbBlink 1.1s steps(1,end) infinite;}
.hb-sb-title{margin:1vmin 0 0; font-family:"Anton",Impact,sans-serif;
  font-size:11vmin; line-height:.92; max-width:92%; letter-spacing:-.005em;
  color:var(--hot); text-transform:uppercase; transform:scaleY(1.08);
  filter:drop-shadow(.5vmin .5vmin 0 rgba(0,0,0,.8));}
.hb-sb-jp{font-family:"Noto Sans JP",sans-serif; font-weight:700; font-size:3.2vmin;
  letter-spacing:.5em; color:var(--bone); text-shadow:2px 0 var(--mid);}
.hb-sb-url{margin-top:2.4vmin; font-size:2.8vmin; letter-spacing:.34em;
  color:var(--black); background:var(--bone); padding:.7vmin 2.6vmin; transform:skewX(-9deg);}

/* ---------- panel de control ---------- */
.hb-panel{position:absolute; left:50%; bottom:1.4vmin; transform:translateX(-50%);
  z-index:60; display:flex; flex-direction:column; align-items:center; gap:5px;
  background:rgba(0,0,0,.78); border:1px solid rgba(217,213,197,.18);
  padding:8px 12px; opacity:0; transition:opacity .3s ease; pointer-events:none;
  font-family:ui-monospace,SFMono-Regular,Menlo,monospace;}
.hb-panel.on{opacity:1; pointer-events:auto}
.hb-pgroup{display:flex; align-items:center; gap:5px; flex-wrap:wrap; justify-content:center}
.hb-plabel{font-size:9px; letter-spacing:.18em; color:rgba(217,213,197,.45); margin-right:3px}
.hb-panel button{font:inherit; font-size:10px; letter-spacing:.1em; cursor:pointer;
  background:transparent; color:rgba(217,213,197,.7); border:1px solid rgba(217,213,197,.28);
  padding:4px 9px; transition:none;}
.hb-panel button:hover{border-color:var(--hot); color:var(--bone)}
.hb-panel button.act{background:var(--hot); border-color:var(--hot); color:#000}
.hb-panel button:focus-visible{outline:2px solid var(--bone); outline-offset:2px}
.hb-phint{font-size:9px; letter-spacing:.06em; color:rgba(217,213,197,.35); margin-top:2px}

@media (max-width:760px){
  .hb-warn-kanji{font-size:34vmin}
  .hb-boot-row{font-size:3.2vmin}
  .hb-boot-k{min-width:26vmin}
  .hb-logo-big{font-size:15vmin}
  .hb-lock-name{font-size:25vmin}
  .hb-globe-word{font-size:21vmin}
  .hb-globe-sub{display:none}
  .hb-grid-word{font-size:25vmin}
  .hb-bug{font-size:2.2vmin}
  .hb-idx-list li{font-size:3.3vmin}
  .hb-cred-row{font-size:3.2vmin}
}

@media (prefers-reduced-motion:reduce){
  .hb-jitter,.hb-flick,.hb-track,.hb-scan,.hb-smear,.hb-interlace,
  .hb-ch-c,.hb-ch-m,.hb-dither-glitch,.hb-grid-lines,.hb-rew-icon,.hb-eject-icon{animation:none!important}
  .hb-root.glitching .hb-jitter{animation:none!important}
}
`;
