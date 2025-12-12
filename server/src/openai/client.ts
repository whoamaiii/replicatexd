import { getEnv } from '../config/env'
import { Buffer } from 'node:buffer'

function normalizeBaseUrl(input: string) {
  return input.replace(/\/+$/g, '')
}

export class HttpError extends Error {
  status: number
  details?: string

  constructor(status: number, message: string, details?: string) {
    super(message)
    this.name = 'HttpError'
    this.status = status
    this.details = details
  }
}

const ANALYSIS_TIMEOUT_MS = 120_000
const GENERATION_TIMEOUT_MS = 180_000

function buildCommonHeaders(apiKey: string) {
  return {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': 'http://localhost:5173',
    'X-Title': 'Psychedelic Visual Replicasion Lab',
  }
}

function isAbortError(err: unknown) {
  return (
    !!err &&
    typeof err === 'object' &&
    'name' in err &&
    typeof (err as { name?: unknown }).name === 'string' &&
    (err as { name: string }).name === 'AbortError'
  )
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

function tryParseOpenRouterError(raw: string) {
  try {
    const parsed = JSON.parse(raw) as unknown
    const errorObj = (parsed as { error?: unknown } | null)?.error
    const message = (errorObj as { message?: unknown } | null)?.message
    const metadata = (errorObj as { metadata?: unknown } | null)?.metadata
    const metadataRaw = (metadata as { raw?: unknown } | null)?.raw

    return {
      message: typeof message === 'string' ? message : null,
      metadataRaw: typeof metadataRaw === 'string' ? metadataRaw : null,
    }
  } catch {
    return null
  }
}

function buildOpenRouterPublicErrorMessage(status: number, rawBody: string) {
  const parsed = tryParseOpenRouterError(rawBody)
  const metadataRaw = parsed?.metadataRaw ?? ''
  const isModerated =
    rawBody.includes('Request Moderated') ||
    metadataRaw.includes('Request Moderated') ||
    rawBody.toLowerCase().includes('moderated') ||
    metadataRaw.toLowerCase().includes('moderated')

  if (isModerated) {
    return 'Image generation was blocked by the provider moderation filter. Try simplifying the prompt, removing drug/sex/violence references, or switching to a different model/provider.'
  }

  const providerMessage = parsed?.message
  if (status === 401 || status === 403) {
    return 'OpenRouter authentication failed. Check `OPENROUTER_API_KEY` and try again.'
  }
  if (typeof providerMessage === 'string' && providerMessage.trim().length > 0) {
    return `OpenRouter rejected the request (${status}). ${providerMessage}`
  }
  return `OpenRouter rejected the request (${status}).`
}

async function postJson(
  url: string,
  body: unknown,
  headers: Record<string, string>,
  options?: { timeoutMs?: number },
) {
  const controller = new AbortController()
  const timeoutMs = options?.timeoutMs ?? ANALYSIS_TIMEOUT_MS
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    })

    if (!res.ok) {
      const raw = await res.text().catch(() => '')
      const safe = summarizeText(redactDataUrls(raw), 700)
      const publicMessage = buildOpenRouterPublicErrorMessage(res.status, raw)
      throw new HttpError(res.status, publicMessage, safe)
    }

    const text = await res.text()
    try {
      return JSON.parse(text) as unknown
    } catch {
      const safe = summarizeText(redactDataUrls(text), 700)
      throw new Error(`OpenRouter returned invalid JSON. ${safe}`)
    }
  } catch (err) {
    if (isAbortError(err)) {
      throw new Error(`OpenRouter request timed out after ${Math.round(timeoutMs / 1000)}s.`)
    }
    throw err
  } finally {
    clearTimeout(timeoutId)
  }
}

function extractTextFromChatCompletions(payload: unknown) {
  const asObj = payload as Record<string, unknown> | null
  if (!asObj || typeof asObj !== 'object') return null

  const choices = asObj.choices
  if (!Array.isArray(choices) || !choices[0] || typeof choices[0] !== 'object') return null
  const message = (choices[0] as { message?: unknown }).message
  if (!message || typeof message !== 'object') return null

  const content = (message as { content?: unknown }).content
  if (typeof content === 'string' && content.trim().length > 0) return content

  if (Array.isArray(content)) {
    const parts: string[] = []
    for (const part of content) {
      if (!part || typeof part !== 'object') continue
      const type = (part as { type?: unknown }).type
      const text = (part as { text?: unknown }).text
      if ((type === 'text' || type === 'output_text') && typeof text === 'string' && text.trim().length > 0) {
        parts.push(text)
      }
    }
    const joined = parts.join('\n').trim()
    return joined.length > 0 ? joined : null
  }

  return null
}

