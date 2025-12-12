import { z } from 'zod'

const EnvSchema = z.object({
  OPENROUTER_API_KEY: z.string().optional(),
  OPENROUTER_BASE_URL: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().optional(),
  PORT: z.string().optional(),
})

type Env = {
  openrouterApiKey: string
  openrouterBaseUrl: string
  openaiModel: string
  port: number
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

  cachedEnv = {
    openrouterApiKey,
    openrouterBaseUrl,
    openaiModel: normalizeModelId(parsed.data.OPENAI_MODEL),
    port,
  }

  return cachedEnv
}


