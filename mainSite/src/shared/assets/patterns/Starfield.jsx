import { useEffect, useRef } from 'react'

// Campo de estrellas animado en canvas: capas de tamaños (grandes/medianas/
// chicas) dibujadas con contornos concéntricos alternando blanco/negro sobre
// la estrella base, en una de tres variantes de movimiento (deriva lenta,
// lluvia, galaxia) — `variant` la fija desde afuera; sin ella se elige al
// azar. Se reordena con click/tap o barra espaciadora. Respeta
// prefers-reduced-motion (dibuja un solo cuadro fijo).

export function Starfield({ className, variant, red = '#c8102e', white = '#ffffff', black = '#000000' }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d', { alpha: false })
    const quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const W_ROJO = 1.30, W_BLANCO = 0.82
    const TAU = Math.PI * 2
    const S36 = Math.sin(Math.PI / 5), C36 = Math.cos(Math.PI / 5)

    const TIPO_ANIMACION = variant != null ? variant : Math.floor(Math.random() * 3)
    const DIRECCION_VORTICE = Math.random() > 0.5 ? 1 : -1

    const TIERS = [
      { min: 0.250, max: 0.400, per: 12 },
      { min: 0.150, max: 0.220, per: 8 },
      { min: 0.090, max: 0.130, per: 5 },
    ]

    function rnd() { return Math.random() }
    function hRatio(q) { return q * S36 / Math.sqrt(1 + q * q - 2 * q * C36) }

    const QN = 6, QMIN = 0.46, QMAX = 0.54
    const FORMAS = []
    for (let i = 0; i < QN; i++) {
      const q = QMIN + (QMAX - QMIN) * i / (QN - 1)
      const p = new Path2D()
      for (let k = 0; k < 10; k++) {
        const rad = k % 2 === 0 ? 1 : q, a = k * Math.PI / 5 - Math.PI / 2
        const px = Math.cos(a) * rad, py = Math.sin(a) * rad
        if (k) p.lineTo(px, py); else p.moveTo(px, py)
      }
      p.closePath()
      FORMAS.push({ path: p, hr: hRatio(q) })
    }

    let D = 1, W = 0, H = 0, S = 320, PAD = 0
    let estrellas = []

    function nacer(s, ahora, escalonar) {
      const T = TIERS[s.tier]
      s.R = S * (T.min + rnd() * (T.max - T.min))
      s.x = s.X0 + (s.gx + 0.5 + (rnd() - 0.5) * 1.3) * s.cw
      s.y = s.Y0 + (s.gy + 0.5 + (rnd() - 0.5) * 1.3) * s.ch
      s.rot = rnd() * TAU
      s.spin = (rnd() - 0.5) * 0.13
      s.qi = (rnd() * QN) | 0
      s.pw = TAU / (6 + rnd() * 9)
      s.pf = rnd() * TAU
      s.dw = TAU / (18 + rnd() * 26)
      s.dp = rnd() * TAU
      s.da = S * (0.010 + rnd() * 0.022)
      s.nace = ahora + (escalonar ? rnd() * 0.45 : 0)
      s.vive = 15 + rnd() * 21
      s.secundario = rnd() > 0.5 ? white : black
      s.vy = S * (0.05 + rnd() * 0.1)
      const velocidadBase = [0.08, 0.12, 0.16][s.tier]
      s.velOrbita = DIRECCION_VORTICE * (velocidadBase + (rnd() - 0.5) * 0.02)
    }

    function construir(ahora) {
      estrellas = []
      const baseW = W / D + PAD * 2
      const baseH = H / D + PAD * 2
      let areaW = baseW, areaH = baseH
      if (TIPO_ANIMACION === 2) {
        const diag = Math.sqrt(baseW * baseW + baseH * baseH)
        areaW = diag; areaH = diag
      }
      const X0 = (W / D) / 2 - areaW / 2
      const Y0 = (H / D) / 2 - areaH / 2

      for (let ti = 0; ti < TIERS.length; ti++) {
        const T = TIERS[ti]
        const n = Math.max(2, Math.round((areaW * areaH / (S * S)) * T.per))
        const cols = Math.max(1, Math.round(Math.sqrt(n * areaW / areaH)))
        const rows = Math.max(1, Math.ceil(n / cols))
        const cw = areaW / cols, ch = areaH / rows
        let c = 0
        for (let gy = 0; gy < rows; gy++) {
          for (let gx = 0; gx < cols && c < n; gx++, c++) {
            const s = { tier: ti, gx, gy, cw, ch, X0, Y0, areaH, orden: rnd() }
            nacer(s, ahora, true)
            estrellas.push(s)
          }
        }
      }
      estrellas.sort((a, b) => a.orden - b.orden)
      if (quieto) estrellas.forEach((e) => { e.nace = ahora - 2 })
    }

    function suave(t) { return t * t * (3 - 2 * t) }

    function pintarEstrella(s, ahora) {
      const edad = ahora - s.nace
      if (edad < 0) return
      if (edad > s.vive) { nacer(s, ahora, false); return }

      let env = 1
      const ENTRA = 0.75, SALE = 0.9
      if (edad < ENTRA) env = suave(edad / ENTRA)
      else if (edad > s.vive - SALE) env = suave(Math.max(0, s.vive - edad) / SALE)
      if (env < 0.02) return

      const R = s.R * env
      let x, y

      if (TIPO_ANIMACION === 0) {
        x = s.x + Math.cos(ahora * s.dw + s.dp) * s.da
        y = s.y + Math.sin(ahora * s.dw * 0.83 + s.dp * 1.7) * s.da
      } else if (TIPO_ANIMACION === 1) {
        x = s.x + Math.cos(ahora * s.dw + s.dp) * s.da
        const posY = s.y + (s.vy * edad)
        y = s.Y0 + ((posY - s.Y0) % s.areaH)
      } else {
        const cx = (W / D) / 2, cy = (H / D) / 2
        const dx = s.x - cx, dy = s.y - cy
        const dist = Math.sqrt(dx * dx + dy * dy)
        const ang = Math.atan2(dy, dx) + s.velOrbita * edad
        x = cx + Math.cos(ang) * dist
        y = cy + Math.sin(ang) * dist
        x += Math.cos(ahora * s.dw) * (s.da * 0.5)
        y += Math.sin(ahora * s.dw) * (s.da * 0.5)
      }

      const px = x * D, py = y * D
      const maxRadio = R * D * 1.15
      if (px + maxRadio < 0 || px - maxRadio > W || py + maxRadio < 0 || py - maxRadio > H) return

      const F = FORMAS[s.qi]
      const h = F.hr * R
      const t = Math.max(S * 0.030, R * 0.095) * (1 + 0.22 * Math.sin(ahora * s.pw + s.pf))
      const wr = t * W_ROJO, wb = t * W_BLANCO
      const rot = s.rot + ahora * s.spin
      const co = Math.cos(rot) * D, si = Math.sin(rot) * D

      let ci = 1, acc = 0, lam = 1
      const colores = [red, s.secundario]
      for (let n = 0; n < 14; n++) {
        const sc = R * lam
        ctx.setTransform(sc * co, sc * si, -sc * si, sc * co, px, py)
        ctx.fillStyle = colores[ci & 1]
        ctx.fill(F.path)
        acc += (ci & 1) ? wb : wr
        ci++
        lam = 1 - acc / h
        if (lam <= 0.03) break
      }
    }

    function pintar(ahora) {
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.fillStyle = red
      ctx.fillRect(0, 0, W, H)
      for (let i = 0; i < estrellas.length; i++) pintarEstrella(estrellas[i], ahora)
    }

    const t0 = performance.now()
    let corriendo = false
    let rafId = 0

    function frame(ms) {
      if (!corriendo) return
      pintar((ms - t0) / 1000)
      rafId = requestAnimationFrame(frame)
    }

    function arrancar() {
      if (quieto) { pintar(0); return }
      if (corriendo) return
      corriendo = true
      rafId = requestAnimationFrame(frame)
    }

    function medir() {
      D = Math.min(2, window.devicePixelRatio || 1)
      const w = Math.max(1, cv.clientWidth), h = Math.max(1, cv.clientHeight)
      W = Math.round(w * D); H = Math.round(h * D)
      cv.width = W; cv.height = H
      S = Math.min(470, Math.max(240, Math.min(w, h) * 0.70))
      PAD = S * 0.5
      construir(quieto ? 0 : (performance.now() - t0) / 1000)
      if (quieto) pintar(0)
    }

    let ultW = cv.clientWidth, ultH = cv.clientHeight, resizeTimer = null
    function onResize() {
      const w = cv.clientWidth, h = cv.clientHeight
      if (Math.abs(w - ultW) < 40 && Math.abs(h - ultH) < 120) return
      ultW = w; ultH = h
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(medir, 160)
    }

    function rebarajar() {
      construir(quieto ? 0 : (performance.now() - t0) / 1000)
      if (quieto) pintar(0)
    }
    function onKeydown(e) {
      const tag = (e.target && e.target.tagName) || ''
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'r' || e.key === 'R') { e.preventDefault(); rebarajar() }
    }
    function onVisibility() { if (document.hidden) corriendo = false; else arrancar() }

    window.addEventListener('resize', onResize)
    document.addEventListener('pointerdown', rebarajar)
    document.addEventListener('keydown', onKeydown)
    document.addEventListener('visibilitychange', onVisibility)

    medir()
    arrancar()

    return () => {
      corriendo = false
      cancelAnimationFrame(rafId)
      clearTimeout(resizeTimer)
      window.removeEventListener('resize', onResize)
      document.removeEventListener('pointerdown', rebarajar)
      document.removeEventListener('keydown', onKeydown)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [variant, red, white, black])

  return <canvas ref={canvasRef} className={className} role="img"
    aria-label="Fondo animado de estrellas rojas sobrepuestas con blanco y negro" />
}
