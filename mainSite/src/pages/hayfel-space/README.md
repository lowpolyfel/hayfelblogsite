# Hayfel Space

La página principal ("el lobby") conserva la identidad visual de **Hayfel Space**, simplificada en menos secciones y con sus elementos reutilizables movidos a `shared/assets` para que el resto del sitio los pueda aprovechar.

## Estructura

- `HayfelSpacePage.jsx`: composición del lobby y estado de la experiencia (sin filtrado por canal: siempre se navega sobre todas las entradas).
- `components/`: primitivas de layout específicas de esta página (`Window`, `Slab`, decoraciones de fondo/stickers).
- `data/content.js`: contenido editorial (`posts`, `schedule`, `socialLinks`, `externalSites`...). Puede sustituirse por un CMS o una API sin tocar los componentes visuales.
- `data/decorations.js`: datos de los "papeles flotantes" decorativos.
- `hayfel-space.css`: sistema visual y responsive de la página.

## Elementos compartidos (`../../shared/assets`)

- `icons/`: componente `Icon` + catálogo de trazos SVG (incluye redes: tiktok, instagram, youtube, twitch, spotify).
- `sprites/`: `PixelSprite`, el avatar/ícono pixel-art reutilizado en el perfil y en el menú.
- `logos/`: `Wordmark`, el logotipo "HAYFEL" reutilizado en la cabecera y en la pantalla de carga.
- `sounds/`: `useBlipSound`, hook con los efectos de sonido de la interfaz.
- `patterns/`: generación de fondos y texturas SVG sin recursos externos.

## Menú de sitios hermanos y redes

- El menú superior (`externalSites` en `data/content.js`) **no filtra contenido de esta página**: cada botón abre otro sitio en una pestaña nueva (`target="_blank"`). Mientras no tengan `href`, se muestran deshabilitados con la etiqueta "PRONTO".
- La sección `#redes` funciona como una página de enlaces (estilo "link in bio"): TikTok, Instagram, YouTube, Twitch y Spotify. Solo falta rellenar el `href` de cada entrada en `socialLinks`.

Los módulos existentes de `domain`, `features`, `services` y `shared` siguen disponibles como base para incorporar persistencia, carga de imágenes, comentarios y páginas individuales de entradas.
