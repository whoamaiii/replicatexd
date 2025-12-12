import type { VisualEffectGroup, VisualEffectScale } from './effects'

export type VisualScale = VisualEffectScale

export type PsychedelicEffect = {
  effectId: string
  group: VisualEffectGroup
  intensity: number
  scales?: VisualScale[]
}

export type AnalysisPrompts = {
  openAIImagePrompt: string
  shortCinematicDescription: string
}

export type ImageAnalysisResult = {
  substanceId: string
  dose: number
  baseSceneDescription: string
  geometrySummary?: string
  distortionSummary?: string
  hallucinationSummary?: string
  effects: PsychedelicEffect[]
  prompts: AnalysisPrompts
}

