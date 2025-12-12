import { getEnv } from '../config/env'

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

function summarizeText(input: string, limit: number) {
  const compact = input.replace(/\s+/g, ' ').trim()
  if (compact.length <= limit) return compact
  return compact.slice(0, limit).trim() + '…'
}

function redactDataUrls(input: string) {
  return input.replace(
    /data:image\/[a-zA-Z0-9.+-]+;base64,[a-zA-Z0-9+/=]+/g,
    'data:image/...;base64,<redacted>',
  )
}

function extractImageDataUrlFromChatCompletions(payload: unknown) {
  const asObj = payload as Record<string, unknown> | null
  if (!asObj || typeof asObj !== 'object') return null

  const choices = asObj.choices
  if (!Array.isArray(choices) || !choices[0] || typeof choices[0] !== 'object') return null
  const message = (choices[0] as { message?: unknown }).message
  if (!message || typeof message !== 'object') return null
  const images = (message as { images?: unknown }).images
  if (!Array.isArray(images) || !images[0] || typeof images[0] !== 'object') return null
  const imageUrl = (images[0] as { image_url?: unknown }).image_url
  if (!imageUrl || typeof imageUrl !== 'object') return null
  const url = (imageUrl as { url?: unknown }).url
  return typeof url === 'string' && url.trim().length > 0 ? url : null
}

function extractUsage(payload: unknown): unknown | undefined {
  const asObj = payload as Record<string, unknown> | null
  if (!asObj || typeof asObj !== 'object') return undefined
  return asObj.usage
}

function extractCost(payload: unknown): number | undefined {
  const asObj = payload as Record<string, unknown> | null
  if (!asObj || typeof asObj !== 'object') return undefined

  const direct = asObj.cost
  if (typeof direct === 'number' && Number.isFinite(direct)) return direct

  const usage = asObj.usage as Record<string, unknown> | null
  if (usage && typeof usage === 'object') {
    const totalCost = usage.total_cost
    if (typeof totalCost === 'number' && Number.isFinite(totalCost)) return totalCost
    const cost = usage.cost
    if (typeof cost === 'number' && Number.isFinite(cost)) return cost
  }

  return undefined
}

function extractResponseId(payload: unknown): string | undefined {
  const asObj = payload as Record<string, unknown> | null
  if (!asObj || typeof asObj !== 'object') return undefined
  const id = asObj.id
  return typeof id === 'string' && id.trim().length > 0 ? id : undefined
}

type NanoBananaMapResult = {
  outputImageDataUrl: string
  usage?: unknown
  cost?: number
  requestId?: string
  responseId?: string
}

export async function callNanoBananaMap(input: {
  modelId: string
  promptText: string
  inputImageDataUrl: string
  timeoutMs?: number
}): Promise<NanoBananaMapResult> {
  const env = getEnv()
  const baseUrl = normalizeBaseUrl(env.openrouterBaseUrl)
  const url = `${baseUrl}/chat/completions`

  const body = {
    model: input.modelId,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: input.promptText },
          { type: 'image_url', image_url: { url: input.inputImageDataUrl } },
        ],
      },
    ],
    modalities: ['image', 'text'],
    stream: false,
  }

  const controller = new AbortController()
  const timeoutMs = input.timeoutMs ?? 180_000
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: buildCommonHeaders(env.openrouterApiKey),
      body: JSON.stringify(body),
      signal: controller.signal,
    })

    const requestIdHeader =
      res.headers.get('x-request-id') ??
      res.headers.get('x-openrouter-request-id') ??
      undefined

    if (!res.ok) {
      const raw = await res.text().catch(() => '')
      const safe = summarizeText(redactDataUrls(raw), 700)
      throw new Error(`OpenRouter rejected the request (${res.status}). ${safe}`)
    }

    const text = await res.text()
    let json: unknown
    try {
      json = JSON.parse(text) as unknown
    } catch {
      const safe = summarizeText(redactDataUrls(text), 700)
      throw new Error(`OpenRouter returned invalid JSON. ${safe}`)
    }

    const outputImageDataUrl = extractImageDataUrlFromChatCompletions(json)
    if (!outputImageDataUrl) {
      throw new Error('OpenRouter did not return an image in chat/completions response')
    }

    return {
      outputImageDataUrl,
      usage: extractUsage(json),
      cost: extractCost(json),
      requestId: requestIdHeader,
      responseId: extractResponseId(json),
    }
  } finally {
    clearTimeout(timeoutId)
  }
}

