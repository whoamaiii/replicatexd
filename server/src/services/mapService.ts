/**
 * Map Service for PsyVis Lab
 *
 * Handles generation, caching, and retrieval of structural maps (depth, edges, masks).
 * Maps are stored in the map_cache directory, indexed by the SHA-256 hash of the input image.
 */

import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { getEnv } from '../config/env'
import type {
  MapPack,
  MapSettings,
  MapKind,
  MapAsset,
  MapProvider,
  MapProviderConfig,
  MapGenerationMeta,
} from '../../../shared/types/maps'
import { DEFAULT_MAP_SETTINGS, DEFAULT_MAP_PROVIDER_CONFIG } from '../../../shared/types/maps'
import { callNanoBananaMap } from '../openrouter/nanoBananaClient'
import { buildNanoBananaMapPrompt } from '../openrouter/nanoBananaPrompts'
import {
  dataUrlToBuffer,
  getImageDimensionsFromDataUrl,
  resizeMapDataUrlToMatch,
  validateGeneratedMap,
} from './mapValidationService'

// ─────────────────────────────────────────────────────────────────────────────
// In-memory tracking for active processing
// ─────────────────────────────────────────────────────────────────────────────

const processingMap = new Map<string, Promise<MapPack>>()

// ─────────────────────────────────────────────────────────────────────────────
// Path Helpers
// ─────────────────────────────────────────────────────────────────────────────

function getMapCacheDir(): string {
  const { mapsCacheDir, libraryOutputDir } = getEnv()
  return path.resolve(libraryOutputDir, mapsCacheDir)
}

function getMapPackDir(sourceHash: string): string {
  return path.join(getMapCacheDir(), sourceHash)
}

function getProviderDir(sourceHash: string, provider: MapProvider): string {
  return path.join(getMapPackDir(sourceHash), 'providers', provider)
}

function getProviderPackPath(sourceHash: string, provider: MapProvider): string {
  return path.join(getProviderDir(sourceHash, provider), 'pack.json')
}

function getScriptsDir(): string {
  // This project runs the server as ESM (tsx/tsup), so `__dirname` is not
  // available. Resolve relative to the current module's path, but in a way
  // that survives bundling into `server/dist`.
  const modulePath = fileURLToPath(import.meta.url)
  const serverMarker = `${path.sep}server${path.sep}`
  const markerIndex = modulePath.lastIndexOf(serverMarker)

  const serverDir =
    markerIndex >= 0
      ? modulePath.slice(0, markerIndex + serverMarker.length - 1)
      : path.resolve(process.cwd(), 'server')

  return path.join(serverDir, 'scripts')
}

// ─────────────────────────────────────────────────────────────────────────────
// Hash Computation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Compute a stable hash from an image data URL.
 * Returns the first 16 characters of the SHA-256 hash.
 */
export function computeSourceHash(imageDataUrl: string): string {
  // Extract base64 data from data URL
  const base64Match = imageDataUrl.match(/^data:[^;]+;base64,(.+)$/)
  if (!base64Match) {
    throw new Error('Invalid image data URL format')
  }

  const base64Data = base64Match[1]
  const hash = crypto.createHash('sha256').update(base64Data).digest('hex')

  // Use first 16 characters for directory name (sufficient uniqueness)
  return hash.slice(0, 16)
}

// ─────────────────────────────────────────────────────────────────────────────
// Map Pack Retrieval
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get an existing map pack from the cache.
 * Returns null if not found.
 */
