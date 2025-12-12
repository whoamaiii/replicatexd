/**
 * Maps API Routes for PsyVis Lab
 *
 * Endpoints for generating, retrieving, and configuring structural maps.
 * These routes are additive - they do not modify existing analyze/generate endpoints.
 */

import { Router } from 'express'
import { z } from 'zod'
import path from 'node:path'
import {
  computeSourceHash,
  ensureMapPack,
  getAnyMapPack,
  getMapSettings,
  saveMapSettings,
  getMapFilePath,
  getMapFilePathForProvider,
  listMapProviders,
} from '../services/mapService'
import type {
  EnsureMapsResponse,
  GetMapsResponse,
  MapKind,
  MapProvider,
  MapProviderConfig,
} from '../../../shared/types/maps'
import { MapKinds } from '../../../shared/types/maps'

// ─────────────────────────────────────────────────────────────────────────────
// Request Validation Schemas
// ─────────────────────────────────────────────────────────────────────────────

const EnsureMapsRequestSchema = z.object({
  imageDataUrl: z
    .string()
    .min(1)
    .refine((v) => v.startsWith('data:image/'), 'imageDataUrl must be a data URL'),
  providerConfig: z
    .object({
      provider: z.enum(['local', 'nanoBanana']).optional(),
      allowFallback: z.boolean().optional(),
      modelId: z.string().min(1).optional(),
      maxRetries: z.number().min(0).max(5).optional(),
    })
    .optional(),
})

const UpdateMapSettingsRequestSchema = z.object({
  sourceHash: z.string().min(1),
  settings: z.object({
    depthEnabled: z.boolean().optional(),
    depthWeight: z.number().min(0).max(1).optional(),
    normalsEnabled: z.boolean().optional(),
    normalsWeight: z.number().min(0).max(1).optional(),
    edgesEnabled: z.boolean().optional(),
    edgesWeight: z.number().min(0).max(1).optional(),
    segmentationEnabled: z.boolean().optional(),
    segmentationWeight: z.number().min(0).max(1).optional(),
    faceProtectionEnabled: z.boolean().optional(),
    faceProtectionStrength: z.number().min(0).max(1).optional(),
    handsProtectionEnabled: z.boolean().optional(),
    handsProtectionStrength: z.number().min(0).max(1).optional(),
    surfaceLockEnabled: z.boolean().optional(),
    surfaceLockStrength: z.number().min(0).max(1).optional(),
  }),
})

// ─────────────────────────────────────────────────────────────────────────────
// Router
// ─────────────────────────────────────────────────────────────────────────────

export const mapsRouter = Router()

/**
 * POST /api/maps/ensure
 *
 * Ensure maps exist for the given image.
 * Generates maps if not already cached.
 *
 * Request body: { imageDataUrl: string }
 * Response: EnsureMapsResponse
 */
mapsRouter.post('/ensure', async (req, res) => {
  try {
    const parsed = EnsureMapsRequestSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ message: 'Invalid request: imageDataUrl is required' })
      return
    }

    const sourceHash = computeSourceHash(parsed.data.imageDataUrl)

    try {
      const mapPack = await ensureMapPack(
        parsed.data.imageDataUrl,
        parsed.data.providerConfig as Partial<MapProviderConfig> | undefined,
      )

      const response: EnsureMapsResponse = {
        sourceHash,
        status: 'ready',
        mapPack,
      }

      res.json(response)
    } catch (err) {
      console.error('[Maps] Error ensuring maps:', err instanceof Error ? err.message : 'Unknown')

      const response: EnsureMapsResponse = {
        sourceHash,
        status: 'error',
        error: err instanceof Error ? err.message : 'Unknown error',
      }
      res.json(response)
    }
  } catch (err) {
    console.error('[Maps] Error in ensure endpoint:', err)
    res.status(500).json({ message: 'Failed to process request' })
  }
})

/**
 * GET /api/maps/:sourceHash
 *
 * Get an existing map pack and its settings.
 *
 * Response: GetMapsResponse
 */
