# Provider Capabilities: OpenRouter Image and Multimodal Features

This document covers OpenRouter's image input and generation capabilities relevant to PsyVis Lab.

## Overview

OpenRouter provides a unified API for accessing multiple AI models, including those capable of image understanding and generation. All multimodal features use the standard `/api/v1/chat/completions` endpoint.

---

## Image Input Methods

OpenRouter supports two methods for providing images to vision models:

### Base64 Data URLs (Current Implementation)

Images encoded as base64 data URLs in the format:
```
data:image/{format};base64,{encoded_data}
```

**Advantages:**
- Works for any image source (local files, generated content)
- No external hosting required
- Content stays within the request

**Disadvantages:**
- Larger request payload sizes
- Higher bandwidth usage
- ~33% size increase due to base64 encoding

**Example:**
```json
{
  "model": "google/gemini-2.5-flash-preview",
  "messages": [{
    "role": "user",
    "content": [
      { "type": "text", "text": "Describe this image" },
      {
        "type": "image_url",
        "image_url": {
          "url": "data:image/png;base64,iVBORw0KGgo..."
        }
      }
    ]
  }]
}
```

### Direct URLs

Images hosted at publicly accessible URLs.

**Advantages:**
- Smaller request payloads
- More efficient for large images
- No encoding overhead

**Disadvantages:**
- Requires public hosting
- May have CORS or access issues
- URL must be stable during request

**Example:**
```json
{
  "type": "image_url",
  "image_url": {
    "url": "https://example.com/image.png"
  }
}
```

Reference: [OpenRouter Image Inputs Documentation](https://openrouter.ai/docs/features/multimodal/images)

---

## Image Generation

To generate images via OpenRouter, use the chat completions endpoint with the `modalities` parameter.

### Request Format

```json
{
  "model": "google/gemini-2.5-flash-image-preview",
  "modalities": ["image", "text"],
  "messages": [{
    "role": "user",
    "content": "Generate an image of a sunset over mountains"
  }]
}
```

### Response Format

Generated images appear in the `images` array of the assistant message:

```json
{
  "choices": [{
    "message": {
      "role": "assistant",
      "content": "Here's a sunset image...",
      "images": [
        "data:image/png;base64,iVBORw0KGgo..."
      ]
    }
  }]
}
```

> "Images are returned as base64-encoded data URLs, typically in PNG format. Some models can generate multiple images in a single response."
> — [OpenRouter Image Generation Docs](https://openrouter.ai/docs/guides/overview/multimodal/image-generation)

### Model-Specific Parameters

**Gemini models** support aspect ratio configuration:
```json
{
  "image_config": {
    "aspect_ratio": "16:9"
  }
}
```

Reference: [OpenRouter Image Generation Documentation](https://openrouter.ai/docs/guides/overview/multimodal/image-generation)

---

## Models API for Capability Detection

OpenRouter provides a models endpoint to discover available models and their capabilities.

### Endpoint

```
GET https://openrouter.ai/api/v1/models
```

### Response Structure

Each model entry includes capability flags:

```json
{
  "id": "google/gemini-2.5-flash-image-preview",
  "name": "Gemini 2.5 Flash Image",
  "input_modalities": ["text", "image"],
  "output_modalities": ["text", "image"],
  ...
}
```

### Detecting Base Image Edit Capability

A model can perform base image editing if it has:
- `"image"` in `input_modalities` (can receive images)
- `"image"` in `output_modalities` (can generate images)

**Implementation example:**

```typescript
type ModelCapabilities = {
  id: string
  input_modalities: string[]
  output_modalities: string[]
}

function canUseBaseImageEdit(model: ModelCapabilities): boolean {
  return (
    model.input_modalities.includes('image') &&
    model.output_modalities.includes('image')
  )
}
```

### Caching Strategy

The models list changes infrequently. Cache with a short TTL (5-15 minutes) to reduce API calls while staying current.

```typescript
const MODELS_CACHE_TTL_MS = 10 * 60 * 1000 // 10 minutes

let modelsCache: { data: Model[]; timestamp: number } | null = null

async function getModels(): Promise<Model[]> {
  if (modelsCache && Date.now() - modelsCache.timestamp < MODELS_CACHE_TTL_MS) {
    return modelsCache.data
  }

  const response = await fetch('https://openrouter.ai/api/v1/models')
  const data = await response.json()

  modelsCache = { data: data.data, timestamp: Date.now() }
  return data.data
}
```

Reference: [OpenRouter Models Page](https://openrouter.ai/models)

---

## Models with Image Generation Support

As of late 2024, these models support image generation via OpenRouter:

### Gemini Models

**Gemini 2.5 Flash Image** (`google/gemini-2.5-flash-image-preview`)
- State-of-the-art image generation with contextual understanding
- Supports image editing, generation, and multi-turn conversations
- Best for: Detailed edits, instruction following

### GPT Image Models

**GPT-5 Image** (`openai/gpt-5-image`)
- Advanced language + image generation
- Superior instruction following and text rendering
- Best for: Complex prompts, text-in-image

**GPT-5 Image Mini** (`openai/gpt-5-image-mini`)
- Efficient variant with reduced latency/cost
- Best for: High-volume generation, simpler prompts

### Flux Models

**Flux.2-Pro** (`black-forest-labs/flux.2-pro`)
- High-quality image generation
- Strong aesthetic consistency
- Best for: Artistic generation, style consistency

> "GPT-5 Image Mini combines OpenAI's advanced language capabilities with GPT Image 1 Mini for efficient image generation."
> — [OpenRouter Documentation](https://openrouter.ai/docs/features/multimodal/overview)

---

## Base Image Edit Mode

When a model supports both image input and output, you can use "base image edit" mode where the original image guides the generation.

### Request Format

```json
{
  "model": "google/gemini-2.5-flash-image-preview",
  "modalities": ["image", "text"],
  "messages": [{
    "role": "user",
    "content": [
      { "type": "text", "text": "Add psychedelic patterns to the surfaces in this image" },
      {
        "type": "image_url",
        "image_url": { "url": "data:image/png;base64,..." }
      }
    ]
  }]
}
```

### Benefits

- **Structure preservation:** Output maintains composition of input
- **Context awareness:** Model understands what's in the image
- **Targeted edits:** Can specify which parts to modify

### Limitations

- Not all image generation models support input images
- Quality depends on how well the model handles editing instructions
- May require specific prompt phrasing for best results

---

## PsyVis Lab Integration

PsyVis Lab uses OpenRouter for two key operations:

### 1. Image Analysis

Uses vision models (e.g., `google/gemini-2.5-flash-preview`) to analyze input images and detect visual elements that map to psychedelic effects.

**Flow:**
1. Send image + analysis prompt to vision model
2. Receive structured JSON with effect mappings
3. Validate against effect taxonomy

### 2. Image Generation

Uses image generation models (e.g., `black-forest-labs/flux.2-pro`) to create psychedelic variants.

**Flow:**
1. Build prompt from analysis results
2. Optionally include input image (base edit mode)
3. Receive generated image as base64 data URL
4. Save to library if configured

---

## Citations

1. OpenRouter Multimodal Overview. [Documentation](https://openrouter.ai/docs/features/multimodal/overview)

2. OpenRouter Image Inputs. [Documentation](https://openrouter.ai/docs/features/multimodal/images)

3. OpenRouter Image Generation. [Documentation](https://openrouter.ai/docs/guides/overview/multimodal/image-generation)

4. OpenRouter API Reference. [Documentation](https://openrouter.ai/docs/api/reference/overview)

5. OpenRouter Models Directory. [Models Page](https://openrouter.ai/models)
