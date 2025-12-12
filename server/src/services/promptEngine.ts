import fs from 'node:fs'
import type { ImageAnalysisResult } from '../../../shared/types/analysis'
import type { PromptBundle, PromptFlavor } from '../../../shared/types/prompts'
import type { VisualEffect, VisualEffectGroup } from '../../../shared/types/effects'
import { selectUsedEffects } from '../../../shared/lib/effectsStudio'

type EffectMeta = Pick<VisualEffect, 'id' | 'group' | 'displayName' | 'shortDescription' | 'simulationHints'>

let cachedEffectMetaById: Map<string, EffectMeta> | null = null

function withoutAsciiHyphen(input: string) {
  return input.replaceAll('-', ' ')
}

function clamp01(value: number) {
  if (Number.isNaN(value)) return 0
  return Math.min(1, Math.max(0, value))
}

function doseBand(dose: number) {
  const d = clamp01(dose)
  if (d < 0.3) return 'threshold'
  if (d < 0.7) return 'common'
  return 'strong'
}

function groupLabel(group: VisualEffectGroup) {
  if (group === 'enhancements') return 'enhancements'
  if (group === 'distortions') return 'distortions'
  if (group === 'geometry') return 'geometry'
  if (group === 'hallucinations') return 'hallucinations'
  return 'perceptual'
}

function intensityWord(intensity: number) {
  const v = clamp01(intensity)
  if (v <= 0.05) return 'absent'
  if (v <= 0.35) return 'subtle'
  if (v <= 0.65) return 'clear'
  return 'dominant'
}

function firstSentence(text: string) {
  const cleaned = text.trim()
  if (!cleaned) return ''
  const match = cleaned.match(/^[\s\S]*?[.!?](\s|$)/)
  const sentence = match ? match[0].trim() : cleaned
  return sentence.length > 220 ? sentence.slice(0, 220).trim() : sentence
}

function trimTrailingPunctuation(text: string) {
  return text.replace(/[\s.,!?]+$/g, '').trim()
}

function joinWithAnd(items: string[]) {
  const cleaned = items.map((s) => s.trim()).filter((s) => s.length > 0)
  if (cleaned.length <= 1) return cleaned[0] ?? ''
  if (cleaned.length === 2) return `${cleaned[0]} and ${cleaned[1]}`
  return `${cleaned.slice(0, -1).join(', ')}, and ${cleaned[cleaned.length - 1]}`
}

function getSubstanceName(substanceId: string) {
  const map: Record<string, string> = {
    lsd: 'LSD',
    psilocybin: 'psilocybin',
    dmt: 'N N DMT',
    five_meo: '5 MeO DMT',
    mescaline: 'mescaline',
    custom_mix: 'custom mix',
  }
  return map[substanceId] ?? substanceId
}

function getSubstanceTone(substanceId: string, band: 'threshold' | 'common' | 'strong') {
  const base: Record<string, string> = {
    lsd: 'electric, vivid, high contrast, intricate',
    psilocybin: 'organic, warm, alive, gently dreamlike',
    dmt: 'hyper vivid, high symmetry, alien, intense',
    five_meo: 'luminous, boundary dissolving, radiant, minimal form',
    mescaline: 'crystalline, ornate, radiant, steady',
    custom_mix: 'distinctive, coherent, immersive',
  }

  const intensityBoost =
    band === 'threshold'
      ? 'subtle'
      : band === 'common'
        ? 'clear'
        : 'very strong'

  const tone = base[substanceId] ?? base.custom_mix
  return `${tone}, ${intensityBoost}`
}

