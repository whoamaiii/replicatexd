import type { GenerateRequest, GenerateResponse } from '../../../shared/types/api'
import type { ImageAnalysisResult } from '../../../shared/types/analysis'
import { callImageGeneration } from '../openai/client'
import fs from 'node:fs'
import type { VisualEffect } from '../../../shared/types/effects'
import { saveGeneratedAsset } from './libraryService'

let cachedVisualEffects: VisualEffect[] | null = null
let cachedEffectById: Map<string, VisualEffect> | null = null

function loadVisualEffects() {
  if (cachedVisualEffects && cachedEffectById) {
    return { effects: cachedVisualEffects, byId: cachedEffectById }
  }

  const fileUrl = new URL('../../../data/visual_effects.json', import.meta.url)
  const raw = fs.readFileSync(fileUrl, 'utf8')
  const parsed = JSON.parse(raw) as unknown
  const effects = Array.isArray(parsed) ? (parsed as VisualEffect[]) : []
  const byId = new Map<string, VisualEffect>(effects.map((e) => [e.id, e]))

  cachedVisualEffects = effects
  cachedEffectById = byId

  return { effects, byId }
}

function buildUsedPrompt(analysis: ImageAnalysisResult) {
  const { byId } = loadVisualEffects()
  const allowSceneReplacement = analysis.effects.some(
    (e) => e.effectId === 'scene_replacement' && e.intensity >= 0.9,
  )

  const topEffects = [...analysis.effects]
    .sort((a, b) => b.intensity - a.intensity)
    .slice(0, 8)
    .map((e, idx) => {
      const meta = byId.get(e.effectId)
      const label = meta?.displayName ?? e.effectId
      const simulation = meta?.notesOnSimulation ?? 'Apply this effect in a plausible way.'
      const surfaceRule =
        e.group === 'geometry'
          ? 'Apply as texture and material patterning on existing surfaces. Do not create floating structures.'
          : e.group === 'distortions'
            ? 'Apply as a coherent deformation of existing surfaces and edges. Keep the camera stable.'
            : e.group === 'enhancements'
              ? 'Apply as plausible changes to color, contrast, glow, and texture salience.'
              : e.group === 'hallucinations'
                ? 'If present, keep hallucinated content coherent and integrated with the scene lighting and occlusion.'
                : 'Apply as changes in interpretation and coupling, not as random decorations.'

      return `${idx + 1}. ${label}. effectId ${e.effectId}. group ${e.group}. intensity ${e.intensity}. ${surfaceRule} simulation: ${simulation}`
    })

  return [
    analysis.prompts.openAIImagePrompt,
    '',
    `Base scene: ${analysis.baseSceneDescription}`,
    `Substance id: ${analysis.substanceId}`,
    `Dose: ${analysis.dose}`,
    '',
    'Critical constraints:',
    '1. Geometric patterns and repeating structure must be embedded in surfaces and materials, not floating in space.',
    '2. Keep geometry texture bound: follow surface perspective, texture flow, and occlusion, and respect lighting.',
    '3. Do not add separate geometric objects, decals, or overlay planes that are not attached to scene surfaces.',
    allowSceneReplacement
      ? '4. Scene replacement is allowed only if it stays visually coherent and still uses surface embedded structure.'
      : '4. Do not replace the scene. Keep the original environment recognizable and preserve the camera framing.',
    '5. Avoid wireframe nets, floating lattice cages, and transparent geometry overlays that sit in front of the scene.',
    '6. Avoid portals, void backgrounds, and cosmic space transitions unless explicitly required by scene replacement.',
    '',
    'Emphasize these effects:',
    ...topEffects,
    '',
    'Output a single image only.',
  ].join('\n')
}

export type GenerateImageOptions = GenerateRequest & {
  projectId?: string
  originalAnalysis?: ImageAnalysisResult
  saveToLibrary?: boolean
}

export async function generateImageFromAnalysis(
  request: GenerateImageOptions
): Promise<GenerateResponse> {
  const usedPrompt = buildUsedPrompt(request.analysis)
  const result = await callImageGeneration({ prompt: usedPrompt, imageDataUrl: request.imageDataUrl })

  const imageDataUrl = `data:${result.mimeType};base64,${result.imageBase64}`
  const mimeType = result.mimeType

  const response: GenerateResponse = {
    imageDataUrl,
    mimeType,
    usedPrompt,
  }

  if (request.saveToLibrary !== false) {
    try {
      const saved = await saveGeneratedAsset({
        imageDataUrl,
        mimeType,
        usedPrompt,
        model: 'black-forest-labs/flux.2-pro',
        projectId: request.projectId,
        originalAnalysis: request.originalAnalysis || request.analysis,
        workingAnalysis: request.analysis,
        inputImageDataUrl: request.imageDataUrl,
      })

      response.projectId = saved.project.projectId
      response.generationId = saved.generation.generationId
      response.downloadUrl = saved.downloadUrl
      response.bundleUrl = saved.bundleUrl
      response.isSaved = saved.project.isSaved
      response.expiresAt = saved.project.expiresAt
    } catch (error) {
      console.error('[Library] Failed to save generated asset:', error)
    }
  }

  return response
}


