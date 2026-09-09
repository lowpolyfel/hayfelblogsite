// Las cuatro redes que hay ahora mismo. Cuando alguna deje de existir o
// aparezca otra, se toca solo esta lista: la página se arma sola.
//
// `href: null` marca una red anunciada pero sin cuenta todavía, y sale como
// "pronto" en vez de como enlace muerto.
export const links = [
  { name: 'twitch', icon: 'twitch', handle: 'hayfel', note: 'en vivo',
    href: 'https://www.twitch.tv/hayfel', tone: 'crimson' },
  { name: 'youtube', icon: 'youtube', handle: '@hayfel', note: 'lo largo',
    href: 'https://www.youtube.com/@hayfel', tone: 'ink' },
  { name: 'tiktok', icon: 'tiktok', handle: '@hayfeldosdos', note: 'videos cortos',
    href: 'https://www.tiktok.com/@hayfeldosdos', tone: 'paper' },
  { name: 'instagram', icon: 'instagram', handle: '@hayfeldosdos', note: 'fotos y bocetos',
    href: 'https://www.instagram.com/hayfeldosdos/', tone: 'crimson' },
]

export const headCopy = {
  title: 'DÓNDE MÁS ESTOY',
  note: 'todos los enlaces, sin intermediarios',
}

export const jpLine = '走 り 出 せ 、 今 す ぐ に'