export function getMapPack(sourceHash: string, provider: MapProvider = 'local'): MapPack | null {
  const providerPackPath = getProviderPackPath(sourceHash, provider)
  const legacyPackPath = path.join(getMapPackDir(sourceHash), 'pack.json')

  const packPath =
    fs.existsSync(providerPackPath) ? providerPackPath : provider === 'local' ? legacyPackPath : ''

  if (!packPath || !fs.existsSync(packPath)) {
    return null
  }

  try {
    const raw = fs.readFileSync(packPath, 'utf8')
    const data = JSON.parse(raw) as Partial<MapPack>

    return {
      sourceHash,
      sourceWidth: data.sourceWidth || 0,
      sourceHeight: data.sourceHeight || 0,
      createdAt: data.createdAt || new Date().toISOString(),
      provider: (data.provider as MapProvider | undefined) ?? provider,
      generationMeta: data.generationMeta,
      maps: data.maps || [],
      inputFilename: data.inputFilename || 'input.png',
    }
  } catch {
    return null
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Map Settings
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get settings for a specific map pack, merged with defaults.
 */
export function getMapSettings(sourceHash: string): MapSettings {
  const settingsPath = path.join(getMapPackDir(sourceHash), 'settings.json')

  const defaults: MapSettings = {
    sourceHash,
    ...DEFAULT_MAP_SETTINGS,
    updatedAt: new Date().toISOString(),
  }

  if (!fs.existsSync(settingsPath)) {
    return defaults
  }

  try {
    const raw = fs.readFileSync(settingsPath, 'utf8')
    const data = JSON.parse(raw) as Partial<MapSettings>

    return {
      ...defaults,
      ...data,
      sourceHash,
    }
  } catch {
    return defaults
  }
}

/**
 * Save settings for a map pack.
 */
export function saveMapSettings(
  sourceHash: string,
  settings: Partial<Omit<MapSettings, 'sourceHash' | 'updatedAt'>>
): MapSettings {
  const dir = getMapPackDir(sourceHash)

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  const current = getMapSettings(sourceHash)
  const updated: MapSettings = {
    ...current,
    ...settings,
    sourceHash,
    updatedAt: new Date().toISOString(),
  }

  const settingsPath = path.join(dir, 'settings.json')
  fs.writeFileSync(settingsPath, JSON.stringify(updated, null, 2), 'utf8')

  return updated
}

// ─────────────────────────────────────────────────────────────────────────────
// Data URL Parsing
// ─────────────────────────────────────────────────────────────────────────────

function stripAnsi(input: string): string {
  // Matches common ANSI escape sequences (colors/styles).
  // eslint-disable-next-line no-control-regex
  return input.replace(new RegExp('\\x1b\\[[0-9;]*m', 'g'), '')
}

function parseDataUrl(dataUrl: string): { mimeType: string; buffer: Buffer } | null {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/)
  if (!match) return null

  return {
    mimeType: match[1],
    buffer: Buffer.from(match[2], 'base64'),
  }
}

function normalizeProviderConfig(
  providerConfig: Partial<MapProviderConfig> | undefined,
): MapProviderConfig {
  const merged: MapProviderConfig = {
    ...DEFAULT_MAP_PROVIDER_CONFIG,
    ...(providerConfig ?? {}),
  }

  const provider: MapProvider = merged.provider === 'nanoBanana' ? 'nanoBanana' : 'local'
  const modelId =
    typeof merged.modelId === 'string' && merged.modelId.trim().length > 0
      ? merged.modelId.trim()
      : DEFAULT_MAP_PROVIDER_CONFIG.modelId
  const maxRetries = Number.isFinite(merged.maxRetries)
    ? Math.max(0, Math.min(5, Math.floor(merged.maxRetries)))
    : DEFAULT_MAP_PROVIDER_CONFIG.maxRetries

  return {
    provider,
    allowFallback: merged.allowFallback ?? DEFAULT_MAP_PROVIDER_CONFIG.allowFallback,
    modelId,
    maxRetries,
  }
}

function safeErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  if (typeof err === 'string') return err
  return 'Unknown error'
}

// ─────────────────────────────────────────────────────────────────────────────
// Map Pack Generation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Ensure a map pack exists for the given image.
 * Returns from cache if available, otherwise generates.
 */
