/**
 * Maps API Client for PsyVis Lab
 *
 * Functions for interacting with the /api/maps endpoints.
 */

import type {
  EnsureMapsRequest,
  EnsureMapsResponse,
  GetMapsResponse,
  MapSettings,
  MapProviderConfig,
  UpdateMapSettingsRequest,
} from '../types/maps'

// Maps generation can take a while
const MAPS_TIMEOUT_MS = 600_000

function isAbortError(err: unknown) {
  return (
    !!err &&
    typeof err === 'object' &&
    'name' in err &&
    typeof (err as { name?: unknown }).name === 'string' &&
    (err as { name: string }).name === 'AbortError'
  )
}

/**
 * Generic POST with JSON body
 */
async function postJson<TRequest, TResponse>(
  url: string,
  body: TRequest,
  options?: { timeoutMs?: number }
): Promise<TResponse> {
  const controller = new AbortController()
  const timeoutMs = options?.timeoutMs ?? 60_000
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs)

  try {
    let res: Response
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      })
    } catch (err) {
      if (isAbortError(err)) {
        throw new Error(
          `Request timed out after ${Math.round(timeoutMs / 1000)}s. If you are running locally, ensure the API server is running (dev: http://127.0.0.1:5174) and try again.`,
        )
      }
      throw err
    }

    if (!res.ok) {
      let message = `Request failed (${res.status})`
      try {
        const data = await res.json()
        if (data.message) message = data.message
      } catch {
        // Ignore JSON parse errors
      }
      if (res.status === 502) {
        // Vite proxy uses 502 for "server not reachable".
        message =
          message ||
          'API server not reachable (expected http://127.0.0.1:5174). Start it (npm run dev) and try again.'
      }
      throw new Error(message)
    }

    return (await res.json()) as TResponse
  } catch (err) {
    if (isAbortError(err)) {
      throw new Error(
        `Request timed out after ${Math.round(timeoutMs / 1000)}s. Map generation can take a while, especially with Nano Banana. Try again, increase retries/fallback settings, or restart the API server.`,
      )
    }
    throw err
  } finally {
    window.clearTimeout(timeoutId)
  }
}

/**
 * Ensure maps exist for an image.
 * Generates maps if not already cached.
 */
export async function ensureMaps(
  imageDataUrl: string,
  providerConfig?: Partial<MapProviderConfig>,
): Promise<EnsureMapsResponse> {
  return postJson<EnsureMapsRequest, EnsureMapsResponse>(
    '/api/maps/ensure',
    { imageDataUrl, providerConfig },
    { timeoutMs: MAPS_TIMEOUT_MS }
  )
}

/**
 * Get an existing map pack and its settings.
 */
export async function getMaps(sourceHash: string): Promise<GetMapsResponse> {
  const res = await fetch(`/api/maps/${sourceHash}`)
  if (!res.ok) {
    throw new Error('Failed to get maps')
  }
  return res.json()
}

/**
 * Update settings for a map pack.
 */
export async function updateMapSettings(
  sourceHash: string,
  settings: Partial<Omit<MapSettings, 'sourceHash' | 'updatedAt'>>
): Promise<MapSettings> {
  return postJson<UpdateMapSettingsRequest, MapSettings>('/api/maps/settings', {
    sourceHash,
    settings,
  })
}

/**
 * Get the URL for serving a map file directly.
 */
export function getMapFileUrl(sourceHash: string, mapKind: string): string {
  return `/api/maps/${sourceHash}/file/${mapKind}`
}

export function getMapFileUrlForProvider(
  sourceHash: string,
  provider: string,
  mapKind: string,
): string {
  return `/api/maps/${sourceHash}/${provider}/file/${mapKind}`
}
