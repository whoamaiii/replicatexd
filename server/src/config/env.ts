import { z } from 'zod'

const EnvSchema = z.object({
  OPENROUTER_API_KEY: z.string().optional(),
  OPENROUTER_BASE_URL: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  // Legacy overrides (model IDs)
  OPENROUTER_IMAGE_MODEL: z.string().optional(),
  OPENAI_MODEL: z.string().optional(),
  // Model catalog configuration (preferred)
  MODEL_CACHE_TTL_SECONDS: z.string().optional(),
  DEFAULT_ANALYSIS_MODEL_NAME: z.string().optional(),
  DEFAULT_GENERATION_MODEL_NAME: z.string().optional(),
  PORT: z.string().optional(),
  LIBRARY_OUTPUT_DIR: z.string().optional(),
  LIBRARY_RETENTION_DAYS: z.string().optional(),
  LIBRARY_TRASH_ENABLED: z.string().optional(),
  LIBRARY_TRASH_GRACE_HOURS: z.string().optional(),
  // Maps configuration
  MAPS_ENABLED: z.string().optional(),
  MAPS_CACHE_DIR: z.string().optional(),
  MAPS_MAX_IMAGE_MP: z.string().optional(),
  MAPS_DEPTH_ENABLED: z.string().optional(),
  MAPS_NORMALS_ENABLED: z.string().optional(),
  MAPS_EDGES_ENABLED: z.string().optional(),
  MAPS_SEGMENTATION_ENABLED: z.string().optional(),
  MAPS_FACE_MASK_ENABLED: z.string().optional(),
  MAPS_HANDS_MASK_ENABLED: z.string().optional(),
  MAPS_PYTHON_PATH: z.string().optional(),

  // RAG configuration
  RAG_ENABLED: z.string().optional(),
  RAG_INDEX_DIR: z.string().optional(),
  RAG_EMBEDDING_MODEL_ID: z.string().optional(),
  DEFAULT_RAG_DRAFT_MODEL_NAME: z.string().optional(),
  DEFAULT_RAG_FINAL_MODEL_NAME: z.string().optional(),
  RAG_TOP_K: z.string().optional(),
  RAG_MAX_CONTEXT_CHARS: z.string().optional(),
})

type Env = {
  openrouterApiKey: string
  openrouterBaseUrl: string
  // Preferred defaults (by display name match via Models API)
  modelCacheTtlSeconds: number
  defaultAnalysisModelName: string
  defaultGenerationModelName: string
  // Legacy overrides (by model ID)
  legacyAnalysisModelId?: string
  legacyGenerationModelId?: string
  port: number
  libraryOutputDir: string
  libraryRetentionDays: number
  libraryTrashEnabled: boolean
  libraryTrashGraceHours: number
  // Maps configuration
  mapsEnabled: boolean
  mapsCacheDir: string
  mapsMaxImageMp: number
  mapsDepthEnabled: boolean
  mapsNormalsEnabled: boolean
  mapsEdgesEnabled: boolean
  mapsSegmentationEnabled: boolean
  mapsFaceMaskEnabled: boolean
  mapsHandsMaskEnabled: boolean
  mapsPythonPath: string

  // RAG configuration
  ragEnabled: boolean
  ragIndexDir: string
  ragEmbeddingModelId: string
  defaultRagDraftModelName: string
  defaultRagFinalModelName: string
  ragTopK: number
  ragMaxContextChars: number
}

let cachedEnv: Env | null = null

