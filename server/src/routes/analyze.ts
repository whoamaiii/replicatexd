import { Router } from 'express'
import { z } from 'zod'
import type { AnalyzeResponse } from '../../../shared/types/api'
import { SubstanceIds } from '../../../shared/types/substances'
import { analyzeImage } from '../services/analysisService'

const AnalyzeRequestSchema = z.object({
  imageDataUrl: z
    .string()
    .min(1)
    .refine((v) => v.startsWith('data:image/'), 'imageDataUrl must be a data url'),
  substanceId: z.enum(SubstanceIds),
  dose: z.number().min(0).max(1),
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

    const status = (err as { status?: unknown } | null)?.status
    if (typeof status === 'number') {
      res
        .status(500)
        .json({ message: 'OpenAI request failed. Check your API key and try again.' })
      return
    }

    console.error(err)
    const message = err instanceof Error && err.message.trim().length > 0 ? err.message : 'Server error'
    res.status(500).json({ message })
  }
})


