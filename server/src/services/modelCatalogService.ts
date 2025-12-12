import { getEnv } from '../config/env'
import type { ModelCaps, ModelInfo, ModelMenuResponse, ModelPricing, ModelTag } from '../../../shared/types/models'

function normalizeBaseUrl(input: string) {
  return input.replace(/\/+$/g, '')
}

function buildCommonHeaders(apiKey: string) {
  return {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': 'http://localhost:5173',
    'X-Title': 'Psychedelic Visual Replicasion Lab',
  }
}

function normalizeText(input: unknown): string {
  return typeof input === 'string' ? input.trim() : ''
}

function lower(input: string) {
  return input.toLowerCase()
}

function normalizeForMatch(input: string) {
  return lower(input)
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function includesAny(haystack: string, needles: string[]) {
  const h = lower(haystack)
  return needles.some((n) => h.includes(lower(n)))
}

function getProviderFromModelId(modelId: string) {
  const idx = modelId.indexOf('/')
  if (idx <= 0) return 'unknown'
  return modelId.slice(0, idx)
}

function asStringArray(input: unknown): string[] {
  if (!Array.isArray(input)) return []
  return input.filter((v): v is string => typeof v === 'string' && v.trim().length > 0).map((v) => v.trim())
}

function inferModalities(raw: unknown): { input: Set<string>; output: Set<string> } {
  const input = new Set<string>()
  const output = new Set<string>()
  const r = raw as Record<string, unknown> | null
  if (!r || typeof r !== 'object') return { input, output }

  const directIn = asStringArray(r.input_modalities)
  const directOut = asStringArray(r.output_modalities)
  for (const v of directIn) input.add(v)
  for (const v of directOut) output.add(v)

  const arch = r.architecture as Record<string, unknown> | null
  if (arch && typeof arch === 'object') {
    const archIn = asStringArray(arch.input_modalities)
    const archOut = asStringArray(arch.output_modalities)
    for (const v of archIn) input.add(v)
    for (const v of archOut) output.add(v)

    const modality = normalizeText(arch.modality)
    // Common patterns: "text->text", "text+image->text", "text->image", "image+text->image"
    if (modality.includes('->')) {
      const [lhs, rhs] = modality.split('->').map((s) => s.trim())
      for (const part of lhs.split('+').map((s) => s.trim()).filter(Boolean)) input.add(part)
      for (const part of rhs.split('+').map((s) => s.trim()).filter(Boolean)) output.add(part)
    }
  }

  const modality = normalizeText(r.modality)
  if (modality.includes('->')) {
    const [lhs, rhs] = modality.split('->').map((s) => s.trim())
    for (const part of lhs.split('+').map((s) => s.trim()).filter(Boolean)) input.add(part)
    for (const part of rhs.split('+').map((s) => s.trim()).filter(Boolean)) output.add(part)
  }

  return { input, output }
}

function inferCaps(model: { name: string; description: string; raw: unknown }): ModelCaps {
  const { input, output } = inferModalities(model.raw)
  const hay = `${model.name}\n${model.description}`

  const imageIn =
    input.has('image') ||
    includesAny(hay, [
      'image input',
      'vision',
      'multimodal',
      'image understanding',
      'image analysis',
      'image-to-text',
      'img2txt',
    ])

  const imageOut =
    output.has('image') ||
    includesAny(hay, [
      'image output',
      'text-to-image',
      'image generation',
      'generate images',
      't2i',
      'diffusion',
      'img2img',
    ])

  const multiImage =
    includesAny(hay, ['multi image', 'multi-image', 'multiple images', 'supports multiple images']) ||
    includesAny(hay, ['multi-modal']) // conservative

  const editMode =
    includesAny(hay, [
      'edit',
      'image edit',
      'inpaint',
      'inpainting',
      'outpaint',
      'outpainting',
      'mask',
      'localized edit',
      'img2img',
    ])

  // Treat text input/output as supported unless the API explicitly says otherwise.
  const textIn = input.size === 0 ? true : input.has('text')
  const textOut = output.size === 0 ? true : output.has('text')

  return {
    textIn,
    textOut,
    imageIn,
    imageOut,
    multiImage,
    editMode,
  }
}

function inferBestForTags(model: { name: string; description: string; pricing?: ModelPricing; caps: ModelCaps }): ModelTag[] {
  const tags: ModelTag[] = []
  const hay = `${model.name}\n${model.description}`
  const normalizedName = normalizeForMatch(model.name)

  if (
    includesAny(hay, ['photoreal', 'photorealistic', 'realistic', 'cinematic']) ||
    (model.caps.imageOut &&
      normalizedName.includes('openai') &&
      normalizedName.includes('gpt') &&
      normalizedName.includes('image'))
  ) {
    tags.push('best-photoreal-replication')
  }
  if (includesAny(hay, ['typography', 'text rendering', 'text in image', 'lettering', 'logo'])) {
    tags.push('best-typography')
  }
  if (model.caps.editMode || includesAny(hay, ['precise', 'local edit', 'inpaint', 'mask'])) {
    tags.push('best-precise-local-edits')
  }

  if (includesAny(hay, ['fast', 'turbo', 'flash', 'mini', 'lite', 'nano'])) {
    tags.push('best-fast-drafts')
  } else if (typeof model.pricing?.prompt === 'string') {
    const v = Number(model.pricing.prompt)
    if (Number.isFinite(v) && v > 0 && v <= 0.000001) tags.push('best-fast-drafts')
  }

  return Array.from(new Set(tags))
}

function inferCapabilityTags(caps: ModelCaps): ModelTag[] {
  const tags: ModelTag[] = []
  if (caps.imageIn) tags.push('image-in')
  if (caps.imageOut) tags.push('image-out')
  if (caps.multiImage) tags.push('multi-image')
  if (caps.editMode) tags.push('edit-mode')
  return tags
}

function normalizePricing(input: unknown): ModelPricing | undefined {
  const asObj = input as Record<string, unknown> | null
  if (!asObj || typeof asObj !== 'object') return undefined

  const prompt = normalizeText(asObj.prompt)
  const completion = normalizeText(asObj.completion)
  const image = normalizeText(asObj.image)
  const request = normalizeText(asObj.request)

  const raw: Record<string, string> = {}
  for (const [k, v] of Object.entries(asObj)) {
    if (typeof v === 'string' && v.trim().length > 0) raw[k] = v.trim()
    if (typeof v === 'number' && Number.isFinite(v)) raw[k] = String(v)
  }

  if (!prompt && !completion && !image && !request && Object.keys(raw).length === 0) return undefined
  return {
    prompt: prompt || undefined,
    completion: completion || undefined,
    image: image || undefined,
    request: request || undefined,
    raw,
  }
}

function toModelInfo(rawModel: unknown): ModelInfo | null {
  const r = rawModel as Record<string, unknown> | null
  if (!r || typeof r !== 'object') return null

  const id = normalizeText(r.id)
  if (!id) return null

  const name = normalizeText(r.name) || id
  const description = normalizeText(r.description)
  const contextLength =
    typeof r.context_length === 'number' && Number.isFinite(r.context_length)
      ? r.context_length
      : undefined

  const pricing = normalizePricing(r.pricing)
  const caps = inferCaps({ name, description, raw: r })
  const tags = [
    ...inferCapabilityTags(caps),
    ...inferBestForTags({ name, description, pricing, caps }),
  ]

  return {
    id,
    displayName: name,
    provider: getProviderFromModelId(id),
    description,
    contextLength,
    pricing,
    caps,
    tags: Array.from(new Set(tags)),
  }
}

function nameMatches(modelName: string, query: string) {
  return normalizeForMatch(modelName).includes(normalizeForMatch(query))
}

export function pickFirstModelIdByName(models: ModelInfo[], nameQuery: string): string | null {
  const q = nameQuery.trim()
  if (!q) return null

  // Prefer exact case-insensitive match, then substring match.
  const exact = models.find((m) => lower(m.displayName) === lower(q))
  if (exact) return exact.id

  const sub = models.find((m) => nameMatches(m.displayName, q))
  return sub ? sub.id : null
}

export function listAnalysisCandidates(models: ModelInfo[]): ModelInfo[] {
  return models.filter((m) => m.caps.imageIn && m.caps.textOut)
}

export function listGenerationCandidates(models: ModelInfo[]): ModelInfo[] {
  return models.filter((m) => m.caps.imageOut)
}

export async function fetchModelsFromOpenRouter(): Promise<{ fetchedAt: string; all: ModelInfo[] }> {
  const env = getEnv()
  const baseUrl = normalizeBaseUrl(env.openrouterBaseUrl)
  const url = `${baseUrl}/models`

  const res = await fetch(url, {
    method: 'GET',
    headers: buildCommonHeaders(env.openrouterApiKey),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    const safe = body.replace(/\s+/g, ' ').slice(0, 700)
    throw new Error(`OpenRouter Models API rejected the request (${res.status}). ${safe}`)
  }

  const json = (await res.json().catch(() => null)) as unknown
  const data = (json as { data?: unknown } | null)?.data
  if (!Array.isArray(data)) {
    throw new Error('OpenRouter Models API returned an unexpected payload shape')
  }

  const all: ModelInfo[] = []
  for (const item of data) {
    const info = toModelInfo(item)
    if (!info) continue
    all.push(info)
  }

  all.sort((a, b) => a.displayName.localeCompare(b.displayName))

  return {
    fetchedAt: new Date().toISOString(),
    all,
  }
}

const RECOMMENDED_NAME_MATCHES = [
  'GPT 5 Image',
  'GPT 5 Image Mini',
  'Nano Banana Pro',
  'Flux 2 Flex',
  'Flux 2 Pro',
]

function buildRecommendedList(models: ModelInfo[]) {
  const recommended = models.filter((m) =>
    RECOMMENDED_NAME_MATCHES.some((q) => nameMatches(m.displayName, q)),
  )
  return recommended
}

type CachedCatalog = {
  expiresAtMs: number
  fetchedAt: string
  all: ModelInfo[]
  recommended: ModelInfo[]
}

let cachedCatalog: CachedCatalog | null = null

export async function getModelMenuResponse(): Promise<ModelMenuResponse> {
  const env = getEnv()
  const now = Date.now()

  if (cachedCatalog && cachedCatalog.expiresAtMs > now) {
    return {
      recommended: cachedCatalog.recommended,
      all: cachedCatalog.all,
      fetchedAt: cachedCatalog.fetchedAt,
    }
  }

  const fetched = await fetchModelsFromOpenRouter()
  const recommended = buildRecommendedList(fetched.all)

  const ttlSeconds = env.modelCacheTtlSeconds
  cachedCatalog = {
    expiresAtMs: now + ttlSeconds * 1000,
    fetchedAt: fetched.fetchedAt,
    all: fetched.all,
    recommended,
  }

  return {
    recommended,
    all: fetched.all,
    fetchedAt: fetched.fetchedAt,
  }
}
