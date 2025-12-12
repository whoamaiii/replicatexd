import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { EventEmitter } from 'node:events'
import express from 'express'
import request from 'supertest'
import { PNG } from 'pngjs'

vi.stubEnv('OPENROUTER_API_KEY', 'test-api-key')
vi.stubEnv('OPENROUTER_BASE_URL', 'https://openrouter.ai/api/v1')
vi.stubEnv('LIBRARY_OUTPUT_DIR', 'test_output_maps')
vi.stubEnv('MAPS_CACHE_DIR', 'map_cache')
vi.stubEnv('MAPS_ENABLED', 'true')
vi.stubEnv('MAPS_DEPTH_ENABLED', 'true')
vi.stubEnv('MAPS_NORMALS_ENABLED', 'false')
vi.stubEnv('MAPS_EDGES_ENABLED', 'false')
vi.stubEnv('MAPS_SEGMENTATION_ENABLED', 'false')
vi.stubEnv('MAPS_FACE_MASK_ENABLED', 'false')
vi.stubEnv('MAPS_HANDS_MASK_ENABLED', 'false')

const spawnMock = vi.hoisted(() => vi.fn())
vi.mock('node:child_process', () => ({
  spawn: spawnMock,
}))

function makePngDataUrl(width: number, height: number, fill: (idx: number) => [number, number, number, number]) {
  const png = new PNG({ width, height })
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (width * y + x) << 2
      const [r, g, b, a] = fill(width * y + x)
      png.data[i] = r
      png.data[i + 1] = g
      png.data[i + 2] = b
      png.data[i + 3] = a
    }
  }
  const buffer = PNG.sync.write(png)
  return `data:image/png;base64,${buffer.toString('base64')}`
}

function createWorkerProcess(outputDir: string, maps: Array<{ kind: string; filename: string }>) {
  const proc = new EventEmitter() as unknown as {
    stdout: EventEmitter
    stderr: EventEmitter
    on: (event: string, cb: (...args: unknown[]) => void) => unknown
  }
  proc.stdout = new EventEmitter()
  proc.stderr = new EventEmitter()

  // Ensure output dir exists and write fake map files.
  fs.mkdirSync(outputDir, { recursive: true })
  for (const m of maps) {
    const png = new PNG({ width: 2, height: 2 })
    png.data.fill(0)
    for (let i = 0; i < png.data.length; i += 4) {
      png.data[i] = 255
      png.data[i + 1] = 255
      png.data[i + 2] = 255
      png.data[i + 3] = 255
    }
    const buffer = PNG.sync.write(png)
    fs.writeFileSync(path.join(outputDir, m.filename), buffer)
  }

  const payload = {
    maps: maps.map((m) => ({
      kind: m.kind,
      filename: m.filename,
      width: 2,
      height: 2,
      generatedAt: new Date().toISOString(),
      modelUsed: 'mock-worker',
    })),
    sourceWidth: 2,
    sourceHeight: 2,
    inputFilename: 'input.png',
  }

  queueMicrotask(() => {
    proc.stdout.emit('data', JSON.stringify(payload) + '\n')
    ;(proc as unknown as EventEmitter).emit('close', 0)
  })

  return proc
}

describe('maps routes + providers', () => {
  const testOutputDir = 'test_output_maps'

  beforeAll(() => {
    if (!fs.existsSync(testOutputDir)) fs.mkdirSync(testOutputDir, { recursive: true })
  })

  afterAll(() => {
    if (fs.existsSync(testOutputDir)) fs.rmSync(testOutputDir, { recursive: true, force: true })
  })

  afterEach(() => {
    spawnMock.mockReset()
    vi.unstubAllGlobals()
    vi.resetModules()
  })

  it('falls back to local when Nano Banana output fails validation', async () => {
    const inputImageDataUrl = makePngDataUrl(2, 2, () => [0, 0, 0, 255])
    // Use an aspect-ratio mismatch so we don't auto-resize-repair it.
    const badOutputDataUrl = makePngDataUrl(1, 3, () => [0, 0, 0, 255])

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'x-request-id': 'req_bad' }),
        text: async () =>
          JSON.stringify({
            choices: [
              {
                message: {
                  images: [{ image_url: { url: badOutputDataUrl } }],
                },
              },
            ],
            usage: { total_cost: 0.01 },
          }),
      }),
    )

    spawnMock.mockImplementation((_cmd: string, args: string[]) => {
      const outputDirIdx = args.indexOf('--output-dir')
      const outputDir = outputDirIdx >= 0 ? args[outputDirIdx + 1]! : 'unknown'
      return createWorkerProcess(outputDir, [{ kind: 'depth', filename: 'depth.png' }])
    })

    const { ensureMapPack, computeSourceHash } = await import('../services/mapService')

    const pack = await ensureMapPack(inputImageDataUrl, {
      provider: 'nanoBanana',
      allowFallback: true,
      maxRetries: 0,
      modelId: 'google/gemini-3-pro-image-preview',
    })

    expect(pack.provider).toBe('nanoBanana')
    expect(pack.maps.find((m) => m.kind === 'depth')?.modelUsed).toBe('fallback-local')
    expect(spawnMock).toHaveBeenCalled()

    const hash = computeSourceHash(inputImageDataUrl)
    const packPath = path.join(testOutputDir, 'map_cache', hash, 'providers', 'nanoBanana', 'pack.json')
    expect(fs.existsSync(packPath)).toBe(true)
  })

  it('POST /api/maps/ensure writes provider pack.json with cost metadata', async () => {
    const inputImageDataUrl = makePngDataUrl(2, 2, () => [255, 255, 255, 255])
    const goodOutputDataUrl = makePngDataUrl(2, 2, (idx) => {
      const values = [0, 64, 128, 255]
      const v = values[idx % values.length]!
      return [v, v, v, 255]
    })

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'x-request-id': 'req_ok' }),
        text: async () =>
          JSON.stringify({
            id: 'resp_ok',
            choices: [
              {
                message: {
                  images: [{ image_url: { url: goodOutputDataUrl } }],
                },
              },
            ],
            usage: { total_cost: 0.1234 },
          }),
      }),
    )

    const { mapsRouter } = await import('./maps')

    const app = express()
    app.use(express.json({ limit: '25mb' }))
    app.use('/api/maps', mapsRouter)

    const response = await request(app).post('/api/maps/ensure').send({
      imageDataUrl: inputImageDataUrl,
      providerConfig: {
        provider: 'nanoBanana',
        allowFallback: true,
        maxRetries: 0,
        modelId: 'google/gemini-3-pro-image-preview',
      },
    })

    expect(response.status).toBe(200)
    expect(response.body.status).toBe('ready')
    expect(response.body.mapPack.provider).toBe('nanoBanana')
    expect(response.body.mapPack.generationMeta.cost).toBe(0.1234)

    const sourceHash = response.body.sourceHash as string
    const packPath = path.join(
      testOutputDir,
      'map_cache',
      sourceHash,
      'providers',
      'nanoBanana',
      'pack.json',
    )
    expect(fs.existsSync(packPath)).toBe(true)
    const raw = fs.readFileSync(packPath, 'utf8')
    const json = JSON.parse(raw) as unknown
    expect(json).toEqual(
      expect.objectContaining({
        provider: 'nanoBanana',
        generationMeta: expect.objectContaining({
          modelId: 'google/gemini-3-pro-image-preview',
          cost: 0.1234,
        }),
      }),
    )
  })
})
