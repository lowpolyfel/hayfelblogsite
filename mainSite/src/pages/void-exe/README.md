# hayfel.exe (void-exe)

Rework completo de la página principal, estilo escritorio Y2K/emo (ventana de
navegador, taskbar, guestbook, webring). Todo el texto largo (bio, entradas
del diario) es **Lorem Ipsum** a propósito — placeholder de diseño, no datos
reales de la persona detrás del sitio. No usa fotografías; el "avatar" es el
mismo generador de pixel-art (`PixelSprite`) recoloreado.

## Estructura

- `VoidPage.jsx`: composición de la página y estado de la experiencia.
- `data/content.js`: contenido editorial de ejemplo (entradas, playlist, links).
- `void.css`: paleta y sistema visual (morado/negro/rosa/lila) + responsive.

## Elementos compartidos (`../../shared`)

- `assets/icons`, `assets/sprites`, `assets/sounds`, `assets/patterns`,
  `assets/logos`: mismos módulos reutilizables de antes, extendidos con
  íconos nuevos (corazón, calavera, cadena, ojo, chispa...) y patrones de
  fondo nuevos (estrellas, rayos, corazones).
- `ui/Window.jsx`: caja tipo ventana retro (barra + contenido), genérica —
  ya la usan tanto este tema como cualquier futuro rediseño.

## Placeholders pendientes de rellenar

- `data/content.js → externalSites` y `socialLinks`: `href: null` hasta que
  existan los sitios/redes reales.
