# Lobby

Portado desde un prototipo HTML/CSS/JS provisto por el usuario (ventana
retro, boot screen, CRT overlay, stickers arrastrables, guestbook, ticker),
recoloreado a rojo crimson intenso sobre negro (`#1a1a1a`). Todo el texto
largo (bio, entradas) sigue siendo Lorem Ipsum a propósito — placeholder de
diseño, no datos reales de la persona detrás del sitio.

## Estructura

- `LobbyPage.jsx`: composición de la página y estado de la experiencia.
- `data/content.js`: contenido editorial de ejemplo (posts, tags, guestbook).
- `lobby.css`: paleta crimson/negro + tipografía + responsive.
- `components/PersonaMenu.jsx` + `persona-menu.css`: el menú de navegación.

## Fondo: campo de estrellas animado

`shared/assets/patterns/Starfield.jsx` es un componente `<canvas>` (portado
de un prototipo del usuario) con tres variantes de movimiento elegidas al
azar por carga (deriva lenta, lluvia, galaxia en espiral), estrellas de 4
puntas en capas de tamaño con contornos concéntricos alternando blanco/negro
sobre el rojo base. Reacciona a `prefers-reduced-motion` (dibuja un solo
cuadro fijo) y se reordena con click/tap/barra espaciadora.

## Hero listo para imagen de fondo

`.hero` lee `background-image:var(--hero-bg, none)`. Para poner una imagen
de fondo más adelante, basta con definir `--hero-bg: url(...)` (por CSS o
inline) — no hace falta tocar el JSX.

## Menú (botón de hamburguesa → overlay estilo Persona 5)

El botón `.hamburger` del hero (visible en todos los tamaños de pantalla)
abre `PersonaMenu`: un overlay de pantalla completa portado y ampliado a
partir de un prototipo del usuario — puntos en movimiento, silueta
diagonal, texto gigante `COMMAND 0X` que cambia según el ítem con foco/hover,
letras dispersas que se "enderezan" al pasar el mouse, capas de fondo tipo
navajazo que se revelan en hover, HUD con las visitas reales del sitio y un
indicador de estado, cinta diagonal "MENU" y botón de cierre. Se cierra con
el botón ×, con `Escape`, o volviendo a picar la hamburguesa. En pantallas
angostas (`≤760px`) los ítems se acomodan en una lista vertical en vez del
acomodo caótico de escritorio. Los links de `navLinks` (`data/content.js`)
tienen `href: null` — se ven como "próximamente" hasta que se les ponga una
URL real; cuando la tengan, abren en pestaña nueva (`target="_blank"`).
