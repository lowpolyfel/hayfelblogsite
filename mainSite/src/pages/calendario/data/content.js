// Texto de relleno a propósito (Lorem Ipsum): es placeholder de diseño, no
// datos reales de la persona detrás del sitio.

export const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

// La semana empieza en lunes
export const DIAS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

// Marcas del calendario. `dia` es día del mes y `mes` es 0-11; se muestran
// solo cuando el mes visible coincide. `tipo` colorea la marca.
export const marcas = [
  { mes: 7, dia: 9, tipo: 'entrada', titulo: 'nuevo diseño, mismas ganas', nota: 'lorem ipsum dolor sit amet' },
  { mes: 7, dia: 14, tipo: 'nota', titulo: 'revisar la vitrina', nota: 'consectetur adipiscing elit' },
  { mes: 7, dia: 21, tipo: 'entrada', titulo: 'siete intentos', nota: 'sed do eiusmod tempor' },
  { mes: 7, dia: 26, tipo: 'racha', titulo: 'una semana seguida', nota: 'incididunt ut labore' },
  { mes: 8, dia: 3, tipo: 'nota', titulo: 'volver al capítulo 4', nota: 'ut enim ad minim veniam' },
  { mes: 8, dia: 12, tipo: 'entrada', titulo: 'por qué volví a lo pixelado', nota: 'quis nostrud exercitation' },
  { mes: 8, dia: 18, tipo: 'racha', titulo: 'dos semanas seguidas', nota: 'duis aute irure dolor' },
  { mes: 8, dia: 27, tipo: 'nota', titulo: 'limpiar borradores', nota: 'excepteur sint occaecat' },
]

export const TIPOS = {
  entrada: { label: 'ENTRADA', tone: 'crimson' },
  nota: { label: 'NOTA', tone: 'paper' },
  racha: { label: 'RACHA', tone: 'ink' },
}

export const copy = {
  kicker: 'bitácora en rejilla',
  title: 'CALENDARIO',
  intro: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore.',
  vacio: 'nada marcado este mes. todavía.',
}

export const jpLine = '一 歩 ず つ 、 前 へ'

export const marquee = 'UN PASO A LA VEZ ~ EMPEZAR HOY ~ HAYFEL ~ '
