import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import rateLimit from 'express-rate-limit'
import morgan from 'morgan'
import { getEnv } from './config/env'
import { analyzeRouter } from './routes/analyze'
import { generateRouter } from './routes/generate'
import { promptsRouter } from './routes/prompts'
import { libraryRouter } from './routes/library'
import { startCleanupScheduler, stopCleanupScheduler } from './services/libraryCleanup'

const app = express()
const env = getEnv()

// Logging middleware
app.use(morgan('combined'))

// CORS configuration
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin || env.corsOrigins.includes('*') || env.corsOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
}
app.use(cors(corsOptions))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
})
app.use('/api/', limiter)

app.use(express.json({ limit: '25mb' }))

app.get('/api/health', async (_req, res) => {
  try {
    const fs = await import('node:fs/promises')
    const path = await import('node:path')

    // Check if library output directory is accessible
    const libraryDir = path.resolve(env.libraryOutputDir)
    await fs.access(libraryDir).catch(() => fs.mkdir(libraryDir, { recursive: true }))

    res.json({
      ok: true,
      timestamp: new Date().toISOString(),
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
      }
    })
  } catch (error) {
    res.status(503).json({
      ok: false,
      error: 'Health check failed',
      timestamp: new Date().toISOString(),
    })
  }
})

app.use('/api/analyze', analyzeRouter)
app.use('/api/generate', generateRouter)
app.use('/api/prompts', promptsRouter)
app.use('/api/library', libraryRouter)

const server = app.listen(env.port, () => {
  console.log(`Server listening on ${env.port}`)
  startCleanupScheduler()
})

// Graceful shutdown handler
const gracefulShutdown = (signal: string) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`)

  stopCleanupScheduler()

  server.close(() => {
    console.log('HTTP server closed')
    process.exit(0)
  })

  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('Forcing shutdown after timeout')
    process.exit(1)
  }, 10000)
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))


