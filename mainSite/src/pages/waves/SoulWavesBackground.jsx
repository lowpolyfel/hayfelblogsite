import { useEffect, useRef, useState } from "react";

/* ─────────────────────────  Paleta  ───────────────────────── */
const BONE = "#D9D5C5";
const INK = "#1C1C1C";

/* Temas: la transición entre ambos es animada */
const THEMES = {
  light: { bg: [217, 213, 197], grid: [28, 28, 28], front: [28, 28, 28], shadow: 0.38 },
  dark: { bg: [12, 12, 12], grid: [217, 213, 197], front: [30, 30, 30], shadow: 0.6 },
};
const mix = (a, b, m) =>
  `rgb(${(a[0] + (b[0] - a[0]) * m) | 0},${(a[1] + (b[1] - a[1]) * m) | 0},${(a[2] + (b[2] - a[2]) * m) | 0})`;

/* Olas de atrás hacia adelante: del crimson brillante al rojo profundo,
   cerradas con una ola de tinta que ancla la composición. */
const WAVES = [
  { color: "#E3122E", y: 0.68, amp: 0.2, freq: 1.6, speed: 0.07, seed: 11 },
  { color: "#CF1331", y: 0.74, amp: 0.17, freq: 2.0, speed: 0.1, seed: 37 },
  { color: "#B50F27", y: 0.8, amp: 0.14, freq: 2.4, speed: 0.13, seed: 73 },
  { color: "#940C1F", y: 0.86, amp: 0.11, freq: 2.9, speed: 0.16, seed: 101 },
  { color: null, y: 0.93, amp: 0.08, freq: 3.4, speed: 0.2, seed: 149 },
];

