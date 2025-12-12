import { Router } from 'express'
import type { ModelMenuResponse } from '../../../shared/types/models'
import { getModelMenuResponse } from '../services/modelCatalogService'

export const modelsRouter = Router()

modelsRouter.get('/', async (_req, res) => {
  try {
    const payload: ModelMenuResponse = await getModelMenuResponse()
    res.json(payload)
  } catch (err) {
    console.error('[models] failed to fetch model catalog', err)
    const message = err instanceof Error && err.message.trim().length > 0 ? err.message : 'Server error'
    res.status(502).json({ message })
  }
})

