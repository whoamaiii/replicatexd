import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import { getEnv } from './config/env'
import { analyzeRouter } from './routes/analyze'
import { generateRouter } from './routes/generate'
import { promptsRouter } from './routes/prompts'
import { libraryRouter } from './routes/library'
import { startCleanupScheduler } from './services/libraryCleanup'

const app = express()

app.use(cors())
app.use(express.json({ limit: '25mb' }))

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.use('/api/analyze', analyzeRouter)
app.use('/api/generate', generateRouter)
app.use('/api/prompts', promptsRouter)
app.use('/api/library', libraryRouter)

const env = getEnv()
app.listen(env.port, () => {
  console.log(`Server listening on ${env.port}`)
  startCleanupScheduler()
})


