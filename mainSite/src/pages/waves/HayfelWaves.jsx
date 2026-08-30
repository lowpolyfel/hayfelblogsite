import React, { useEffect, useRef } from "react";

/* ------------------------------------------------------------------
   HAYFEL — waves (WebGL)

   Puerto del shader de olas con una diferencia clave respecto a mis
   otras versiones: el ruido es SIMPLEX 3D y el tiempo entra como
   tercera dimensión. Eso hace que el campo se transforme de verdad,
   en vez de trasladarse. Las olas nacen y mueren en su lugar.

   Cambios sobre el original:
   - Sin three.js. Es un solo quad, no hace falta un motor 3D entero.
   - Tiempo en segundos reales, no += 0.01 por frame (que corre
     distinto en pantallas de 60 y de 120 Hz).
   - Rampa sobre tu paleta en vez de mix(negro, rojo).
   - Grano decente: el del original resta con un hash de sin() que
     genera muaré, y al restar solo ensucia.

   Paleta (Adobe):
   #FD1348  #CF1331  #BF1F3C  #1C1C1C  #D9D5C5
------------------------------------------------------------------- */

const RED_HOT = "#FD1348";
const RED_MID = "#CF1331";
const RED_DEEP = "#BF1F3C";
const INK = "#1C1C1C";
const BONE = "#D9D5C5";

const v3 = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return `vec3(${[(n >> 16) & 255, (n >> 8) & 255, n & 255]
    .map((c) => (c / 255).toFixed(4))
    .join(",")})`;
};

const VERT = `
attribute vec2 aPos;
void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform vec2  uRes;
uniform float uTime;
uniform float uZoom;
uniform float uWarp;
uniform float uGamma;
uniform float uGrain;
uniform float uGrainPx;
uniform float uGrainT;

const vec3 C_INK  = ${v3(INK)};
const vec3 C_HOT  = ${v3(RED_HOT)};
const vec3 C_MID  = ${v3(RED_MID)};
const vec3 C_DEEP = ${v3(RED_DEEP)};

/* --- simplex 3D (Ashima / Gustavson) --- */
vec3 mod289(vec3 x){ return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x){ return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x){ return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v){
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;

  i = mod289(i);
  vec4 p = permute(permute(permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);

  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);

  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;

  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

float hash12(vec2 p){
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

void main(){
  vec2 uv = gl_FragCoord.xy / uRes - 0.5;
  uv.x *= uRes.x / uRes.y;

  // domain warping: el ruido empuja las coordenadas del ruido
  float w = snoise(vec3(uv * 2.0, uTime * 0.15));
  vec2 wuv = uv + w * uWarp;

  float n = snoise(vec3(wuv * uZoom, uTime * 0.20));
  n = smoothstep(0.0, 1.0, n * 0.5 + 0.5);

  // el gamma inclina el reparto hacia el negro, como el original
  float g = pow(n, uGamma);

  // rampa contigua con mesetas cortas: gradiente sedoso pero cada
  // pixel cae entre dos colores VECINOS de la paleta, nunca fuera
  vec3 col = C_INK;
  col = mix(col, C_DEEP, smoothstep(0.06, 0.34, g));
  col = mix(col, C_MID,  smoothstep(0.42, 0.62, g));
  col = mix(col, C_HOT,  smoothstep(0.72, 0.94, g));

  // grano de luminancia, tamaño fijo en px de CSS.
  // tres muestras -> distribución casi normal, no estática de tele
  vec2 gp = floor(gl_FragCoord.xy / uGrainPx) + uGrainT;
  float e = (hash12(gp) + hash12(gp + 17.31) + hash12(gp + 91.70)) * 0.3333 - 0.5;
  col += e * uGrain * (0.30 + 0.70 * (4.0 * g * (1.0 - g)));

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`;

const compile = (gl, type, src) => {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(s));
    gl.deleteShader(s);
    return null;
  }
  return s;
};

export default function HayfelWaves({
  word = "hayfel",
  showType = true,
  speed = 1,
  zoom = 3.5, // densidad de olas
  warp = 0.4, // fuerza del pliegue
  gamma = 1.5, // >1 empuja hacia el negro, <1 hacia el rojo
  grain = 0.11,
  grainSize = 1.0,
  grainFps = 0,
  melt = 5.5,
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl =
      canvas.getContext("webgl", { antialias: false, alpha: false }) ||
      canvas.getContext("experimental-webgl", { antialias: false, alpha: false });
    if (!gl) return;

    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return;

    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(prog));
      return;
    }
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "aPos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, "uRes");
    const uTime = gl.getUniformLocation(prog, "uTime");
    const uGrainPx = gl.getUniformLocation(prog, "uGrainPx");
    const uGrainT = gl.getUniformLocation(prog, "uGrainT");
    gl.uniform1f(gl.getUniformLocation(prog, "uZoom"), zoom);
    gl.uniform1f(gl.getUniformLocation(prog, "uWarp"), warp);
    gl.uniform1f(gl.getUniformLocation(prog, "uGamma"), gamma);
    gl.uniform1f(gl.getUniformLocation(prog, "uGrain"), grain);
    gl.uniform1f(uGrainT, 0);

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
      const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uGrainPx, Math.max(1, dpr * grainSize));
    };
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf;
    const start = performance.now();

    // el original avanzaba 0.01 por frame; a 60 Hz eso son 0.6/s
    const RATE = 0.6;

    const draw = (t) => {
      resize();
      gl.uniform1f(uTime, t);
      gl.uniform1f(uGrainT, grainFps > 0 ? Math.floor(t * grainFps) * 13.73 : 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    if (reduced) {
      draw(6);
    } else {
      const loop = (now) => {
        raf = requestAnimationFrame(loop);
        draw(((now - start) / 1000) * RATE * speed);
      };
      raf = requestAnimationFrame(loop);
    }

    return () => {
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect();
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buf);
    };
  }, [speed, zoom, warp, gamma, grain, grainSize, grainFps]);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        minHeight: "100vh",
        background: INK,
        overflow: "hidden",
      }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@600;700&family=Poppins:wght@600&display=swap');`}</style>

      <canvas
        ref={canvasRef}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }}
      />

      {showType && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          <svg
            viewBox="0 0 700 200"
            style={{ width: "min(62%, 700px)", height: "auto", overflow: "visible" }}
          >
            <defs>
              {/* blur + umbral duro = tipo FF Blur, color plano */}
              <filter
                id="hw-blurtype"
                x="-15%"
                y="-45%"
                width="130%"
                height="190%"
                colorInterpolationFilters="sRGB"
              >
                <feGaussianBlur in="SourceGraphic" stdDeviation={melt} result="b" />
                <feColorMatrix
                  in="b"
                  type="matrix"
                  values="0 0 0 0 0.851
                          0 0 0 0 0.835
                          0 0 0 0 0.773
                          0 0 0 26 -11"
                />
              </filter>
            </defs>

            <text
              x="350"
              y="138"
              textAnchor="middle"
              fontFamily="'Quicksand','Poppins','Helvetica Neue',Helvetica,Arial,sans-serif"
              fontWeight="700"
              fontSize="140"
              letterSpacing="7"
              fill={BONE}
              filter="url(#hw-blurtype)"
            >
              {word}
            </text>
          </svg>
        </div>
      )}
    </div>
  );
}
