import { describe, it, expect } from 'vitest'
import type { PsychedelicEffect } from '../types/analysis'
import type { VisualEffect } from '../types/effects'
import { applyPresetToEffects, intensityForPreset, selectUsedEffects } from './effectsStudio'

describe('effectsStudio helpers', () => {
  describe('applyPresetToEffects', () => {
    it('respects locksById and only changes unlocked effects', () => {
      const effects: PsychedelicEffect[] = [
        { effectId: 'color_enhancement', group: 'enhancements', intensity: 0.2 },
        { effectId: 'breathing_surfaces', group: 'distortions', intensity: 0.2 },
      ]

      type Meta = Pick<VisualEffect, 'id' | 'typicalIntensityRange' | 'doseResponse'>
      const metaById: Map<string, Meta> = new Map<string, Meta>([
        [
          'color_enhancement',
          {
            id: 'color_enhancement',
            typicalIntensityRange: { min: 0.2, max: 0.9 },
            doseResponse: { curve: 'linear', anchor: 'common' },
          },
        ],
        [
          'breathing_surfaces',
          {
            id: 'breathing_surfaces',
            typicalIntensityRange: { min: 0.1, max: 0.8 },
            doseResponse: { curve: 'easeOut', anchor: 'micro' },
          },
        ],
      ])

      const locksById = { color_enhancement: true }

      const next = applyPresetToEffects({
        effects,
        preset: 'heroic',
        locksById,
        metaById,
      })

      const locked = next.find((e) => e.effectId === 'color_enhancement')!
      const unlocked = next.find((e) => e.effectId === 'breathing_surfaces')!

      expect(locked.intensity).toBe(0.2)
      expect(unlocked.intensity).toBe(
        intensityForPreset(metaById.get('breathing_surfaces')!, 'heroic'),
      )
    })
  })

  describe('selectUsedEffects', () => {
    it('filters by threshold and caps to maxEffects', () => {
      const effects: PsychedelicEffect[] = [
        { effectId: 'a', group: 'enhancements', intensity: 0.9 },
        { effectId: 'b', group: 'distortions', intensity: 0.6 },
        { effectId: 'c', group: 'geometry', intensity: 0.49 },
        { effectId: 'd', group: 'hallucinations', intensity: 0.6 },
      ]

      const selected = selectUsedEffects({ effects, threshold: 0.5, maxEffects: 2 })
      expect(selected.map((e) => e.effectId)).toEqual(['a', 'b'])
    })

    it('sorts deterministically when intensities tie', () => {
      const effects: PsychedelicEffect[] = [
        { effectId: 'b', group: 'distortions', intensity: 0.6 },
        { effectId: 'a', group: 'distortions', intensity: 0.6 },
      ]

      const selected = selectUsedEffects({ effects, threshold: 0, maxEffects: 10 })
      expect(selected.map((e) => e.effectId)).toEqual(['a', 'b'])
    })
  })
})
