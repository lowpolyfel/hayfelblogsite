const baseUrl = import.meta.env.VITE_API_BASE_URL ?? ''

export async function getJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: { Accept: 'application/json', ...init?.headers },
  })

  if (!response.ok) throw new Error(`API request failed (${response.status})`)
  return response.json() as Promise<T>
}
