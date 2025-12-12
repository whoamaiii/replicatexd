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

export type VisualEffect = {
  id: string
  group: VisualEffectGroup
  displayName: string
  shortDescription: string
  longDescription: string
  typicalIntensityRange: [number, number]
  primaryScales: VisualEffectScale[]
  commonSubstances?: string[]
  notesOnSimulation: string
}

