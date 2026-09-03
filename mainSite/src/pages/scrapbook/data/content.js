// El arranque, el menú y las firmas siguen compartidos con la versión
// legacy. El resto del texto ya es propio de esta página, así que se define
// aquí: la versión legacy se queda en espera y no debe moverse.
export { bootLines, navLinks, initialGuests } from '../../legacy/data/content'

export const statement = 'MIS REDES, HORARIOS Y MÁS COSILLAS'

// Tira corrediza entre la portada y el manifiesto. Se repite en pantalla,
// así que conviene que sea corta y en mayúsculas.
export const marquee = 'TODOS LOS ENLACES ~ SIN INTERMEDIARIOS ~ HAYFEL ~ '

// ---------- SOBRE MI ----------
export const aboutTitle = '¿QUIÉN CHOTAS ES HAYFEL?'

export const bio = [
  'Cuando era pequeño siempre hablaba solo en mi cabeza.',
  'Y cuando mi mamá compró una cámara Sony, algo en mi cerebro hizo que se unieran los cables.',
  'Quiero seguir con eso.',
]

// Dos filas de etiquetas: las de arriba van en bloque de color y las de
// abajo en contorno, para que la lista no se lea como un muro.
export const badges = ['EST. 2002', 'NIÑO RATA', 'AMO LOVE LIVE', 'VIVA PERSONA 5', 'BULDAKSLOVER']

export const tags = [
  'ingepobre',
  'gaymer',
  'desempleado',
  'luismifan',
  'creativo',
  'procrastinador (espero que ya no tanto)',
]

// ---------- ÚLTIMAS PUBLICACIONES ----------
// Todavía no hay entradas escritas: las fichas son marcadores de sitio y
// por eso no llevan título ni fecha inventados.
export const posts = [
  { n: '01', label: 'PRÓXIMAMENTE' },
  { n: '02', label: 'PRÓXIMAMENTE' },
  { n: '03', label: 'PRÓXIMAMENTE' },
  { n: '04', label: 'PRÓXIMAMENTE' },
]

export const notice =
  'Yo hice esta página, así que escribo como se me da la gana, ¿ok? Aaaaa, y me proyecto a las 3 de la mañana, ¿y qué?'

// ---------- LO ÚLTIMO DE HAYFEL ----------
// Cada hueco lee su propia variable CSS (--slot-1, --slot-2, ...) definida
// sobre `.scb`: mientras no exista, se muestra el marcador. Para poner una
// miniatura basta con declarar `--slot-2: url('/mi-foto.jpg')`.
export const glassSlots = [
  { id: 1, icon: 'instagram', platform: 'INSTAGRAM' },
  { id: 2, icon: 'youtube', platform: 'YOUTUBE' },
  { id: 3, icon: 'tiktok', platform: 'TIKTOK' },
  { id: 4, icon: 'instagram', platform: 'INSTAGRAM' },
  { id: 5, icon: 'youtube', platform: 'YOUTUBE' },
  { id: 6, icon: 'tiktok', platform: 'TIKTOK' },
]

export const glassCopy = {
  title: 'LO ÚLTIMO DE HAYFEL',
  tag: 'PRÓXIMAMENTE',
  body: 'Aquí van a caer las últimas publicaciones de Instagram, YouTube y TikTok, sin salir de la página.',
  meta: 'todavía nada que enseñar',
  cta: 'LEER MÁS',
}

// Líneas en japonés en la línea de "CHASE!" de Setsuna Yuki: empezar ahora,
// perseguir a quien quieres llegar a ser, avanzar un paso a la vez.
// Son frases escritas para el sitio, no la letra de la canción.
export const jpLines = [
  '走 り 出 せ 、 今 す ぐ に', // "echa a correr, ahora mismo"
  'ま だ 見 ぬ 自 分 を 追 い か け て', // "persiguiendo al yo que aún no conozco"
  '一 歩 ず つ 、 前 へ', // "un paso a la vez, hacia adelante"
]

// Accesos directos a los otros sitios, en la primera escena
export const heroLinks = [
  { label: 'REDES', href: '#redes', note: 'todos los enlaces', icon: 'chain' },
  { label: 'CALENDARIO', href: '#calendario', note: 'qué viene ahora', icon: 'sparkle' },
]

export const gallery = [
  { icon: 'heart', tone: 'crimson' },
  { icon: 'sparkle', tone: 'paper' },
  { icon: 'skull', tone: 'ink' },
  { icon: 'chain', tone: 'crimson' },
  { icon: 'flame', tone: 'paper' },
  { icon: 'eye', tone: 'ink' },
]

export const footerWord = 'HAYFEL'
