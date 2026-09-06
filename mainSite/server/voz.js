// Ajustes del lector de voz. La validación vive aquí y no en la página
// porque el TTS lee en directo lo que escribe cualquiera: los topes son
// moderación, y la moderación no se deja en manos del navegador.

export const AJUSTES_VOZ_POR_DEFECTO = {
  voz: '',                 // vacío = la que el sistema tenga por defecto
  velocidad: 1,
  tono: 1,
  volumen: 1,
  maxCaracteres: 200,
  leerNombre: true,
  colapsarRepetidos: true, // "AAAAAAAA" -> "AAA"
  bloqueadas: [],
}

const entre = (v, min, max, porDefecto) => {
  const n = Number(v)
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : porDefecto
}

/**
 * Devuelve unos ajustes siempre válidos y dentro de rango. Nunca lanza: si
 * llega basura, se cae a los valores de fábrica en vez de dejar la voz sin
 * límites, que es el fallo peligroso.
 */
export function normalizarAjustesVoz(bruto) {
  const a = bruto && typeof bruto === 'object' ? bruto : {}
  return {
    voz: typeof a.voz === 'string' ? a.voz.slice(0, 120) : '',
    // Los rangos son los que admite la API de voz del navegador.
    velocidad: entre(a.velocidad, 0.5, 2, 1),
    tono: entre(a.tono, 0.5, 2, 1),
    volumen: entre(a.volumen, 0, 1, 1),
    // El tope de arriba es duro a propósito: sin él, alguien pega un tocho
    // y el canal se queda escuchándolo cinco minutos.
    maxCaracteres: Math.round(entre(a.maxCaracteres, 20, 400, 200)),
    leerNombre: a.leerNombre !== false,
    colapsarRepetidos: a.colapsarRepetidos !== false,
    bloqueadas: Array.isArray(a.bloqueadas)
      ? [...new Set(a.bloqueadas
          .filter((p) => typeof p === 'string')
          .map((p) => p.trim().toLowerCase())
          .filter(Boolean))].slice(0, 200)
      : [],
  }
}
