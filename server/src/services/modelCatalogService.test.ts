import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'

function makeModelsPayload(models: unknown[]) {
  return { data: models }
}

describe('modelCatalogService (OpenRouter models cache)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-01-01T00:00:00.000Z'))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
    vi.resetModules()
    vi.useRealTimers()
  })

  it('caches model list within TTL and refreshes after TTL', async () => {
    vi.stubEnv('OPENROUTER_API_KEY', 'test-api-key')
    vi.stubEnv('OPENROUTER_BASE_URL', 'https://openrouter.ai/api/v1')
    vi.stubEnv('MODEL_CACHE_TTL_SECONDS', '10')
    vi.stubEnv('DEFAULT_ANALYSIS_MODEL_NAME', 'GPT 5.2')
    vi.stubEnv('DEFAULT_GENERATION_MODEL_NAME', 'GPT 5 Image')

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () =>
        makeModelsPayload([
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
        ]),
    })
    vi.stubGlobal('fetch', fetchMock)

    const { getModelMenuResponse } = await import('./modelCatalogService')

    const first = await getModelMenuResponse()
    const second = await getModelMenuResponse()

    expect(first.fetchedAt).toBe(second.fetchedAt)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(first.all.length).toBeGreaterThan(0)

    vi.setSystemTime(new Date('2025-01-01T00:00:11.000Z'))
    const third = await getModelMenuResponse()
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(third.fetchedAt).not.toBe(first.fetchedAt)
  })

  it('derives capability tags and selection helpers', async () => {
    vi.stubEnv('OPENROUTER_API_KEY', 'test-api-key')
    vi.stubEnv('OPENROUTER_BASE_URL', 'https://openrouter.ai/api/v1')
    vi.stubEnv('MODEL_CACHE_TTL_SECONDS', '60')
    vi.stubEnv('DEFAULT_ANALYSIS_MODEL_NAME', 'GPT 5.2')
    vi.stubEnv('DEFAULT_GENERATION_MODEL_NAME', 'Flux 2 Pro')

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () =>
          makeModelsPayload([
            {
              id: 'openai/gpt-5.2',
              name: 'GPT 5.2',
              description: 'Multimodal vision analysis.',
              architecture: { modality: 'text+image->text' },
              pricing: { prompt: '0.000001', completion: '0.000002' },
            },
            {
              id: 'black-forest-labs/flux.2-pro',
              name: 'Flux 2 Pro',
              description: 'Photoreal image generation.',
              architecture: { modality: 'text->image' },
              pricing: { image: '0.01' },
            },
          ]),
      }),
    )

    const {
      getModelMenuResponse,
      listAnalysisCandidates,
      listGenerationCandidates,
      pickFirstModelIdByName,
    } = await import('./modelCatalogService')

    const menu = await getModelMenuResponse()
    const analysis = listAnalysisCandidates(menu.all)
    const gen = listGenerationCandidates(menu.all)

    expect(analysis.map((m) => m.id)).toContain('openai/gpt-5.2')
    expect(gen.map((m) => m.id)).toContain('black-forest-labs/flux.2-pro')

    const pickedAnalysis = pickFirstModelIdByName(analysis, 'gpt 5.2')
    expect(pickedAnalysis).toBe('openai/gpt-5.2')
  })
})

