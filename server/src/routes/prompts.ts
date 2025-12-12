import { Router } from 'express'
import { z } from 'zod'
import type { PromptBundle } from '../../../shared/types/prompts'
import { ImageAnalysisResultSchema } from '../services/analysisService'
import { buildPromptBundleForAnalysis } from '../services/promptEngine'

const PromptsRequestSchema = z.object({
  analysis: ImageAnalysisResultSchema,
})

export const promptsRouter = Router()

promptsRouter.post('/', (req, res) => {
  try {
    const parsed = PromptsRequestSchema.parse(req.body)
    const prompts: PromptBundle[] = buildPromptBundleForAnalysis(parsed.analysis)
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


