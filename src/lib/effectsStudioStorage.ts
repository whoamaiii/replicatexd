export type EffectsStudioPersisted = {
  threshold?: number
  maxEffects?: number
  locksById?: Record<string, boolean>
}

const SETTINGS_KEY = 'psyvis.effectsStudio.settings.v1'
const FAMILY_TAB_KEY = 'psyvis.effectsStudio.familyTab.v1'

function safeParseJson(value: string | null): unknown {
  if (!value) return null
  try {
    return JSON.parse(value) as unknown
  } catch {
    return null
  }
}

export function loadEffectsStudioPersisted(): EffectsStudioPersisted {
  if (typeof window === 'undefined') return {}
  const raw = safeParseJson(window.localStorage.getItem(SETTINGS_KEY))
  if (!raw || typeof raw !== 'object') return {}
  const obj = raw as Record<string, unknown>

  const threshold = typeof obj.threshold === 'number' ? obj.threshold : undefined
  const maxEffects = typeof obj.maxEffects === 'number' ? obj.maxEffects : undefined
  const locksById =
    obj.locksById && typeof obj.locksById === 'object'
      ? (obj.locksById as Record<string, boolean>)
      : undefined

  return { threshold, maxEffects, locksById }
}

export function saveEffectsStudioPersisted(next: EffectsStudioPersisted): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(next))
  } catch {
    // ignore
  }
}

export function loadEffectsStudioFamilyTab(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage.getItem(FAMILY_TAB_KEY)
  } catch {
    return null
  }
}

export function saveEffectsStudioFamilyTab(tab: string): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(FAMILY_TAB_KEY, tab)
  } catch {
    // ignore
  }
}

