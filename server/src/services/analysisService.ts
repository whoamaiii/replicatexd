import fs from 'node:fs'
import { z } from 'zod'
import type { AnalyzeRequest } from '../../../shared/types/api'
import type { ImageAnalysisResult } from '../../../shared/types/analysis'
import type { VisualEffect } from '../../../shared/types/effects'
import { VisualEffectGroups, VisualEffectScales } from '../../../shared/types/effects'
import { callVisionAnalysis } from '../openai/client'

const VisualEffectSchema = z.object({
  id: z.string().min(1),
  group: z.enum(VisualEffectGroups),
  displayName: z.string().min(1),
  shortDescription: z.string().min(1),
  longDescription: z.string().min(1),
  typicalIntensityRange: z.tuple([z.number().min(0).max(1), z.number().min(0).max(1)]),
  primaryScales: z.array(z.enum(VisualEffectScales)).min(1),
  commonSubstances: z.array(z.string().min(1)).optional(),
  notesOnSimulation: z.string().min(1),
})

const VisualEffectsFileSchema = z.array(VisualEffectSchema).min(1)

let cachedEffects: VisualEffect[] | null = null
let cachedEffectById: Map<string, VisualEffect> | null = null
let cachedEffectIds: string[] | null = null

function loadVisualEffects() {
  if (cachedEffects && cachedEffectById && cachedEffectIds) {
    return { effects: cachedEffects, byId: cachedEffectById, ids: cachedEffectIds }
  }

  const fileUrl = new URL('../../../data/visual_effects.json', import.meta.url)
  const raw = fs.readFileSync(fileUrl, 'utf8')
  const parsed = JSON.parse(raw) as unknown
  const effects = VisualEffectsFileSchema.parse(parsed) as VisualEffect[]

  const byId = new Map<string, VisualEffect>()
  const ids: string[] = []
  for (const effect of effects) {
    if (byId.has(effect.id)) continue
    byId.set(effect.id, effect)
    ids.push(effect.id)
  }

  cachedEffects = effects
  cachedEffectById = byId
  cachedEffectIds = ids

  return { effects, byId, ids }
}

function isAnalysisDebugEnabled() {
  const raw = process.env.ANALYSIS_DEBUG
  if (!raw) return false
  const normalized = raw.trim().toLowerCase()
  return normalized === 'true' || normalized === '1' || normalized === 'yes' || normalized === 'on'
}

function formatZodError(error: z.ZodError) {
  const issues = error.issues.slice(0, 12).map((i) => {
    const path = i.path.length ? i.path.join('.') : '(root)'
    return `${path}: ${i.message}`
  })
  const suffix = error.issues.length > issues.length ? ` (+${error.issues.length - issues.length} more)` : ''
  return `${issues.join('; ')}${suffix}`
}

function getSubstanceSignature(substanceId: string) {
  const map: Record<string, string> = {
    lsd: 'Sharp, neon leaning clarity: vivid color and contrast, animated surfaces, intricate geometry.',
    psilocybin:
      'Softer, organic drift: breathing surfaces, living textures, nature linked motifs, emotional warmth.',
    dmt: 'Rapid onset hyper geometry: tunnels and mandalas, possible scene replacement and entities at high intensity.',
    five_meo: 'Luminous dissolution: boundary loss, bloom and bright field effects, minimal structured imagery.',
    mescaline: 'Crystalline ornamentation: stable form constant geometry, luminous color brilliance, steady coherence.',
  }

  return map[substanceId] ?? 'Substance specific signature is unknown.'
}

