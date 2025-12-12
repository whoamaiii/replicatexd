import type { GenerateRequest, GenerateResponse } from '../../../shared/types/api'
import type { ImageAnalysisResult } from '../../../shared/types/analysis'
import type { PsychedelicEffect } from '../../../shared/types/analysis'
import type { MapPack, MapSettings } from '../../../shared/types/maps'
import type { RouterSettings } from '../../../shared/types/router'
import { callImageGeneration } from '../openai/client'
import fs from 'node:fs'
import type { VisualEffect } from '../../../shared/types/effects'
import { saveGeneratedAsset } from './libraryService'
import { buildControlSummary } from './mapService'
import { resolveRouterSettings, buildPlacementPlan } from './routerService'
import { selectUsedEffects } from '../../../shared/lib/effectsStudio'
import { getEnv } from '../config/env'
import { getModelMenuResponse, listGenerationCandidates, pickFirstModelIdByName } from './modelCatalogService'
import { runRagPipeline } from './rag/ragPipeline'

let cachedVisualEffects: VisualEffect[] | null = null
let cachedEffectById: Map<string, VisualEffect> | null = null

function looksLikeModerationError(err: unknown) {
  if (!(err instanceof Error)) return false
  const msg = err.message.toLowerCase()
  return msg.includes('moderation') || msg.includes('moderated')
}

function sanitizePromptForModeration(prompt: string) {
  const replacements: Array<[RegExp, string]> = [
    [/\bpsychedelic\b/gi, 'surreal'],
    [/\bLSD\b/gi, 'surreal'],
    [/\bpsilocybin\b/gi, 'surreal'],
    [/\bDMT\b/gi, 'surreal'],
    [/\b5\s*MeO\s*DMT\b/gi, 'surreal'],
    [/\bmescaline\b/gi, 'surreal'],
    [/\bacid\b/gi, 'surreal'],
    [/\bmushroom(s)?\b/gi, 'surreal'],
    [/\btrip(ping)?\b/gi, 'dreamlike'],
    [/\bdrug(s)?\b/gi, ''],
  ]

  let out = prompt
  for (const [re, replacement] of replacements) {
    out = out.replace(re, replacement)
  }

  out = out
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  // Add a clear constraint to avoid moderation triggers from "substance framing".
  return [
    'Constraint: Do not mention or depict drugs, drug paraphernalia, or substance use. Focus on abstract visual effects only.',
    out,
  ].join('\n')
}

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

type EffectsStudioSettings = {
  threshold: number
  maxEffects: number
}

function normalizeEffectsStudioSettings(settings?: EffectsStudioSettings) {
  return {
    threshold:
      typeof settings?.threshold === 'number'
        ? Math.min(1, Math.max(0, settings.threshold))
        : 0,
    maxEffects: typeof settings?.maxEffects === 'number' ? Math.max(0, Math.floor(settings.maxEffects)) : 8,
  }
}

