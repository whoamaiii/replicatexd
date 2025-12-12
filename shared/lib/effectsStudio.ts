import type { PsychedelicEffect } from '../types/analysis'
import type {
  DoseResponseAnchor,
  DoseResponseCurve,
  EffectDoseResponse,
  VisualEffect,
} from '../types/effects'

function clamp01(value: number) {
  if (Number.isNaN(value)) return 0
  return Math.min(1, Math.max(0, value))
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

function applyCurve(curve: DoseResponseCurve, t: number) {
  const x = clamp01(t)
  if (curve === 'easeIn') return x * x
  if (curve === 'easeOut') return 1 - (1 - x) * (1 - x)
  return x
}

function presetToT(preset: DoseResponseAnchor, anchor: DoseResponseAnchor) {
  const map: Record<DoseResponseAnchor, Record<DoseResponseAnchor, number>> = {
    micro: {
      micro: 0.55,
      common: 0.85,
      heroic: 1,
    },
    common: {
      micro: 0.2,
      common: 0.6,
      heroic: 1,
    },
    heroic: {
      micro: 0,
      common: 0.25,
      heroic: 1,
    },
  }
  return map[anchor][preset]
}

export function intensityForPreset(meta: Pick<VisualEffect, 'typicalIntensityRange' | 'doseResponse'>, preset: DoseResponseAnchor) {
  const { min, max } = meta.typicalIntensityRange
  const response: EffectDoseResponse = meta.doseResponse ?? { curve: 'linear', anchor: 'common' }

  const t0 = presetToT(preset, response.anchor)
  const t = applyCurve(response.curve, t0)

  return clamp01(lerp(min, max, t))
}

export type EffectLocksById = Record<string, boolean>

export function applyPresetToEffects(params: {
  effects: PsychedelicEffect[]
  preset: DoseResponseAnchor
  locksById?: EffectLocksById
  metaById: Map<string, Pick<VisualEffect, 'id' | 'typicalIntensityRange' | 'doseResponse'>>
}): PsychedelicEffect[] {
  const { effects, preset, locksById, metaById } = params

  return effects.map((effect) => {
    if (locksById?.[effect.effectId]) return effect

    const meta = metaById.get(effect.effectId)
    if (!meta) return effect

    return {
      ...effect,
      intensity: intensityForPreset(meta, preset),
    }
  })
}

export function selectUsedEffects(params: {
  effects: PsychedelicEffect[]
  threshold: number
  maxEffects: number
}): PsychedelicEffect[] {
  const threshold = clamp01(params.threshold)
  const maxEffects = Math.max(0, Math.floor(params.maxEffects))

  if (maxEffects === 0) return []

  return params.effects
    .filter((e) => clamp01(e.intensity) >= threshold)
    .map((e) => ({ ...e, intensity: clamp01(e.intensity) }))
    .sort((a, b) => {
      const diff = b.intensity - a.intensity
      if (diff !== 0) return diff
      return a.effectId.localeCompare(b.effectId)
    })
    .slice(0, maxEffects)
}

