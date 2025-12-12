export const SubstanceIds = [
  'lsd',
  'psilocybin',
  'dmt',
  'five_meo',
  'mescaline',
  'custom_mix',
] as const

export type SubstanceId = (typeof SubstanceIds)[number]

export type SubstanceOption = {
  id: SubstanceId
  label: string
  description: string
}

export const SubstanceOptions: SubstanceOption[] = [
  {
    id: 'lsd',
    label: 'LSD',
    description: 'Sharper edges, geometry, patterning, synesthetic color shifts',
  },
  {
    id: 'psilocybin',
    label: 'Psilocybin',
    description: 'Breathing surfaces, organic drift, emotional color warmth',
  },
  {
    id: 'dmt',
    label: 'DMT',
    description: 'High density geometry, hyperdetail, entity like motifs',
  },
  {
    id: 'five_meo',
    label: 'Five MeO',
    description: 'Bright dissolution, nondual glow, minimal form boundaries',
  },
  {
    id: 'mescaline',
    label: 'Mescaline',
    description: 'Radiant color, gentle geometry, crystalline shimmer',
  },
  {
    id: 'custom_mix',
    label: 'Custom mix',
    description: 'Provide your own blend description',
  },
]

export function getSubstanceOption(id: SubstanceId): SubstanceOption {
  const found = SubstanceOptions.find((s) => s.id === id)
  return found ?? SubstanceOptions[0]!
}