export async function ensureMapPack(
  imageDataUrl: string,
  providerConfig?: Partial<MapProviderConfig>,
): Promise<MapPack> {
  const env = getEnv()

  if (!env.mapsEnabled) {
    throw new Error('Map generation is disabled')
  }

  const config = normalizeProviderConfig(providerConfig)
  const sourceHash = computeSourceHash(imageDataUrl)
  const processingKey = `${sourceHash}:${config.provider}`

  // Check if already exists and has maps
  const existing = getMapPack(sourceHash, config.provider)
  if (existing && existing.maps.length > 0) {
    console.log(`[Maps] Cache hit for ${sourceHash} (${config.provider})`)
    return existing
  }

  // Check if already processing
  const inProgress = processingMap.get(processingKey)
  if (inProgress) {
    console.log(`[Maps] Waiting for in-progress generation: ${sourceHash} (${config.provider})`)
    return inProgress
  }

  // Start processing
  console.log(`[Maps] Starting generation for ${sourceHash} (${config.provider})`)
  const promise =
    config.provider === 'nanoBanana'
      ? generateMapPackViaNanoBanana(sourceHash, imageDataUrl, config)
      : generateMapPackViaWorker(sourceHash, imageDataUrl, getProviderDir(sourceHash, 'local'))

  processingMap.set(processingKey, promise)

  try {
    const result = await promise
    console.log(
      `[Maps] Generation complete for ${sourceHash} (${config.provider}): ${result.maps.length} maps`,
    )
    return result
  } finally {
    processingMap.delete(processingKey)
  }
}

/**
 * Generate maps by spawning the Python worker process.
 */
async function generateMapPackViaWorker(
  sourceHash: string,
  imageDataUrl: string,
  outputDir: string,
  overrides?: { onlyKinds?: MapKind[] },
): Promise<MapPack> {
  const env = getEnv()
  const dir = outputDir

  // Create directory
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  // Save input image
  const parsed = parseDataUrl(imageDataUrl)
  if (!parsed) {
    throw new Error('Invalid image data URL')
  }

  const ext = parsed.mimeType.split('/')[1]?.replace('jpeg', 'jpg') || 'png'
  const inputPath = path.join(dir, `input_original.${ext}`)
  fs.writeFileSync(inputPath, parsed.buffer)

  // Build map list based on config
  const mapTypes: string[] = []
  const onlyKinds = overrides?.onlyKinds
  const include = (kind: MapKind) => (!onlyKinds ? true : onlyKinds.includes(kind))

  if (env.mapsDepthEnabled && include('depth')) mapTypes.push('depth')
  if (env.mapsNormalsEnabled && include('normals')) mapTypes.push('normals')
  if (env.mapsEdgesEnabled && include('edges')) mapTypes.push('edges')
  if (env.mapsSegmentationEnabled && include('segmentation')) mapTypes.push('segmentation')
  if (env.mapsFaceMaskEnabled && include('faceMask')) mapTypes.push('faceMask')
  if (env.mapsHandsMaskEnabled && include('handsMask')) mapTypes.push('handsMask')

  if (mapTypes.length === 0) {
    throw new Error('No map types enabled in configuration')
  }

  // Calculate max dimension from megapixels
  const maxDimension = Math.round(Math.sqrt(env.mapsMaxImageMp * 1_000_000))

  // Spawn Python worker
  const scriptPath = path.join(getScriptsDir(), 'generate_maps.py')

  return new Promise((resolve, reject) => {
    const proc = spawn(env.mapsPythonPath, [
      scriptPath,
      '--input',
      inputPath,
      '--output-dir',
      dir,
      '--maps',
      mapTypes.join(','),
      '--max-dimension',
      String(maxDimension),
    ])

    let stdout = ''
    let stderr = ''

    proc.stdout.on('data', (data) => {
      stdout += data.toString()
    })

    proc.stderr.on('data', (data) => {
      stderr += data.toString()
      // Log stderr but don't include any base64 data (there shouldn't be any)
      const lines = stripAnsi(data.toString())
        .split('\n')
        .filter((l: string) => l.trim())
      for (const line of lines) {
        console.error(`[MapWorker] ${line}`)
      }
    })

    proc.on('close', (code) => {
      if (code !== 0) {
        const message = stripAnsi(stderr).trim().slice(0, 2000)
        reject(new Error(`Map generation failed with code ${code}: ${message}`))
        return
      }

      try {
        // Parse JSON output from worker (last line of stdout)
        const lines = stdout.trim().split('\n')
        const lastLine = lines[lines.length - 1]
        const result = JSON.parse(lastLine)

        if (result.error) {
          reject(new Error(result.error))
          return
        }

        // Build MapPack
        const createdAt = new Date().toISOString()
        const generationMeta: MapGenerationMeta = {
          provider: 'local',
          modelId: 'local-worker',
          createdAt,
        }

        const pack: MapPack = {
          sourceHash,
          sourceWidth: result.sourceWidth,
          sourceHeight: result.sourceHeight,
          createdAt,
          provider: 'local',
          generationMeta,
          maps: result.maps as MapAsset[],
          inputFilename: result.inputFilename,
        }

        // Save pack.json
        const packPath = path.join(dir, 'pack.json')
        fs.writeFileSync(packPath, JSON.stringify(pack, null, 2), 'utf8')

        resolve(pack)
      } catch (e) {
        reject(new Error(`Failed to parse worker output: ${e}`))
      }
    })

    proc.on('error', (err) => {
      reject(new Error(`Failed to spawn Python worker: ${err.message}`))
    })
  })
}

