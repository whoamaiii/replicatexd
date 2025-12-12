import type { ImageAnalysisResult } from './analysis'
import type { GenerationMode } from './maps'
import type { PromptBundle } from './prompts'

export type AnalyzeRequest = {
  imageDataUrl: string
  substanceId: string
  dose: number
  // Optional: override analysis model (OpenRouter model ID)
  analysisModelId?: string
  // Optional: RAG settings for the analysis stage (retrieval + biasing)
  rag?: RagSettings
}

export type AnalyzeResponse = ImageAnalysisResult

export type EffectsStudioSettings = {
  threshold: number
  maxEffects: number
}

export type RagSettings = {
  enabled?: boolean
  query?: string
  topK?: number
  draftModelId?: string
  finalModelId?: string
  mode?: 'retrieve_only' | 'draft_and_refine'
}

export type RagResult = {
  enabled: boolean
  query: string
  models?: {
    draftModelId: string
    finalModelId: string
  }
  retrieved?: Array<{
    id: string
    title: string
    score: number
    source: {
      type: 'visual_effect' | 'doc_md' | 'custom'
      path?: string
      effectId?: string
    }
  }>
  finalText?: string
}

export type GenerateRequest = {
  imageDataUrl: string
  analysis: ImageAnalysisResult
  // Optional: for library metadata (model used to produce the analysis)
  analysisModelId?: string
  // Optional: override generation model (OpenRouter model ID)
  generationModelId?: string
  // Optional: RAG pipeline settings (draft + refine)
  rag?: RagSettings
  // Optional: control how input image is used
  generationMode?: GenerationMode
  // Optional: hash to fetch map settings for prompt enhancement
  mapSourceHash?: string
  // Optional: Effects Studio selection settings (threshold + cap)
  effectsStudioSettings?: EffectsStudioSettings
}

export type GenerateResponse = {
  imageDataUrl: string
  mimeType: string
  usedPrompt: string
  rag?: RagResult
  projectId?: string
  generationId?: string
  downloadUrl?: string
  bundleUrl?: string
  isSaved?: boolean
  expiresAt?: string | null
}

export type PromptsRequest = {
  analysis: ImageAnalysisResult
  effectsStudioSettings?: EffectsStudioSettings
  // Optional: prompt generation can be tailored for image model quirks
  generationModelId?: string
}

export type PromptsResponse = {
  prompts: PromptBundle[]
}
