import { Router } from 'express'
import { z } from 'zod'
import type { GenerateResponse } from '../../../shared/types/api'
import { ImageAnalysisInputSchema, ImageAnalysisResultSchema } from '../services/analysisService'
import { generateImageFromAnalysis } from '../services/imageGenerationService'
import { getMapSettings, getAnyMapPack } from '../services/mapService'
import { HttpError } from '../openai/client'

// Router settings schema (all fields optional for backward compatibility)
const RouterSettingsSchema = z
  .object({
    enabled: z.boolean().optional(),
    defaultRegions: z.array(z.enum(['face', 'hands', 'subject', 'background', 'global'])).optional(),
    defaultDepthBands: z.array(z.enum(['near', 'mid', 'far'])).optional(),
    protectFace: z.boolean().optional(),
    protectHands: z.boolean().optional(),
    protectEdges: z.boolean().optional(),
    surfaceLockStrength: z.number().min(0).max(1).optional(),
    groupMultipliers: z
      .object({
        enhancements: z.number().optional(),
        distortions: z.number().optional(),
        geometry: z.number().optional(),
        hallucinations: z.number().optional(),
        perceptual: z.number().optional(),
      })
      .optional(),
    rules: z
      .array(
        z.object({
          effectId: z.string(),
          regions: z.array(z.enum(['face', 'hands', 'subject', 'background', 'global'])),
          depthBands: z.array(z.enum(['near', 'mid', 'far'])),
          strength: z.number().min(0).max(2),
          protectEdges: z.boolean(),
        }),
      )
      .optional(),
  })
  .optional()

const GenerateRequestSchema = z.object({
  imageDataUrl: z
    .string()
    .min(1)
    .refine((v) => v.startsWith('data:image/'), 'imageDataUrl must be a data url'),
  analysis: ImageAnalysisInputSchema,
  analysisModelId: z.string().min(1).optional(),
  generationModelId: z.string().min(1).optional(),
  projectId: z.string().optional(),
  originalAnalysis: ImageAnalysisResultSchema.optional(),
  saveToLibrary: z.boolean().optional(),
  // Optional fields for map support
  generationMode: z.enum(['prompt_only', 'base_image_edit']).optional(),
  mapSourceHash: z.string().optional(),
  // Optional router settings for effect placement control
  routerSettings: RouterSettingsSchema,
  effectsStudioSettings: z
    .object({
      threshold: z.number().min(0).max(1),
      maxEffects: z.number().min(0).max(50),
    })
    .optional(),
  rag: z
    .object({
      enabled: z.boolean().optional(),
      query: z.string().min(1).optional(),
      topK: z.number().min(1).max(20).optional(),
      draftModelId: z.string().min(1).optional(),
      finalModelId: z.string().min(1).optional(),
      mode: z.enum(['retrieve_only', 'draft_and_refine']).optional(),
    })
    .optional(),
})

export const generateRouter = Router()

generateRouter.post('/', async (req, res) => {
  try {
    const parsed = GenerateRequestSchema.parse(req.body)

    // Fetch map settings and pack if sourceHash provided
    const mapSettings = parsed.mapSourceHash ? getMapSettings(parsed.mapSourceHash) : undefined
    const mapPack = parsed.mapSourceHash ? getAnyMapPack(parsed.mapSourceHash) : undefined

    const result = await generateImageFromAnalysis({
      ...parsed,
      mapSettings,
      mapPack,
      routerSettings: parsed.routerSettings,
    })
    const payload: GenerateResponse = result
    res.json(payload)
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ message: 'Invalid request' })
      return
    }

    if (err instanceof HttpError) {
      const status = err.status >= 500 ? 502 : err.status
      console.error('[generate] upstream error', { status: err.status, details: err.details })
      res.status(status).json({ message: err.message })
      return
    }

    console.error(err)
    const message =
      err instanceof Error && err.message.trim().length > 0 ? err.message : 'Server error'
    res.status(500).json({ message })
  }
})
