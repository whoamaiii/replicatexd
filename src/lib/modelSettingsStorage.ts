export type ModelSettings = {
  analysisModelId?: string
  generationModelId?: string
  mapsModelId?: string
  ragDraftModelId?: string
  ragFinalModelId?: string
}

const STORAGE_KEY = 'psyvis_model_settings'

function normalizeOptionalId(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

export function loadModelSettings(): ModelSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Partial<ModelSettings>
    return {
      analysisModelId: normalizeOptionalId(parsed.analysisModelId),
      generationModelId: normalizeOptionalId(parsed.generationModelId),
      mapsModelId: normalizeOptionalId(parsed.mapsModelId),
      ragDraftModelId: normalizeOptionalId(parsed.ragDraftModelId),
      ragFinalModelId: normalizeOptionalId(parsed.ragFinalModelId),
    }
  } catch {
    return {}
  }
}

export function saveModelSettings(settings: ModelSettings): void {
  const payload: ModelSettings = {
    analysisModelId: normalizeOptionalId(settings.analysisModelId),
    generationModelId: normalizeOptionalId(settings.generationModelId),
    mapsModelId: normalizeOptionalId(settings.mapsModelId),
    ragDraftModelId: normalizeOptionalId(settings.ragDraftModelId),
    ragFinalModelId: normalizeOptionalId(settings.ragFinalModelId),
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
}
