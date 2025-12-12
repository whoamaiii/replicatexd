import type {
  AnalyzeRequest,
  AnalyzeResponse,
  GenerateRequest,
  GenerateResponse,
} from '../../shared/types/api'
import type {
  LibraryListResponse,
  LibraryProject,
  SaveProjectRequest,
} from '../../shared/types/library'
import type { ImageAnalysisResult } from '../../shared/types/analysis'

type ApiError = {
  message: string
}

const DEFAULT_TIMEOUT_MS = 60_000
const ANALYZE_TIMEOUT_MS = 150_000
const GENERATE_TIMEOUT_MS = 210_000

function isAbortError(err: unknown) {
  return (
    !!err &&
    typeof err === 'object' &&
    'name' in err &&
    typeof (err as { name?: unknown }).name === 'string' &&
    (err as { name: string }).name === 'AbortError'
  )
}

async function postJson<TRequest, TResponse>(
  url: string,
  body: TRequest,
  options?: { timeoutMs?: number },
) {
  const controller = new AbortController()
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    })

    if (!res.ok) {
      const statusLabel = res.statusText ? ` ${res.statusText}` : ''
      let message = `Request failed (${res.status}${statusLabel})`
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
  } catch (err) {
    if (isAbortError(err)) {
      throw new Error(
        `Request timed out after ${Math.round(timeoutMs / 1000)}s. If you are running locally, ensure the API server is running (dev: http://127.0.0.1:5174) and try again.`,
      )
    }
    if (err instanceof TypeError) {
      throw new Error(
        'Could not reach the API server. If you are running locally, start the backend (npm run dev) and try again.',
      )
    }
    throw err
  } finally {
    window.clearTimeout(timeoutId)
  }
}

export function analyzeImage(request: AnalyzeRequest) {
  return postJson<AnalyzeRequest, AnalyzeResponse>('/api/analyze', request, {
    timeoutMs: ANALYZE_TIMEOUT_MS,
  })
}

export type GenerateImageRequest = GenerateRequest & {
  projectId?: string
  originalAnalysis?: ImageAnalysisResult
  saveToLibrary?: boolean
}

export function generateImage(request: GenerateImageRequest) {
  return postJson<GenerateImageRequest, GenerateResponse>('/api/generate', request, {
    timeoutMs: GENERATE_TIMEOUT_MS,
  })
}

async function getJson<TResponse>(
  url: string,
  options?: { timeoutMs?: number },
): Promise<TResponse> {
  const controller = new AbortController()
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
    })

    if (!res.ok) {
      const statusLabel = res.statusText ? ` ${res.statusText}` : ''
      let message = `Request failed (${res.status}${statusLabel})`
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
  } catch (err) {
    if (isAbortError(err)) {
      throw new Error(
        `Request timed out after ${Math.round(timeoutMs / 1000)}s.`,
      )
    }
    if (err instanceof TypeError) {
      throw new Error('Could not reach the API server.')
    }
    throw err
  } finally {
    window.clearTimeout(timeoutId)
  }
}

export function fetchLibraryProjects(): Promise<LibraryListResponse> {
  return getJson<LibraryListResponse>('/api/library/projects')
}

export function fetchLibraryProject(projectId: string): Promise<LibraryProject> {
  return getJson<LibraryProject>(`/api/library/projects/${projectId}`)
}

export function saveProject(projectId: string, isSaved: boolean): Promise<LibraryProject> {
  return postJson<SaveProjectRequest, LibraryProject>(
    `/api/library/projects/${projectId}/save`,
    { isSaved }
  )
}

export function getLibraryFileUrl(projectId: string, generationId: string): string {
  return `/api/library/file/${projectId}/${generationId}`
}

export function getLibraryBundleUrl(projectId: string, generationId: string): string {
  return `/api/library/bundle/${projectId}/${generationId}`
}