function loadEffectMetaById() {
  if (cachedEffectMetaById) return cachedEffectMetaById

  const fileUrl = new URL('../../../data/visual_effects.json', import.meta.url)
  const raw = fs.readFileSync(fileUrl, 'utf8')
  const parsed = JSON.parse(raw) as unknown
  const list = Array.isArray(parsed) ? (parsed as VisualEffect[]) : []

  const byId = new Map<string, EffectMeta>()
  for (const item of list) {
    if (!item || typeof item !== 'object') continue
    const v = item as VisualEffect
    if (typeof v.id !== 'string' || v.id.trim().length === 0) continue
    if (typeof v.displayName !== 'string' || v.displayName.trim().length === 0) continue
    if (typeof v.group !== 'string') continue
    byId.set(v.id, {
      id: v.id,
      group: v.group,
      displayName: v.displayName,
      shortDescription: typeof v.shortDescription === 'string' ? v.shortDescription : '',
      simulationHints: Array.isArray(v.simulationHints)
        ? v.simulationHints.filter((hint) => typeof hint === 'string')
        : [],
    })
  }

  cachedEffectMetaById = byId
  return byId
}

function buildTopEffectsSummary(
  analysis: ImageAnalysisResult,
  metaById: Map<string, EffectMeta>,
  maxCount: number,
) {
  const sorted = [...analysis.effects].sort((a, b) => {
    const diff = b.intensity - a.intensity
    if (diff !== 0) return diff
    return a.effectId.localeCompare(b.effectId)
  })

  const top = sorted.slice(0, Math.min(maxCount, sorted.length))

  const effectLines = top.map((e) => {
    const meta = metaById.get(e.effectId)
    const name = meta?.displayName ?? e.effectId
    const group = meta?.group ?? e.group
    return `${intensityWord(e.intensity)} (${clamp01(e.intensity).toFixed(2)}) ${name} in ${groupLabel(group)}`
  })

  const compactNames = top.map((e) => metaById.get(e.effectId)?.displayName ?? e.effectId)

  const groupNames = Array.from(
    new Set(top.map((e) => metaById.get(e.effectId)?.group ?? e.group)),
  ).map((g) => groupLabel(g))

  return {
    top,
    effectLines,
    compactNames,
    groupNames,
  }
}

function buildPromptText(
  flavor: PromptFlavor,
  analysis: ImageAnalysisResult,
  metaById: Map<string, EffectMeta>,
) {
  const band = doseBand(analysis.dose)
  const substance = getSubstanceName(analysis.substanceId)
  const tone = getSubstanceTone(analysis.substanceId, band)

  const baseScene = withoutAsciiHyphen(analysis.baseSceneDescription.trim())
  const baseSentence = withoutAsciiHyphen(firstSentence(baseScene))
  const baseShort = trimTrailingPunctuation(withoutAsciiHyphen(firstSentence(baseScene)))

  const summary = buildTopEffectsSummary(analysis, metaById, Math.min(10, analysis.effects.length))

  const effectLineText = joinWithAnd(summary.effectLines)
  const effectNamesCsv = summary.compactNames.join(', ')
  const effectGroupsCsv = summary.groupNames.join(', ')

  const styleClause = 'cinematic lighting, photoreal detail, coherent texture motion'
  const hasEffects = summary.top.length > 0

  if (flavor === 'openai') {
    const sentenceTwo = hasEffects
      ? `Apply a ${band} ${substance} psychedelic look with ${effectLineText} and an overall ${tone} feeling; ${styleClause}.`
      : `Apply a ${band} ${substance} psychedelic look with an overall ${tone} feeling; ${styleClause}.`
    return `${baseSentence} ${sentenceTwo}`
  }

  if (flavor === 'midjourney') {
    const scene = baseShort || trimTrailingPunctuation(baseScene)
    const effects = hasEffects ? `, ${effectNamesCsv}` : ''
    return `${scene}, ${substance}, ${band}, ${tone}${effects}, ${styleClause}`
  }

  if (flavor === 'kling') {
    const scene = baseShort || trimTrailingPunctuation(baseScene)
    const motion = 'seamless loop video, slow orbit camera, subtle push in'
    const loopCue = 'smooth breathing motion, stable composition, loopable'
    const effectPhrase = hasEffects ? ` with ${effectNamesCsv}` : ''
    return `${motion}. ${scene}. ${band} ${substance} feel${effectPhrase}. ${loopCue}. ${styleClause}.`
  }

  const technicalMotifs: string[] = []
  const ids = new Set(analysis.effects.map((e) => e.effectId))
  if (ids.has('form_constant_tunnel')) technicalMotifs.push('tunnel form constants')
  if (ids.has('kaleidoscopic_tiling')) technicalMotifs.push('kaleidoscopic tiling')
  if (ids.has('fractal_recursion')) technicalMotifs.push('fractal recursion')
  if (ids.has('breathing_surfaces')) technicalMotifs.push('breathing surfaces')
  if (ids.has('flowing_textures')) technicalMotifs.push('flowing textures')
  if (ids.has('visual_drifting')) technicalMotifs.push('visual drifting')
  if (ids.has('tracers_motion_trails') || ids.has('afterimage_persistence')) technicalMotifs.push('tracers and persistence')
  if (ids.has('entity_encounters')) technicalMotifs.push('entity like motifs')
  if (ids.has('scene_replacement')) technicalMotifs.push('scene replacement')

  if (analysis.substanceId === 'dmt' && band === 'strong') {
    technicalMotifs.push('high symmetry geometric hallucinations')
  }
  if (analysis.substanceId === 'lsd' && band !== 'threshold') {
    technicalMotifs.push('surface locked geometry overlays')
  }
  if (analysis.substanceId === 'psilocybin') {
    technicalMotifs.push('organic drift and animacy')
  }
  if (analysis.substanceId === 'five_meo') {
    technicalMotifs.push('boundary dissolution and bright field effects')
  }
  if (analysis.substanceId === 'mescaline') {
    technicalMotifs.push('crystalline ornamentation and form constants')
  }

  const motifs = joinWithAnd(Array.from(new Set(technicalMotifs)))
  const scene = baseShort || trimTrailingPunctuation(baseScene)
  const method = 'temporally coherent warping, controlled bloom, contrast shaping, symmetry driven geometry'
  const taxonomyLine = hasEffects ? `Primary effect groups: ${effectGroupsCsv}.` : ''
  const emphasizeLine = hasEffects ? `Emphasize ${effectNamesCsv}.` : 'Keep effects subtle and coherent.'
  return `${scene}. ${taxonomyLine} ${emphasizeLine} Use ${motifs}. Apply ${method}. Overall mood is ${tone}.`
}

