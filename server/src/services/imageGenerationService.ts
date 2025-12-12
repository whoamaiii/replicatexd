import type { GenerateRequest } from '../../../shared/types/api'
import type { ImageAnalysisResult } from '../../../shared/types/analysis'
import { callImageGeneration } from '../openai/client'

function buildUsedPrompt(analysis: ImageAnalysisResult) {
  const topEffects = [...analysis.effects]
    .sort((a, b) => b.intensity - a.intensity)
    .slice(0, 8)
    .map((e, idx) => `${idx + 1}. effectId ${e.effectId}. group ${e.group}. intensity ${e.intensity}.`)

  return [
    analysis.prompts.openAIImagePrompt,
    '',
    `Base scene: ${analysis.baseSceneDescription}`,
    `Substance id: ${analysis.substanceId}`,
    `Dose: ${analysis.dose}`,
    '',
    'Emphasize these effects:',
    ...topEffects,
    '',
    'Preserve composition and lighting unless the strongest effects imply scene replacement.',
  ].join('\n')
}

export async function generateImageFromAnalysis(request: GenerateRequest) {
  const usedPrompt = buildUsedPrompt(request.analysis)
  const result = await callImageGeneration({ prompt: usedPrompt, imageDataUrl: request.imageDataUrl })

  return {
    imageDataUrl: `data:${result.mimeType};base64,${result.imageBase64}`,
    mimeType: result.mimeType,
    usedPrompt,
  }
}


