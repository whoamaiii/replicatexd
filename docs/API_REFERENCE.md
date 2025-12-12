# API Reference

Complete reference for PsyVis Lab REST API endpoints.

**Last Updated**: 2025-12-12

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Base URL](#base-url)
4. [Common Headers](#common-headers)
5. [Core Endpoints](#core-endpoints)
   - [POST /api/analyze](#post-apianalyze)
   - [POST /api/generate](#post-apigenerate)
   - [POST /api/prompts](#post-apiprompts)
6. [Library Endpoints](#library-endpoints)
7. [Maps Endpoints](#maps-endpoints)
8. [Data Models](#data-models)
9. [Error Responses](#error-responses)
10. [Rate Limits & Timeouts](#rate-limits--timeouts)
11. [Examples](#examples)

---

## Overview

The PsyVis Lab API provides endpoints for:
- **Vision Analysis**: Detect visual features and map to psychedelic effects
- **Image Generation**: Create psychedelic variants with effect guidance
- **Prompt Generation**: Build multi-flavor prompts from analysis
- **Project Management**: Save, retrieve, and manage analysis projects
- **Structural Maps**: Generate depth, edge, normal, and segmentation maps

All endpoints use JSON for request/response bodies.

---

## Authentication

API authentication is handled through environment variables configured on the server:

```env
OPENROUTER_API_KEY=your_key_here  # Required for vision + generation
OPENAI_API_KEY=your_key_here      # Optional fallback
```

Client applications do not need to provide authentication headers. The backend handles all API key management internally.

---

## Base URL

**Development**: `http://localhost:5174/api`

**Production**: Configure based on deployment (e.g., `https://your-domain.com/api`)

In development mode, Vite proxies `/api/*` requests from port 5173 to the Express backend at port 5174.

---

## Common Headers

### Request Headers
```
Content-Type: application/json
```

### Response Headers
```
Content-Type: application/json
```

---

## Core Endpoints

### POST /api/analyze

Analyze an image to detect visual features and map them to psychedelic effects based on substance profile and dose.

#### Request Body

```typescript
{
  imageDataUrl: string      // Base64 data URL (must start with "data:image/")
  substanceId: string       // "lsd" | "psilocybin" | "dmt" | "five_meo" | "mescaline" | "custom_mix"
  dose: number              // 0.0 to 1.0 (0.0=threshold, 0.3-0.7=common, 0.7-1.0=strong)
}
```

#### Response

```typescript
{
  substanceId: string
  dose: number
  baseSceneDescription: string          // Natural language scene description
  geometrySummary?: string              // Geometric patterns detected
  distortionSummary?: string            // Distortion patterns detected
  hallucinationSummary?: string         // Hallucination patterns detected
  effects: Array<{
    effectId: string                    // Effect identifier from catalog
    group: "enhancements" | "distortions" | "geometry" | "hallucinations" | "perceptual"
    intensity: number                   // 0.0 to 1.0
    scales?: Array<"macro" | "meso" | "micro">
  }>
  prompts: {
    openAIImagePrompt: string           // Ready-to-use generation prompt
    shortCinematicDescription: string   // Concise artistic description
  }
}
```

#### Example Request

```bash
curl -X POST http://localhost:5174/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "imageDataUrl": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
    "substanceId": "lsd",
    "dose": 0.6
  }'
```

#### Example Response

```json
{
  "substanceId": "lsd",
  "dose": 0.6,
  "baseSceneDescription": "A forest path with sunlight filtering through dense foliage, creating dappled patterns on moss-covered ground.",
  "geometrySummary": "Organic fractals in foliage, radial symmetry in light patterns",
  "distortionSummary": "Gentle breathing on moss surfaces, color drift in shadows",
  "hallucinationSummary": null,
  "effects": [
    {
      "effectId": "color_enhancement",
      "group": "enhancements",
      "intensity": 0.7,
      "scales": ["macro", "meso"]
    },
    {
      "effectId": "pattern_recognition_enhancement",
      "group": "enhancements",
      "intensity": 0.6,
      "scales": ["meso", "micro"]
    },
    {
      "effectId": "breathing",
      "group": "distortions",
      "intensity": 0.5,
      "scales": ["meso"]
    }
  ],
  "prompts": {
    "openAIImagePrompt": "A forest path with vivid, saturated colors...",
    "shortCinematicDescription": "Sunlit forest with living, breathing foliage"
  }
}
```

#### Status Codes

- `200 OK` - Analysis successful
- `400 Bad Request` - Invalid request body (missing fields, wrong types)
- `500 Internal Server Error` - OpenRouter API error or server error

#### Timeout

120 seconds

---

### POST /api/generate

Generate a psychedelic image variant based on analysis results.

#### Request Body

```typescript
{
  imageDataUrl: string                    // Base64 data URL
  analysis: ImageAnalysisResult           // Result from /api/analyze
  projectId?: string                      // Optional: associate with existing project
  originalAnalysis?: ImageAnalysisResult  // Optional: preserve original analysis
  saveToLibrary?: boolean                 // Optional: save to project library
  generationMode?: "prompt_only" | "base_image_edit"  // Optional: default "base_image_edit"
  mapSourceHash?: string                  // Optional: hash to fetch structural maps
  routerSettings?: RouterSettings         // Optional: effect placement controls
}
```

#### RouterSettings Schema

```typescript
{
  enabled?: boolean                       // Enable router (default: false)
  defaultRegions?: Array<"face" | "hands" | "subject" | "background" | "global">
  defaultDepthBands?: Array<"near" | "mid" | "far">
  protectFace?: boolean                   // Prevent effects on face
  protectHands?: boolean                  // Prevent effects on hands
  protectEdges?: boolean                  // Preserve structural edges
  surfaceLockStrength?: number            // 0.0 to 1.0
  groupMultipliers?: {
    enhancements?: number
    distortions?: number
    geometry?: number
    hallucinations?: number
    perceptual?: number
  }
  rules?: Array<{                         // Per-effect override rules
    effectId: string
    regions: Array<"face" | "hands" | "subject" | "background" | "global">
    depthBands: Array<"near" | "mid" | "far">
    strength: number                      // 0.0 to 2.0
    protectEdges: boolean
  }>
}
```

#### Response

```typescript
{
  imageDataUrl: string        // Generated image as base64 data URL
  mimeType: string           // "image/png" | "image/jpeg" | "image/webp"
  usedPrompt: string         // Actual prompt sent to generation model
  projectId?: string         // Project ID (if saved)
  generationId?: string      // Generation ID (if saved)
  downloadUrl?: string       // URL to download image file
  bundleUrl?: string         // URL to download ZIP bundle (image + metadata)
  isSaved?: boolean          // Whether project is permanently saved
  expiresAt?: string | null  // ISO 8601 timestamp when unsaved project expires
}
```

#### Example Request

```bash
curl -X POST http://localhost:5174/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "imageDataUrl": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
    "analysis": { ... },
    "generationMode": "base_image_edit",
    "saveToLibrary": true
  }'
```

#### Example Response

```json
{
  "imageDataUrl": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "mimeType": "image/png",
  "usedPrompt": "A forest path with vivid, saturated colors and gentle breathing textures...",
  "projectId": "proj_abc123",
  "generationId": "gen_xyz789",
  "downloadUrl": "/api/library/file/proj_abc123/gen_xyz789",
  "bundleUrl": "/api/library/bundle/proj_abc123/gen_xyz789",
  "isSaved": true,
  "expiresAt": null
}
```

#### Status Codes

- `200 OK` - Generation successful
- `400 Bad Request` - Invalid request body
- `500 Internal Server Error` - Image generation error or server error

#### Timeout

180 seconds

---

### POST /api/prompts

Generate multi-flavor prompts from analysis results without creating an image.

#### Request Body

```typescript
{
  analysis: ImageAnalysisResult  // Result from /api/analyze
}
```

#### Response

```typescript
{
  prompts: Array<{
    id: string                  // Unique prompt identifier
    flavor: "openai" | "midjourney" | "kling" | "technical" | "structural" | "poetic"
    title: string               // Human-readable flavor name
    description: string         // What this flavor optimizes for
    prompt: string              // The actual prompt text
    notes?: string              // Optional usage notes
  }>
}
```

#### Example Response

```json
{
  "prompts": [
    {
      "id": "structural",
      "flavor": "structural",
      "title": "Structural (Surface-Locked)",
      "description": "Preserves composition with surface-locked geometric effects",
      "prompt": "A forest path with enhanced color saturation (0.7)...",
      "notes": "Best for preserving recognizable structures"
    },
    {
      "id": "poetic",
      "flavor": "poetic",
      "title": "Poetic",
      "description": "Lyrical, metaphorical descriptions",
      "prompt": "A living forest where light dances through breathing leaves...",
      "notes": "More artistic interpretation"
    }
  ]
}
```

#### Status Codes

- `200 OK` - Prompts generated successfully
- `400 Bad Request` - Invalid analysis object
- `500 Internal Server Error` - Server error

---

## Library Endpoints

### GET /api/library/projects

List all saved and temporary projects.

#### Response

```typescript
{
  projects: Array<{
    projectId: string
    createdAt: string              // ISO 8601 timestamp
    lastActivityAt: string
    isSaved: boolean
    expiresAt: string | null       // null if saved permanently
    inputImagePath?: string
    generations: Array<{
      generationId: string
      createdAt: string
      substanceId: string
      dose: number
      model: string
      imagePath: string
      mimeType: string
      usedPrompt: string
      bundlePath?: string
    }>
  }>
  total: number
}
```

#### Status Codes

- `200 OK` - Projects retrieved successfully
- `500 Internal Server Error` - Server error

---

### GET /api/library/projects/:projectId

Get a single project by ID.

#### Parameters

- `projectId` (path parameter) - Project identifier

#### Response

Same schema as individual project object from list endpoint.

#### Status Codes

- `200 OK` - Project found
- `404 Not Found` - Project does not exist
- `500 Internal Server Error` - Server error

---

### POST /api/library/projects/:projectId/save

Toggle save status of a project (pin/unpin).

#### Parameters

- `projectId` (path parameter) - Project identifier

#### Request Body

```typescript
{
  isSaved: boolean  // true = save permanently, false = allow expiration
}
```

#### Response

Updated project object (same schema as GET).

#### Status Codes

- `200 OK` - Save status updated
- `400 Bad Request` - Invalid request body
- `404 Not Found` - Project does not exist
- `500 Internal Server Error` - Server error

---

### DELETE /api/library/projects/:projectId

Delete a project and all associated files.

#### Parameters

- `projectId` (path parameter) - Project identifier

#### Response

```typescript
{
  message: string  // "Project deleted successfully"
}
```

#### Status Codes

- `200 OK` - Project deleted
- `404 Not Found` - Project does not exist
- `500 Internal Server Error` - Server error

---

### GET /api/library/file/:projectId/:generationId

Download generated image file.

#### Parameters

- `projectId` (path parameter) - Project identifier
- `generationId` (path parameter) - Generation identifier

#### Response

Binary image file with appropriate `Content-Type` header.

#### Status Codes

- `200 OK` - File served
- `404 Not Found` - File does not exist
- `500 Internal Server Error` - Server error

---

### GET /api/library/bundle/:projectId/:generationId

Download ZIP bundle containing image, metadata, and prompts.

#### Parameters

- `projectId` (path parameter) - Project identifier
- `generationId` (path parameter) - Generation identifier

#### Response

ZIP file containing:
- Generated image
- `metadata.json` - Full analysis and generation data
- `prompts.txt` - All prompt flavors

#### Status Codes

- `200 OK` - Bundle created and served
- `404 Not Found` - Generation does not exist
- `500 Internal Server Error` - Server error

---

## Maps Endpoints

### POST /api/maps/ensure

Generate or retrieve structural maps for an image.

#### Request Body

```typescript
{
  imageDataUrl: string  // Base64 data URL
}
```

#### Response

```typescript
{
  sourceHash: string          // SHA-256 hash of image (use for subsequent requests)
  mapPack: {
    sourceHash: string
    createdAt: string
    maps: {
      depth?: { path: string, url: string }
      normals?: { path: string, url: string }
      edges?: { path: string, url: string }
      segmentation?: { path: string, url: string }
      faceMask?: { path: string, url: string }
      handsMask?: { path: string, url: string }
    }
  }
  settings: {
    depthWeight?: number       // 0.0 to 1.0
    normalsWeight?: number
    edgesWeight?: number
    faceProtection?: boolean
    handsProtection?: boolean
  }
}
```

#### Status Codes

- `200 OK` - Maps generated or retrieved
- `400 Bad Request` - Invalid image data
- `500 Internal Server Error` - Map generation error

---

### GET /api/maps/:sourceHash

Retrieve map pack and settings by source hash.

#### Parameters

- `sourceHash` (path parameter) - SHA-256 hash from /api/maps/ensure

#### Response

Same as POST /api/maps/ensure response.

#### Status Codes

- `200 OK` - Map pack found
- `404 Not Found` - No maps exist for this hash
- `500 Internal Server Error` - Server error

---

### POST /api/maps/settings

Update map influence weights.

#### Request Body

```typescript
{
  sourceHash: string
  settings: {
    depthWeight?: number
    normalsWeight?: number
    edgesWeight?: number
    faceProtection?: boolean
    handsProtection?: boolean
  }
}
```

#### Response

Updated settings object.

#### Status Codes

- `200 OK` - Settings updated
- `400 Bad Request` - Invalid settings
- `404 Not Found` - No maps exist for this hash
- `500 Internal Server Error` - Server error

---

### GET /api/maps/:sourceHash/file/:mapKind

Serve individual map image file.

#### Parameters

- `sourceHash` (path parameter) - SHA-256 hash
- `mapKind` (path parameter) - "depth" | "normals" | "edges" | "segmentation" | "faceMask" | "handsMask"

#### Response

PNG image file.

#### Status Codes

- `200 OK` - Map image served
- `404 Not Found` - Map does not exist
- `500 Internal Server Error` - Server error

---

## Data Models

### SubstanceIds

```typescript
type SubstanceId =
  | "lsd"
  | "psilocybin"
  | "dmt"
  | "five_meo"
  | "mescaline"
  | "custom_mix"
```

### VisualEffectGroup

```typescript
type VisualEffectGroup =
  | "enhancements"
  | "distortions"
  | "geometry"
  | "hallucinations"
  | "perceptual"
```

### VisualEffectScale

```typescript
type VisualEffectScale =
  | "macro"    // Large-scale patterns (whole scene)
  | "meso"     // Medium-scale patterns (objects, textures)
  | "micro"    // Fine-scale patterns (edges, fine detail)
```

### GenerationMode

```typescript
type GenerationMode =
  | "prompt_only"       // Text-only generation (high creativity, low structure preservation)
  | "base_image_edit"   // Use input image as base (structure preservation, identity stability)
```

---

## Error Responses

All endpoints return errors in a consistent format:

```typescript
{
  message: string         // Human-readable error description
  errors?: string[]       // Optional: detailed validation errors
}
```

### Common Error Messages

**400 Bad Request**
- `"Invalid request"` - Zod schema validation failed
- `"Invalid request body"` - Missing required fields or wrong types
- `"imageDataUrl must be a data url"` - Image data doesn't start with `data:image/`

**404 Not Found**
- `"Project not found"` - Project ID doesn't exist
- `"File not found"` - Requested file doesn't exist in library

**500 Internal Server Error**
- `"OpenAI request failed. Check your API key and try again."` - API key invalid or quota exceeded
- `"Server error"` - Generic server error (check logs)
- `"Failed to list projects"` - Library filesystem error
- `"Failed to generate maps"` - Python worker error

---

## Rate Limits & Timeouts

### Timeouts

- **Vision Analysis** (`/api/analyze`): 120 seconds
- **Image Generation** (`/api/generate`): 180 seconds
- **Prompt Generation** (`/api/prompts`): No timeout (synchronous)
- **Library Operations**: 30 seconds
- **Map Generation** (`/api/maps/ensure`): 60 seconds (per map type)

### Rate Limits

Rate limits are determined by your OpenRouter API tier:
- **Free tier**: ~10 requests/minute
- **Paid tier**: Higher limits based on plan

Check [OpenRouter documentation](https://openrouter.ai/docs) for current limits.

---

## Examples

### Complete Analysis → Generation Workflow

```javascript
// Step 1: Analyze image
const analyzeResponse = await fetch('http://localhost:5174/api/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    imageDataUrl: 'data:image/jpeg;base64,...',
    substanceId: 'lsd',
    dose: 0.6
  })
})
const analysis = await analyzeResponse.json()

// Step 2: Generate multi-flavor prompts
const promptsResponse = await fetch('http://localhost:5174/api/prompts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ analysis })
})
const { prompts } = await promptsResponse.json()

// Step 3: Generate image variant
const generateResponse = await fetch('http://localhost:5174/api/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    imageDataUrl: 'data:image/jpeg;base64,...',
    analysis,
    saveToLibrary: true,
    generationMode: 'base_image_edit'
  })
})
const { imageDataUrl, projectId, generationId } = await generateResponse.json()

// Step 4: Download bundle
window.location.href = `http://localhost:5174/api/library/bundle/${projectId}/${generationId}`
```

### Using Structural Maps

```javascript
// Step 1: Ensure maps exist
const mapsResponse = await fetch('http://localhost:5174/api/maps/ensure', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    imageDataUrl: 'data:image/jpeg;base64,...'
  })
})
const { sourceHash, mapPack, settings } = await mapsResponse.json()

// Step 2: Update map weights
await fetch('http://localhost:5174/api/maps/settings', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sourceHash,
    settings: {
      depthWeight: 0.8,
      normalsWeight: 0.5,
      edgesWeight: 0.3,
      faceProtection: true
    }
  })
})

// Step 3: Generate with map guidance
const generateResponse = await fetch('http://localhost:5174/api/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    imageDataUrl: 'data:image/jpeg;base64,...',
    analysis,
    mapSourceHash: sourceHash
  })
})
```

### Using Effect Router

```javascript
const generateResponse = await fetch('http://localhost:5174/api/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    imageDataUrl: 'data:image/jpeg;base64,...',
    analysis,
    routerSettings: {
      enabled: true,
      defaultRegions: ['subject', 'background'],
      defaultDepthBands: ['mid', 'far'],
      protectFace: true,
      protectHands: true,
      surfaceLockStrength: 0.8,
      groupMultipliers: {
        geometry: 1.5,        // Boost geometric effects
        hallucinations: 0.3   // Reduce hallucinations
      },
      rules: [
        {
          effectId: 'breathing',
          regions: ['subject'],
          depthBands: ['near', 'mid'],
          strength: 0.9,
          protectEdges: false
        }
      ]
    }
  })
})
```

---

## Additional Resources

- [User Guide](./USER_GUIDE.md) - Application usage guide
- [DESIGN.md](./DESIGN.md) - Architecture and design decisions
- [ROUTER_GUIDE.md](./ROUTER_GUIDE.md) - Effect routing deep dive
- [Maps Documentation](./maps_and_controls.md) - Structural maps guide
- [Substance Profiles](./substance_visual_profiles.md) - Phenomenological details

---

**Questions or issues?** Open an issue on [GitHub](https://github.com/your-repo/issues) or check the [Troubleshooting Guide](./TROUBLESHOOTING.md).
