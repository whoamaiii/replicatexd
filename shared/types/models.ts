export type ModelPricing = {
  prompt?: string
  completion?: string
  image?: string
  request?: string
  raw?: Record<string, string>
}

export type ModelCaps = {
  textIn: boolean
  textOut: boolean
  imageIn: boolean
  imageOut: boolean
  multiImage: boolean
  editMode: boolean
}

export type ModelTag =
  | 'image-in'
  | 'image-out'
  | 'multi-image'
  | 'edit-mode'
  | 'best-photoreal-replication'
  | 'best-typography'
  | 'best-precise-local-edits'
  | 'best-fast-drafts'

export type ModelInfo = {
  id: string
  displayName: string
  provider: string
  description: string
  contextLength?: number
  pricing?: ModelPricing
  caps: ModelCaps
  tags: ModelTag[]
}

export type ModelMenuResponse = {
  recommended: ModelInfo[]
  all: ModelInfo[]
  fetchedAt: string
}

