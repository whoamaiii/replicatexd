import { describe, it, expect } from 'vitest'
import type { VisualEffect } from '../../../shared/types/effects'
import { filterEffectsCatalog } from './catalogFilter'

function effect(id: string, displayName: string, family: VisualEffect['family']) {
  return { id, displayName, family } as VisualEffect
}

describe('filterEffectsCatalog', () => {
  const catalog: VisualEffect[] = [
    effect('color_enhancement', 'Color enhancement', 'amplification'),
    effect('color_depression', 'Color depression', 'suppression'),
    effect('visual_drifting', 'Drifting', 'distortion'),
    effect('visual_noise', 'Visual noise', 'geometry'),
  ]

  it('filters by family tab', () => {
    const filtered = filterEffectsCatalog({ catalog, familyTab: 'distortion', query: '' })
    expect(filtered.map((e) => e.id)).toEqual(['visual_drifting'])
  })

  it('returns a sorted list when query is empty', () => {
    const filtered = filterEffectsCatalog({ catalog, familyTab: 'all', query: '' })
    expect(filtered.map((e) => e.displayName)).toEqual([
      'Color depression',
      'Color enhancement',
      'Drifting',
      'Visual noise',
    ])
  })

  it('matches fuzzily against displayName and id', () => {
    const filtered = filterEffectsCatalog({ catalog, familyTab: 'all', query: 'color enh' })
    expect(filtered[0]?.id).toBe('color_enhancement')
  })
})

