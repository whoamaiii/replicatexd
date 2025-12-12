# Workflow Options for Psychedelic Image Generation

This document compares the two primary generation workflows available in PsyVis Lab, with recommendations for different use cases.

## Overview

PsyVis Lab supports two generation modes:
1. **Prompt-only generation** — Text prompt drives generation without input image reference
2. **Base image edit mode** — Input image + prompt for guided editing

Both modes use the same analysis results and effect mappings; they differ in how the generation model receives context.

---

## Workflow A: Prompt-Only Generation

### Description

The generation model receives only the text prompt constructed from the analysis. The input image is used only for analysis, not for generation.

### Request Structure

```json
{
  "model": "black-forest-labs/flux.2-pro",
  "modalities": ["image", "text"],
  "messages": [{
    "role": "user",
    "content": "A photograph of a mountain landscape with color enhancement, breathing surfaces, and geometric patterning embedded in the rock faces..."
  }]
}
```

### Pros

| Benefit | Description |
|---------|-------------|
| Maximum creativity | Model not constrained by input composition |
| Artistic freedom | Can deviate significantly from original |
| Novel outputs | Each generation uniquely interprets the prompt |
| Faster iteration | Explore very different visual directions |

### Cons

| Limitation | Description |
|------------|-------------|
| Low structure preservation | Original composition may be lost |
| Inconsistent results | Same prompt yields variable outputs |
| Identity drift | Faces/people may change significantly |
| Scene variance | Background and context may differ |

### Best For

- Abstract psychedelic art generation
- Exploring visual variations
- When original structure is not important
- Artistic experimentation

### Accuracy Assessment

**Structure fidelity:** Low (20-40%)
**Face preservation:** Low (10-30%)
**Composition match:** Low (20-40%)
**Effect application:** High (70-90%)

---

## Workflow B: Base Image Edit Mode

### Description

The generation model receives both the text prompt AND the input image. The model uses the input as a reference for composition, structure, and content while applying the requested modifications.

### Request Structure

```json
{
  "model": "google/gemini-2.5-flash-image-preview",
  "modalities": ["image", "text"],
  "messages": [{
    "role": "user",
    "content": [
      {
        "type": "text",
        "text": "Transform this image with psychedelic effects: color enhancement, breathing surfaces, geometric patterning embedded in surfaces..."
      },
      {
        "type": "image_url",
        "image_url": { "url": "data:image/png;base64,..." }
      }
    ]
  }]
}
```

### Pros

| Benefit | Description |
|---------|-------------|
| Structure preservation | Maintains original composition |
| Consistent results | Outputs reliably match input structure |
| Face stability | People remain recognizable |
| Context aware | Effects appropriate to scene content |

### Cons

| Limitation | Description |
|------------|-------------|
| Limited creativity | Constrained by input composition |
| Model dependency | Requires model with image input + output |
| Subtle changes | May not produce dramatic transformations |
| Prompt conflicts | Model may prioritize input over prompt |

### Best For

- Portrait psychedelic overlays
- Preserving recognizable scenes
- Before/after comparisons
- When identity preservation matters

### Accuracy Assessment

**Structure fidelity:** High (70-90%)
**Face preservation:** Medium-High (50-80%)
**Composition match:** High (80-95%)
**Effect application:** Medium-High (60-80%)

---

## Comparison Table

| Aspect | Prompt Only | Base Image Edit |
|--------|-------------|-----------------|
| **Structure preservation** | Low | High |
| **Creative freedom** | High | Medium |
| **Consistency** | Variable | Stable |
| **Face/identity preservation** | Low | Medium-High |
| **Required model capabilities** | Image output only | Image input + output |
| **Complexity** | Simple | Moderate |
| **Generation time** | Faster | Similar |
| **Best for** | Art generation | Replication/overlay |

---

## Implementation Details

### Prompt-Only Mode

```typescript
// In imageGenerationService.ts
async function generatePromptOnly(prompt: string): Promise<GenerateResponse> {
  const result = await callImageGeneration({
    prompt: prompt,
    imageDataUrl: undefined  // No input image
  })
  return result
}
```

### Base Image Edit Mode

```typescript
// In imageGenerationService.ts
async function generateWithBaseImage(
  prompt: string,
  inputImageDataUrl: string
): Promise<GenerateResponse> {
  const result = await callImageGeneration({
    prompt: prompt,
    imageDataUrl: inputImageDataUrl  // Include input image
  })
  return result
}
```

### Mode Selection

```typescript
// Determine generation approach based on settings
const imageToSend = settings.generationMode === 'prompt_only'
  ? undefined
  : inputImageDataUrl

const result = await callImageGeneration({
  prompt: buildUsedPrompt(analysis, mapSettings),
  imageDataUrl: imageToSend
})
```

---

## Map Settings Integration

When maps are generated and settings configured, the prompt is enhanced regardless of generation mode:

```typescript
function buildUsedPrompt(
  analysis: ImageAnalysisResult,
  mapSettings?: MapSettings
): string {
  let prompt = analysis.prompts.openAIImagePrompt

  // Add base scene and effect descriptions
  prompt += `\n\nBase scene: ${analysis.baseSceneDescription}`
  prompt += `\n\nEmphasize these effects:\n${formatEffects(analysis.effects)}`

  // Add structural guidance from maps
  if (mapSettings) {
    prompt += buildControlSummary(mapSettings)
  }

  return prompt
}
```

### Control Summary Example

When maps are enabled, additional guidance is appended:

```
Structural guidance:
- Preserve surface structure and depth relationships (strength: 60%).
- Maintain depth layering and perspective (weight: 70%).
- Preserve major edges and compositional lines (weight: 50%).
- Keep faces recognizable and undistorted (protection: 80%).
- Preserve hand structure and anatomy (protection: 60%).
```

---

## Recommended Default

**Base Image Edit mode** is recommended as the default because:

1. **Better replication fidelity** — Psychedelic replications aim to show "what I saw" which requires preserving the original scene
2. **Identity preservation** — Users often want to see themselves or their photos with effects, not entirely new images
3. **Predictable results** — Easier to iterate and refine when the base structure is consistent
4. **Surface embedding** — Effects naturally anchor to surfaces in the input image

### When to Switch to Prompt-Only

- Abstract art generation without specific source
- Exploring novel psychedelic aesthetics
- When the input image is just inspiration, not a target
- Maximum creative variation desired

---

## Future: Local Controlled Workflows

For users requiring maximum control and accuracy, local workflows with ControlNet conditioning could provide:

- **Direct map conditioning** — Depth/edge maps directly influence diffusion process
- **Precise spatial control** — Sub-region effect application
- **Iterative refinement** — Real-time adjustment of control strengths
- **Offline processing** — No API dependencies

This would require:
- Local Stable Diffusion or Flux installation
- ControlNet models (depth, canny, normal)
- Significant GPU resources
- More complex setup

**Note:** Local workflows are documented for future reference but are not currently implemented in PsyVis Lab. The current implementation focuses on OpenRouter-based generation with prompt-level guidance.

---

## Citations

1. OpenRouter Multimodal Overview. [Documentation](https://openrouter.ai/docs/features/multimodal/overview)

2. OpenRouter Image Generation. [Documentation](https://openrouter.ai/docs/guides/overview/multimodal/image-generation)

3. Zhang & Agrawala, "Adding Conditional Control to Text-to-Image Diffusion Models," ICCV 2023. [arXiv:2302.05543](https://arxiv.org/abs/2302.05543)

4. Hugging Face Diffusers ControlNet Guide. [Documentation](https://huggingface.co/docs/diffusers/en/using-diffusers/controlnet)
