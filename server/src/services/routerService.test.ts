import { describe, it, expect } from 'vitest'
import { buildPlacementPlan, resolveRouterSettings } from './routerService'
import type { RouterSettings, GroupMultipliers } from '../../../shared/types/router'
import type { PsychedelicEffect } from '../../../shared/types/analysis'
import type { MapPack, MapAsset } from '../../../shared/types/maps'

// Fixed sample analysis result for determinism tests
const sampleEffects: PsychedelicEffect[] = [
  { effectId: 'color_enhancement', group: 'enhancements', intensity: 0.7 },
  { effectId: 'breathing', group: 'distortions', intensity: 0.6 },
  { effectId: 'fractal_patterns', group: 'geometry', intensity: 0.8 },
  { effectId: 'entity_perception', group: 'hallucinations', intensity: 0.4 },
  { effectId: 'pareidolia', group: 'perceptual', intensity: 0.5 },
]

// Fixed sample router settings
const sampleRouterSettings: RouterSettings = {
  enabled: true,
  defaultRegions: ['subject', 'background'],
  defaultDepthBands: ['near', 'mid', 'far'],
  protectFace: true,
  protectHands: true,
  protectEdges: true,
  surfaceLockStrength: 0.6,
  groupMultipliers: {
    enhancements: 1.0,
    distortions: 1.0,
    geometry: 1.0,
    hallucinations: 1.0,
    perceptual: 1.0,
  },
  rules: [],
}

// Sample MapPack with all map types
const fullMapPack: MapPack = {
  sourceHash: 'test-hash',
  sourceWidth: 1920,
  sourceHeight: 1080,
  createdAt: '2025-01-01T00:00:00Z',
  inputFilename: 'test.png',
  maps: [
    { kind: 'depth', filename: 'depth.png', width: 1920, height: 1080, generatedAt: '2025-01-01T00:00:00Z' },
    { kind: 'edges', filename: 'edges.png', width: 1920, height: 1080, generatedAt: '2025-01-01T00:00:00Z' },
    { kind: 'faceMask', filename: 'face.png', width: 1920, height: 1080, generatedAt: '2025-01-01T00:00:00Z' },
    { kind: 'handsMask', filename: 'hands.png', width: 1920, height: 1080, generatedAt: '2025-01-01T00:00:00Z' },
    { kind: 'segmentation', filename: 'seg.png', width: 1920, height: 1080, generatedAt: '2025-01-01T00:00:00Z' },
  ] as MapAsset[],
}

