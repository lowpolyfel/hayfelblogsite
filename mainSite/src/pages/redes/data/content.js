// Todo el texto largo es Lorem Ipsum a propósito: es relleno de diseño, no
// datos reales de la persona detrás del sitio.

export const profile = {
  name: 'HAYFEL',
  handle: '@hayfel',
  bio: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt.',
  meta: 'todos los enlaces en un solo lugar',
}

// `href: null` = todavía sin enlazar; se muestra como "próximamente".
// Cuando tenga URL real, abre en pestaña nueva sin tocar nada más.
export const links = [
  { name: 'tiktok', icon: 'tiktok', handle: '@hayfel', note: 'videos cortos', href: null, tone: 'crimson' },
  { name: 'instagram', icon: 'instagram', handle: '@hayfel', note: 'fotos y bocetos', href: null, tone: 'paper' },
  { name: 'youtube', icon: 'youtube', handle: 'hayfel', note: 'lo largo', href: null, tone: 'ink' },
  { name: 'twitch', icon: 'twitch', handle: 'hayfel', note: 'en vivo, a veces', href: null, tone: 'crimson' },
  { name: 'spotify', icon: 'spotify', handle: 'hayfel', note: 'lo que suena', href: null, tone: 'paper' },
  { name: 'github', icon: 'github', handle: 'hayfel', note: 'código suelto', href: null, tone: 'ink' },
]

// Accesos a lo demás del sitio
export const siteLinks = [
  { label: 'EL BLOG', href: '#', note: 'entradas y bitácora' },
  { label: 'VERSIÓN LEGACY', href: '#legacy', note: 'la home anterior' },
]

export const jpLine = '全 て の リ ン ク が こ こ に あ り ま す 。'

export const marquee = 'TODOS LOS ENLACES ~ SIN INTERMEDIARIOS ~ HAYFEL ~ '
