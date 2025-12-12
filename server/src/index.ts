import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import { getEnv } from './config/env'
import { analyzeRouter } from './routes/analyze'
import { generateRouter } from './routes/generate'
import { promptsRouter } from './routes/prompts'
import { libraryRouter } from './routes/library'
import { mapsRouter } from './routes/maps'
import { modelsRouter } from './routes/models'
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
app.use('/api/maps', mapsRouter)
app.use('/api/models', modelsRouter)

const env = getEnv()
const server = app.listen(env.port, () => {
  console.log(`Server listening on ${env.port}`)
  console.log(`Health check: http://127.0.0.1:${env.port}/api/health`)
  startCleanupScheduler()
})

server.on('error', (err) => {
  const asAny = err as { code?: unknown; message?: unknown }
  const code = typeof asAny?.code === 'string' ? asAny.code : ''

  if (code === 'EADDRINUSE') {
    console.error(
      `[server] Port ${env.port} is already in use. Stop the other process or set PORT to a free port in .env.`,
    )
    process.exit(1)
  }

  console.error('[server] Failed to start server:', err)
  process.exit(1)
})