function buildUsedPrompt(
  analysis: ImageAnalysisResult,
  mapSettings?: MapSettings,
  routerSettings?: RouterSettings,
  mapPack?: MapPack,
  effectsStudioSettings?: EffectsStudioSettings,
) {
  const { byId } = loadVisualEffects()
  const normalizedStudio = normalizeEffectsStudioSettings(effectsStudioSettings)
  const usedEffects: PsychedelicEffect[] = selectUsedEffects({
    effects: analysis.effects,
    threshold: normalizedStudio.threshold,
    maxEffects: normalizedStudio.maxEffects,
  })
  const allowSceneReplacement = usedEffects.some((e) => e.effectId === 'scene_replacement' && e.intensity >= 0.9)

  // Resolve router settings with defaults
  const resolvedRouter = resolveRouterSettings(routerSettings)

  // Build placement plan from router settings
  const placementPlan = buildPlacementPlan(resolvedRouter, usedEffects, mapPack)

  // Apply group multipliers to effect intensities for display
  const topEffects = [...usedEffects]
    .map((e, idx) => {
      const meta = byId.get(e.effectId)
      const label = meta?.displayName ?? e.effectId
      const simulation =
        meta?.simulationHints?.length
          ? meta.simulationHints.join(' · ')
          : 'Apply this effect in a plausible way.'

      // Apply group multiplier to displayed intensity
      const groupMult = resolvedRouter.groupMultipliers[e.group] ?? 1.0
      const adjustedIntensity = Math.min(1.0, e.intensity * groupMult)

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

      return `${idx + 1}. ${label}. effectId ${e.effectId}. group ${e.group}. intensity ${adjustedIntensity.toFixed(2)}. ${surfaceRule} simulation: ${simulation}`
    })

  // Build control summary from map settings
  const controlSummary = mapSettings ? buildControlSummary(mapSettings) : ''

  const prompt = [
    analysis.prompts.openAIImagePrompt,
    '',
    `Base scene: ${analysis.baseSceneDescription}`,
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
    controlSummary,
    placementPlan.summary, // Add placement plan from router
    '',
    'Emphasize these effects:',
    ...topEffects,
    '',
    'Output a single image only.',
  ].join('\n')

  return {
    prompt,
    usedEffects,
    effectsStudioSettings: normalizedStudio,
  }
}

function buildDefaultRagQuery(analysis: ImageAnalysisResult) {
  const base = analysis.baseSceneDescription?.trim() || 'a photo'
  const effects = Array.isArray(analysis.effects) ? analysis.effects : []
  const top = effects
    .slice()
    .sort((a, b) => (b.intensity ?? 0) - (a.intensity ?? 0))
    .slice(0, 6)
    .map((e) => `${e.effectId} (${e.group})`)
    .join(', ')

  const dose = typeof analysis.dose === 'number' ? analysis.dose : undefined
  const doseText = typeof dose === 'number' ? `dose ${Math.round(dose * 100) / 100}` : ''

  return [
    `Generate surreal psychedelic-style visual effect guidance for: ${base}.`,
    top ? `Emphasize: ${top}.` : '',
    doseText ? `Intensity: ${doseText}.` : '',
    'Keep the original scene recognizable; embed patterns into surfaces/materials.',
    'Avoid floating wireframe overlays and avoid scene replacement unless explicitly requested.',
  ]
    .filter(Boolean)
    .join(' ')
    .trim()
}

export type GenerateImageOptions = GenerateRequest & {
  projectId?: string
  originalAnalysis?: ImageAnalysisResult
  saveToLibrary?: boolean
  mapSettings?: MapSettings
  routerSettings?: RouterSettings
  mapPack?: MapPack
}

async function resolveGenerationModelId(request: GenerateRequest): Promise<string> {
  const env = getEnv()

  if (typeof request.generationModelId === 'string' && request.generationModelId.trim().length > 0) {
    return request.generationModelId.trim()
  }

  if (typeof env.legacyGenerationModelId === 'string' && env.legacyGenerationModelId.trim().length > 0) {
    return env.legacyGenerationModelId.trim()
  }

  const menu = await getModelMenuResponse()
  const candidates = listGenerationCandidates(menu.all)
  const picked = pickFirstModelIdByName(candidates, env.defaultGenerationModelName)
  if (picked) return picked

  throw new Error(
    `Could not resolve a default generation model. Set DEFAULT_GENERATION_MODEL_NAME (current: ${JSON.stringify(env.defaultGenerationModelName)}), or choose a model in the Models view.`,
  )
}

