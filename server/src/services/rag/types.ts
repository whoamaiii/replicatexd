export type RagDocument = {
  id: string
  title: string
  text: string
  source: {
    type: 'visual_effect' | 'doc_md' | 'custom'
    path?: string
    effectId?: string
  }
  metadata?: Record<string, unknown>
}

export type RagIndexedDocument = RagDocument & {
  embeddingB64: string
}

export type RagManifestV1 = {
  version: 1
  createdAt: string
  embedding: {
    provider: 'xenova'
    modelId: string
    dims: number
    normalize: boolean
    e5Prefixing: boolean
  }
  files: {
    docsJsonl: string
  }
  docCount: number
  sourceHashes?: Record<string, string>
}

export type RagSearchHit = {
  doc: RagDocument
  score: number
}

export type RagSearchResult = {
  query: string
  hits: RagSearchHit[]
  manifest?: RagManifestV1
}

