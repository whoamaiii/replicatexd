import type { OutputSettings } from '../types/settings'
import { DEFAULT_OUTPUT_SETTINGS } from '../types/settings'

const STORAGE_KEY = 'psyvis_output_settings'

export function loadOutputSettings(): OutputSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_OUTPUT_SETTINGS
    const parsed = JSON.parse(raw) as Partial<OutputSettings>
    return {
      autoDownloadMode: parsed.autoDownloadMode || DEFAULT_OUTPUT_SETTINGS.autoDownloadMode,
      autoSaveToLibrary: parsed.autoSaveToLibrary ?? DEFAULT_OUTPUT_SETTINGS.autoSaveToLibrary,
    }
  } catch {
    return DEFAULT_OUTPUT_SETTINGS
  }
}

export function saveOutputSettings(settings: OutputSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
}
