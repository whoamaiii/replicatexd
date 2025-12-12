import type { ImageAnalysisResult, PsychedelicEffect } from './analysis'
import type { RouterSettings } from './router'

/**
 * A project groups multiple generations together.
 * Projects can be temporary (auto-deleted after inactivity) or saved (permanent).
 */
export type LibraryProject = {
  projectId: string
  createdAt: string
  lastActivityAt: string
  isSaved: boolean
  expiresAt: string | null
  inputImagePath?: string
  generations: LibraryGeneration[]
  trashedAt?: string
  // Default router settings for this project
  defaultRouterSettings?: RouterSettings
}

/**
 * A single generation within a project.
 */
export type LibraryGeneration = {
  generationId: string
  createdAt: string
  substanceId: string
  dose: number
  // Backward-compatible: historically a single model string (now the generation model id).
  model: string
  analysisModelId?: string
  analysisModelName?: string
  generationModelId?: string
  generationModelName?: string
  imagePath: string
  mimeType: string
  usedPrompt: string
  bundlePath?: string
  originalAnalysis: ImageAnalysisResult
  workingAnalysis: ImageAnalysisResult
  // Router settings used for this generation
  routerSettings?: RouterSettings
  // Effects Studio selection settings used for this generation
  effectsStudio?: {
    threshold: number
    maxEffects: number
    usedEffects: PsychedelicEffect[]
  }
}

/**
 * Summary of a project for listing purposes.
 */
export type LibraryProjectSummary = {
  projectId: string
  createdAt: string
  lastActivityAt: string
  isSaved: boolean
  expiresAt: string | null
  generationCount: number
  latestSubstanceId?: string
  latestDose?: number
}

/**
 * Response from the list projects endpoint.
 */
export type LibraryListResponse = {
  projects: LibraryProjectSummary[]
  total: number
}

/**
 * Request body for toggling project save status.
 */
export type SaveProjectRequest = {
  isSaved: boolean
}
