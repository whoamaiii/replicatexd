/**
 * Map types for structural guidance in PsyVis Lab
 *
 * MapPack: A set of derived images (depth, edges, masks) tied to an input image hash.
 * MapSettings: User-configurable weights and toggles for how maps influence generation.
 */

// Available map types
export const MapKinds = [
  'depth',
  'normals',
  'edges',
  'segmentation',
  'faceMask',
  'handsMask',
] as const

export type MapKind = (typeof MapKinds)[number]

// ─────────────────────────────────────────────────────────────────────────────
// Map Providers
// ─────────────────────────────────────────────────────────────────────────────

export type MapProvider = 'local' | 'nanoBanana'

export type MapProviderConfig = {
  provider: MapProvider
  allowFallback: boolean
  modelId: string
  maxRetries: number
}

export const DEFAULT_MAP_PROVIDER_CONFIG: MapProviderConfig = {
  provider: 'local',
  allowFallback: true,
  modelId: '',
  maxRetries: 1,
}

export type MapGenerationMeta = {
  provider: MapProvider
  modelId: string
  createdAt: string
  usage?: unknown
  cost?: number
  requestId?: string
  attempts?: Array<{
    kind: MapKind
    provider: MapProvider
    ok: boolean
    error?: string
    usedFallback?: boolean
  }>
}

/**
 * A single map asset within a MapPack
 */
export type MapAsset = {
  kind: MapKind
  filename: string
  width: number
  height: number
  generatedAt: string
  modelUsed?: string
}

/**
 * A complete set of structural maps for a source image
 */
export type MapPack = {
  sourceHash: string
  sourceWidth: number
  sourceHeight: number
  createdAt: string
  provider?: MapProvider
  generationMeta?: MapGenerationMeta
  maps: MapAsset[]
  inputFilename: string
}

/**
 * User-configurable settings for map influence on generation
 */
export type MapSettings = {
  sourceHash: string

  // Depth map: preserves spatial layering and perspective
  depthEnabled: boolean
  depthWeight: number // 0.0 to 1.0

  // Normal map: preserves surface curvature and lighting
  normalsEnabled: boolean
  normalsWeight: number

  // Edge map: preserves composition and structural lines
  edgesEnabled: boolean
  edgesWeight: number

  // Segmentation: object-aware boundaries
  segmentationEnabled: boolean
  segmentationWeight: number

  // Face protection: prevents identity drift
  faceProtectionEnabled: boolean
  faceProtectionStrength: number // 0.0 to 1.0

  // Hands protection: preserves hand anatomy
  handsProtectionEnabled: boolean
  handsProtectionStrength: number

  // Surface lock: overall structural adherence
  surfaceLockEnabled: boolean
  surfaceLockStrength: number

  updatedAt: string
}

/**
 * Default settings optimized for psychedelic replication
 */
export const DEFAULT_MAP_SETTINGS: Omit<MapSettings, 'sourceHash' | 'updatedAt'> = {
  // Depth: Strong guidance for spatial coherence
  depthEnabled: true,
  depthWeight: 0.7,

  // Normals: Off by default (derived from depth)
  normalsEnabled: false,
  normalsWeight: 0.5,

  // Edges: Moderate guidance for composition
  edgesEnabled: true,
  edgesWeight: 0.5,

  // Segmentation: Off by default (slower)
  segmentationEnabled: false,
  segmentationWeight: 0.5,

  // Face protection: On for portraits
  faceProtectionEnabled: true,
  faceProtectionStrength: 0.8,

  // Hands protection: On by default
  handsProtectionEnabled: true,
  handsProtectionStrength: 0.6,

  // Surface lock: Ensures effects embed in surfaces
  surfaceLockEnabled: true,
  surfaceLockStrength: 0.6,
}

// ─────────────────────────────────────────────────────────────────────────────
// API Request/Response Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/maps/ensure - Ensure maps exist for an image
 */
export type EnsureMapsRequest = {
  imageDataUrl: string
  providerConfig?: Partial<MapProviderConfig>
}

export type EnsureMapsResponse = {
  sourceHash: string
  status: 'ready' | 'processing' | 'error'
  mapPack?: MapPack
  error?: string
}

/**
 * GET /api/maps/:sourceHash - Get existing map pack and settings
 */
export type GetMapsResponse = {
  mapPack: MapPack
  settings: MapSettings
}

/**
 * POST /api/maps/settings - Update map settings
 */
export type UpdateMapSettingsRequest = {
  sourceHash: string
  settings: Partial<Omit<MapSettings, 'sourceHash' | 'updatedAt'>>
}

/**
 * Generation mode for how input image is used
 */
export type GenerationMode = 'prompt_only' | 'base_image_edit'
