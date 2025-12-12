/**
 * Effect Router Types
 *
 * Defines types for routing psychedelic effects to specific image regions
 * and depth bands using MapPack structural data.
 */

import type { VisualEffectGroup } from './effects'

// ─────────────────────────────────────────────────────────────────────────────
// Routing Primitives
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Regions where effects can be applied or protected.
 * Maps to segmentation and mask data from MapPack.
 */
export const RouterRegions = ['face', 'hands', 'subject', 'background', 'global'] as const
export type RouterRegion = (typeof RouterRegions)[number]

/**
 * Depth bands for layered effect application.
 * Derived from depth map when available.
 */
export const DepthBands = ['near', 'mid', 'far'] as const
export type DepthBand = (typeof DepthBands)[number]

// ─────────────────────────────────────────────────────────────────────────────
// Effect Routing Rules
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Per-effect routing override.
 * Allows fine-grained control over where specific effects appear.
 */
export type EffectRoutingRule = {
  effectId: string
  regions: RouterRegion[]
  depthBands: DepthBand[]
  strength: number // 0.0 to 1.0, multiplier for this effect
  protectEdges: boolean
}

/**
 * Group-level multipliers for batch adjustments.
 * Applied before per-effect rules.
 */
export type GroupMultipliers = {
  [K in VisualEffectGroup]: number
}

// ─────────────────────────────────────────────────────────────────────────────
// Router Settings
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Complete router configuration.
 * All fields are optional for backward compatibility.
 */
export type RouterSettings = {
  // Global toggle
  enabled: boolean

  // Default routing for effects without explicit rules
  defaultRegions: RouterRegion[]
  defaultDepthBands: DepthBand[]

  // Protection settings
  protectFace: boolean
  protectHands: boolean
  protectEdges: boolean

  // Surface lock (ensures effects embed in surfaces)
  surfaceLockStrength: number // 0.0 to 1.0

  // Group-level intensity multipliers
  groupMultipliers: GroupMultipliers

  // Per-effect override rules
  rules: EffectRoutingRule[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Defaults
// ─────────────────────────────────────────────────────────────────────────────

export const DEFAULT_GROUP_MULTIPLIERS: GroupMultipliers = {
  enhancements: 1.0,
  distortions: 1.0,
  geometry: 1.0,
  hallucinations: 1.0,
  perceptual: 1.0,
}

export const DEFAULT_ROUTER_SETTINGS: RouterSettings = {
  enabled: true,
  defaultRegions: ['subject', 'background'],
  defaultDepthBands: ['near', 'mid', 'far'],
  protectFace: true,
  protectHands: true,
  protectEdges: true,
  surfaceLockStrength: 0.6,
  groupMultipliers: { ...DEFAULT_GROUP_MULTIPLIERS },
  rules: [],
}

// ─────────────────────────────────────────────────────────────────────────────
// Placement Plan Output
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Human-readable placement plan for inclusion in prompts.
 * Generated from RouterSettings + available maps.
 */
export type PlacementPlan = {
  lines: string[]
  summary: string
  availableMaps: string[]
}
