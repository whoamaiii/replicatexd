import { z } from 'zod'

const EnvSchema = z.object({
  OPENROUTER_API_KEY: z.string().optional(),
  OPENROUTER_BASE_URL: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().optional(),
  PORT: z.string().optional(),
  LIBRARY_OUTPUT_DIR: z.string().optional(),
  LIBRARY_RETENTION_DAYS: z.string().optional(),
  LIBRARY_TRASH_ENABLED: z.string().optional(),
  LIBRARY_TRASH_GRACE_HOURS: z.string().optional(),
})

type Env = {
  openrouterApiKey: string
  openrouterBaseUrl: string
  openaiModel: string
  port: number
  libraryOutputDir: string
  libraryRetentionDays: number
  libraryTrashEnabled: boolean
  libraryTrashGraceHours: number
}

let cachedEnv: Env | null = null

function normalizeModelId(input: string | undefined) {
  if (!input) return 'gpt-5.2'
  const cleaned = input.trim().toLowerCase()
  if (cleaned === 'gpt 5 point 2' || cleaned === 'gpt5 point 2' || cleaned === 'gpt5.2') {
    return 'gpt-5.2'
  }
  return input.trim()
}

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

  cachedEnv = {
    openrouterApiKey,
    openrouterBaseUrl,
    openaiModel: normalizeModelId(parsed.data.OPENAI_MODEL),
    port,
    libraryOutputDir,
    libraryRetentionDays,
    libraryTrashEnabled,
    libraryTrashGraceHours,
  }

  return cachedEnv
}


