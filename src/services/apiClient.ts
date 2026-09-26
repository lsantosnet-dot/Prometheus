const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
  ?? 'https://vallourec-dev.outsystemsenterprise.com/Prometheus_Backend2/rest/Maintenance'
const TIMEOUT_MS = 15000
const UPLOAD_TIMEOUT_MS = 120000

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

/**
 * POSTs a binary body with upload progress (0..1). Uses XMLHttpRequest because fetch
 * exposes no upload progress; the longer timeout lets large photos finish on slow networks.
 */
export function uploadBinary(path: string, body: Blob, headers: Record<string, string>, onProgress?: (fraction: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${API_BASE_URL}${path}`)
    xhr.timeout = UPLOAD_TIMEOUT_MS
    for (const [name, value] of Object.entries(headers)) xhr.setRequestHeader(name, value)
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress?.(event.loaded / event.total)
    }
    xhr.onload = () => xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new ApiRequestError(xhr.status, path))
    xhr.onerror = () => reject(new ApiUnavailableError())
    xhr.ontimeout = () => reject(new ApiUnavailableError('Unable to synchronize: the photo upload timed out.'))
    xhr.send(body)
  })
}

export function postJson<T>(path: string, body: unknown) {
  return apiRequest<T>(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
}
