// Bio y cuerpos de las entradas son Lorem Ipsum a propósito — placeholder
// de diseño, no información real de la persona detrás del sitio.

export const bio = [
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
  'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.',
  'Nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat.',
]

export const badges = ['EST. 2004', 'CHRONICALLY ONLINE', 'MODO OSCURO: SIEMPRE', 'STATUS: LOREM']

// Nav de la cabecera: pendiente para abrir sitios hermanos en pestaña
// nueva más adelante. href:null = todavía no existe el sitio.
export const navLinks = [
  { key: 'inicio', href: null },
  { key: 'sobre mi', href: null },
  { key: 'extras', href: null },
  { key: 'faq', href: null },
  { key: 'links', href: null },
]

export const posts = [
  {
    date: '09.08.26', category: 'DIARIO', tone: '',
    title: 'nuevo diseño, mismas ganas de romperlo todo',
    body: `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.

Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.`,
  },
  {
    date: '02.08.26', category: 'PENSAMIENTOS', tone: 'gym',
    title: 'doce semanas de lo mismo, otra vez',
    body: `Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

Curabitur pretium tincidunt lacus, sed sagittis nunc rhoncus a. Aenean commodo ligula eget dolor.`,
  },
  {
    date: '21.07.26', category: 'RANDOM', tone: 'cocina',
    title: 'siete intentos hasta que salió bien',
    body: `Nam dui mi, tincidunt quis, accumsan porttitor, facilisis luctus, metus. Vestibulum ante ipsum primis in faucibus orci luctus.

Et ultrices posuere cubilia curae. Class aptent taciti sociosqu ad litora torquent per conubia nostra.`,
  },
  {
    date: '10.07.26', category: 'DIBUJO', tone: 'dibujo',
    title: 'por qué volví a lo pixelado',
    body: `Etiam ultricies nisi vel augue. Curabitur ullamcorper ultricies nisi. Nam eget dui. Etiam rhoncus.

Maecenas tempus, tellus eget condimentum rhoncus, sem quam semper libero, sit amet adipiscing sem neque sed ipsum.`,
  },
]

export const songs = ['ruido blanco de lluvia', 'breakcore a las 3am', 'la misma playlist de siempre', 'silencio (por fin)']
export const moods = ['cafeinado', 'en negación', 'productivo??', 'tranquilo']
export const tags = ['agentes LLM', 'pixel art', 'upper/lower', 'lorem ipsum', 'CSS feo a propósito', 'webrings', 'café frío']

export const notice = 'Esto es un blog, no un portafolio. Habrá errores de dedo, opiniones que voy a cambiar en tres meses y posts a las 2am.'

export const bootLines = ['cargando gifs innecesarios...', 'despertando a los agentes...', 'aplicando demasiado rojo...', 'listo.']

export const initialGuests = [
  { name: 'ana_delcampo', message: 'me encanta que esto no parezca hecho con plantilla' },
  { name: 'estefan', message: 'lorem ipsum dolor sit amet, gracias por el layout' },
  { name: 'anon', message: 'volví solo para arrastrar el sticker' },
]
