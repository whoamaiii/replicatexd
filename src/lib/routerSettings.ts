/**
 * Router Settings Persistence
 *
 * Handles localStorage persistence for effect router settings.
 */

import type { RouterSettings } from '../types/router'
import { DEFAULT_ROUTER_SETTINGS, DEFAULT_GROUP_MULTIPLIERS } from '../types/router'

const STORAGE_KEY = 'psyvis_router_settings'

/**
 * Load router settings from localStorage, merging with defaults.
 */
export function loadRouterSettings(): RouterSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_ROUTER_SETTINGS }

    const parsed = JSON.parse(raw) as Partial<RouterSettings>
    return {
      enabled: parsed.enabled ?? DEFAULT_ROUTER_SETTINGS.enabled,
      defaultRegions: parsed.defaultRegions ?? DEFAULT_ROUTER_SETTINGS.defaultRegions,
      defaultDepthBands: parsed.defaultDepthBands ?? DEFAULT_ROUTER_SETTINGS.defaultDepthBands,
      protectFace: parsed.protectFace ?? DEFAULT_ROUTER_SETTINGS.protectFace,
      protectHands: parsed.protectHands ?? DEFAULT_ROUTER_SETTINGS.protectHands,
      protectEdges: parsed.protectEdges ?? DEFAULT_ROUTER_SETTINGS.protectEdges,
      surfaceLockStrength:
        parsed.surfaceLockStrength ?? DEFAULT_ROUTER_SETTINGS.surfaceLockStrength,
      groupMultipliers: {
        ...DEFAULT_GROUP_MULTIPLIERS,
        ...parsed.groupMultipliers,
      },
      rules: parsed.rules ?? DEFAULT_ROUTER_SETTINGS.rules,
    }
  } catch {
    return { ...DEFAULT_ROUTER_SETTINGS }
  }
}

/**
 * Save router settings to localStorage.
 */
export function saveRouterSettings(settings: RouterSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
}

/**
 * Reset router settings to defaults.
 */
export function resetRouterSettings(): RouterSettings {
  localStorage.removeItem(STORAGE_KEY)
  return { ...DEFAULT_ROUTER_SETTINGS }
}
