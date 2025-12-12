import type { ImageAnalysisResult } from '../../../../shared/types/analysis'
import { getEnv } from '../../config/env'
import { callTextCompletion } from '../../openai/client'
import { getModelMenuResponse, pickFirstModelIdByName } from '../modelCatalogService'
import { createXenovaEmbedder, type Embedder } from './embedder'
import { resolveRagIndexDir } from './paths'
import { searchRagIndex } from './localVectorStore'
import type { RagSearchHit } from './types'

export type RagPipelineOptions = {
  query: string
  analysis?: ImageAnalysisResult
  enabled?: boolean
  topK?: number
  draftModelId?: string
  finalModelId?: string
  mode?: 'retrieve_only' | 'draft_and_refine'
}

export type RagPipelineResult = {
  enabled: boolean
  query: string
  mode: 'retrieve_only' | 'draft_and_refine'
  models?: {
    draftModelId: string
    finalModelId: string
  }
  retrieved: Array<{
    id: string
    title: string
    source: RagSearchHit['doc']['source']
    score: number
  }>
  contextText: string
  draftText: string
  finalText: string
}

function clampInt(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Math.floor(n)))
}

function summarizeAnalysisForPrompt(analysis?: ImageAnalysisResult) {
  if (!analysis) return ''
  const effects = Array.isArray(analysis.effects) ? analysis.effects : []
  const top = effects
    .slice()
    .sort((a, b) => (b.intensity ?? 0) - (a.intensity ?? 0))
    .slice(0, 7)
    .map((e) => `${e.effectId} (${e.group}) intensity ${Math.round((e.intensity ?? 0) * 100) / 100}`)

  const lines: string[] = []
  lines.push(`Base scene: ${analysis.baseSceneDescription}`)
  if (analysis.geometrySummary) lines.push(`Geometry: ${analysis.geometrySummary}`)
  if (analysis.distortionSummary) lines.push(`Distortions: ${analysis.distortionSummary}`)
  if (analysis.hallucinationSummary) lines.push(`Hallucinations: ${analysis.hallucinationSummary}`)
  if (top.length) {
    lines.push('Top effects:')
    for (const t of top) lines.push(`- ${t}`)
  }
  return lines.join('\n').trim()
}

function buildContextText(hits: RagSearchHit[], maxChars: number) {
  const sections: string[] = []
  let used = 0

  for (let i = 0; i < hits.length; i++) {
    const hit = hits[i]!
    const header = `# Source ${i + 1} (score ${hit.score.toFixed(3)}): ${hit.doc.title}`
    const body = hit.doc.text.trim()
    const section = `${header}\n${body}`
    if (used + section.length + 2 > maxChars) break
    sections.push(section)
    used += section.length + 2
  }

  return sections.join('\n\n').trim()
}

function shortSnippet(text: string, maxLen: number) {
  const compact = text.replace(/\s+/g, ' ').trim()
  if (compact.length <= maxLen) return compact
  return compact.slice(0, maxLen).trim() + '…'
}

function parseLineValue(text: string, prefix: string) {
  const lines = text.split('\n')
  for (const line of lines) {
    if (line.startsWith(prefix)) return line.slice(prefix.length).trim()
  }
  return ''
}

function buildRetrievedOnlyAddendum(hits: RagSearchHit[]) {
  const bullets: string[] = []

  for (const h of hits.slice(0, 8)) {
    if (bullets.length >= 10) break

    if (h.doc.source.type === 'visual_effect') {
      const desc = parseLineValue(h.doc.text, 'Description:')
      const effectLine = parseLineValue(h.doc.text, 'Effect:')
      const label = effectLine ? effectLine : h.doc.title
      bullets.push(`- ${label}${desc ? ` — ${shortSnippet(desc, 140)}` : ''}`)
      continue
    }

    if (h.doc.source.type === 'doc_md') {
      bullets.push(`- Reference: ${h.doc.title} — ${shortSnippet(h.doc.text, 140)}`)
      continue
    }

    bullets.push(`- ${h.doc.title} — ${shortSnippet(h.doc.text, 140)}`)
  }

  const constraints = [
    '- Keep effects embedded in surfaces/materials and aligned to perspective and lighting.',
    '- Avoid floating wireframe overlays and separate decals.',
    '- Keep the original scene recognizable unless explicitly requesting replacement.',
    '- Prefer the closest existing effectIds; never invent new taxonomy ids.',
  ]

  return [
    'RAG Addendum',
    ...(bullets.length ? bullets : ['- Retrieved context was sparse; proceed with conservative effect selection.']),
    '',
    'Constraints',
    ...constraints,
  ].join('\n')
}

async function resolveRagModelIdByName(name: string) {
  const menu = await getModelMenuResponse()
  const textCandidates = menu.all.filter((m) => m.caps.textIn && m.caps.textOut)
  return pickFirstModelIdByName(textCandidates, name)
}

let cachedEmbedderPromise: Promise<Embedder> | null = null

async function getEmbedder() {
  if (cachedEmbedderPromise) return cachedEmbedderPromise
  const env = getEnv()
  cachedEmbedderPromise = createXenovaEmbedder({ modelId: env.ragEmbeddingModelId })
  return cachedEmbedderPromise
}

