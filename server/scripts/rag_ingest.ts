import { getEnv } from '../src/config/env'
import { resolveRagIndexDir } from '../src/services/rag/paths'
import { createXenovaEmbedder } from '../src/services/rag/embedder'
import { ingestKnowledgeBase } from '../src/services/rag/ingest'

async function main() {
  const env = getEnv()
  const indexDir = resolveRagIndexDir(env.ragIndexDir)

  console.log('[rag] building index', { indexDir, embeddingModel: env.ragEmbeddingModelId })
  const embedder = await createXenovaEmbedder({ modelId: env.ragEmbeddingModelId })
  const result = await ingestKnowledgeBase({ indexDir, embedder })

  console.log('[rag] done', {
    indexDir: result.indexDir,
    docCount: result.manifest.docCount,
    dims: result.manifest.embedding.dims,
    modelId: result.manifest.embedding.modelId,
    createdAt: result.manifest.createdAt,
  })
}

main().catch((err) => {
  console.error('[rag] ingest failed', err)
  process.exitCode = 1
})

