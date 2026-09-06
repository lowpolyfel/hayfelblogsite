// Filtros de lo que se lee en voz alta.
//
// Esto no es un detalle: el lector dice literalmente lo que escriba
// cualquiera, en directo y con el audio del canal. Un mensaje sin filtrar es
// un problema esperando a pasar, así que se limpia antes de hablar y se
// devuelve el motivo cuando se descarta, para poder verlo en el panel.

const URL_SUELTA = /\b(?:https?:\/\/|www\.)\S+/gi

// "AAAAAAAAAA" -> "AAA". Es el abuso más común y el más molesto de oír.
const colapsar = (t) => t.replace(/(.)\1{2,}/gu, '$1$1$1')

/**
 * @returns {{ok:true, texto:string} | {ok:false, motivo:string}}
 */
export function prepararMensaje(bruto, ajustes) {
  const a = ajustes ?? {}
  let t = String(bruto ?? '').trim()

  if (!t) return { ok: false, motivo: 'vacío' }

  // Las direcciones no se leen: en voz alta no aportan nada y sirven para
  // colar sitios que nadie ha mirado.
  t = t.replace(URL_SUELTA, ' ')

  if (a.colapsarRepetidos !== false) t = colapsar(t)

  // Espacios de sobra, y los caracteres invisibles que se usan para saltarse
  // los filtros de palabras.
  t = t.replace(/[​-‍﻿]/g, '').replace(/\s+/g, ' ').trim()

  if (!t) return { ok: false, motivo: 'vacío tras limpiar' }

  // La comparación va sin tildes ni mayúsculas: si no, basta con escribir
  // "holá" para saltarse "hola" en la lista.
  const plano = t.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '')
  const bloqueadas = Array.isArray(a.bloqueadas) ? a.bloqueadas : []
  const encontrada = bloqueadas.find((p) => {
    const q = String(p).toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').trim()
    return q && plano.includes(q)
  })
  // Se descarta el mensaje entero en vez de censurar la palabra: dejar el
  // resto suele bastar para que se entienda igual lo que se quería decir.
  if (encontrada) return { ok: false, motivo: `palabra bloqueada: ${encontrada}` }

  const tope = Number(a.maxCaracteres) || 200
  if (t.length > tope) t = `${t.slice(0, tope)}…`

  return { ok: true, texto: t }
}
