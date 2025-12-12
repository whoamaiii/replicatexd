import type { ModelMenuResponse } from '../../shared/types/models'

type ApiError = { message: string }

export async function fetchModelMenu(options?: { signal?: AbortSignal }): Promise<ModelMenuResponse> {
  const res = await fetch('/api/models', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    signal: options?.signal,
  })

  if (!res.ok) {
    let message = `Request failed (${res.status})`
    try {
      const data = (await res.json()) as Partial<ApiError>
      if (typeof data.message === 'string' && data.message.trim().length > 0) message = data.message
    } catch {
      // ignore
    }
    throw new Error(message)
  }

  return (await res.json()) as ModelMenuResponse
}

