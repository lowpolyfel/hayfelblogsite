// Todo el texto largo (bio, entradas) es Lorem Ipsum a propósito — placeholder
// de diseño, no información real de la persona detrás del sitio.

export const bio = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.`

export const entries = [
  {
    date: '09.08.26', category: 'DIARY', title: 'new layout, same void',
    body: `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.

Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.`,
  },
  {
    date: '05.08.26', category: 'THOUGHTS', title: 'static in my head again',
    body: `Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Curabitur pretium tincidunt lacus, sed sagittis nunc rhoncus a.

Aenean commodo ligula eget dolor. Aenean massa, cum sociis natoque penatibus et magnis dis parturient montes.`,
  },
  {
    date: '02.08.26', category: 'MUSIC', title: '3am playlist dump',
    body: `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla consequat massa quis enim. Donec pede justo, fringilla vel, aliquet nec, vulputate eget, arcu.

In enim justo, rhoncus ut, imperdiet a, venenatis vitae, justo.`,
  },
  {
    date: '28.07.26', category: 'PHOTOS', title: 'photo dump, nothing special',
    body: `Nam dui mi, tincidunt quis, accumsan porttitor, facilisis luctus, metus. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae.

Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos.`,
  },
  {
    date: '21.07.26', category: 'DIARY', title: "i don't know what today was",
    body: `Etiam ultricies nisi vel augue. Curabitur ullamcorper ultricies nisi. Nam eget dui. Etiam rhoncus. Maecenas tempus, tellus eget condimentum rhoncus.

Sem quam semper libero, sit amet adipiscing sem neque sed ipsum.`,
  },
]

export const moods = ['miserable but cute', 'chronically online', 'running on static', 'feral but soft', 'offline in spirit']

export const playlist = [
  { artist: 'ghost parade', title: 'violet hour', duration: '4:12' },
  { artist: 'nocturne kid', title: 'static bloom', duration: '3:47' },
  { artist: 'paper moth', title: 'glass skin', duration: '5:01' },
  { artist: 'lonely static', title: 'neon grave', duration: '3:20' },
  { artist: 'velvet bruise', title: 'nightdrive', duration: '4:44' },
]

export const thingsILove = ['rainy nights', 'film grain', 'dial-up sounds', 'thrifted jackets', 'mixtapes', 'static noise']

export const badges = ['EST. 2004', 'CHRONICALLY ONLINE', 'MOOD: STATIC', 'OFFLINE IRL']

// Sitios hermanos: cada uno abre en pestaña nueva, no filtra contenido de
// esta página. href:null = todavía no existe el sitio.
export const externalSites = [
  { key: 'portfolio', href: null },
  { key: 'art dump', href: null },
  { key: 'old diary', href: null },
]

// Todos los enlaces reales van aquí — solo falta rellenar el href de cada uno.
export const socialLinks = [
  { name: 'tiktok', icon: 'tiktok', handle: '@lorem', href: null },
  { name: 'instagram', icon: 'instagram', handle: '@lorem', href: null },
  { name: 'youtube', icon: 'youtube', handle: 'lorem ipsum', href: null },
  { name: 'twitch', icon: 'twitch', handle: 'lorem_ipsum', href: null },
  { name: 'spotify', icon: 'spotify', handle: 'lorem ipsum', href: null },
]

export const coolLinks = ['starlight.zone', 'moon-diary.net', 'crybaby.club', 'pixel-grave.org', 'lilith.page', 'nightowl.blog']

export const downloadz = ['wallpapers', 'cursors', 'y2k icons', 'screensavers', 'fonts']

export const initialGuests = [
  { name: 'xx_voiddreamer_xx', message: 'lorem ipsum dolor sit amet, love ur layout!!' },
  { name: 'glitter_ghost', message: 'consectetur adipiscing elit ur so real for this' },
  { name: 'staticsoul', message: 'sed do eiusmod, signing just to sign <3' },
]
