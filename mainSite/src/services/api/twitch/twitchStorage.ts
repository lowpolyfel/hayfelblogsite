import { K, PARAM } from './twitchConfig'

// Guardado de la configuración. Dos fuentes, en este orden:
//
//   1. Los parámetros de la URL. Imprescindible para OBS: el Browser Source
//      tiene su propio perfil de navegador y NO ve el localStorage que
//      escribió Chrome, así que la config viaja en el enlace del widget.
//   2. El localStorage, para que la página de ajustes recuerde la sesión y
//      para que el widget siga funcionando si OBS recarga sin parámetros.
//
// Lo que llega por URL se copia a localStorage la primera vez, así que basta
// con pegar el enlace una vez en OBS.

export type Premios = string[]

function leer(clave: string): string {
  try {
    return window.localStorage.getItem(clave) ?? ''
  } catch {
    return '' // modo incógnito o almacenamiento bloqueado
  }
}

function escribir(clave: string, valor: string) {
  try {
    if (valor) window.localStorage.setItem(clave, valor)
    else window.localStorage.removeItem(clave)
  } catch {
    /* sin almacenamiento: la sesión no persiste, pero la página funciona */
  }
}

export const almacen = {
  get clientId() { return leer(K.clientId) },
  set clientId(v: string) { escribir(K.clientId, v) },

  get token() { return leer(K.token) },
  set token(v: string) { escribir(K.token, v) },

  get broadcasterId() { return leer(K.broadcasterId) },
  set broadcasterId(v: string) { escribir(K.broadcasterId, v) },

  get broadcasterLogin() { return leer(K.broadcasterLogin) },
  set broadcasterLogin(v: string) { escribir(K.broadcasterLogin, v) },

  get rewardId() { return leer(K.rewardId) },
  set rewardId(v: string) { escribir(K.rewardId, v) },

  get premios(): Premios {
    try {
      const crudo = leer(K.premios)
      if (!crudo) return []
      const v = JSON.parse(crudo)
      return Array.isArray(v) ? v.map(String) : []
    } catch {
      return []
    }
  },
  set premios(v: Premios) {
    escribir(K.premios, v.length ? JSON.stringify(v) : '')
  },

  limpiar() {
    Object.values(K).forEach((k) => escribir(k, ''))
  },
}

// Lee la config que venga en la URL y la vuelca al almacén. Se llama una vez
// al arrancar el widget. Devuelve true si encontró algo.
export function adoptarConfigDeUrl(): boolean {
  const q = new URLSearchParams(window.location.search)
  let encontrado = false

  const par: Array<[string, (v: string) => void]> = [
    [PARAM.clientId, (v) => { almacen.clientId = v }],
    [PARAM.token, (v) => { almacen.token = v }],
    [PARAM.broadcasterId, (v) => { almacen.broadcasterId = v }],
    [PARAM.rewardId, (v) => { almacen.rewardId = v }],
  ]
  for (const [clave, set] of par) {
    const v = q.get(clave)
    if (v) { set(v); encontrado = true }
  }

  const p = q.get(PARAM.premios)
  if (p) {
    try {
      const lista = JSON.parse(atob(p))
      if (Array.isArray(lista)) { almacen.premios = lista.map(String); encontrado = true }
    } catch {
      /* parámetro corrupto: se ignora y se usan los premios por defecto */
    }
  }
  return encontrado
}

// Arma el enlace que se pega en el Browser Source de OBS.
export function urlDelWidget(premios: Premios): string {
  const q = new URLSearchParams()
  q.set(PARAM.clientId, almacen.clientId)
  q.set(PARAM.token, almacen.token)
  q.set(PARAM.broadcasterId, almacen.broadcasterId)
  q.set(PARAM.rewardId, almacen.rewardId)
  if (premios.length) q.set(PARAM.premios, btoa(JSON.stringify(premios)))
  return `${window.location.origin}${window.location.pathname}?${q}#overlays/ruleta`
}
