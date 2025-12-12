import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest'
import express from 'express'
import request from 'supertest'
import { generateRouter } from './generate'
import type { ImageAnalysisResult } from '../../../shared/types/analysis'
import fs from 'node:fs'

// Mock environment before importing modules that use getEnv
vi.stubEnv('OPENROUTER_API_KEY', 'test-api-key')
vi.stubEnv('OPENROUTER_IMAGE_MODEL', 'test/generation-model')
vi.stubEnv('LIBRARY_OUTPUT_DIR', 'test_output')

// Mock the openai/client module to avoid real API calls
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
    callTextCompletion: vi.fn().mockResolvedValue('RAG Addendum\n- test\n\nConstraints\n- test'),
    callImageGeneration: vi.fn().mockResolvedValue({
      imageBase64: 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', // 1x1 transparent GIF
      mimeType: 'image/gif',
    }),
  }
})

// Create a minimal test app
function createTestApp() {
  const app = express()
  app.use(express.json({ limit: '25mb' }))
  app.use('/api/generate', generateRouter)
  return app
}

// Sample valid analysis result for tests
// Uses actual effectIds from data/visual_effects.json
const sampleAnalysis: ImageAnalysisResult = {
  substanceId: 'lsd',
  dose: 0.5,
  baseSceneDescription: 'A forest path with dappled sunlight filtering through the trees.',
  effects: [
    { effectId: 'color_enhancement', group: 'enhancements', intensity: 0.6 },
    { effectId: 'breathing_surfaces', group: 'distortions', intensity: 0.5 },
  ],
  prompts: {
    openAIImagePrompt: 'A psychedelic forest scene with enhanced colors and breathing surfaces.',
    shortCinematicDescription: 'A mystical forest awakening',
  },
}

// Minimal valid image data URL (1x1 transparent GIF)
const sampleImageDataUrl = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'

describe('POST /api/generate', () => {
  let app: ReturnType<typeof createTestApp>
  const testOutputDir = 'test_output'

  beforeAll(() => {
    app = createTestApp()
    // Ensure test output directory exists
    if (!fs.existsSync(testOutputDir)) {
      fs.mkdirSync(testOutputDir, { recursive: true })
    }
  })

  afterAll(() => {
    // Cleanup test output
    if (fs.existsSync(testOutputDir)) {
      fs.rmSync(testOutputDir, { recursive: true, force: true })
    }
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('router settings validation', () => {
    it('rejects invalid router settings with 400', async () => {
      const response = await request(app)
        .post('/api/generate')
        .send({
          imageDataUrl: sampleImageDataUrl,
          analysis: sampleAnalysis,
          saveToLibrary: false,
          routerSettings: {
            surfaceLockStrength: 1.5, // Invalid: must be 0-1
          },
        })

      expect(response.status).toBe(400)
      expect(response.body.message).toBe('Invalid request')
    })

    it('rejects invalid region values in router settings', async () => {
      const response = await request(app)
        .post('/api/generate')
        .send({
          imageDataUrl: sampleImageDataUrl,
          analysis: sampleAnalysis,
          saveToLibrary: false,
          routerSettings: {
            defaultRegions: ['invalid_region'],
          },
        })

      expect(response.status).toBe(400)
      expect(response.body.message).toBe('Invalid request')
    })

    it('rejects invalid depth band values in router settings', async () => {
      const response = await request(app)
        .post('/api/generate')
        .send({
          imageDataUrl: sampleImageDataUrl,
          analysis: sampleAnalysis,
          saveToLibrary: false,
          routerSettings: {
            defaultDepthBands: ['close'], // Invalid: must be near, mid, or far
          },
        })

      expect(response.status).toBe(400)
      expect(response.body.message).toBe('Invalid request')
    })

    it('rejects rule strength above 2', async () => {
      const response = await request(app)
        .post('/api/generate')
        .send({
          imageDataUrl: sampleImageDataUrl,
          analysis: sampleAnalysis,
          saveToLibrary: false,
          routerSettings: {
            rules: [{
              effectId: 'breathing_surfaces',
              regions: ['subject'],
              depthBands: ['mid'],
              strength: 2.5, // Invalid: must be 0-2
              protectEdges: false,
            }],
          },
        })

      expect(response.status).toBe(400)
      expect(response.body.message).toBe('Invalid request')
    })
  })

  describe('valid router settings', () => {
    it('accepts valid router settings and returns success', async () => {
      const response = await request(app)
        .post('/api/generate')
        .send({
          imageDataUrl: sampleImageDataUrl,
          analysis: sampleAnalysis,
          saveToLibrary: false,
          routerSettings: {
            enabled: true,
            protectFace: true,
            protectHands: false,
            surfaceLockStrength: 0.8,
            groupMultipliers: {
              geometry: 1.5,
            },
          },
        })

      expect(response.status).toBe(200)
      expect(response.body.imageDataUrl).toBeDefined()
      expect(response.body.imageDataUrl).toContain('data:image/')
    })

    it('accepts empty router settings object', async () => {
      const response = await request(app)
        .post('/api/generate')
        .send({
          imageDataUrl: sampleImageDataUrl,
          analysis: sampleAnalysis,
          saveToLibrary: false,
          routerSettings: {},
        })

      expect(response.status).toBe(200)
    })

    it('accepts request without router settings', async () => {
      const response = await request(app)
        .post('/api/generate')
        .send({
          imageDataUrl: sampleImageDataUrl,
          analysis: sampleAnalysis,
          saveToLibrary: false,
        })

      expect(response.status).toBe(200)
    })

    it('accepts complete valid router settings with rules', async () => {
      const response = await request(app)
        .post('/api/generate')
        .send({
          imageDataUrl: sampleImageDataUrl,
          analysis: sampleAnalysis,
          saveToLibrary: false,
          routerSettings: {
            enabled: true,
            defaultRegions: ['subject', 'background'],
            defaultDepthBands: ['near', 'mid', 'far'],
            protectFace: true,
            protectHands: true,
            protectEdges: true,
            surfaceLockStrength: 0.6,
            groupMultipliers: {
              enhancements: 1.0,
              distortions: 1.2,
              geometry: 0.8,
              hallucinations: 0.5,
              perceptual: 1.0,
            },
            rules: [
              {
                effectId: 'breathing_surfaces',
                regions: ['subject'],
                depthBands: ['near', 'mid'],
                strength: 1.5,
                protectEdges: true,
              },
            ],
          },
        })

      expect(response.status).toBe(200)
      expect(response.body.usedPrompt).toBeDefined()
    })
  })

  describe('used prompt contains router instructions', () => {
    it('includes router placement instructions in used prompt', async () => {
      const response = await request(app)
        .post('/api/generate')
        .send({
          imageDataUrl: sampleImageDataUrl,
          analysis: sampleAnalysis,
          saveToLibrary: false,
          routerSettings: {
            enabled: true,
            protectFace: true,
            surfaceLockStrength: 0.8,
          },
        })

      expect(response.status).toBe(200)
      // The prompt should contain surface lock instruction
      expect(response.body.usedPrompt).toContain('surface-embedded')
    })

    it('excludes router instructions when router is disabled', async () => {
      const response = await request(app)
        .post('/api/generate')
        .send({
          imageDataUrl: sampleImageDataUrl,
          analysis: sampleAnalysis,
          saveToLibrary: false,
          routerSettings: {
            enabled: false,
          },
        })

      expect(response.status).toBe(200)
      // Should not contain the "Effect Routing:" section
      expect(response.body.usedPrompt).not.toContain('Effect Routing:')
    })
  })
})
