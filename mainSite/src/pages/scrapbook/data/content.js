export { bio, badges, bootLines, navLinks, posts, tags, notice, initialGuests } from '../../legacy/data/content'

export const statement = 'SIN ALGORITMO SIN ADS PURO CAOS ORGANIZADO'

// Texto de las cintas inclinadas tipo "no pase". Se repite en pantalla, así
// que conviene que sea corto y en mayúsculas.
export const tapeLines = [
  'NO PASAR ~ ZONA EN OBRA ~ HAYFEL ~ NO PASAR ~ ZONA EN OBRA ~ HAYFEL ~',
  'ESCRITO A MANO ~ SIN PLANTILLA ~ SIN ADS ~ ESCRITO A MANO ~ SIN PLANTILLA ~',
]

// Huecos de imagen de la sección de cristal. Cada uno lee su propia variable
// CSS (--slot-1, --slot-2, ...) definida sobre `.scb`: mientras no exista, se
// muestra el marcador punteado. Para poner una foto basta con declarar
// `--slot-2: url('/mi-foto.jpg')` — no hace falta tocar el JSX.
export const glassSlots = [
  { id: 1, label: 'IMG 01', span: 'tall' },
  { id: 2, label: 'IMG 02', span: 'wide' },
  { id: 3, label: 'IMG 03', span: null },
  { id: 4, label: 'IMG 04', span: 'wide3' },
]

export const glassCopy = {
  title: 'VITRINA',
  kicker: 'espacio de cristal',
  body: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
  meta: 'aquí van las imágenes que se quieran cargar después',
}

export const gallery = [
  { icon: 'heart', tone: 'crimson' },
  { icon: 'sparkle', tone: 'paper' },
  { icon: 'skull', tone: 'ink' },
  { icon: 'chain', tone: 'crimson' },
  { icon: 'flame', tone: 'paper' },
  { icon: 'eye', tone: 'ink' },
]

export const socialLinks = [
  { name: 'tiktok', icon: 'tiktok', handle: '@hayfel', href: null },
  { name: 'instagram', icon: 'instagram', handle: '@hayfel', href: null },
  { name: 'youtube', icon: 'youtube', handle: 'hayfel', href: null },
  { name: 'twitch', icon: 'twitch', handle: 'hayfel', href: null },
  { name: 'spotify', icon: 'spotify', handle: 'hayfel', href: null },
]

export const footerWord = 'HAYFEL'
