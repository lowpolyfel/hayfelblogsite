// Las ocho gemas de la ruleta. Van sueltas del componente porque la página
// de ajustes también las necesita, para etiquetar cada campo de premio con
// la gema que le toca.
export const GEMAS = [
  { id: 'Cian', base: '#00d9ea' },
  { id: 'Verde', base: '#2fd117' },
  { id: 'Amarilla', base: '#ffcf00' },
  { id: 'Naranja', base: '#ff8400' },
  { id: 'Roja', base: '#f4142a' },
  { id: 'Rosa', base: '#ee1f96' },
  { id: 'Morada', base: '#9b1fe8' },
  { id: 'Azul', base: '#2160ec' },
]

// Texto que se canta en el "esto te ha tocado" cuando no hay nada
// configurado todavía: el nombre de la propia gema.
export const premiosPorDefecto = () => GEMAS.map((g) => `Gema ${g.id.toLowerCase()}`)
