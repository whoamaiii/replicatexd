import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('env configuration', () => {
  beforeEach(() => {
    // Clear module cache to reset env singleton
    vi.resetModules()
  })

  it('should have default values for optional configuration', async () => {
    // Set minimal required env vars
    process.env.OPENROUTER_API_KEY = 'test-key'

    const { getEnv } = await import('./env')
    const env = getEnv()

    expect(env.openrouterApiKey).toBe('test-key')
    expect(env.port).toBe(5174)
    expect(env.libraryOutputDir).toBe('psyvis_lab_output')
    expect(env.libraryRetentionDays).toBe(5)
    expect(env.libraryTrashEnabled).toBe(true)
    expect(env.libraryTrashGraceHours).toBe(24)
    expect(env.corsOrigins).toEqual(['http://localhost:5173', 'http://localhost:5174'])
  })

  it('should throw error when API key is missing', async () => {
    delete process.env.OPENROUTER_API_KEY
    delete process.env.OPENAI_API_KEY

    const { getEnv } = await import('./env')

    expect(() => getEnv()).toThrow('OPENROUTER_API_KEY')
  })

  it('should parse custom CORS origins', async () => {
    process.env.OPENROUTER_API_KEY = 'test-key'
    process.env.CORS_ORIGINS = 'http://example.com,https://app.example.com'

    const { getEnv } = await import('./env')
    const env = getEnv()

    expect(env.corsOrigins).toEqual(['http://example.com', 'https://app.example.com'])
  })

  it('should use custom model names when provided', async () => {
    process.env.OPENROUTER_API_KEY = 'test-key'
    process.env.OPENAI_VISION_MODEL = 'custom/vision-model'
    process.env.OPENAI_IMAGE_MODEL = 'custom/image-model'

    const { getEnv } = await import('./env')
    const env = getEnv()

    expect(env.visionModel).toBe('custom/vision-model')
    expect(env.imageModel).toBe('custom/image-model')
  })
})
