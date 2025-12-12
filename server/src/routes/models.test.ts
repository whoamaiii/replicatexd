import { describe, it, expect, afterEach, vi } from 'vitest'
import express from 'express'
import request from 'supertest'

function createTestApp(modelsRouter: unknown) {
  const app = express()
  app.use(express.json({ limit: '25mb' }))
  app.use('/api/models', modelsRouter as express.Router)
  return app
}

describe('GET /api/models', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('returns { recommended, all, fetchedAt }', async () => {
    vi.stubEnv('OPENROUTER_API_KEY', 'test-api-key')
    vi.stubEnv('OPENROUTER_BASE_URL', 'https://openrouter.ai/api/v1')
    vi.stubEnv('MODEL_CACHE_TTL_SECONDS', '3600')
    vi.stubEnv('DEFAULT_ANALYSIS_MODEL_NAME', 'GPT 5.2')
    vi.stubEnv('DEFAULT_GENERATION_MODEL_NAME', 'GPT 5 Image')

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          data: [
            {
              id: 'openai/gpt-5.2',
              name: 'GPT 5.2',
              description: 'Vision model for image analysis.',
              architecture: { modality: 'text+image->text' },
              pricing: { prompt: '0.000001', completion: '0.000002' },
            },
            {
              id: 'black-forest-labs/flux.2-pro',
              name: 'Flux 2 Pro',
              description: 'High quality image generation.',
              architecture: { modality: 'text->image' },
              pricing: { image: '0.01' },
            },
          ],
        }),
      }),
    )

    const { modelsRouter } = await import('./models')
    const app = createTestApp(modelsRouter)

    const res = await request(app).get('/api/models')
    expect(res.status).toBe(200)

    expect(res.body).toEqual(
      expect.objectContaining({
        recommended: expect.any(Array),
        all: expect.any(Array),
        fetchedAt: expect.any(String),
      }),
    )

    // Basic shape checks for returned model metadata
    expect(res.body.all.length).toBeGreaterThan(0)
    const first = res.body.all[0]
    expect(first).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        displayName: expect.any(String),
        provider: expect.any(String),
        description: expect.any(String),
        caps: expect.any(Object),
        tags: expect.any(Array),
      }),
    )

    // Recommended should be a subset of all (by id)
    const allIds = new Set<string>((res.body.all as Array<{ id: string }>).map((m) => m.id))
    for (const m of res.body.recommended as Array<{ id: string }>) {
      expect(allIds.has(m.id)).toBe(true)
    }

    // With our fixture, Flux 2 Pro should show up in recommended by name match.
    const recIds = new Set<string>((res.body.recommended as Array<{ id: string }>).map((m) => m.id))
    expect(recIds.has('black-forest-labs/flux.2-pro')).toBe(true)
  })
})

