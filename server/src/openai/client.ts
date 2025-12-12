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

async function postJson(url: string, body: unknown, headers: Record<string, string>) {
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const raw = await res.text().catch(() => '')
    const safe = summarizeText(redactDataUrls(raw), 700)
    throw new Error(`OpenRouter request failed with status ${res.status}. ${safe}`)
  }

  const text = await res.text()
  try {
    return JSON.parse(text) as unknown
  } catch {
    const safe = summarizeText(redactDataUrls(text), 700)
    throw new Error(`OpenRouter returned invalid JSON. ${safe}`)
  }
}

function extractFirstOutputTextFromResponsesResponse(payload: unknown) {
  const asObj = payload as Record<string, unknown> | null
  if (!asObj || typeof asObj !== 'object') return null

  const direct = asObj.output_text
  if (typeof direct === 'string' && direct.trim().length > 0) return direct

  const output = asObj.output
  if (!Array.isArray(output)) return null

  for (const item of output) {
    if (!item || typeof item !== 'object') continue
    const content = (item as { content?: unknown }).content
    if (!Array.isArray(content)) continue

    for (const part of content) {
      if (!part || typeof part !== 'object') continue
      const type = (part as { type?: unknown }).type
      const text = (part as { text?: unknown }).text
      if (type === 'output_text' && typeof text === 'string' && text.trim().length > 0) {
        return text
      }
    }
  }

  return null
}

export async function callVisionAnalysis(input: {
  systemPrompt: string
  userPrompt: string
  imageDataUrl: string
}) {
  const env = getEnv()
  const baseUrl = normalizeBaseUrl(env.openrouterBaseUrl)
  const url = `${baseUrl}/responses`

  const body = {
    model: 'openai/gpt-5.2',
    input: [
      {
        type: 'message',
        role: 'system',
        content: [{ type: 'input_text', text: input.systemPrompt }],
      },
      {
        type: 'message',
        role: 'user',
        content: [
          { type: 'input_text', text: input.userPrompt },
          { type: 'input_image', image_url: input.imageDataUrl, detail: 'high' },
        ],
      },
    ],
    text: { format: { type: 'text' } },
  }

  const json = await postJson(url, body, buildCommonHeaders(env.openrouterApiKey))
  const outputText = extractFirstOutputTextFromResponsesResponse(json)
  if (!outputText) {
    throw new Error('OpenRouter did not return output_text content for analysis')
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

export async function callImageGeneration(input: { prompt: string; imageDataUrl?: string }) {
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
    model: 'black-forest-labs/flux.2-pro',
    messages,
    modalities: ['image', 'text'],
    image_config: {
      aspect_ratio: '3:4',
    },
    stream: false,
  }

  const json = await postJson(url, body, buildCommonHeaders(env.openrouterApiKey))
  const dataUrl = extractImageDataUrlFromChatCompletions(json)
  if (!dataUrl) {
    throw new Error('OpenRouter did not return an image for generation')
  }

  const parsed = parseDataUrl(dataUrl)
  if (!parsed) {
    throw new Error('OpenRouter returned an unsupported image url format')
  }

  return {
    imageBase64: parsed.imageBase64,
    mimeType: parsed.mimeType,
  }
}

