import type { MapProviderConfig } from '../types/maps'
import { DEFAULT_MAP_PROVIDER_CONFIG } from '../types/maps'

const STORAGE_KEY = 'psyvis_map_provider_config'

export function loadMapProviderConfig(): MapProviderConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_MAP_PROVIDER_CONFIG
    const parsed = JSON.parse(raw) as Partial<MapProviderConfig>

    return {
      provider:
        parsed.provider === 'nanoBanana' || parsed.provider === 'local'
          ? parsed.provider
          : DEFAULT_MAP_PROVIDER_CONFIG.provider,
      allowFallback: parsed.allowFallback ?? DEFAULT_MAP_PROVIDER_CONFIG.allowFallback,
      modelId:
        typeof parsed.modelId === 'string' && parsed.modelId.trim().length > 0
          ? parsed.modelId.trim()
          : DEFAULT_MAP_PROVIDER_CONFIG.modelId,
      maxRetries:
        typeof parsed.maxRetries === 'number' && Number.isFinite(parsed.maxRetries)
          ? Math.max(0, Math.min(5, Math.floor(parsed.maxRetries)))
          : DEFAULT_MAP_PROVIDER_CONFIG.maxRetries,
    }
  } catch {
    return DEFAULT_MAP_PROVIDER_CONFIG
  }
}

export function saveMapProviderConfig(config: MapProviderConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
}