export function getEnv(): Env {
  if (cachedEnv) return cachedEnv

  const parsed = EnvSchema.safeParse(process.env)
  if (!parsed.success) {
    const detail = parsed.error.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join('\n')
    throw new Error(`Missing or invalid environment variables\n${detail}`)
  }

  const openrouterApiKey =
    (parsed.data.OPENROUTER_API_KEY ? parsed.data.OPENROUTER_API_KEY.trim() : '') ||
    (parsed.data.OPENAI_API_KEY ? parsed.data.OPENAI_API_KEY.trim() : '')
  if (!openrouterApiKey) {
    throw new Error(
      'Missing or invalid environment variables\nOPENROUTER_API_KEY: Required (or provide OPENAI_API_KEY as a fallback)',
    )
  }

  const openrouterBaseUrl = parsed.data.OPENROUTER_BASE_URL
    ? parsed.data.OPENROUTER_BASE_URL.trim()
    : 'https://openrouter.ai/api/v1'

  const modelCacheTtlSeconds = parsed.data.MODEL_CACHE_TTL_SECONDS
    ? Number(parsed.data.MODEL_CACHE_TTL_SECONDS)
    : 3600
  if (!Number.isFinite(modelCacheTtlSeconds) || modelCacheTtlSeconds <= 0) {
    throw new Error('MODEL_CACHE_TTL_SECONDS must be a positive number')
  }

  const defaultAnalysisModelName =
    parsed.data.DEFAULT_ANALYSIS_MODEL_NAME?.trim() || 'GPT 5.2'
  const defaultGenerationModelName =
    parsed.data.DEFAULT_GENERATION_MODEL_NAME?.trim() || 'GPT 5 Image'

  const legacyAnalysisModelId = parsed.data.OPENAI_MODEL?.trim() || undefined
  const legacyGenerationModelId = parsed.data.OPENROUTER_IMAGE_MODEL?.trim() || undefined

  const port = parsed.data.PORT ? Number(parsed.data.PORT) : 5174
  if (!Number.isFinite(port)) {
    throw new Error('PORT must be a number')
  }

  const libraryOutputDir = parsed.data.LIBRARY_OUTPUT_DIR?.trim() || 'psyvis_lab_output'
  const libraryRetentionDays = parsed.data.LIBRARY_RETENTION_DAYS
    ? Number(parsed.data.LIBRARY_RETENTION_DAYS)
    : 5
  const libraryTrashEnabled = parsed.data.LIBRARY_TRASH_ENABLED?.toLowerCase() !== 'false'
  const libraryTrashGraceHours = parsed.data.LIBRARY_TRASH_GRACE_HOURS
    ? Number(parsed.data.LIBRARY_TRASH_GRACE_HOURS)
    : 24

  // Maps configuration
  const mapsEnabled = parsed.data.MAPS_ENABLED?.toLowerCase() !== 'false'
  const mapsCacheDir = parsed.data.MAPS_CACHE_DIR?.trim() || 'map_cache'
  const mapsMaxImageMp = parsed.data.MAPS_MAX_IMAGE_MP
    ? Number(parsed.data.MAPS_MAX_IMAGE_MP)
    : 4 // 4 megapixels default
  const mapsDepthEnabled = parsed.data.MAPS_DEPTH_ENABLED?.toLowerCase() !== 'false'
  const mapsNormalsEnabled = parsed.data.MAPS_NORMALS_ENABLED?.toLowerCase() !== 'false'
  const mapsEdgesEnabled = parsed.data.MAPS_EDGES_ENABLED?.toLowerCase() !== 'false'
  const mapsSegmentationEnabled =
    parsed.data.MAPS_SEGMENTATION_ENABLED?.toLowerCase() === 'true'
  const mapsFaceMaskEnabled = parsed.data.MAPS_FACE_MASK_ENABLED?.toLowerCase() !== 'false'
  const mapsHandsMaskEnabled = parsed.data.MAPS_HANDS_MASK_ENABLED?.toLowerCase() !== 'false'
  const mapsPythonPath = parsed.data.MAPS_PYTHON_PATH?.trim() || 'python3'

  // RAG configuration
  const ragEnabled = parsed.data.RAG_ENABLED?.toLowerCase() === 'true'
  const ragIndexDir = parsed.data.RAG_INDEX_DIR?.trim() || 'data/rag'
  const ragEmbeddingModelId = parsed.data.RAG_EMBEDDING_MODEL_ID?.trim() || 'Xenova/e5-small-v2'
  const defaultRagDraftModelName =
    parsed.data.DEFAULT_RAG_DRAFT_MODEL_NAME?.trim() || 'Grok 4 Fast'
  const defaultRagFinalModelName =
    parsed.data.DEFAULT_RAG_FINAL_MODEL_NAME?.trim() || defaultAnalysisModelName
  const ragTopK = parsed.data.RAG_TOP_K ? Number(parsed.data.RAG_TOP_K) : 6
  const ragMaxContextChars = parsed.data.RAG_MAX_CONTEXT_CHARS
    ? Number(parsed.data.RAG_MAX_CONTEXT_CHARS)
    : 8000

  if (!Number.isFinite(ragTopK) || ragTopK <= 0) {
    throw new Error('RAG_TOP_K must be a positive number')
  }
  if (!Number.isFinite(ragMaxContextChars) || ragMaxContextChars <= 0) {
    throw new Error('RAG_MAX_CONTEXT_CHARS must be a positive number')
  }

  cachedEnv = {
    openrouterApiKey,
    openrouterBaseUrl,
    modelCacheTtlSeconds,
    defaultAnalysisModelName,
    defaultGenerationModelName,
    legacyAnalysisModelId,
    legacyGenerationModelId,
    port,
    libraryOutputDir,
    libraryRetentionDays,
    libraryTrashEnabled,
    libraryTrashGraceHours,
    mapsEnabled,
    mapsCacheDir,
    mapsMaxImageMp,
    mapsDepthEnabled,
    mapsNormalsEnabled,
    mapsEdgesEnabled,
    mapsSegmentationEnabled,
    mapsFaceMaskEnabled,
    mapsHandsMaskEnabled,
    mapsPythonPath,

    ragEnabled,
    ragIndexDir,
    ragEmbeddingModelId,
    defaultRagDraftModelName,
    defaultRagFinalModelName,
    ragTopK,
    ragMaxContextChars,
  }

  return cachedEnv
}
