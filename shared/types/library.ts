import type { ImageAnalysisResult } from './analysis'

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
}

/**
 * A single generation within a project.
 */
export type LibraryGeneration = {
  generationId: string
  createdAt: string
  substanceId: string
  dose: number
  model: string
  imagePath: string
  mimeType: string
  usedPrompt: string
  bundlePath?: string
  originalAnalysis: ImageAnalysisResult
  workingAnalysis: ImageAnalysisResult
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