export async function runRagPipeline(options: RagPipelineOptions): Promise<RagPipelineResult> {
  const env = getEnv()
  const query = options.query.trim()
  if (!query) {
    return {
      enabled: false,
      query,
      mode: 'draft_and_refine',
      models: undefined,
      retrieved: [],
      contextText: '',
      draftText: '',
      finalText: '',
    }
  }

  const enabled = !!options.enabled && env.ragEnabled
  if (!enabled) {
    return {
      enabled: false,
      query,
      mode: 'draft_and_refine',
      models: undefined,
      retrieved: [],
      contextText: '',
      draftText: '',
      finalText: '',
    }
  }

  const mode: 'retrieve_only' | 'draft_and_refine' = options.mode ?? 'draft_and_refine'
  const topK = clampInt(typeof options.topK === 'number' ? options.topK : env.ragTopK, 1, 20)
  const maxContextChars = clampInt(env.ragMaxContextChars, 800, 40_000)

  const indexDir = resolveRagIndexDir(env.ragIndexDir)
  const embedder = await getEmbedder()

  const retrieval = await searchRagIndex({
    indexDir,
    embedQuery: embedder.embedQuery,
    query,
    topK,
  })

  const hits = retrieval.hits
  const contextText = buildContextText(hits, maxContextChars)

  if (mode === 'retrieve_only') {
    const finalText = buildRetrievedOnlyAddendum(hits).trim()
    return {
      enabled: true,
      mode,
      query,
      models: undefined,
      retrieved: hits.map((h) => ({
        id: h.doc.id,
        title: h.doc.title,
        source: h.doc.source,
        score: h.score,
      })),
      contextText,
      draftText: '',
      finalText,
    }
  }

  const resolvedDraftModelId =
    (typeof options.draftModelId === 'string' && options.draftModelId.trim().length > 0
      ? options.draftModelId.trim()
      : (await resolveRagModelIdByName(env.defaultRagDraftModelName)) ||
        (await resolveRagModelIdByName(env.defaultAnalysisModelName)) ||
        env.legacyAnalysisModelId ||
        '')

  const resolvedFinalModelId =
    (typeof options.finalModelId === 'string' && options.finalModelId.trim().length > 0
      ? options.finalModelId.trim()
      : (await resolveRagModelIdByName(env.defaultRagFinalModelName)) ||
        (await resolveRagModelIdByName(env.defaultAnalysisModelName)) ||
        env.legacyAnalysisModelId ||
        '')

  if (!resolvedDraftModelId || !resolvedFinalModelId) {
    throw new Error(
      'RAG could not resolve draft/final models. Pick models in the Models view, or set DEFAULT_RAG_DRAFT_MODEL_NAME / DEFAULT_RAG_FINAL_MODEL_NAME.',
    )
  }

  const analysisSummary = summarizeAnalysisForPrompt(options.analysis)

  const ragSystemPrompt = [
    'You are PsyVis Lab RAG Draft Assistant.',
    'Goal: produce a prompt addendum for generating psychedelic-style visual effects on an existing photo.',
    'You MUST keep effects embedded in surfaces/materials and aligned to perspective and lighting.',
    'Avoid floating wireframe overlays, portals, space backgrounds, or scene replacement unless explicitly requested.',
    'Important moderation constraint: do NOT mention drugs, substance use, or paraphernalia. Use "surreal", "dreamlike", "hallucinatory" language instead.',
    '',
    'Output format:',
    '- Write a short section titled "RAG Addendum" with 6–12 bullet points.',
    '- Each bullet is an actionable visual instruction (not an explanation).',
    '- Then write a short section titled "Constraints" with 4–8 bullets that prevent common failure modes.',
  ].join('\n')

  const ragUserPrompt = [
    'User intent:',
    query,
    '',
    analysisSummary ? `Current analysis:\n${analysisSummary}\n` : '',
    contextText ? `Retrieved knowledge base context:\n${contextText}\n` : 'Retrieved knowledge base context: (none)\n',
  ].join('\n')

  const draftText = await callTextCompletion({
    systemPrompt: ragSystemPrompt,
    userPrompt: ragUserPrompt,
    modelId: resolvedDraftModelId,
    temperature: 0.35,
  })

  const refineSystemPrompt = [
    'You are PsyVis Lab RAG Refiner.',
    'You take a rough prompt addendum and rewrite it into the most useful, non-redundant, high-signal prompt guidance for an image generation model.',
    'Preserve perspective realism: patterns belong on surfaces and materials.',
    'Keep language moderation-safe (no drug terms).',
    'Do not add fluff; prefer concrete, testable constraints.',
    '',
    'Output format (same as draft):',
    '- Section "RAG Addendum" with 6–12 bullets.',
    '- Section "Constraints" with 4–8 bullets.',
  ].join('\n')

  const refineUserPrompt = [
    'User intent:',
    query,
    '',
    analysisSummary ? `Current analysis:\n${analysisSummary}\n` : '',
    contextText ? `Retrieved context:\n${contextText}\n` : 'Retrieved context: (none)\n',
    'Draft addendum to refine:',
    draftText,
  ].join('\n')

  const finalText = await callTextCompletion({
    systemPrompt: refineSystemPrompt,
    userPrompt: refineUserPrompt,
    modelId: resolvedFinalModelId,
    temperature: 0.2,
  })

  return {
    enabled: true,
    query,
    mode,
    models: { draftModelId: resolvedDraftModelId, finalModelId: resolvedFinalModelId },
    retrieved: hits.map((h) => ({
      id: h.doc.id,
      title: h.doc.title,
      source: h.doc.source,
      score: h.score,
    })),
    contextText,
    draftText: draftText.trim(),
    finalText: finalText.trim(),
  }
}
