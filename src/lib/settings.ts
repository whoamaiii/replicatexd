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
      generationMode: parsed.generationMode || DEFAULT_OUTPUT_SETTINGS.generationMode,
      ragEnabled: parsed.ragEnabled ?? DEFAULT_OUTPUT_SETTINGS.ragEnabled,
      ragQuery: typeof parsed.ragQuery === 'string' ? parsed.ragQuery : DEFAULT_OUTPUT_SETTINGS.ragQuery,
      ragAnalysisEnabled: parsed.ragAnalysisEnabled ?? DEFAULT_OUTPUT_SETTINGS.ragAnalysisEnabled,
      ragAnalysisQuery:
        typeof parsed.ragAnalysisQuery === 'string'
          ? parsed.ragAnalysisQuery
          : DEFAULT_OUTPUT_SETTINGS.ragAnalysisQuery,
      ragAnalysisMode:
        parsed.ragAnalysisMode === 'retrieve_only' || parsed.ragAnalysisMode === 'draft_and_refine'
          ? parsed.ragAnalysisMode
          : DEFAULT_OUTPUT_SETTINGS.ragAnalysisMode,
    }
  } catch {
    return DEFAULT_OUTPUT_SETTINGS
  }
}

export function saveOutputSettings(settings: OutputSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
}