export async function callTextCompletion(input: {
  systemPrompt: string
  userPrompt: string
  modelId: string
  temperature?: number
  maxTokens?: number
}) {
  const env = getEnv()
  const baseUrl = normalizeBaseUrl(env.openrouterBaseUrl)
  const url = `${baseUrl}/chat/completions`

  const body: Record<string, unknown> = {
    model: input.modelId,
    messages: [
      { role: 'system', content: input.systemPrompt },
      { role: 'user', content: input.userPrompt },
    ],
    stream: false,
  }

  if (typeof input.temperature === 'number' && Number.isFinite(input.temperature)) {
    body.temperature = input.temperature
  }
  if (typeof input.maxTokens === 'number' && Number.isFinite(input.maxTokens)) {
    body.max_tokens = input.maxTokens
  }

  const json = await postJson(url, body, buildCommonHeaders(env.openrouterApiKey), {
    timeoutMs: ANALYSIS_TIMEOUT_MS,
  })
  const outputText = extractTextFromChatCompletions(json)
  if (!outputText) {
    throw new Error('OpenRouter did not return text content')
  }
  return outputText
}

export async function callVisionAnalysis(input: {
  systemPrompt: string
  userPrompt: string
  imageDataUrl: string
  modelId: string
}) {
  const env = getEnv()
  const baseUrl = normalizeBaseUrl(env.openrouterBaseUrl)
  const url = `${baseUrl}/chat/completions`

  const body = {
    model: input.modelId,
    messages: [
      {
        role: 'system',
        content: input.systemPrompt,
      },
      {
        role: 'user',
        content: [
          { type: 'text', text: input.userPrompt },
          { type: 'image_url', image_url: { url: input.imageDataUrl } },
        ],
      },
    ],
    stream: false,
  }

  const json = await postJson(url, body, buildCommonHeaders(env.openrouterApiKey), {
    timeoutMs: ANALYSIS_TIMEOUT_MS,
  })
  const outputText = extractTextFromChatCompletions(json)
  if (!outputText) {
    throw new Error('OpenRouter did not return text content for analysis')
  }
  return outputText
}

function parseDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,([\s\S]+)$/)
  if (!match) return null
  const mimeType = match[1]!
  const imageBase64 = match[2]!.trim()
  if (!imageBase64) return null
  return { mimeType, imageBase64 }
}

function isHttpUrl(input: string) {
  return input.startsWith('http://') || input.startsWith('https://')
}

async function fetchImageUrlAsBase64(url: string, options: { timeoutMs: number }) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), options.timeoutMs)

  try {
    const res = await fetch(url, { method: 'GET', signal: controller.signal })
    if (!res.ok) {
      throw new Error(`Image download failed (${res.status})`)
    }

    const contentType = res.headers.get('content-type') || 'application/octet-stream'
    const buf = Buffer.from(await res.arrayBuffer())
    const imageBase64 = buf.toString('base64')
    return { mimeType: contentType, imageBase64 }
  } finally {
    clearTimeout(timeoutId)
  }
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

export async function callImageGeneration(input: { prompt: string; imageDataUrl?: string; modelId: string }) {
  if (!input.modelId || input.modelId.trim().length === 0) {
    throw new Error('Missing generation model id')
  }
  const env = getEnv()
  const baseUrl = normalizeBaseUrl(env.openrouterBaseUrl)
  const url = `${baseUrl}/chat/completions`

  const messages = input.imageDataUrl
    ? [
        {
          role: 'user',
          content: [
            { type: 'text', text: input.prompt },
            { type: 'image_url', image_url: { url: input.imageDataUrl } },
          ],
        },
      ]
    : [{ role: 'user', content: input.prompt }]

  const body = {
    model: input.modelId,
    messages,
    modalities: ['image', 'text'],
    image_config: {
      aspect_ratio: '3:4',
    },
    stream: false,
  }

  const json = await postJson(url, body, buildCommonHeaders(env.openrouterApiKey), {
    timeoutMs: GENERATION_TIMEOUT_MS,
  })
  const imageUrlOrDataUrl = extractImageDataUrlFromChatCompletions(json)
  if (!imageUrlOrDataUrl) {
    throw new Error('OpenRouter did not return an image for generation')
  }

  const parsed = parseDataUrl(imageUrlOrDataUrl)
  if (parsed) {
    return {
      imageBase64: parsed.imageBase64,
      mimeType: parsed.mimeType,
    }
  }

  if (isHttpUrl(imageUrlOrDataUrl)) {
    const downloaded = await fetchImageUrlAsBase64(imageUrlOrDataUrl, {
      timeoutMs: GENERATION_TIMEOUT_MS,
    })
    return downloaded
  }

  throw new Error('OpenRouter returned an unsupported image url format')
}