mapsRouter.get('/:sourceHash', async (req, res) => {
  try {
    const { sourceHash } = req.params
    const mapPack = getAnyMapPack(sourceHash)

    if (!mapPack) {
      res.status(404).json({ message: 'Map pack not found' })
      return
    }

    const settings = getMapSettings(sourceHash)

    const response: GetMapsResponse = {
      mapPack,
      settings,
    }

    res.json(response)
  } catch (err) {
    console.error('[Maps] Error getting maps:', err)
    res.status(500).json({ message: 'Failed to get maps' })
  }
})

/**
 * POST /api/maps/settings
 *
 * Update settings for a map pack.
 *
 * Request body: { sourceHash: string, settings: Partial<MapSettings> }
 * Response: MapSettings
 */
mapsRouter.post('/settings', async (req, res) => {
  try {
    const parsed = UpdateMapSettingsRequestSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ message: 'Invalid request' })
      return
    }

    const settings = saveMapSettings(parsed.data.sourceHash, parsed.data.settings)

    res.json(settings)
  } catch (err) {
    console.error('[Maps] Error updating settings:', err)
    res.status(500).json({ message: 'Failed to update settings' })
  }
})

/**
 * GET /api/maps/:sourceHash/file/:mapKind
 *
 * Serve a map file directly.
 *
 * Response: image/png file
 */
mapsRouter.get('/:sourceHash/file/:mapKind', async (req, res) => {
  try {
    const { sourceHash, mapKind } = req.params

    // Validate mapKind
    if (!MapKinds.includes(mapKind as MapKind)) {
      res.status(400).json({ message: 'Invalid map kind' })
      return
    }

    const filePath = getMapFilePath(sourceHash, mapKind as MapKind)

    if (!filePath) {
      res.status(404).json({ message: 'Map file not found' })
      return
    }

    const ext = path.extname(filePath).toLowerCase()
    const contentType =
      ext === '.jpg' || ext === '.jpeg'
        ? 'image/jpeg'
        : ext === '.webp'
          ? 'image/webp'
          : 'image/png'
    res.setHeader('Content-Type', contentType)
    res.setHeader('Cache-Control', 'public, max-age=86400') // Cache for 24h
    res.sendFile(path.resolve(filePath))
  } catch (err) {
    console.error('[Maps] Error serving file:', err)
    res.status(500).json({ message: 'Failed to serve file' })
  }
})

/**
 * GET /api/maps/:sourceHash/providers
 *
 * List providers that have cached packs for this sourceHash.
 */
mapsRouter.get('/:sourceHash/providers', async (req, res) => {
  try {
    const { sourceHash } = req.params
    const providers = listMapProviders(sourceHash)
    res.json({ sourceHash, providers })
  } catch (err) {
    console.error('[Maps] Error listing providers:', err)
    res.status(500).json({ message: 'Failed to list providers' })
  }
})

/**
 * GET /api/maps/:sourceHash/:provider/file/:mapKind
 *
 * Serve a map file for a specific provider.
 */
mapsRouter.get('/:sourceHash/:provider/file/:mapKind', async (req, res) => {
  try {
    const { sourceHash, provider, mapKind } = req.params

    if (!MapKinds.includes(mapKind as MapKind)) {
      res.status(400).json({ message: 'Invalid map kind' })
      return
    }
    if (provider !== 'local' && provider !== 'nanoBanana') {
      res.status(400).json({ message: 'Invalid provider' })
      return
    }

    const filePath = getMapFilePathForProvider(sourceHash, provider as MapProvider, mapKind as MapKind)
    if (!filePath) {
      res.status(404).json({ message: 'Map file not found' })
      return
    }

    const ext = path.extname(filePath).toLowerCase()
    const contentType =
      ext === '.jpg' || ext === '.jpeg'
        ? 'image/jpeg'
        : ext === '.webp'
          ? 'image/webp'
          : 'image/png'
    res.setHeader('Content-Type', contentType)
    res.setHeader('Cache-Control', 'public, max-age=86400')
    res.sendFile(path.resolve(filePath))
  } catch (err) {
    console.error('[Maps] Error serving provider file:', err)
    res.status(500).json({ message: 'Failed to serve file' })
  }
})