function buildSystemPrompt(effectCatalogText: string) {
  return [
    'You are Psychedelic Visual Replicasion Lab.',
    'You are a psychedelic visual phenomenology specialist.',
    'Your job is to analyze an input photo and map plausible psychedelic visuals onto a fixed effect taxonomy.',
    '',
    'Fixed taxonomy (non negotiable):',
    'The effect taxonomy is defined in data/visual_effects.json. It is a CLOSED set.',
    'Every entry in effects[] MUST use an effectId that exists in the allowlist below. Never invent new effectId values.',
    'If you cannot find a perfect match, choose the closest existing effectId and lower intensity, but do not invent ids.',
    '',
    'VisualEffectGroup values (what they mean):',
    'enhancements: increased salience and clarity (color, contrast, glow, texture detail).',
    'distortions: warping, drifting, morphing, motion persistence, optical instability.',
    'geometry: structured repeating patterns and form constants (lattices, spirals, tunnels, fractals, mandalas).',
    'hallucinations: novel content or scene level replacement (internal scenes, entities, external objects).',
    'perceptual: cross modal and higher order perceptual changes (pareidolia, depth and scale shifts, time slicing).',
    '',
    'Staged process (do this internally; output ONLY the final JSON):',
    'Step 1: Write a sober, neutral photograph description in 1 to 3 sentences. This becomes baseSceneDescription.',
    'Step 2: Simulate the chosen substanceId and dose using ONLY plausible psychedelic visuals, biased by substance presets and dose.',
    'Step 3: Output a single JSON object that strictly matches the ImageAnalysisResult type in shared/types/analysis.ts.',
    '',
    'Intensity calibration (intensity is always 0 to 1, rounded to one decimal):',
    '0.0 means the effect is absent.',
    '0.1 to 0.3 means subtle.',
    '0.4 to 0.6 means clear but not overwhelming.',
    '0.7 to 1.0 means dominant.',
    '',
    'Dose interpretation (dose is normalized 0 to 1):',
    'Threshold: about 0.0 to 0.3. Mostly enhancements and mild distortions. Geometry is subtle. Hallucinations are unlikely.',
    'Common: about 0.3 to 0.7. Clear distortions and geometry while the scene remains mostly anchored.',
    'Strong: about 0.7 to 1.0. Immersive geometry and hallucinations become plausible depending on substance.',
    '',
    'Substance presets (use these to bias which effects appear and their strength):',
    'lsd: sharp high contrast and high saturation, intricate surface bound geometry, visual drifting, tracers, synesthetic coupling.',
    'psilocybin: softer organic breathing and living textures, nature linked motifs, warmer palette, richer internal imagery at strong dose.',
    'dmt (N,N DMT): extremely rapid escalation, hyper detailed high symmetry geometry, tunnels and mandalas, hyper clarity then overload, entities and scene replacement plausible at strong dose.',
    'five_meo (5 MeO DMT): luminous dissolution and boundary loss, bloom and bright field effects, minimal structured imagery unless dose is strong.',
    'mescaline: crystalline ornamentation, stable form constant geometry (lattice, spiral, tunnel, cobweb), vivid color brilliance, steady coherent motion.',
    'two_c_b and related 2C compounds: playful neon overlays, crystalline surfaces, stable pattern overlays more than scene replacement.',
    '',
    'Hard rules:',
    '1. Output JSON only. No markdown, no code fences, no commentary.',
    '2. Do not use the ASCII hyphen character "-" in any string values.',
    '3. Every effects[].effectId must come from the allowed list below. Never invent new ids.',
    '4. effects[].group MUST match the group shown in the allowed list for that effectId.',
    '5. effects[].intensity MUST be a number from 0 to 1.',
    '6. effects[] must not contain duplicate effectId values.',
    '7. In openAIImagePrompt, keep geometric patterns embedded in scene surfaces and materials, aligned to perspective and lighting.',
    '',
    'Allowed effects (id | group | displayName):',
    effectCatalogText,
    '',
    'ImageAnalysisResult JSON shape (must match shared/types/analysis.ts exactly):',
    '{',
    '  "substanceId": string,',
    '  "dose": number,',
    '  "baseSceneDescription": string,',
    '  "geometrySummary"?: string,',
    '  "distortionSummary"?: string,',
    '  "hallucinationSummary"?: string,',
    '  "effects": Array<{',
    '    "effectId": string,',
    '    "group": "enhancements" | "distortions" | "geometry" | "hallucinations" | "perceptual",',
    '    "intensity": number,',
    '    "scales"?: Array<"macro" | "meso" | "micro">',
    '  }>,',
    '  "prompts": {',
    '    "openAIImagePrompt": string,',
    '    "shortCinematicDescription": string',
    '  }',
    '}',
  ].join('\n')
}

function buildEffectCatalogText(effects: VisualEffect[]) {
  return effects.map((e) => `${e.id} | ${e.group} | ${e.displayName}`).join('\n')
}

function getDoseBand(dose: number) {
  const clamped = Math.min(1, Math.max(0, dose))
  if (clamped < 0.3) return 'threshold'
  if (clamped < 0.7) return 'common'
  return 'strong'
}