async function generateMapPackViaNanoBanana(
  sourceHash: string,
  imageDataUrl: string,
  config: MapProviderConfig,
): Promise<MapPack> {
  const env = getEnv()
  const dir = getProviderDir(sourceHash, 'nanoBanana')

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  const inputInfo = getImageDimensionsFromDataUrl(imageDataUrl)
  const createdAt = new Date().toISOString()

  const mapKinds: MapKind[] = []
  if (env.mapsDepthEnabled) mapKinds.push('depth')
  if (env.mapsNormalsEnabled) mapKinds.push('normals')
  if (env.mapsEdgesEnabled) mapKinds.push('edges')
  if (env.mapsSegmentationEnabled) mapKinds.push('segmentation')
  if (env.mapsFaceMaskEnabled) mapKinds.push('faceMask')
  if (env.mapsHandsMaskEnabled) mapKinds.push('handsMask')

  if (mapKinds.length === 0) {
    throw new Error('No map types enabled in configuration')
  }

  // Save input image (for cache/debug)
  const inputParsed = dataUrlToBuffer(imageDataUrl)
  const inputExt = inputParsed.mimeType.split('/')[1]?.replace('jpeg', 'jpg') || 'png'
  const inputFilename = `input_original.${inputExt}`
  fs.writeFileSync(path.join(dir, inputFilename), inputParsed.buffer)

  const attempts: NonNullable<MapGenerationMeta['attempts']> = []
  const maps: MapAsset[] = []
  const usageByKind: Record<string, unknown[]> = {}

  let totalCost = 0
  let requestId: string | undefined
  const fallbackKinds: MapKind[] = []

  for (const kind of mapKinds) {
    const promptText = buildNanoBananaMapPrompt(kind, {
      targetWidth: inputInfo.width,
      targetHeight: inputInfo.height,
    })
    const totalAttempts = 1 + Math.max(0, config.maxRetries)

    let ok = false
    let lastError: string | undefined

    for (let attempt = 0; attempt < totalAttempts; attempt += 1) {
      try {
        const res = await callNanoBananaMap({
          modelId: config.modelId,
          promptText,
          inputImageDataUrl: imageDataUrl,
        })

        if (typeof res.cost === 'number' && Number.isFinite(res.cost)) {
          totalCost += res.cost
        }
        if (res.requestId) requestId = res.requestId
        if (res.usage !== undefined) {
          usageByKind[kind] ||= []
          usageByKind[kind]!.push(res.usage)
        }

        const validation = validateGeneratedMap({
          kind,
          mapDataUrl: res.outputImageDataUrl,
          expectedWidth: inputInfo.width,
          expectedHeight: inputInfo.height,
        })

        let finalDataUrl = res.outputImageDataUrl
        if (!validation.ok) {
          // Some models ignore exact pixel dimensions but preserve aspect ratio.
          // If the aspect ratio is close, we can safely resize and re-validate.
          if (validation.code === 'dimension_mismatch' && validation.width && validation.height) {
            const inputAspect = inputInfo.width / inputInfo.height
            const outAspect = validation.width / validation.height
            const aspectDelta = Math.abs(inputAspect - outAspect) / Math.max(1e-6, inputAspect)

            if (aspectDelta <= 0.03) {
              const mode =
                kind === 'segmentation' || kind === 'faceMask' || kind === 'handsMask' || kind === 'edges'
                  ? 'nearest'
                  : 'bilinear'
              finalDataUrl = resizeMapDataUrlToMatch({
                mapDataUrl: res.outputImageDataUrl,
                targetWidth: inputInfo.width,
                targetHeight: inputInfo.height,
                mode,
              })

              const postResize = validateGeneratedMap({
                kind,
                mapDataUrl: finalDataUrl,
                expectedWidth: inputInfo.width,
                expectedHeight: inputInfo.height,
              })
              if (!postResize.ok) {
                lastError = postResize.reason || 'Validation failed'
                attempts.push({
                  kind,
                  provider: 'nanoBanana',
                  ok: false,
                  error: lastError,
                })
                continue
              }
            } else {
              lastError = validation.reason || 'Validation failed'
              attempts.push({
                kind,
                provider: 'nanoBanana',
                ok: false,
                error: lastError,
              })
              continue
            }
          } else {
            lastError = validation.reason || 'Validation failed'
            attempts.push({
              kind,
              provider: 'nanoBanana',
              ok: false,
              error: lastError,
            })
            continue
          }
        }

        const { mimeType, buffer } = dataUrlToBuffer(finalDataUrl)
        const ext = mimeType.split('/')[1]?.replace('jpeg', 'jpg') || 'png'
        const filename = `${kind}.${ext}`
        fs.writeFileSync(path.join(dir, filename), buffer)

        maps.push({
          kind,
          filename,
          width: inputInfo.width,
          height: inputInfo.height,
          generatedAt: new Date().toISOString(),
          modelUsed: config.modelId,
        })

        attempts.push({
          kind,
          provider: 'nanoBanana',
          ok: true,
        })
        ok = true
        break
      } catch (err) {
        lastError = safeErrorMessage(err)
        attempts.push({
          kind,
          provider: 'nanoBanana',
          ok: false,
          error: lastError,
        })
      }
    }

    if (!ok) {
      if (config.allowFallback) {
        fallbackKinds.push(kind)
      } else {
        throw new Error(
          `Nano Banana failed to generate ${kind}${lastError ? `: ${lastError}` : ''}`,
        )
      }
    }
  }

  if (fallbackKinds.length > 0) {
    const fallbackDir = path.join(dir, '_fallback_local')
    const fallbackPack = await generateMapPackViaWorker(sourceHash, imageDataUrl, fallbackDir, {
      onlyKinds: fallbackKinds,
    })

    for (const kind of fallbackKinds) {
      const map = fallbackPack.maps.find((m) => m.kind === kind)
      if (!map) {
        attempts.push({
          kind,
          provider: 'local',
          ok: false,
          error: 'Local fallback did not produce expected map',
          usedFallback: true,
        })
        continue
      }

      const srcPath = path.join(fallbackDir, map.filename)
      const dstPath = path.join(dir, map.filename)
      if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, dstPath)
      }

      const existingIdx = maps.findIndex((m) => m.kind === kind)
      const asset: MapAsset = {
        ...map,
        generatedAt: new Date().toISOString(),
        modelUsed: 'fallback-local',
      }
      if (existingIdx >= 0) maps[existingIdx] = asset
      else maps.push(asset)

      attempts.push({
        kind,
        provider: 'local',
        ok: true,
        usedFallback: true,
      })
    }

    try {
      fs.rmSync(fallbackDir, { recursive: true, force: true })
    } catch {
      // ignore
    }
  }

  const generationMeta: MapGenerationMeta = {
    provider: 'nanoBanana',
    modelId: config.modelId,
    createdAt,
    usage: { byKind: usageByKind },
    cost: Number.isFinite(totalCost) ? totalCost : undefined,
    requestId,
    attempts,
  }

  const pack: MapPack = {
    sourceHash,
    sourceWidth: inputInfo.width,
    sourceHeight: inputInfo.height,
    createdAt,
    provider: 'nanoBanana',
    generationMeta,
    maps,
    inputFilename,
  }

  fs.writeFileSync(path.join(dir, 'pack.json'), JSON.stringify(pack, null, 2), 'utf8')
  return pack
}

