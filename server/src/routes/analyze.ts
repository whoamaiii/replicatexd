import { Router } from 'express'
import { z } from 'zod'
import type { AnalyzeResponse } from '../../../shared/types/api'
import { SubstanceIds } from '../../../shared/types/substances'
import { analyzeImage } from '../services/analysisService'
import { HttpError } from '../openai/client'

const AnalyzeRequestSchema = z.object({
  imageDataUrl: z
    .string()
    .min(1)
    .refine((v) => v.startsWith('data:image/'), 'imageDataUrl must be a data url'),
  substanceId: z.enum(SubstanceIds),
  dose: z.number().min(0).max(1),
  analysisModelId: z.string().min(1).optional(),
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

export const analyzeRouter = Router()

analyzeRouter.post('/', async (req, res) => {
  try {
    const parsed = AnalyzeRequestSchema.parse(req.body)
    const analysis: AnalyzeResponse = await analyzeImage(parsed)
    res.json(analysis)
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ message: 'Invalid request' })
      return
    }

    if (err instanceof HttpError) {
      const status = err.status >= 500 ? 502 : err.status
      console.error('[analyze] upstream error', { status: err.status, details: err.details })
      res.status(status).json({ message: err.message })
      return
    }

    console.error(err)
    const message = err instanceof Error && err.message.trim().length > 0 ? err.message : 'Server error'
    res.status(500).json({ message })
  }
})
