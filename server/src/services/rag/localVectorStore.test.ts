import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { float32ToBase64, l2Normalize } from './base64Float32'
import { searchRagIndex } from './localVectorStore'
import type { RagManifestV1 } from './types'

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'psyvis-rag-test-'))
}

describe('localVectorStore', () => {
  it('returns empty hits when index is missing', async () => {
    const dir = makeTempDir()
    const res = await searchRagIndex({
      indexDir: dir,
      query: 'test',
      topK: 3,
      embedQuery: async () => new Float32Array([1, 0, 0]),
    })
    expect(res.hits).toEqual([])
  })

  it('loads a jsonl index and ranks by cosine similarity', async () => {
    const dir = makeTempDir()

    const manifest: RagManifestV1 = {
      version: 1,
      createdAt: new Date().toISOString(),
      embedding: {
        provider: 'xenova',
        modelId: 'mock',
        dims: 3,
        normalize: true,
        e5Prefixing: true,
      },
      files: { docsJsonl: 'docs.jsonl' },
      docCount: 2,
      sourceHashes: {},
    }

    const a = l2Normalize(new Float32Array([1, 0, 0]))
    const b = l2Normalize(new Float32Array([0, 1, 0]))

    fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(manifest), 'utf8')
    fs.writeFileSync(
      path.join(dir, 'docs.jsonl'),
      [
        JSON.stringify({
          id: 'a',
          title: 'A',
          text: 'doc a',
          source: { type: 'custom' },
          embeddingB64: float32ToBase64(a),
        }),
        JSON.stringify({
          id: 'b',
          title: 'B',
          text: 'doc b',
          source: { type: 'custom' },
          embeddingB64: float32ToBase64(b),
        }),
        '',
      ].join('\n'),
      'utf8',
    )

    const res = await searchRagIndex({
      indexDir: dir,
      query: 'q',
      topK: 2,
      embedQuery: async () => new Float32Array([10, 0, 0]),
    })

    expect(res.hits.length).toBe(2)
    expect(res.hits[0]!.doc.id).toBe('a')
    expect(res.hits[0]!.score).toBeGreaterThan(res.hits[1]!.score)
  })
})

