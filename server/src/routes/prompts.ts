import { Router } from 'express'
import { z } from 'zod'
import type { PromptBundle } from '../../../shared/types/prompts'
import { ImageAnalysisInputSchema } from '../services/analysisService'
import { buildPromptBundleForAnalysis } from '../services/promptEngine'

const PromptsRequestSchema = z.object({
  analysis: ImageAnalysisInputSchema,
  effectsStudioSettings: z
    .object({
      threshold: z.number().min(0).max(1),
      maxEffects: z.number().min(0).max(50),
    })
    .optional(),
  generationModelId: z.string().min(1).optional(),
})

export const promptsRouter = Router()

promptsRouter.post('/', (req, res) => {
  try {
    const parsed = PromptsRequestSchema.parse(req.body)
    const prompts: PromptBundle[] = buildPromptBundleForAnalysis(
      parsed.analysis,
      parsed.effectsStudioSettings,
    )
    res.json({ prompts })
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