describe('routerService', () => {
  describe('buildPlacementPlan determinism', () => {
    it('produces identical output given the same inputs', () => {
      const plan1 = buildPlacementPlan(sampleRouterSettings, sampleEffects, fullMapPack)
      const plan2 = buildPlacementPlan(sampleRouterSettings, sampleEffects, fullMapPack)

      expect(plan1.lines).toEqual(plan2.lines)
      expect(plan1.summary).toBe(plan2.summary)
      expect(plan1.availableMaps).toEqual(plan2.availableMaps)
    })

    it('produces identical output across multiple calls', () => {
      const results: string[] = []
      for (let i = 0; i < 5; i++) {
        const plan = buildPlacementPlan(sampleRouterSettings, sampleEffects, fullMapPack)
        results.push(plan.summary)
      }

      expect(new Set(results).size).toBe(1)
    })
  })

  describe('group multipliers', () => {
    it('produces minimize instruction when multiplier is below 0.3', () => {
      const settings: RouterSettings = {
        ...sampleRouterSettings,
        groupMultipliers: {
          enhancements: 0.2,
          distortions: 1.0,
          geometry: 1.0,
          hallucinations: 1.0,
          perceptual: 1.0,
        },
      }

      const plan = buildPlacementPlan(settings, sampleEffects, fullMapPack)

      const hasMinimizeEnhancements = plan.lines.some((line) =>
        line.includes('Minimize') && line.includes('enhancement effects')
      )
      expect(hasMinimizeEnhancements).toBe(true)
    })

    it('produces emphasize instruction when multiplier is above 1.5', () => {
      const settings: RouterSettings = {
        ...sampleRouterSettings,
        groupMultipliers: {
          enhancements: 1.0,
          distortions: 1.0,
          geometry: 2.0,
          hallucinations: 1.0,
          perceptual: 1.0,
        },
      }

      const plan = buildPlacementPlan(settings, sampleEffects, fullMapPack)

      const hasEmphasizeGeometry = plan.lines.some((line) =>
        line.includes('Emphasize') && line.includes('geometric patterns')
      )
      expect(hasEmphasizeGeometry).toBe(true)
    })

    it('produces no special instruction for normal range multipliers (0.3-1.5)', () => {
      const settings: RouterSettings = {
        ...sampleRouterSettings,
        groupMultipliers: {
          enhancements: 1.0,
          distortions: 0.8,
          geometry: 1.2,
          hallucinations: 0.5,
          perceptual: 1.0,
        },
      }

      const plan = buildPlacementPlan(settings, sampleEffects, fullMapPack)

      const hasMinimizeOrEmphasize = plan.lines.some((line) =>
        line.includes('Minimize') || line.includes('Emphasize')
      )
      expect(hasMinimizeOrEmphasize).toBe(false)
    })

    it('includes all group multiplier instructions in summary', () => {
      const settings: RouterSettings = {
        ...sampleRouterSettings,
        groupMultipliers: {
          enhancements: 0.1,
          distortions: 1.8,
          geometry: 0.2,
          hallucinations: 1.6,
          perceptual: 1.0,
        },
      }

      const plan = buildPlacementPlan(settings, sampleEffects, fullMapPack)

      expect(plan.summary).toContain('Minimize')
      expect(plan.summary).toContain('Emphasize')
      expect(plan.lines.filter((l) => l.includes('Minimize')).length).toBe(2)
      expect(plan.lines.filter((l) => l.includes('Emphasize')).length).toBe(2)
    })
  })

  describe('protectFace flag', () => {
    it('produces face protection instruction with faceMask available', () => {
      const settings: RouterSettings = {
        ...sampleRouterSettings,
        protectFace: true,
      }

      const plan = buildPlacementPlan(settings, sampleEffects, fullMapPack)

      const hasFaceProtection = plan.lines.some((line) =>
        line.includes('Do not modify face regions') ||
        line.includes('facial features')
      )
      expect(hasFaceProtection).toBe(true)
    })

    it('produces fallback face instruction without faceMask', () => {
      const noFaceMaskPack: MapPack = {
        ...fullMapPack,
        maps: fullMapPack.maps.filter((m) => m.kind !== 'faceMask'),
      }

      const settings: RouterSettings = {
        ...sampleRouterSettings,
        protectFace: true,
      }

      const plan = buildPlacementPlan(settings, sampleEffects, noFaceMaskPack)

      const hasFallbackInstruction = plan.lines.some((line) =>
        line.includes('Preserve facial identity')
      )
      expect(hasFallbackInstruction).toBe(true)
    })

    it('produces no face protection instruction when protectFace is false', () => {
      const settings: RouterSettings = {
        ...sampleRouterSettings,
        protectFace: false,
      }

      const plan = buildPlacementPlan(settings, sampleEffects, fullMapPack)

      // Check specifically for face protection phrases, not just the word "face"
      // (e.g., "surface" contains "face" but is not a face protection instruction)
      const hasFaceProtectionInstruction = plan.lines.some((line) =>
        line.includes('Do not modify face regions') ||
        line.includes('facial features') ||
        line.includes('Preserve facial identity')
      )
      expect(hasFaceProtectionInstruction).toBe(false)
    })
  })

  describe('protectHands flag', () => {
    it('produces hands protection instruction with handsMask available', () => {
      const settings: RouterSettings = {
        ...sampleRouterSettings,
        protectHands: true,
      }

      const plan = buildPlacementPlan(settings, sampleEffects, fullMapPack)

      const hasHandsProtection = plan.lines.some((line) =>
        line.includes('Preserve hand anatomy') ||
        line.includes('finger count')
      )
      expect(hasHandsProtection).toBe(true)
    })

    it('produces fallback hands instruction without handsMask', () => {
      const noHandsMaskPack: MapPack = {
        ...fullMapPack,
        maps: fullMapPack.maps.filter((m) => m.kind !== 'handsMask'),
      }

      const settings: RouterSettings = {
        ...sampleRouterSettings,
        protectHands: true,
      }

      const plan = buildPlacementPlan(settings, sampleEffects, noHandsMaskPack)

      const hasFallbackInstruction = plan.lines.some((line) =>
        line.includes('Maintain natural hand structure')
      )
      expect(hasFallbackInstruction).toBe(true)
    })

    it('produces no hands instruction when protectHands is false', () => {
      const settings: RouterSettings = {
        ...sampleRouterSettings,
        protectHands: false,
      }

      const plan = buildPlacementPlan(settings, sampleEffects, fullMapPack)

      const hasHandsInstruction = plan.lines.some((line) =>
        line.toLowerCase().includes('hand')
      )
      expect(hasHandsInstruction).toBe(false)
    })
  })

  describe('router disabled', () => {
    it('returns empty plan when router is disabled', () => {
      const settings: RouterSettings = {
        ...sampleRouterSettings,
        enabled: false,
      }

      const plan = buildPlacementPlan(settings, sampleEffects, fullMapPack)

      expect(plan.lines).toEqual([])
      expect(plan.summary).toBe('')
      expect(plan.availableMaps).toEqual(['depth', 'edges', 'faceMask', 'handsMask', 'segmentation'])
    })
  })

  describe('resolveRouterSettings', () => {
    it('returns defaults when no settings provided', () => {
      const resolved = resolveRouterSettings(undefined)

      expect(resolved.enabled).toBe(true)
      expect(resolved.protectFace).toBe(true)
      expect(resolved.protectHands).toBe(true)
    })

    it('merges partial settings with defaults', () => {
      const partial = {
        protectFace: false,
        surfaceLockStrength: 0.8,
      }

      const resolved = resolveRouterSettings(partial)

      expect(resolved.protectFace).toBe(false)
      expect(resolved.surfaceLockStrength).toBe(0.8)
      expect(resolved.protectHands).toBe(true) // from defaults
      expect(resolved.enabled).toBe(true) // from defaults
    })

    it('merges partial group multipliers with defaults', () => {
      const partial = {
        groupMultipliers: {
          geometry: 2.0,
        } as Partial<GroupMultipliers>,
      }

      const resolved = resolveRouterSettings(partial)

      expect(resolved.groupMultipliers.geometry).toBe(2.0)
      expect(resolved.groupMultipliers.enhancements).toBe(1.0) // from defaults
      expect(resolved.groupMultipliers.distortions).toBe(1.0) // from defaults
    })
  })
})