function buildUserPrompt(request: AnalyzeRequest) {
  const signature = getSubstanceSignature(request.substanceId)
  const doseBand = getDoseBand(request.dose)

  return [
    'Analyze the attached image for psychedelic visual replication.',
    `substanceId: ${request.substanceId}`,
    `dose: ${request.dose}`,
    `doseBand: ${doseBand}`,
    `signature: ${signature}`,
    '',
    'Return JSON only.',
  ].join('\n')
}

function extractJsonObject(text: string) {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('Model output did not contain a JSON object')
  }
  return text.slice(start, end + 1)
}

const { byId: effectByIdForSchema, ids: effectIdsForSchema } = loadVisualEffects()

const EffectIdSchema = z.enum(effectIdsForSchema as [string, ...string[]])

const PsychedelicEffectSchema = z
  .object({
    effectId: EffectIdSchema,
    group: z.enum(VisualEffectGroups),
    intensity: z.number().min(0).max(1),
    scales: z.array(z.enum(VisualEffectScales)).min(1).optional(),
  })
  .superRefine((val, ctx) => {
    const meta = effectByIdForSchema.get(val.effectId)
    if (meta && meta.group !== val.group) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'group must match the group for the selected effectId',
        path: ['group'],
      })
    }
  })

export const ImageAnalysisResultSchema = z
  .object({
    substanceId: z.string().min(1),
    dose: z.number().min(0).max(1),
    baseSceneDescription: z.string().min(1),
    geometrySummary: z.string().min(1).optional(),
    distortionSummary: z.string().min(1).optional(),
    hallucinationSummary: z.string().min(1).optional(),
    effects: z.array(PsychedelicEffectSchema).min(1),
    prompts: z.object({
      openAIImagePrompt: z.string().min(1),
      shortCinematicDescription: z.string().min(1),
    }),
  })
  .superRefine((val, ctx) => {
    const seen = new Set<string>()
    for (const effect of val.effects) {
      if (seen.has(effect.effectId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'effects must not contain duplicate effectId values',
          path: ['effects'],
        })
        break
      }
      seen.add(effect.effectId)
    }
  })

export async function analyzeImage(request: AnalyzeRequest): Promise<ImageAnalysisResult> {
  const { effects } = loadVisualEffects()

  const systemPrompt = buildSystemPrompt(buildEffectCatalogText(effects))
  const userPrompt = buildUserPrompt(request)

  const debug = isAnalysisDebugEnabled()
  if (debug) {
    console.log('[analysis debug] system prompt\n' + systemPrompt)
    console.log('[analysis debug] user content structure', {
      role: 'user',
      content: [
        { type: 'input_text', text: userPrompt },
        {
          type: 'input_image',
          image_url: '<omitted>',
          image_url_prefix: request.imageDataUrl.slice(0, 32),
          image_url_length: request.imageDataUrl.length,
          detail: 'high',
        },
      ],
    })
  }

  const rawText = await callVisionAnalysis({
    systemPrompt,
    userPrompt,
    imageDataUrl: request.imageDataUrl,
  })

  if (debug) {
    console.log('[analysis debug] raw response.output_text\n' + rawText)
  }

  let jsonText: string
  try {
    jsonText = extractJsonObject(rawText)
  } catch {
    const prefix = rawText.trim().slice(0, 280)
    throw new Error(
      `Model output did not contain a JSON object. First chars: ${JSON.stringify(prefix)}`,
    )
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(jsonText) as unknown
  } catch {
    const prefix = jsonText.trim().slice(0, 280)
    throw new Error(`Model output contained invalid JSON. First chars: ${JSON.stringify(prefix)}`)
  }

  const validatedResult = ImageAnalysisResultSchema.safeParse(parsed)
  if (!validatedResult.success) {
    throw new Error(`Model output failed ImageAnalysisResult validation. ${formatZodError(validatedResult.error)}`)
  }
  const validated = validatedResult.data

  const openAIImagePrompt = [
    validated.prompts.openAIImagePrompt,
    '',
    'Constraint: Keep geometric patterns embedded in surfaces and materials, aligned to perspective and lighting.',
    'Constraint: Avoid floating geometry overlays, wireframe nets, and separate decals.',
  ].join('\n')

  return {
    ...(validated as ImageAnalysisResult),
    substanceId: request.substanceId,
    dose: request.dose,
    prompts: {
      ...validated.prompts,
      openAIImagePrompt,
    },
  }
}


