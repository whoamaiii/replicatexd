import fs from 'node:fs'
import path from 'node:path'
import type { RagDocument, RagIndexedDocument, RagManifestV1, RagSearchResult } from './types'
import { base64ToFloat32, dot, l2Normalize } from './base64Float32'

type LoadedIndex = {
  manifest: RagManifestV1
  docs: RagDocument[]
  embeddings: Float32Array[]
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object'
}

function parseManifest(jsonText: string): RagManifestV1 {
  const parsed = JSON.parse(jsonText) as unknown
  if (!isRecord(parsed) || parsed.version !== 1) {
    throw new Error('Invalid RAG manifest (missing version)')
  }
  return parsed as RagManifestV1
}

function parseJsonlLine(line: string): RagIndexedDocument | null {
  const trimmed = line.trim()
  if (!trimmed) return null
  const parsed = JSON.parse(trimmed) as unknown
  if (!isRecord(parsed)) return null
  const id = typeof parsed.id === 'string' ? parsed.id : ''
  const title = typeof parsed.title === 'string' ? parsed.title : ''
  const text = typeof parsed.text === 'string' ? parsed.text : ''
  const embeddingB64 = typeof parsed.embeddingB64 === 'string' ? parsed.embeddingB64 : ''
  const source = isRecord(parsed.source) ? (parsed.source as RagDocument['source']) : null
  if (!id || !title || !text || !embeddingB64 || !source) return null
  return parsed as RagIndexedDocument
}

function loadIndexFromDir(indexDir: string): LoadedIndex | null {
  const manifestPath = path.join(indexDir, 'manifest.json')
  if (!fs.existsSync(manifestPath)) return null

  const manifest = parseManifest(fs.readFileSync(manifestPath, 'utf8'))
  const docsPath = path.join(indexDir, manifest.files.docsJsonl)
  if (!fs.existsSync(docsPath)) return null

  const raw = fs.readFileSync(docsPath, 'utf8')
  const lines = raw.split('\n')

  const docs: RagDocument[] = []
  const embeddings: Float32Array[] = []

  for (const line of lines) {
    const item = parseJsonlLine(line)
    if (!item) continue
    const vec = base64ToFloat32(item.embeddingB64)
    if (vec.length !== manifest.embedding.dims) continue

    docs.push({
      id: item.id,
      title: item.title,
      text: item.text,
      source: item.source,
      metadata: item.metadata,
    })
    // Embeddings should already be normalized; normalize defensively.
    embeddings.push(l2Normalize(vec))
  }

  return { manifest, docs, embeddings }
}

let cached: { indexDir: string; loaded: LoadedIndex } | null = null

export function loadRagIndex(indexDir: string): LoadedIndex | null {
  if (cached && cached.indexDir === indexDir) return cached.loaded
  const loaded = loadIndexFromDir(indexDir)
  if (!loaded) return null
  cached = { indexDir, loaded }
  return loaded
}

export async function searchRagIndex(input: {
  indexDir: string
  embedQuery: (text: string) => Promise<Float32Array>
  query: string
  topK: number
}): Promise<RagSearchResult> {
  const loaded = loadRagIndex(input.indexDir)
  const query = input.query.trim()
  const topK = Math.max(1, Math.min(30, Math.floor(input.topK)))

  if (!loaded || loaded.docs.length === 0) {
    return { query, hits: [], manifest: loaded?.manifest }
  }

  const q = await input.embedQuery(query)
  const qn = l2Normalize(q)

  // Simple brute-force search; for the current knowledge base size this is plenty fast.
  const scored: Array<{ idx: number; score: number }> = []
  for (let i = 0; i < loaded.embeddings.length; i++) {
    const score = dot(qn, loaded.embeddings[i]!)
    scored.push({ idx: i, score })
  }

  scored.sort((a, b) => b.score - a.score)

  const hits = scored.slice(0, topK).map((s) => ({
    doc: loaded.docs[s.idx]!,
    score: s.score,
  }))

  return { query, hits, manifest: loaded.manifest }
}