function buildBundle(
  flavor: PromptFlavor,
  analysis: ImageAnalysisResult,
  metaById: Map<string, EffectMeta>,
  title: string,
  description: string,
  notes?: string,
): PromptBundle {
  const prompt = buildPromptText(flavor, analysis, metaById)
  return {
    id: flavor,
    flavor,
    title: withoutAsciiHyphen(title),
    description: withoutAsciiHyphen(description),
    prompt: withoutAsciiHyphen(prompt),
    notes: notes ? withoutAsciiHyphen(notes) : undefined,
  }
}

export function buildPromptBundleForAnalysis(
  analysis: ImageAnalysisResult,
  effectsStudioSettings?: { threshold: number; maxEffects: number },
): PromptBundle[] {
  const metaById = loadEffectMetaById()
  const selected = selectUsedEffects({
    effects: analysis.effects,
    threshold: effectsStudioSettings ? effectsStudioSettings.threshold : 0,
    maxEffects: effectsStudioSettings ? effectsStudioSettings.maxEffects : 5,
  })

  const bundles: PromptBundle[] = [
    buildBundle(
      'openai',
      { ...analysis, effects: selected },
      metaById,
      'OpenAI',
      'Natural language prompt with clear effect guidance.',
    ),
    buildBundle(
      'midjourney',
      { ...analysis, effects: selected },
      metaById,
      'Midjourney',
      'Compact comma based prompt for quick iteration.',
    ),
    buildBundle(
      'kling',
      { ...analysis, effects: selected },
      metaById,
      'Kling',
      'Video oriented prompt with simple camera motion and looping cues.',
      'Tip: Keep motion slow and coherent for a clean seamless loop.',
    ),
    buildBundle(
      'technical',
      { ...analysis, effects: selected },
      metaById,
      'Technical',
      'Explicit taxonomy language and perceptual terminology.',
      'Tip: Prefer time coherent surface locked warps to avoid shimmer.',
    ),
  ]

  return bundles
}
