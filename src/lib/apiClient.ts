import type {
  AnalyzeRequest,
  AnalyzeResponse,
  GenerateRequest,
  GenerateResponse,
} from '../../shared/types/api'

type ApiError = {
  message: string
}

async function postJson<TRequest, TResponse>(url: string, body: TRequest) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    let message = 'Request failed'
    try {
      const data = (await res.json()) as Partial<ApiError>
      if (typeof data.message === 'string' && data.message.trim().length > 0) {
        message = data.message
      }
    } catch {
      // ignore
    }
    throw new Error(message)
  }

  return (await res.json()) as TResponse
}

export function analyzeImage(request: AnalyzeRequest) {
  return postJson<AnalyzeRequest, AnalyzeResponse>('/api/analyze', request)
}

export function generateImage(request: GenerateRequest) {
  return postJson<GenerateRequest, GenerateResponse>('/api/generate', request)
}

