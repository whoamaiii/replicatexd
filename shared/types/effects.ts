export const VisualEffectGroups = [
  'enhancements',
  'distortions',
  'geometry',
  'hallucinations',
  'perceptual',
] as const

export type VisualEffectGroup = (typeof VisualEffectGroups)[number]

export const VisualEffectScales = ['macro', 'meso', 'micro'] as const

export type VisualEffectScale = (typeof VisualEffectScales)[number]

export const EffectFamilies = [
  'amplification',
  'suppression',
  'distortion',
  'geometry',
  'cognitive',
] as const

export type EffectFamily = (typeof EffectFamilies)[number]

export const DoseResponseCurves = ['linear', 'easeIn', 'easeOut'] as const

export type DoseResponseCurve = (typeof DoseResponseCurves)[number]

export const DoseResponseAnchors = ['micro', 'common', 'heroic'] as const

export type DoseResponseAnchor = (typeof DoseResponseAnchors)[number]

export type EffectDoseResponse = {
  curve: DoseResponseCurve
  anchor: DoseResponseAnchor
}

export type TypicalIntensityRange = {
  min: number
  max: number
}

export type EffectSource = {
  label: string
  url: string
}

export type VisualEffect = {
  id: string
  group: VisualEffectGroup
  family: EffectFamily
  displayName: string
  shortDescription: string
  simulationHints: string[]
  typicalIntensityRange: TypicalIntensityRange
  doseResponse?: EffectDoseResponse
  sources: EffectSource[]
}
