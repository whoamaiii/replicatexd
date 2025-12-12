import { describe, it, expect, vi } from 'vitest'
import express from 'express'
import request from 'supertest'
import { analyzeRouter } from './analyze'

vi.stubEnv('OPENROUTER_API_KEY', 'test-api-key')
vi.stubEnv('RAG_ENABLED', 'true')

vi.mock('../services/rag/ragPipeline', () => {
  return {
    runRagPipeline: vi.fn().mockResolvedValue({
      enabled: true,
      query: 'custom query',
      models: { draftModelId: 'x-ai/grok-fast', finalModelId: 'openai/gpt-5.2' },
      retrieved: [
        {
          id: 'visual_effect:breathing_surfaces',
          title: 'Visual effect: Breathing surfaces',
          source: { type: 'visual_effect', effectId: 'breathing_surfaces' },
          score: 0.9,
        },
      ],
      contextText: '# Source 1\nEffect: Breathing surfaces (breathing_surfaces)',
      draftText: 'draft',
      finalText: 'RAG Addendum\n- emphasize breathing surfaces\n\nConstraints\n- no floating overlays',
    }),
  }
})

vi.mock('../openai/client', () => {
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
    callVisionAnalysis: vi.fn().mockResolvedValue(
      JSON.stringify({
        substanceId: 'lsd',
        dose: 0.5,
        baseSceneDescription: 'A forest path with dappled sunlight.',
        effects: [{ effectId: 'color_enhancement', group: 'enhancements', intensity: 0.6 }],
        prompts: {
          openAIImagePrompt: 'A surreal forest scene with enhanced colors.',
          shortCinematicDescription: 'A mystical forest awakening',
        },
      }),
    ),
  }
})

function createTestApp() {
  const app = express()
  app.use(express.json({ limit: '25mb' }))
  app.use('/api/analyze', analyzeRouter)
  return app
}

describe('POST /api/analyze', () => {
  it('returns analysis without RAG fields by default', async () => {
    const app = createTestApp()
    const res = await request(app).post('/api/analyze').send({
      imageDataUrl: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      substanceId: 'lsd',
      dose: 0.5,
      analysisModelId: 'test/vision',
    })

    expect(res.status).toBe(200)
    expect(res.body.prompts.openAIImagePrompt).toContain('Constraint: Keep geometric patterns embedded')
    expect(res.body.prompts.openAIImagePrompt).not.toContain('RAG Augmentation')
    expect(res.body.rag).toBeUndefined()
  })

  it('includes RAG addendum + metadata when enabled', async () => {
    const app = createTestApp()
    const res = await request(app).post('/api/analyze').send({
      imageDataUrl: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      substanceId: 'lsd',
      dose: 0.5,
      analysisModelId: 'test/vision',
      rag: {
        enabled: true,
        query: 'custom query',
        draftModelId: 'x-ai/grok-fast',
        finalModelId: 'openai/gpt-5.2',
      },
    })

    expect(res.status).toBe(200)
    expect(res.body.prompts.ragAddendum).toContain('RAG Addendum')
    expect(res.body.prompts.openAIImagePrompt).toContain('RAG Augmentation')
    expect(res.body.rag?.enabled).toBe(true)
    expect(res.body.rag?.query).toBe('custom query')
    expect(Array.isArray(res.body.rag?.retrieved)).toBe(true)
  })
})

