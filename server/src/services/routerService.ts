/**
 * Router Service
 *
 * Builds placement plans from router settings and available maps.
 * Generates human-readable instructions for the generation prompt.
 */

import type { MapPack } from '../../../shared/types/maps'
import type { RouterSettings, PlacementPlan, GroupMultipliers } from '../../../shared/types/router'
import type { PsychedelicEffect } from '../../../shared/types/analysis'
import type { VisualEffectGroup } from '../../../shared/types/effects'
import { DEFAULT_ROUTER_SETTINGS, DEFAULT_GROUP_MULTIPLIERS } from '../../../shared/types/router'

/**
 * Merge user settings with defaults, handling missing fields gracefully.
 */
export function resolveRouterSettings(userSettings?: Partial<RouterSettings>): RouterSettings {
  if (!userSettings) return { ...DEFAULT_ROUTER_SETTINGS }

  return {
    enabled: userSettings.enabled ?? DEFAULT_ROUTER_SETTINGS.enabled,
    defaultRegions: userSettings.defaultRegions ?? DEFAULT_ROUTER_SETTINGS.defaultRegions,
    defaultDepthBands: userSettings.defaultDepthBands ?? DEFAULT_ROUTER_SETTINGS.defaultDepthBands,
    protectFace: userSettings.protectFace ?? DEFAULT_ROUTER_SETTINGS.protectFace,
    protectHands: userSettings.protectHands ?? DEFAULT_ROUTER_SETTINGS.protectHands,
    protectEdges: userSettings.protectEdges ?? DEFAULT_ROUTER_SETTINGS.protectEdges,
    surfaceLockStrength:
      userSettings.surfaceLockStrength ?? DEFAULT_ROUTER_SETTINGS.surfaceLockStrength,
    groupMultipliers: {
      ...DEFAULT_GROUP_MULTIPLIERS,
      ...userSettings.groupMultipliers,
    },
    rules: userSettings.rules ?? [],
  }
}

/**
 * Determine which maps are available from the MapPack.
 */
export function getAvailableMaps(mapPack?: MapPack): Set<string> {
  if (!mapPack) return new Set()
  return new Set(mapPack.maps.map((m) => m.kind))
}

/**
 * Build a placement plan from router settings and available maps.
 * Returns human-readable instructions for the generation prompt.
 */
export function buildPlacementPlan(
  settings: RouterSettings,
  effects: PsychedelicEffect[],
  mapPack?: MapPack,
): PlacementPlan {
  const lines: string[] = []
  const availableMaps = getAvailableMaps(mapPack)

  if (!settings.enabled) {
    return {
      lines: [],
      summary: '',
      availableMaps: Array.from(availableMaps),
    }
  }

  // Surface lock instruction (always applicable)
  if (settings.surfaceLockStrength > 0) {
    const strength = Math.round(settings.surfaceLockStrength * 100)
    lines.push(
      `Apply all effects as surface-embedded textures and materials (${strength}% adherence). ` +
        `Do not create floating geometry or overlay planes.`,
    )
  }

  // Protection instructions based on available masks
  if (settings.protectFace && availableMaps.has('faceMask')) {
    lines.push(
      'Do not modify face regions. Keep facial features, identity, and expression stable. ' +
        'No extra eyes, distorted features, or pattern intrusion on faces.',
    )
  } else if (settings.protectFace) {
    // Fallback without mask
    lines.push(
      'Preserve facial identity and features. Avoid distorting faces or adding patterns to them.',
    )
  }

  if (settings.protectHands && availableMaps.has('handsMask')) {
    lines.push('Preserve hand anatomy and finger count. Keep hands structurally intact.')
  } else if (settings.protectHands) {
    lines.push('Maintain natural hand structure. Avoid distorting hands or adding extra fingers.')
  }

  // Edge preservation
  if (settings.protectEdges && availableMaps.has('edges')) {
    lines.push('Respect major edges and silhouettes. Keep compositional boundaries stable.')
  }

  // Depth-based routing instructions
  if (availableMaps.has('depth')) {
    const depthInstructions = buildDepthInstructions(settings, effects)
    lines.push(...depthInstructions)
  }

  // Region-based routing instructions
  if (availableMaps.has('segmentation') || availableMaps.has('faceMask')) {
    const regionInstructions = buildRegionInstructions(settings)
    lines.push(...regionInstructions)
  }

  // Group multiplier instructions
  const groupInstructions = buildGroupMultiplierInstructions(settings.groupMultipliers)
  lines.push(...groupInstructions)

  // Per-effect override instructions
  const effectOverrides = buildEffectOverrideInstructions(settings.rules)
  lines.push(...effectOverrides)

  const summary =
    lines.length > 0 ? '\n\nEffect Routing:\n' + lines.map((l) => `- ${l}`).join('\n') : ''

  return {
    lines,
    summary,
    availableMaps: Array.from(availableMaps),
  }
}

