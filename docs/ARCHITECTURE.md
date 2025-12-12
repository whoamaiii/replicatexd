# Architecture Guide

Technical deep dive into PsyVis Lab system design and implementation.

**Last Updated**: 2025-12-12

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Frontend Architecture](#frontend-architecture)
3. [Backend Architecture](#backend-architecture)
4. [Shared Type System](#shared-type-system)
5. [Data Flow](#data-flow)
6. [API Client Layer](#api-client-layer)
7. [State Management](#state-management)
8. [Error Handling](#error-handling)
9. [Library & Caching](#library--caching)
10. [Map Generation Pipeline](#map-generation-pipeline)
11. [Security Architecture](#security-architecture)
12. [Performance Considerations](#performance-considerations)

---

## System Overview

PsyVis Lab is a **monorepo full-stack application** with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                               │
│  ┌────────────────────────────────────────────────────┐    │
│  │  React 19 Frontend (Port 5173)                     │    │
│  │  - Components (analysis, prompts, maps, router)    │    │
│  │  - Client state (localStorage, React state)        │    │
│  │  - API client (fetch abstraction)                  │    │
│  └─────────────────┬──────────────────────────────────┘    │
└────────────────────┼───────────────────────────────────────┘
                     │ HTTP/JSON
                     │ /api/* proxy via Vite (dev)
                     │ or Nginx (prod)
┌────────────────────▼───────────────────────────────────────┐
│  Express 4 Backend (Port 5174)                             │
│  ┌──────────────────────────────────────────────────┐     │
│  │  Routes Layer                                     │     │
│  │  - /api/analyze, /api/generate, /api/prompts     │     │
│  │  - /api/library/*, /api/maps/*                   │     │
│  └────────────┬─────────────────────────────────────┘     │
│               │                                             │
│  ┌────────────▼─────────────────────────────────────┐     │
│  │  Service Layer                                    │     │
│  │  - analysisService, imageGenerationService        │     │
│  │  - promptEngine, routerService, mapService        │     │
│  │  - libraryService, libraryIndex                   │     │
│  └────────────┬─────────────────────────────────────┘     │
│               │                                             │
│  ┌────────────▼─────────────────────────────────────┐     │
│  │  External Integration Layer                       │     │
│  │  - OpenRouter API client (vision + generation)    │     │
│  │  - Python worker spawner (map generation)         │     │
│  │  - File system (library storage)                  │     │
│  └───────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
   ┌────▼───┐  ┌────▼────┐  ┌───▼──────┐
   │OpenRouter│ │Python   │  │Filesystem│
   │   API    │ │Worker   │  │ (Library)│
   └──────────┘ └─────────┘  └──────────┘
```

**Key Principles**:
- **Type safety**: Shared TypeScript types across frontend/backend
- **Validation**: Zod schemas at API boundaries
- **Service layer**: Business logic separated from routing
- **Caching**: Maps and library items cached by hash
- **Async workflows**: Long-running operations with timeouts

---

## Frontend Architecture

### Component Hierarchy

```
App.tsx (root)
├── Layout components
│   └── Main application shell
├── Upload components
│   ├── ImageDropzone
│   └── ImagePreviewCard
├── Analysis components
│   ├── EffectsPanel
│   └── EffectsOverridePanel
├── Prompts components
│   └── PromptLabPanel
├── Maps components
│   ├── MapLabPanel
│   └── MapControlsPanel
├── Router components
│   └── EffectRouterPanel
├── Settings components
│   └── OutputSettingsPanel
├── History components
│   └── LibraryPanel
├── Project components
│   └── ProjectStatusPanel
└── UI components (reusable)
    ├── Button, Card, Panel
    ├── Badge, Chip, Select
    ├── Slider, CodeBlock
    └── etc.
```

### State Management Strategy

**No global state management library** (Redux, Zustand, etc.). State is managed through:

1. **React useState** for component-local state
2. **localStorage** for persistence:
   - Router settings
   - Output settings
   - Map settings
   - User preferences

3. **Props drilling** for shared state (intentionally simple)
4. **API as source of truth** for server-side data

**Example state flow**:
```typescript
// App.tsx holds core state
const [analysis, setAnalysis] = useState<ImageAnalysisResult | null>(null)
const [generatedImage, setGeneratedImage] = useState<string | null>(null)

// Pass to children via props
<EffectsPanel analysis={analysis} />
<PromptLabPanel analysis={analysis} />
<GenerateButton analysis={analysis} onGenerate={setGeneratedImage} />
```

### Client-Side Routing

**No routing library** - single page application with conditional rendering:

```typescript
// Simple state-based view switching
const [view, setView] = useState<'upload' | 'analysis' | 'generation'>('upload')

return (
  <>
    {view === 'upload' && <UploadView />}
    {view === 'analysis' && <AnalysisView />}
    {view === 'generation' && <GenerationView />}
  </>
)
```

---

## Backend Architecture

### Service Layer Pattern

**Routes** handle HTTP concerns (request/response):
```typescript
// routes/analyze.ts
analyzeRouter.post('/', async (req, res) => {
  const parsed = AnalyzeRequestSchema.parse(req.body) // Validate
  const analysis = await analyzeImage(parsed)          // Delegate to service
  res.json(analysis)                                   // Respond
})
```

**Services** contain business logic:
```typescript
// services/analysisService.ts
export async function analyzeImage(request: AnalyzeRequest): Promise<ImageAnalysisResult> {
  // 1. Build vision prompt from substance profile
  // 2. Call OpenRouter vision API
  // 3. Parse and validate response
  // 4. Map to effect catalog
  // 5. Return structured result
}
```

### Dependency Injection

Services receive dependencies explicitly (no hidden globals):

```typescript
// Good: explicit dependencies
function generateImage(
  analysis: ImageAnalysisResult,
  apiClient: OpenAIClient
): Promise<string> {
  return apiClient.generateImage(/* ... */)
}

// Avoid: hidden module-level client
const client = new OpenAIClient() // Module scope - harder to test
```

### Error Handling Strategy

**Layered error handling**:

1. **Service layer**: Throw typed errors
   ```typescript
   if (!response.ok) {
     throw new HttpError(response.status, await response.text())
   }
   ```

2. **Route layer**: Catch and convert to HTTP responses
   ```typescript
   catch (err) {
     if (err instanceof HttpError) {
       res.status(err.status >= 500 ? 502 : err.status).json({ message: err.message })
     }
   }
   ```

3. **Client layer**: Display user-friendly messages
   ```typescript
   catch (error) {
     setError(error.message || 'An error occurred')
   }
   ```

---

## Shared Type System

### Type Organization

```
shared/types/
├── api.ts           # Request/response types
├── analysis.ts      # ImageAnalysisResult
├── effects.ts       # VisualEffect definitions
├── substances.ts    # SubstanceId enum
├── library.ts       # LibraryProject, LibraryGeneration
├── maps.ts          # MapPack, MapSettings
├── router.ts        # RouterSettings, PlacementRule
└── prompts.ts       # PromptBundle
```

### Type Safety Patterns

**Discriminated unions** for variant types:
```typescript
type GenerationMode = 'prompt_only' | 'base_image_edit'

// Compiler knows which fields exist based on mode
if (mode === 'base_image_edit') {
  // Can safely access base image fields
}
```

**Branded types** for IDs:
```typescript
type ProjectId = string & { __brand: 'ProjectId' }
type GenerationId = string & { __brand: 'GenerationId' }

// Prevents mixing up IDs
function getProject(id: ProjectId) { /* ... */ }
getProject(generationId) // Type error!
```

**Zod for runtime validation**:
```typescript
// Define schema once
const AnalyzeRequestSchema = z.object({
  imageDataUrl: z.string().refine(v => v.startsWith('data:image/')),
  substanceId: z.enum(SubstanceIds),
  dose: z.number().min(0).max(1),
})

// Infer TypeScript type
type AnalyzeRequest = z.infer<typeof AnalyzeRequestSchema>

// Parse and validate at runtime
const parsed = AnalyzeRequestSchema.parse(req.body)
```

---

## Data Flow

### Analysis → Generation Workflow

```
1. User uploads image
   │
   ├─→ Convert to data URL (browser FileReader)
   │
2. POST /api/analyze
   │
   ├─→ Backend: analyzeImage(imageDataUrl, substanceId, dose)
   │   ├─→ Build substance-specific vision prompt
   │   ├─→ Call OpenRouter vision API (120s timeout)
   │   ├─→ Parse JSON response
   │   ├─→ Validate against effect catalog
   │   └─→ Return ImageAnalysisResult
   │
   ├─→ Frontend: Display EffectsPanel + PromptLabPanel
   │
3. Optional: Adjust effects, router settings, generate maps
   │
4. POST /api/generate
   │
   ├─→ Backend: generateImageFromAnalysis(imageDataUrl, analysis, settings)
   │   ├─→ Build generation prompt from analysis + router
   │   ├─→ Include map guidance if available
   │   ├─→ Call OpenRouter image generation API (180s timeout)
   │   ├─→ Save to library if requested
   │   └─→ Return GenerateResponse
   │
   └─→ Frontend: Display generated image
```

### Map Generation Pipeline

```
1. POST /api/maps/ensure { imageDataUrl }
   │
2. Backend: Compute SHA-256 hash of image
   │
3. Check cache: map_cache/<hash>/
   │
   ├─→ If exists: Return cached MapPack
   │
   └─→ If not exists:
       │
       4. Save image to temp file
       │
       5. Spawn Python worker: generate_maps.py <image_path> <output_dir>
          │
          ├─→ Python: Load image with PIL
          ├─→ Generate depth map (Depth Anything V2 algorithm)
          ├─→ Generate normal map (Sobel gradients)
          ├─→ Generate edge map (Canny edge detection)
          ├─→ Detect face (MediaPipe Face Mesh)
          ├─→ Detect hands (MediaPipe Hands)
          └─→ Save all maps as PNG
       │
       6. Index maps in MapPack structure
       │
       7. Cache by hash
       │
       8. Return MapPack
```

---

## API Client Layer

### OpenRouter Integration

**Single client** for both vision and image generation:

```typescript
// openai/client.ts
export class HttpError extends Error {
  constructor(public status: number, public details: string) {
    super(`HTTP ${status}: ${details}`)
  }
}

export async function callOpenRouterVision(
  imageDataUrl: string,
  systemPrompt: string,
  userPrompt: string
): Promise<ImageAnalysisResult> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 120000)

  try {
    const response = await fetch(`${OPENROUTER_BASE_URL}/responses`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              { type: 'image_url', image_url: { url: imageDataUrl } },
              { type: 'text', text: userPrompt },
            ],
          },
        ],
      }),
    })

    if (!response.ok) {
      throw new HttpError(response.status, await response.text())
    }

    return await response.json()
  } finally {
    clearTimeout(timeoutId)
  }
}
```

**Error handling**:
- Network errors → HttpError with status 0
- API errors → HttpError with actual status code
- Timeout → AbortError (caught and converted)

---

## Library & Caching

### File System Structure

```
psyvis_lab_output/
├── proj_abc123/                    # Project directory
│   ├── metadata.json               # Project metadata
│   ├── input.jpg                   # Original image (optional)
│   ├── gen_xyz789/                 # Generation directory
│   │   ├── output.png              # Generated image
│   │   ├── metadata.json           # Generation metadata
│   │   ├── prompts.txt             # All prompt flavors
│   │   └── bundle.zip              # Downloadable bundle
│   └── gen_abc456/
│       └── ...
└── proj_def456/
    └── ...

map_cache/
├── <sha256_hash_1>/
│   ├── depth.png
│   ├── normals.png
│   ├── edges.png
│   ├── faceMask.png
│   ├── handsMask.png
│   └── settings.json
└── <sha256_hash_2>/
    └── ...
```

### Cleanup Scheduler

**Auto-cleanup runs daily**:

```typescript
// Runs at startup
startCleanupScheduler()

function startCleanupScheduler() {
  // Run immediately
  cleanupExpiredProjects()

  // Then every 24 hours
  setInterval(cleanupExpiredProjects, 24 * 60 * 60 * 1000)
}

function cleanupExpiredProjects() {
  const projects = listProjects()
  const now = Date.now()

  for (const project of projects) {
    if (!project.isSaved && project.expiresAt && new Date(project.expiresAt) < now) {
      deleteProject(project.projectId)
    }
  }
}
```

---

## Security Architecture

### API Key Protection

**Never exposed to frontend**:
- Keys stored in `.env` (server-side only)
- Backend acts as proxy to OpenRouter
- Frontend makes requests to `/api/*`, not directly to OpenRouter

### Input Validation

**Zod schemas at every boundary**:

```typescript
// All API routes validate input
const parsed = RequestSchema.parse(req.body)

// Malformed requests rejected before reaching service layer
```

### Data URL Sanitization

**Prevent XSS via data URLs**:

```typescript
// Validate format
z.string().refine(v => v.startsWith('data:image/'))

// Images only rendered in <img> tags, never in <script> or innerHTML
<img src={imageDataUrl} alt="..." />
```

### Rate Limiting

**OpenRouter handles rate limiting**:
- Backend forwards rate limit headers to client
- Client can implement exponential backoff
- Production deployments should add server-side rate limiting (express-rate-limit)

---

## Performance Considerations

### Lazy Loading

**Code splitting** via dynamic imports:
```typescript
// Load map generation UI only when needed
const MapLabPanel = lazy(() => import('./components/maps/MapLabPanel'))
```

### Image Optimization

**Reduce data URL size**:
```typescript
// Resize large images before upload
async function resizeImage(file: File, maxDimension: number): Promise<string> {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  const img = await loadImage(file)

  const scale = Math.min(1, maxDimension / Math.max(img.width, img.height))
  canvas.width = img.width * scale
  canvas.height = img.height * scale

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/jpeg', 0.9)
}
```

### Caching Strategy

**Multi-level caching**:

1. **Browser cache**: Static assets (Vite build with hashes)
2. **localStorage**: Settings and preferences
3. **Map cache**: SHA-256 based (persistent across sessions)
4. **Library cache**: In-memory index rebuilt on startup

---

## Additional Resources

- [API Reference](./API_REFERENCE.md) - Endpoint documentation
- [Deployment Guide](./DEPLOYMENT.md) - Production setup
- [Performance Guide](./PERFORMANCE.md) - Optimization strategies
- [Contributing](../CONTRIBUTING.md) - Development guidelines

---

**Questions?** Open an issue on [GitHub](https://github.com/your-repo/issues)
