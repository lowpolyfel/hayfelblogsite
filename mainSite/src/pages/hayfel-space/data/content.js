export const posts = [
  { date: '09.08.26', category: 'TESIS', face: 'crim', title: 'los cuatro agentes por fin se hablan entre ellos', body: `Llevaba semanas con el Crítico devolviendo puras quejas vacías. El problema no era el prompt: era que le pasaba el requisito ya clasificado y sin el texto original, así que criticaba una etiqueta, no una frase.

Ahora el grafo lleva el texto crudo hasta el final. El Crítico marca la ambigüedad, el Modelador la reescribe, y si el Clasificador no está de acuerdo, regresa un ciclo. Máximo dos vueltas o esto no termina nunca.

Nota para mí del futuro: los ciclos infinitos en un grafo de agentes no truenan, solo te vacían la cuenta.` },
  { date: '05.08.26', category: 'SITIO', face: 'shadow', title: 'reconstruí este sitio otra vez, sin degradados', body: `La versión anterior tenía demasiado bisel con degradado y una franja diagonal de fondo que ya se sentía de otra época.

Esta vez todo es color plano: los paneles usan sombra sólida en vez de brillo degradado, y el fondo es un patrón SVG (cuadrícula, puntos, cruces o damero) con una capa de grano encima. Hay un botón abajo para cambiarlo.

También dejé de forzar el mismo corte torcido en cada tarjeta. Ahora la mayoría son ventanas rectas, tipo escritorio viejo, y lo irregular se guarda para unos cuantos acentos.` },
  { date: '02.08.26', category: 'GYM', face: 'blood', title: 'semana 12 de upper/lower: lo que sí sirvió', body: `Cuatro días, dos superiores y dos inferiores. Nada exótico.

Lo que movió la aguja no fue el programa, fue dejar de cambiarlo. Mismos ejercicios doce semanas seguidas, subiendo peso o repeticiones cuando salían limpias.

Lo otro: agendar el gym a las 5pm y tratarlo como clase. Si es "cuando pueda", no puedo.` },
  { date: '28.07.26', category: 'TESIS', face: 'bone', title: 'leí 140 títulos para quedarme con diecinueve', body: `El protocolo pedía documentar cada descarte, y ahí estuvo el valor real: al escribir por qué tiraba cada paper, empecé a ver que mi pregunta estaba mal formulada.

De 140 títulos pasé a 47 resúmenes, de ahí a 19 textos completos. Los otros hablaban de ambigüedad, sí, pero midiéndola, no resolviéndola.

Lo tedioso resultó ser lo que me dio el hueco donde cabe mi trabajo.` },
  { date: '21.07.26', category: 'COCINA', face: 'flare', title: 'butter chicken, intento siete', body: `Los primeros seis salieron a sopa de tomate con pollo adentro. El error era meter la crema con la sartén a todo fuego: se corta y ya nada la salva.

Intento siete: marinar el pollo en yogur griego una hora, tostar las especias en seco antes de nada, bajar la flama al mínimo antes de la mantequilla y la crema.

Salió. Lo malo es que ahora tengo que hacerlo cada semana.` },
  { date: '10.07.26', category: 'DIBUJO', face: 'deep', title: 'por qué volví al pixel art', body: `Porque una cuadrícula de 16x16 no te deja esconderte. No hay degradado que tape una silueta mal resuelta.

Es el mismo motivo por el que me gusta escribir con restricciones: menos opciones, decisiones más honestas.

El avatar de este sitio está hecho con un arreglo de texto y un montón de rectángulos. Nada más.` },
]

// Menú de sitios hermanos: cada botón abre otro sitio en una pestaña nueva,
// no filtra contenido de esta página. href:null = todavía no existe el sitio.
export const externalSites = [
  { key: 'PORTAFOLIO', accent: '#ff1f3f', href: null },
  { key: 'PROYECTOS', accent: '#ffc300', href: null },
  { key: 'TESIS DOCS', accent: '#f5ede2', href: null },
]

export const schedule = [
  ['07:00', 'café y silencio'], ['08:30', 'escribir tesis'], ['11:00', 'código / agentes'],
  ['13:30', 'comer'], ['17:00', 'gym (upper)'], ['19:00', 'cocinar algo con especias'],
  ['21:00', 'dibujar'], ['23:00', 'leer papers mal'],
]
export const songs = ['jazz de bar en loop', 'breakcore a las 3am', 'la misma playlist de siempre', 'silencio (por fin)']
export const moods = ['cafeinado', 'en negación', 'productivo??', 'tranquilo']
export const bootLog = ['montando ventanas...', 'cargando patrón de fondo...', 'afilando dos o tres bordes...', 'listo.']
// Todos los enlaces reales van aquí — solo falta rellenar el href de cada uno.
export const socialLinks = [
  { name: 'TIKTOK', icon: 'tiktok', handle: '@hayfel', href: null },
  { name: 'INSTAGRAM', icon: 'instagram', handle: '@hayfel', href: null },
  { name: 'YOUTUBE', icon: 'youtube', handle: 'hayfel', href: null },
  { name: 'TWITCH', icon: 'twitch', handle: 'hayfel', href: null },
  { name: 'SPOTIFY', icon: 'spotify', handle: 'hayfel', href: null },
]
export const initialGuests = [
  { name: 'ana_delcampo', message: 'me encanta que esto no parezca hecho con plantilla' },
  { name: 'estefan', message: 'la receta del curry me salvó la cena, gracias' },
  { name: 'anon', message: 'volví solo para arrastrar el sticker' },
]