// ─────────────────────────────────────────────────────────────────────────────
// File Access
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get the file path for a specific map.
 * Returns null if the map doesn't exist.
 */
export function getMapFilePath(sourceHash: string, kind: MapKind): string | null {
  const pack = getMapPack(sourceHash, 'local')
  if (!pack) return null

  const map = pack.maps.find((m) => m.kind === kind)
  if (!map) return null

  const providerCandidate = path.join(getProviderDir(sourceHash, 'local'), map.filename)
  if (fs.existsSync(providerCandidate)) return providerCandidate

  const legacyCandidate = path.join(getMapPackDir(sourceHash), map.filename)
  return fs.existsSync(legacyCandidate) ? legacyCandidate : null
}

export function getMapFilePathForProvider(
  sourceHash: string,
  provider: MapProvider,
  kind: MapKind,
): string | null {
  const pack = getMapPack(sourceHash, provider)
  if (!pack) return null

  const map = pack.maps.find((m) => m.kind === kind)
  if (!map) return null

  const providerCandidate = path.join(getProviderDir(sourceHash, provider), map.filename)
  if (fs.existsSync(providerCandidate)) return providerCandidate

  const legacyCandidate = path.join(getMapPackDir(sourceHash), map.filename)
  return fs.existsSync(legacyCandidate) ? legacyCandidate : null
}

