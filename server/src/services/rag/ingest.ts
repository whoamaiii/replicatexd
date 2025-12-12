import fs from 'node:fs'
import path from 'node:path'
import type { Embedder } from './embedder'
import type { RagManifestV1, RagIndexedDocument } from './types'
import { float32ToBase64, l2Normalize } from './base64Float32'
import { ensureDirExists } from './paths'
import { loadKnowledgeBaseDocuments } from './documentSources'

function stableNowIso() {
  return new Date().toISOString()
}

export async function ingestKnowledgeBase(input: {
  indexDir: string
  embedder: Embedder
  docsJsonlFilename?: string
  batchSize?: number
}) {
  ensureDirExists(input.indexDir)

  const docsJsonlFilename = input.docsJsonlFilename?.trim() || 'docs.jsonl'
  const docsPath = path.join(input.indexDir, docsJsonlFilename)
  const manifestPath = path.join(input.indexDir, 'manifest.json')

  const kb = loadKnowledgeBaseDocuments()
  const docs = kb.docs

  const batchSize = typeof input.batchSize === 'number' ? Math.max(1, Math.floor(input.batchSize)) : 24

  const stream = fs.createWriteStream(docsPath, { encoding: 'utf8' })

  try {
    for (let i = 0; i < docs.length; i += batchSize) {
      const batch = docs.slice(i, i + batchSize)
      const embeddings = await input.embedder.embedPassages(batch.map((d) => d.text))

      for (let j = 0; j < batch.length; j++) {
        const doc = batch[j]!
        const emb = embeddings[j]!
        const normalized = l2Normalize(emb)
        const line: RagIndexedDocument = {
          ...doc,
          embeddingB64: float32ToBase64(normalized),
        }
        stream.write(JSON.stringify(line) + '\n')
      }
    }
  } finally {
    await new Promise<void>((resolve) => stream.end(() => resolve()))
  }

  const manifest: RagManifestV1 = {
    version: 1,
    createdAt: stableNowIso(),
    embedding: {
      provider: input.embedder.provider,
      modelId: input.embedder.modelId,
      dims: input.embedder.dims,
      normalize: true,
      e5Prefixing: true,
    },
    files: {
      docsJsonl: docsJsonlFilename,
    },
    docCount: docs.length,
    sourceHashes: kb.sourceHashes,
  }

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8')

  return {
    indexDir: input.indexDir,
    manifest,
  }
}