export async function generateImageFromAnalysis(
  request: GenerateImageOptions,
): Promise<GenerateResponse> {
  const built = buildUsedPrompt(
    request.analysis,
    request.mapSettings,
    request.routerSettings,
    request.mapPack,
    request.effectsStudioSettings,
  )
  const basePrompt = built.prompt

  // Determine whether to include the input image based on generation mode
  // Default to 'base_image_edit' for backward compatibility
  const generationMode = request.generationMode || 'base_image_edit'
  const imageDataUrl = generationMode === 'prompt_only' ? undefined : request.imageDataUrl
  const generationModelId = await resolveGenerationModelId(request)
  const analysisModelId =
    typeof request.analysisModelId === 'string' && request.analysisModelId.trim().length > 0
      ? request.analysisModelId.trim()
      : undefined

  let usedPrompt = basePrompt
  let result: Awaited<ReturnType<typeof callImageGeneration>>
  let ragResult: GenerateResponse['rag'] | undefined

  const rag = request.rag
  if (rag?.enabled) {
    const query = typeof rag.query === 'string' && rag.query.trim().length > 0
      ? rag.query.trim()
      : buildDefaultRagQuery(request.analysis)

    try {
      const fromAnalysis =
        request.analysis?.rag?.finalText?.trim().length
          ? request.analysis.rag.finalText.trim()
          : request.analysis?.prompts?.ragAddendum?.trim().length
            ? request.analysis.prompts.ragAddendum.trim()
            : ''

      if (fromAnalysis) {
        ragResult = request.analysis.rag
          ? request.analysis.rag
          : { enabled: true, query, finalText: fromAnalysis }

        usedPrompt = [
          usedPrompt,
          '',
          '---',
          'RAG Augmentation (apply these additional constraints and effect cues):',
          fromAnalysis,
        ].join('\n')
      } else {
        const pipeline = await runRagPipeline({
          enabled: true,
          query,
          topK: rag.topK,
          draftModelId: rag.draftModelId,
          finalModelId: rag.finalModelId,
          mode: rag.mode ?? 'draft_and_refine',
          analysis: request.analysis,
        })

        ragResult = {
          enabled: pipeline.enabled,
          query: pipeline.query,
          models: pipeline.models,
          retrieved: pipeline.retrieved,
          finalText: pipeline.finalText,
        }

        if (pipeline.enabled && pipeline.finalText.trim().length > 0) {
          usedPrompt = [
            usedPrompt,
            '',
            '---',
            'RAG Augmentation (apply these additional constraints and effect cues):',
            pipeline.finalText.trim(),
          ].join('\n')
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'RAG pipeline failed'
      console.warn('[rag] failed, proceeding without augmentation:', message)
      ragResult = { enabled: false, query }
    }
  }

  try {
    result = await callImageGeneration({ prompt: usedPrompt, imageDataUrl, modelId: generationModelId })
  } catch (err) {
    if (!looksLikeModerationError(err)) throw err

    // Retry once with a moderation-safe prompt variant.
    const sanitized = sanitizePromptForModeration(usedPrompt)
    console.warn('[generate] Moderation blocked request, retrying with sanitized prompt')
    usedPrompt = sanitized
    result = await callImageGeneration({ prompt: usedPrompt, imageDataUrl, modelId: generationModelId })
  }

  const generatedImageDataUrl = `data:${result.mimeType};base64,${result.imageBase64}`
  const mimeType = result.mimeType

  const response: GenerateResponse = {
    imageDataUrl: generatedImageDataUrl,
    mimeType,
    usedPrompt,
    rag: ragResult,
  }

  if (request.saveToLibrary !== false) {
    try {
      const modelMenu = await getModelMenuResponse().catch(() => null)
      const generationModelName =
        modelMenu?.all.find((m) => m.id === generationModelId)?.displayName || undefined
      const analysisModelName =
        analysisModelId ? modelMenu?.all.find((m) => m.id === analysisModelId)?.displayName || undefined : undefined

      const saved = await saveGeneratedAsset({
        imageDataUrl: generatedImageDataUrl,
        mimeType,
        usedPrompt,
        model: generationModelId,
        analysisModelId,
        analysisModelName,
        generationModelId,
        generationModelName,
        projectId: request.projectId,
        originalAnalysis: request.originalAnalysis || request.analysis,
        workingAnalysis: request.analysis,
        inputImageDataUrl: request.imageDataUrl,
        routerSettings: request.routerSettings,
        effectsStudio: {
          threshold: built.effectsStudioSettings.threshold,
          maxEffects: built.effectsStudioSettings.maxEffects,
          usedEffects: built.usedEffects,
        },
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
