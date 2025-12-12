import type { PsychedelicEffect } from '../../shared/types/analysis'
import type { VisualEffect, VisualEffectGroup } from '../../shared/types/effects'
import { VisualEffectGroups } from '../../shared/types/effects'
import visualEffectsData from '../../data/visual_effects.json'

const allVisualEffects = visualEffectsData as VisualEffect[]

const effectById = new Map<string, VisualEffect>(allVisualEffects.map((e) => [e.id, e]))

export function getEffectById(effectId: string) {
  return effectById.get(effectId)
}

export type EffectWithMeta = {
  effect: PsychedelicEffect
  meta: VisualEffect | null
}

export type GroupedEffects = Record<VisualEffectGroup, EffectWithMeta[]>

export function groupByGroup(effects: PsychedelicEffect[]): GroupedEffects {
  const grouped: GroupedEffects = {
    enhancements: [],
    distortions: [],
    geometry: [],
    hallucinations: [],
    perceptual: [],
  }

  for (const effect of effects) {
    grouped[effect.group].push({ effect, meta: getEffectById(effect.effectId) ?? null })
  }

  for (const group of VisualEffectGroups) {
    grouped[group].sort((a, b) => b.effect.intensity - a.effect.intensity)
  }

  return grouped
}

