/**
 * Frontend router types for PsyVis Lab
 *
 * Re-exports shared types and adds frontend-specific utilities.
 */

// Re-export all shared types
export type {
  RouterRegion,
  DepthBand,
  EffectRoutingRule,
  GroupMultipliers,
  RouterSettings,
  PlacementPlan,
} from '../../shared/types/router'

export {
  RouterRegions,
  DepthBands,
  DEFAULT_GROUP_MULTIPLIERS,
  DEFAULT_ROUTER_SETTINGS,
} from '../../shared/types/router'

// Import types needed for utilities
import type { RouterRegion, DepthBand } from '../../shared/types/router'

/**
 * Human-readable labels for router regions.
 */
export function getRegionLabel(region: RouterRegion): string {
  const labels: Record<RouterRegion, string> = {
    face: 'Face',
    hands: 'Hands',
    subject: 'Subject',
    background: 'Background',
    global: 'Global',
  }
  return labels[region]
}

/**
 * Human-readable labels for depth bands.
 */
export function getDepthBandLabel(band: DepthBand): string {
  const labels: Record<DepthBand, string> = {
    near: 'Near',
    mid: 'Mid',
    far: 'Far',
  }
  return labels[band]
}

/**
 * Icons/descriptions for router regions.
 */
export function getRegionDescription(region: RouterRegion): string {
  const descriptions: Record<RouterRegion, string> = {
    face: 'Facial features and identity',
    hands: 'Hands and finger anatomy',
    subject: 'Main subject/foreground',
    background: 'Background areas',
    global: 'Entire image uniformly',
  }
  return descriptions[region]
}

/**
 * Descriptions for depth bands.
 */
export function getDepthBandDescription(band: DepthBand): string {
  const descriptions: Record<DepthBand, string> = {
    near: 'Close to camera',
    mid: 'Medium distance',
    far: 'Background/distant',
  }
  return descriptions[band]
}
