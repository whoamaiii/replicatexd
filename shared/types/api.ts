import type { ImageAnalysisResult } from './analysis'

export type AnalyzeRequest = {
  imageDataUrl: string
  substanceId: string
  dose: number
}

export type AnalyzeResponse = ImageAnalysisResult

export type GenerateRequest = {
  imageDataUrl: string
  analysis: ImageAnalysisResult
}

export type GenerateResponse = {
  imageDataUrl: string
  mimeType: string
  usedPrompt: string
  projectId?: string
  generationId?: string
  downloadUrl?: string
  bundleUrl?: string
  isSaved?: boolean
  expiresAt?: string | null
}


