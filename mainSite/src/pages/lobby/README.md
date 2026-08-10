# Lobby

Portado desde un prototipo HTML/CSS/JS provisto por el usuario (ventana
retro, boot screen, CRT overlay, stickers arrastrables, guestbook, ticker),
recoloreado a rojo crimson intenso sobre negro (`#1a1a1a`). Todo el texto
largo (bio, entradas) sigue siendo Lorem Ipsum a propósito — placeholder de
diseño, no datos reales de la persona detrás del sitio.

## Estructura

- `LobbyPage.jsx`: composición de la página y estado de la experiencia.
- `data/content.js`: contenido editorial de ejemplo (posts, tags, guestbook).
- `lobby.css`: paleta crimson/negro + fondo de estrellas + responsive.

## Fondo de estrellas

`shared/assets/patterns/backgroundPatterns.js` expone `makeStarfield()`:
genera un solo tile SVG grande con estrellas de 4 puntas en varias capas
(grandes y tenues detrás, chicas y brillantes encima) en posiciones
pseudoaleatorias deterministas. Es una réplica por código del estilo pedido
(no una copia de ningún archivo de imagen).

## Hero listo para imagen de fondo

`.hero` lee `background-image:var(--hero-bg, none)`. Para poner una imagen
de fondo más adelante, basta con definir `--hero-bg: url(...)` (por CSS o
inline) — no hace falta tocar el JSX.

## Nav pendiente + menú hamburguesa

Los links de `navLinks` (`data/content.js`) tienen `href: null` — se ven
deshabilitados con subrayado punteado hasta que se les ponga una URL real;
cuando la tengan, abren en pestaña nueva (`target="_blank"`). En móvil
(`≤560px`) el nav se colapsa detrás de un botón de hamburguesa.
