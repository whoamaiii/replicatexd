import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.stubEnv('OPENROUTER_API_KEY', 'test-api-key')
vi.stubEnv('RAG_ENABLED', 'true')

vi.mock('./embedder', () => {
  return {
    createXenovaEmbedder: vi.fn().mockResolvedValue({
      provider: 'xenova',
      modelId: 'mock',
      dims: 3,
      embedPassages: vi.fn(),
      embedQuery: vi.fn().mockResolvedValue(new Float32Array([1, 0, 0])),
    }),
  }
})

const callTextCompletion = vi.fn()
vi.mock('../../openai/client', () => {
  class HttpError extends Error {
    status: number
    details?: string

    constructor(status: number, message: string, details?: string) {
      super(message)
      this.name = 'HttpError'
      this.status = status
      this.details = details
    }
  }

  return {
    HttpError,
    callTextCompletion,
  }
})

vi.mock('./localVectorStore', () => {
  return {
    searchRagIndex: vi.fn().mockResolvedValue({
      query: 'q',
      manifest: undefined,
      hits: [
        {
          score: 0.9,
          doc: {
            id: 'visual_effect:breathing_surfaces',
            title: 'Visual effect: Breathing surfaces',
            text: [
              'Effect: Breathing surfaces (breathing_surfaces)',
              'Group: distortions',
              'Family: perceptual',
              'Description: Subtle rhythmic expansion and contraction of surfaces.',
            ].join('\n'),
            source: { type: 'visual_effect', effectId: 'breathing_surfaces' },
          },
        },
      ],
    }),
  }
})

describe('runRagPipeline', () => {
  beforeEach(() => {
    callTextCompletion.mockReset()
  })

  it('retrieve_only does not call text models', async () => {
    const { runRagPipeline } = await import('./ragPipeline')
    const res = await runRagPipeline({
      enabled: true,
      query: 'bias toward breathing surfaces',
      mode: 'retrieve_only',
    })

    expect(res.enabled).toBe(true)
    expect(res.mode).toBe('retrieve_only')
    expect(res.finalText).toContain('RAG Addendum')
    expect(callTextCompletion).not.toHaveBeenCalled()
  })

  it('draft_and_refine calls text models when ids provided', async () => {
    callTextCompletion
      .mockResolvedValueOnce('draft text')
      .mockResolvedValueOnce('final text')

    const { runRagPipeline } = await import('./ragPipeline')
    const res = await runRagPipeline({
      enabled: true,
      query: 'bias toward breathing surfaces',
      mode: 'draft_and_refine',
      draftModelId: 'x-ai/grok-fast',
      finalModelId: 'openai/gpt-5.2',
    })

    expect(res.enabled).toBe(true)
    expect(res.mode).toBe('draft_and_refine')
    expect(callTextCompletion).toHaveBeenCalledTimes(2)
    expect(res.finalText).toBe('final text')
  })
})