export function listMapProviders(sourceHash: string): MapProvider[] {
  const providers: MapProvider[] = []

  const legacyLocalPath = path.join(getMapPackDir(sourceHash), 'pack.json')
  const localProviderPath = getProviderPackPath(sourceHash, 'local')
  const nanoProviderPath = getProviderPackPath(sourceHash, 'nanoBanana')

  if (fs.existsSync(localProviderPath) || fs.existsSync(legacyLocalPath)) providers.push('local')
  if (fs.existsSync(nanoProviderPath)) providers.push('nanoBanana')

  return providers
}

/**
 * Get a map as a data URL.
 * Useful for returning maps to the frontend.
 */
export function getMapAsDataUrl(sourceHash: string, kind: MapKind): string | null {
  const filePath = getMapFilePath(sourceHash, kind)
  if (!filePath) return null

  const buffer = fs.readFileSync(filePath)
  const base64 = buffer.toString('base64')
  const ext = path.extname(filePath).toLowerCase()
  const mimeType =
    ext === '.jpg' || ext === '.jpeg'
      ? 'image/jpeg'
      : ext === '.webp'
        ? 'image/webp'
        : 'image/png'
  return `data:${mimeType};base64,${base64}`
}

/**
 * Get the first available map pack, preferring local, then nanoBanana.
 */
export function getAnyMapPack(sourceHash: string): MapPack | null {
  const providers: MapProvider[] = ['local', 'nanoBanana']
  for (const provider of providers) {
    const pack = getMapPack(sourceHash, provider)
    if (pack) return pack
  }

  // Final fallback: check any provider folder that exists
  const discovered = listMapProviders(sourceHash)
  for (const provider of discovered) {
    const pack = getMapPack(sourceHash, provider)
    if (pack) return pack
  }

  return null
}

// ─────────────────────────────────────────────────────────────────────────────
// Control Summary for Prompt Enhancement
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build a text summary of enabled controls to append to generation prompts.
 * This provides structural guidance to the generation model via text.
 */
export function buildControlSummary(settings: MapSettings): string {
  const parts: string[] = []

  if (settings.surfaceLockEnabled && settings.surfaceLockStrength > 0) {
    parts.push(
      `Preserve surface structure and depth relationships (strength: ${Math.round(settings.surfaceLockStrength * 100)}%).`
    )
  }

  if (settings.depthEnabled && settings.depthWeight > 0) {
    parts.push(
      `Maintain depth layering and perspective (weight: ${Math.round(settings.depthWeight * 100)}%).`
    )
  }

  if (settings.edgesEnabled && settings.edgesWeight > 0) {
    parts.push(
      `Preserve major edges and compositional lines (weight: ${Math.round(settings.edgesWeight * 100)}%).`
    )
  }

  if (settings.faceProtectionEnabled && settings.faceProtectionStrength > 0) {
    parts.push(
      `Keep faces recognizable and undistorted. No extra eyes on faces. (protection: ${Math.round(settings.faceProtectionStrength * 100)}%).`
    )
  }

  if (settings.handsProtectionEnabled && settings.handsProtectionStrength > 0) {
    parts.push(
      `Preserve hand structure and finger count. (protection: ${Math.round(settings.handsProtectionStrength * 100)}%).`
    )
  }

  return parts.length > 0
    ? '\n\nStructural guidance:\n' + parts.map((p) => `- ${p}`).join('\n')
    : ''
}
