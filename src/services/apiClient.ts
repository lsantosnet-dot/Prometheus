const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
  ?? 'https://vallourec-dev.outsystemsenterprise.com/Prometheus_Backend2/rest/Maintenance'
const TIMEOUT_MS = 15000

export class ApiUnavailableError extends Error {
  constructor(message = 'Unable to synchronize: no network connection or the server is unavailable.') {
    super(message)
    this.name = 'ApiUnavailableError'
  }
}

export class ApiRequestError extends Error {
  readonly status: number

  constructor(status: number, path: string) {
    super(`The server rejected the request (${status} on ${path}).`)
    this.name = 'ApiRequestError'
    this.status = status
  }
}

export function ensureOnline() {
  if (!navigator.onLine) throw new ApiUnavailableError('Unable to synchronize: no network connection detected.')
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...init, signal: AbortSignal.timeout(TIMEOUT_MS) })
  } catch {
    throw new ApiUnavailableError()
  }
  if (!response.ok) throw new ApiRequestError(response.status, path)
  const text = await response.text()
  return (text ? JSON.parse(text) : undefined) as T
}

export function postJson<T>(path: string, body: unknown) {
  return apiRequest<T>(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
}
