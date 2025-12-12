import { Router } from 'express'
import { z } from 'zod'
import type { GenerateResponse } from '../../../shared/types/api'
import { ImageAnalysisResultSchema } from '../services/analysisService'
import { generateImageFromAnalysis } from '../services/imageGenerationService'

const GenerateRequestSchema = z.object({
  imageDataUrl: z
    .string()
    .min(1)
    .refine((v) => v.startsWith('data:image/'), 'imageDataUrl must be a data url'),
  analysis: ImageAnalysisResultSchema,
})

export const generateRouter = Router()

generateRouter.post('/', async (req, res) => {
  try {
    const parsed = GenerateRequestSchema.parse(req.body)
    const result = await generateImageFromAnalysis(parsed)
    const payload: GenerateResponse = result
    res.json(payload)
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ message: 'Invalid request' })
      return
    }

    console.error(err)
    const message = err instanceof Error && err.message.trim().length > 0 ? err.message : 'Server error'
    res.status(500).json({ message })
  }
})