function buildDepthInstructions(
  settings: RouterSettings,
  effects: PsychedelicEffect[],
): string[] {
  const lines: string[] = []
  const bands = settings.defaultDepthBands

  // Group effects by their dominant depth preference
  const geometryEffects = effects.filter((e) => e.group === 'geometry')
  const distortionEffects = effects.filter((e) => e.group === 'distortions')
  const hallucinationEffects = effects.filter((e) => e.group === 'hallucinations')

  // Geometry tends to work best on mid-far for surface embedding
  if (geometryEffects.length > 0 && bands.includes('mid')) {
    lines.push(
      'Apply geometric patterns primarily to mid and far depth layers where surfaces are more stable.',
    )
  }

  // Distortions can span all depths but need anchoring
  if (distortionEffects.length > 0) {
    lines.push(
      'Apply distortions with depth-coherent warping. Near objects should distort more subtly than background.',
    )
  }

  // Hallucinations in background tend to be safer
  if (hallucinationEffects.length > 0 && bands.includes('far')) {
    lines.push(
      'If adding hallucinatory elements, prefer background and peripheral regions over foreground subjects.',
    )
  }

  // If specific depth bands are excluded, mention that
  if (bands.length > 0 && bands.length < 3) {
    const bandNames = bands.join(', ')
    lines.push(`Concentrate effects in the ${bandNames} depth band${bands.length > 1 ? 's' : ''}.`)
  }

  return lines
}

function buildRegionInstructions(settings: RouterSettings): string[] {
  const lines: string[] = []
  const regions = settings.defaultRegions

  // Check for exclusive targeting
  const hasSubject = regions.includes('subject')
  const hasBackground = regions.includes('background')
  const hasGlobal = regions.includes('global')

  if (hasBackground && !hasSubject) {
    lines.push(
      'Focus psychedelic effects on the background. Keep the main subject relatively unchanged.',
    )
  } else if (hasSubject && !hasBackground) {
    lines.push('Apply effects primarily to the subject. Keep background more naturalistic.')
  }

  if (hasGlobal) {
    lines.push('Apply global color and perception shifts uniformly across the entire image.')
  }

  // If face/hands are not in regions but also not protected, don't apply effects there
  if (!regions.includes('face') && !settings.protectFace) {
    // No specific instruction needed
  }

  return lines
}

const GROUP_LABELS: Record<VisualEffectGroup, string> = {
  enhancements: 'enhancement effects (color, contrast, acuity)',
  distortions: 'distortion effects (breathing, drifting, warping)',
  geometry: 'geometric patterns (fractals, tilings, form constants)',
  hallucinations: 'hallucinatory content (entities, transformations)',
  perceptual: 'perceptual effects (synesthesia, time perception)',
}

function buildGroupMultiplierInstructions(multipliers: GroupMultipliers): string[] {
  const lines: string[] = []

  for (const [group, mult] of Object.entries(multipliers)) {
    const g = group as VisualEffectGroup
    if (mult < 0.3) {
      lines.push(`Minimize ${GROUP_LABELS[g]}.`)
    } else if (mult > 1.5) {
      lines.push(`Emphasize ${GROUP_LABELS[g]}.`)
    }
    // Normal range (0.3-1.5) doesn't need special instruction
  }

  return lines
}

function buildEffectOverrideInstructions(rules: RouterSettings['rules']): string[] {
  if (rules.length === 0) return []

  const lines: string[] = []

  // Limit to top 5 rules to avoid prompt bloat
  for (const rule of rules.slice(0, 5)) {
    const parts: string[] = []

    // Strength descriptor
    if (rule.strength < 0.3) {
      parts.push('minimally')
    } else if (rule.strength < 0.7) {
      parts.push('subtly')
    } else if (rule.strength > 1.3) {
      parts.push('strongly')
    }

    // Region specification
    if (rule.regions.length > 0 && rule.regions.length < 5) {
      parts.push(`in ${rule.regions.join(' and ')} regions`)
    }

    // Depth specification
    if (rule.depthBands.length > 0 && rule.depthBands.length < 3) {
      parts.push(`at ${rule.depthBands.join('/')} depth`)
    }

    // Edge protection
    if (rule.protectEdges) {
      parts.push('respecting edges')
    }

    if (parts.length > 0) {
      lines.push(`Apply ${rule.effectId} ${parts.join(', ')}.`)
    }
  }

  return lines
}