/* ─────────────────────────  Ruido orgánico  ───────────────────────── */
const hash = (x, y) => {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const noise = (x, y) => {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
  return (a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v) * 2 - 1;
};
const fbm = (x, y) =>
  noise(x, y) * 0.62 + noise(x * 2.03 + 5.2, y * 2.03 + 1.3) * 0.26 + noise(x * 4.1 + 1.7, y * 4.1 + 9.2) * 0.12;

/* ─────────────────────────  Componente  ───────────────────────── */
export default function SoulWavesBackground({
  gridSize = 46,      // líneas por lado de la malla
  gridOpacity = 0.14, // opacidad de la malla (0–1)
  grain = 0.06,       // intensidad del grano (0 = sin grano)
  speed = 1,          // velocidad general
  defaultDark = false, // empezar en fondo negro
  showToggle = true,   // mostrar el botón claro/oscuro
  className,
  style,
  children,
}) {
  const canvasRef = useRef(null);
  const [dark, setDark] = useState(defaultDark);
  const darkRef = useRef(dark);
  darkRef.current = dark;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let w = 0, h = 0, raf = 0, last = performance.now(), t = 0;
    let m = darkRef.current ? 1 : 0; // 0 = claro, 1 = oscuro

    /* Textura de grano reutilizable */
    const grainCanvas = document.createElement("canvas");
    grainCanvas.width = grainCanvas.height = 160;
    const gctx = grainCanvas.getContext("2d");
    const img = gctx.createImageData(160, 160);
    for (let i = 0; i < img.data.length; i += 4) {
      const g = Math.random() < 0.5 ? 0 : 255;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = g;
      img.data[i + 3] = Math.random() * 255;
    }
    gctx.putImageData(img, 0, 0);
    const grainPattern = ctx.createPattern(grainCanvas, "repeat");

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const r = canvas.getBoundingClientRect();
      w = r.width;
      h = r.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* Malla 3D: superficie que respira con ruido, cubre toda la pantalla */
    const surface = (x, z) =>
      fbm(x * 0.5 + t * 0.09, z * 0.5 - t * 0.06) * 1.1 +
      Math.sin(x * 0.8 + z * 0.55 + t * 0.45) * 0.3;

    const drawGrid = () => {
      const N = gridSize;
      const span = 3.6;
      const cam = 4;
      const tilt = 0.98;
      const focal = Math.max(w, h) * 1.05;
      const cx = w / 2;
      const cy = h * 0.4;
      const rotY = Math.sin(t * 0.07) * 0.2;
      const cosY = Math.cos(rotY), sinY = Math.sin(rotY);
      const cosX = Math.cos(tilt), sinX = Math.sin(tilt);

      const P = N + 1;
      const sx = new Float32Array(P * P);
      const sy = new Float32Array(P * P);
      const dz = new Float32Array(P * P);
      for (let i = 0; i < P; i++) {
        for (let j = 0; j < P; j++) {
          const x0 = (i / N) * 2 * span - span;
          const z0 = (j / N) * 2 * span - span;
          const y0 = surface(x0, z0);
          const x1 = x0 * cosY - z0 * sinY;
          const z1 = x0 * sinY + z0 * cosY;
          const y2 = y0 * cosX - z1 * sinX;
          const d = y0 * sinX + z1 * cosX + cam;
          const k = i * P + j;
          sx[k] = cx + (x1 * focal) / d;
          sy[k] = cy - (y2 * focal) / d;
          dz[k] = d;
        }
      }

      ctx.strokeStyle = mix(THEMES.light.grid, THEMES.dark.grid, m);
      ctx.lineWidth = 1;
      ctx.lineJoin = "round";
      // líneas en una dirección, luego en la otra; se desvanecen con la distancia
      for (let pass = 0; pass < 2; pass++) {
        for (let a = 0; a < P; a++) {
          const k0 = pass ? a : a * P;
          const step = pass ? P : 1;
          const mid = dz[k0 + step * (N >> 1)];
          ctx.globalAlpha = gridOpacity * Math.max(0.25, Math.min(1, 1.9 - mid / cam));
          ctx.beginPath();
          let pen = false;
          for (let b = 0; b < P; b++) {
            const k = k0 + b * step;
            if (dz[k] < 0.4) { pen = false; continue; }
            pen ? ctx.lineTo(sx[k], sy[k]) : ctx.moveTo(sx[k], sy[k]);
            pen = true;
          }
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
    };

    /* Ola: borde con ruido fractal que fluye hacia un solo lado */
    const wavePath = (wv) => {
      const base = wv.y * h;
      const size = Math.min(h, w);
      const swell = 1 + 0.25 * Math.sin(t * 0.3 + wv.seed); // respiración lenta
      ctx.beginPath();
      ctx.moveTo(-20, h + 40);
      for (let x = -20; x <= w + 20; x += 8) {
        // escala en píxeles: la forma se ve igual de suave en móvil y escritorio
        const n = fbm((x / 720) * wv.freq - t * wv.speed, wv.seed + t * 0.05);
        ctx.lineTo(x, base + n * wv.amp * size * swell);
      }
      ctx.lineTo(w + 20, h + 40);
      ctx.closePath();
    };

    const drawWaves = () => {
      for (const wv of WAVES) {
        // sombra suave sobre la capa de atrás: profundidad con colores planos
        ctx.save();
        ctx.shadowColor = `rgba(8, 2, 4, ${THEMES.light.shadow + (THEMES.dark.shadow - THEMES.light.shadow) * m})`;
        ctx.shadowBlur = 34;
        ctx.shadowOffsetY = -6;
        wavePath(wv);
        ctx.fillStyle = wv.color || mix(THEMES.light.front, THEMES.dark.front, m);
        ctx.fill();
        ctx.restore();

        // filo de luz muy tenue en la cresta
        wavePath(wv);
        ctx.globalAlpha = 0.22;
        ctx.strokeStyle = BONE;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    };

    const drawGrain = () => {
      if (!grain) return;
      ctx.save();
      ctx.globalAlpha = grain * (1 - 0.5 * m); // más sutil en oscuro
      ctx.translate(Math.random() * 160, Math.random() * 160);
      ctx.fillStyle = grainPattern;
      ctx.fillRect(-160, -160, w + 320, h + 320);
      ctx.restore();
    };

    const frame = (now) => {
      const raw = (now - last) / 1000;
      const dt = Math.min(raw, 0.05);
      last = now;
      t += dt * speed;
      m += ((darkRef.current ? 1 : 0) - m) * Math.min(1, raw * 5);

      ctx.fillStyle = mix(THEMES.light.bg, THEMES.dark.bg, m);
      ctx.fillRect(0, 0, w, h);
      drawGrid();   // al fondo
      drawWaves();  // encima, abajo del sitio
      drawGrain();  // textura final

      if (!reduceMotion) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    // con movimiento reducido, redibuja al cambiar de tema
    const redraw = () => {
      if (!reduceMotion) return; // el loop normal ya hace la transición
      m = darkRef.current ? 1 : 0;
      last = performance.now();
      requestAnimationFrame(frame);
    };
    canvas.addEventListener("themechange", redraw);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener("themechange", redraw);
    };
  }, [gridSize, gridOpacity, grain, speed]);

  const toggle = () => {
    setDark((d) => !d);
    requestAnimationFrame(() => canvasRef.current?.dispatchEvent(new Event("themechange")));
  };

  return (
    <div
      className={className}
      style={{ position: "relative", width: "100%", height: "100vh", overflow: "hidden", background: dark ? "#0C0C0C" : BONE, transition: "background .4s", ...style }}
    >
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }}
      />
      <div style={{ position: "relative", zIndex: 1, height: "100%" }}>{children}</div>
      {showToggle && (
        <button
          type="button"
          onClick={toggle}
          aria-label={dark ? "Cambiar a fondo claro" : "Cambiar a fondo negro"}
          aria-pressed={dark}
          title={dark ? "Fondo claro" : "Fondo negro"}
          style={{
            position: "absolute",
            top: 20,
            right: 20,
            zIndex: 2,
            width: 44,
            height: 44,
            display: "grid",
            placeItems: "center",
            borderRadius: "50%",
            border: `1.5px solid ${dark ? BONE : INK}`,
            background: dark ? INK : BONE,
            color: dark ? BONE : INK,
            boxShadow: `3px 3px 0 ${dark ? "#CF1331" : INK}`,
            cursor: "pointer",
            transition: "background .4s, color .4s, border-color .4s, box-shadow .4s",
          }}
        >
          {dark ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="4.5" />
              <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.5 14.6A8.5 8.5 0 0 1 9.4 3.5 8.5 8.5 0 1 0 20.5 14.6Z" />
            </svg>
          )}
        </button>
      )}
    </div>
  );
}
