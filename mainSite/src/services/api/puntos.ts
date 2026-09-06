// Cliente del backend propio. El navegador ya no habla con Twitch para
// iniciar sesión ni para leer recompensas: de eso se encarga el servidor,
// que es el único que conoce el Client Secret y guarda el refresh token.

export interface AjustesVoz {
  voz: string
  velocidad: number
  tono: number
  volumen: number
  maxCaracteres: number
  leerNombre: boolean
  colapsarRepetidos: boolean
  bloqueadas: string[]
}

export interface Sesion {
  sesion: boolean
  login?: string
  displayName?: string
  ruleta?: { rewardId: string | null; premios: string[]; widgetUrl: string }
  voz?: { rewardId: string | null; ajustes: AjustesVoz; widgetUrl: string }
}

export interface Recompensa {
  id: string
  title: string
  cost: number
  is_enabled: boolean
}

export interface ConfigDelWidget {
  accessToken: string
  clientId: string
  broadcasterId: string
  ruleta: { rewardId: string | null; premios: string[] }
  voz: { rewardId: string | null; ajustes: AjustesVoz }
  revalidarEnSegundos: number
}

export class ErrorApi extends Error {
  status: number
  constructor(status: number, mensaje: string) {
    super(mensaje)
    this.name = 'ErrorApi'
    this.status = status
  }
}

async function pedir<T>(ruta: string, init?: RequestInit): Promise<T> {
  const r = await fetch(`/api${ruta}`, {
    credentials: 'same-origin', // la cookie de sesión viaja sola
    headers: init?.body ? { 'Content-Type': 'application/json' } : undefined,
    ...init,
  })
  const datos = await r.json().catch(() => ({}))
  if (!r.ok) throw new ErrorApi(r.status, (datos as any)?.error || `Error ${r.status}`)
  return datos as T
}

/** Con qué cuenta estoy. Es lo que hace que la siguiente página ya salga iniciada. */
export const quienSoy = () => pedir<Sesion>('/me')

export const salir = () => pedir<{ ok: true }>('/auth/logout', { method: 'POST' })

export const listarRecompensas = () =>
  pedir<{ recompensas: Recompensa[] }>('/rewards').then((r) => r.recompensas)

export interface CambiosConfig {
  rewardId?: string | null
  premios?: string[]
  rewardTtsId?: string | null
  ttsAjustes?: Partial<AjustesVoz>
}

export const guardarConfig = (cambios: CambiosConfig) =>
  pedir<{ ruleta: { rewardId: string | null; premios: string[] }
          voz: { rewardId: string | null; ajustes: AjustesVoz } }>('/config', {
    method: 'PUT',
    body: JSON.stringify(cambios),
  })

export const rotarWidget = () =>
  pedir<{ ruletaUrl: string; vozUrl: string }>('/widget-key/rotar', { method: 'POST' })

/** Lo que piden los widgets de OBS. Sin cookies: se identifican por su clave. */
export const configDelWidget = (clave: string) =>
  pedir<ConfigDelWidget>(`/widget/${encodeURIComponent(clave)}`)

/** El login lo arranca el servidor, que es quien pone el `state`. */
export const URL_ENTRAR = '/api/auth/login'
