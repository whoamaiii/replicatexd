import { l2Normalize } from './base64Float32'

export type Embedder = {
  provider: 'xenova'
  modelId: string
  dims: number
  embedPassages: (texts: string[]) => Promise<Float32Array[]>
  embedQuery: (text: string) => Promise<Float32Array>
}

type FeatureExtractor = (inputs: string | string[], options?: Record<string, unknown>) => Promise<unknown>

let cachedExtractor: { modelId: string; extractor: FeatureExtractor } | null = null

function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object'
}

function toFloat32Array(output: unknown): Float32Array {
  if (output instanceof Float32Array) return output

  if (Array.isArray(output) && output.length > 0 && typeof output[0] === 'number') {
    return new Float32Array(output as number[])
  }

  if (isRecord(output) && output.data) {
    const data = output.data as unknown
    if (data instanceof Float32Array) return data
    if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'number') {
      return new Float32Array(data as number[])
    }
  }

  throw new Error('Unexpected embedding output shape')
}

async function getXenovaExtractor(modelId: string): Promise<FeatureExtractor> {
  if (cachedExtractor && cachedExtractor.modelId === modelId) return cachedExtractor.extractor

  const mod = await import('@xenova/transformers')
  if (!('pipeline' in mod) || typeof mod.pipeline !== 'function') {
    throw new Error('Failed to load @xenova/transformers pipeline')
  }

  const extractor = (await mod.pipeline('feature-extraction', modelId, {
    // quantized tends to be faster + smaller, and is sufficient for RAG.
    quantized: true,
  })) as FeatureExtractor

  cachedExtractor = { modelId, extractor }
  return extractor
}

function applyE5Prefix(text: string, kind: 'query' | 'passage') {
  const trimmed = text.trim()
  if (!trimmed) return `${kind}:`
  // Avoid double-prefixing if callers already supplied it.
  const lower = trimmed.toLowerCase()
  if (lower.startsWith('query:') || lower.startsWith('passage:')) return trimmed
  return `${kind}: ${trimmed}`
}

async function embedTexts(
  extractor: FeatureExtractor,
  texts: string[],
  options: { normalize: boolean; e5Prefixing: boolean; kind: 'query' | 'passage' },
): Promise<Float32Array[]> {
  const prepared = texts.map((t) => {
    const base = t.replace(/\s+/g, ' ').trim()
    return options.e5Prefixing ? applyE5Prefix(base, options.kind) : base
  })

  // transformers.js supports pooling: 'mean' and normalize: true for feature extraction pipelines.
  const out = await extractor(prepared, { pooling: 'mean', normalize: options.normalize })

  // When passed an array of inputs, transformers.js returns an array of embeddings.
  if (Array.isArray(out)) {
    return out.map((v) => toFloat32Array(v))
  }

  // Some versions may return a tensor-like object for batched inputs; fall back to single.
  return [toFloat32Array(out)]
}

export async function createXenovaEmbedder(options: { modelId: string }): Promise<Embedder> {
  const modelId = options.modelId.trim()
  const extractor = await getXenovaExtractor(modelId)

  // Infer dims by embedding a trivial string once.
  const probe = await embedTexts(extractor, ['passage: probe'], {
    normalize: true,
    e5Prefixing: false,
    kind: 'passage',
  })
  const dims = probe[0]!.length

  const normalize = true
  const e5Prefixing = true

  return {
    provider: 'xenova',
    modelId,
    dims,
    embedPassages: async (texts) => {
      const vecs = await embedTexts(extractor, texts, { normalize, e5Prefixing, kind: 'passage' })
      return vecs.map((v) => (normalize ? v : l2Normalize(v)))
    },
    embedQuery: async (text) => {
      const vecs = await embedTexts(extractor, [text], { normalize, e5Prefixing, kind: 'query' })
      const v = vecs[0]!
      return normalize ? v : l2Normalize(v)
    },
  }
}
