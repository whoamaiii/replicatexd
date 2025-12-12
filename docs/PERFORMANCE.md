# Performance Guide

Optimization strategies for PsyVis Lab.

**Last Updated**: 2025-12-12

---

## Table of Contents

1. [Overview](#overview)
2. [Image Size Optimization](#image-size-optimization)
3. [API Performance](#api-performance)
4. [Frontend Optimization](#frontend-optimization)
5. [Backend Optimization](#backend-optimization)
6. [Map Generation Performance](#map-generation-performance)
7. [Library Management](#library-management)
8. [Caching Strategies](#caching-strategies)
9. [Monitoring & Profiling](#monitoring--profiling)
10. [Production Tuning](#production-tuning)

---

## Overview

PsyVis Lab performance is primarily constrained by:
- **External API latency**: OpenRouter vision (120s) and generation (180s)
- **Image size**: Larger images = slower processing + more tokens
- **Map generation**: Python worker CPU usage
- **Network bandwidth**: Data URL transfer size

**Quick wins**:
- Resize images to 1024-2048px max dimension
- Enable map caching
- Use minimal prompt flavor when appropriate
- Implement library cleanup

---

## Image Size Optimization

### Recommended Sizes

| Use Case | Max Dimension | Typical File Size | Analysis Time | Generation Time |
|----------|---------------|-------------------|---------------|-----------------|
| Quick preview | 512px | ~50KB | 15-30s | 30-60s |
| Standard quality | 1024px | ~150KB | 30-60s | 60-120s |
| High quality | 2048px | ~400KB | 60-90s | 120-180s |
| Maximum (not recommended) | 4096px | ~1.5MB | 90-120s | 180s+ (may timeout) |

### Client-Side Resizing

**Before upload**:
```typescript
async function resizeImage(file: File, maxDimension: number): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!

    img.onload = () => {
      // Calculate new dimensions
      const scale = Math.min(1, maxDimension / Math.max(img.width, img.height))
      const width = Math.floor(img.width * scale)
      const height = Math.floor(img.height * scale)

      // Resize on canvas
      canvas.width = width
      canvas.height = height
      ctx.drawImage(img, 0, 0, width, height)

      // Convert to data URL (JPEG for smaller size)
      resolve(canvas.toDataURL('image/jpeg', 0.85))
    }

    img.src = URL.createObjectURL(file)
  })
}
```

**Quality vs Size**:
- JPEG quality 0.9: Best quality, larger size
- JPEG quality 0.85: Recommended (good balance)
- JPEG quality 0.7: Smaller, visible compression artifacts

---

## API Performance

### Timeout Configuration

**Analysis**: 120 seconds (default)
```typescript
const controller = new AbortController()
const timeoutId = setTimeout(() => controller.abort(), 120000)

fetch(url, { signal: controller.signal })
```

**Generation**: 180 seconds (default)
```typescript
setTimeout(() => controller.abort(), 180000)
```

**When to adjust**:
- Increase for large images (>2048px)
- Decrease for quick previews

### Reducing API Token Usage

**Strategies**:

1. **Use minimal prompt flavor**
   ```typescript
   // 50-100 tokens
   const minimalPrompt = buildMinimalPrompt(analysis)
   ```

2. **Simplify effect descriptions**
   ```typescript
   // Only include effects above threshold
   const significantEffects = effects.filter(e => e.intensity > 0.3)
   ```

3. **Disable router for simple scenes**
   ```typescript
   // Router adds 50-150 tokens
   const routerSettings = { enabled: false }
   ```

### Parallel Requests

**Good**: Generate prompts while waiting for analysis
```typescript
const analysisPromise = fetch('/api/analyze', { ... })
const mapsPromise = fetch('/api/maps/ensure', { ... })

const [analysis, maps] = await Promise.all([analysisPromise, mapsPromise])
```

**Bad**: Sequential waits
```typescript
const analysis = await fetch('/api/analyze', { ... })
// Wait unnecessarily
const maps = await fetch('/api/maps/ensure', { ... })
```

---

## Frontend Optimization

### Code Splitting

**Lazy load** heavy components:
```typescript
import { lazy, Suspense } from 'react'

const MapLabPanel = lazy(() => import('./components/maps/MapLabPanel'))

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <MapLabPanel />
    </Suspense>
  )
}
```

### Memoization

**Prevent unnecessary re-renders**:
```typescript
import { memo } from 'react'

export const EffectCard = memo(({ effect }: { effect: PsychedelicEffect }) => {
  return <div>{effect.displayName}</div>
})
```

**Expensive calculations**:
```typescript
import { useMemo } from 'react'

function PromptLabPanel({ analysis }: { analysis: ImageAnalysisResult }) {
  const prompts = useMemo(
    () => buildAllPromptFlavors(analysis),
    [analysis]
  )

  return <div>{/* render prompts */}</div>
}
```

### Virtual Scrolling

**For large effect lists**:
```typescript
import { FixedSizeList } from 'react-window'

<FixedSizeList
  height={600}
  itemCount={effects.length}
  itemSize={80}
>
  {({ index, style }) => (
    <div style={style}>
      <EffectCard effect={effects[index]} />
    </div>
  )}
</FixedSizeList>
```

### localStorage Optimization

**Debounce writes**:
```typescript
import { debounce } from 'lodash'

const saveSettings = debounce((settings) => {
  localStorage.setItem('routerSettings', JSON.stringify(settings))
}, 500)
```

**Limit data size**:
```typescript
// Don't store large data URLs in localStorage
// Store project IDs instead
localStorage.setItem('recentProjects', JSON.stringify([projectId1, projectId2]))
```

---

## Backend Optimization

### Response Compression

**Enable gzip** (production):
```typescript
import compression from 'compression'

app.use(compression())
```

**Reduces payload size** by 70-90% for JSON responses.

### Streaming Responses

**For large files**:
```typescript
app.get('/api/library/file/:projectId/:generationId', (req, res) => {
  const filePath = getGenerationImagePath(req.params)

  // Stream instead of loading into memory
  const stream = fs.createReadStream(filePath)
  stream.pipe(res)
})
```

### Connection Pooling

**Keep-alive connections** to OpenRouter:
```typescript
import { Agent } from 'https'

const agent = new Agent({
  keepAlive: true,
  maxSockets: 10,
})

fetch(url, { agent })
```

### Process-Level Caching

**In-memory cache** for frequently accessed data:
```typescript
const effectCatalog = JSON.parse(
  fs.readFileSync('data/visual_effects.json', 'utf-8')
)

// Load once at startup, reuse for all requests
```

---

## Map Generation Performance

### Reduce Image Size

**Before sending to Python**:
```typescript
// Downscale to max 4MP (default)
const MAX_MEGAPIXELS = 4

function downscaleIfNeeded(imageBuffer: Buffer): Buffer {
  const img = loadImage(imageBuffer)
  const currentMP = (img.width * img.height) / 1_000_000

  if (currentMP > MAX_MEGAPIXELS) {
    const scale = Math.sqrt(MAX_MEGAPIXELS / currentMP)
    return resizeImage(img, scale)
  }

  return imageBuffer
}
```

### Disable Unused Maps

**In .env**:
```env
MAPS_DEPTH_ENABLED=true
MAPS_NORMALS_ENABLED=true
MAPS_EDGES_ENABLED=true
MAPS_FACE_MASK_ENABLED=false  # Disable if not needed
MAPS_HANDS_MASK_ENABLED=false
MAPS_SEGMENTATION_ENABLED=false
```

**Savings**: Each disabled map saves 5-15 seconds.

### Python Optimization

**Install optimized libraries**:
```bash
# Use optimized NumPy
pip install numpy[mkl]

# Use TurboJPEG for faster decoding
pip install PyTurboJPEG
```

**Use process pool** for concurrent map generation:
```typescript
import { Pool } from 'generic-pool'

const pythonPool = Pool.create({
  create: () => spawn('python3', ['-u', 'generate_maps.py']),
  destroy: (process) => process.kill(),
  max: 4, // 4 concurrent workers
})
```

---

## Library Management

### Auto-Cleanup Configuration

**Aggressive cleanup** (save storage):
```env
LIBRARY_RETENTION_DAYS=2
LIBRARY_TRASH_GRACE_HOURS=12
```

**Conservative cleanup** (keep history):
```env
LIBRARY_RETENTION_DAYS=14
LIBRARY_TRASH_GRACE_HOURS=72
```

### Manual Cleanup

**Prune old projects**:
```bash
find psyvis_lab_output -type d -mtime +30 -exec rm -rf {} \;
```

**Clear map cache**:
```bash
rm -rf map_cache/*
```

### Storage Estimates

| Item | Size | Per Day (10 users) |
|------|------|-------------------|
| Analysis result | ~5KB | ~50KB |
| Generated image (1024px) | ~200KB | ~2MB |
| Map pack (6 maps) | ~3MB | ~30MB |
| Bundle (with metadata) | ~3.5MB | ~35MB |

**Monthly estimate**: 1-3GB for moderate usage.

---

## Caching Strategies

### Map Cache

**Already implemented** (SHA-256 based):
```
map_cache/
└── <image_hash>/
    ├── depth.png       # Cached permanently
    ├── normals.png
    ├── edges.png
    └── settings.json
```

**Cache hit rate**: ~70% for repeated analyses of same image.

### Effect Catalog Cache

**Load once, reuse**:
```typescript
let cachedCatalog: VisualEffect[] | null = null

function getEffectCatalog(): VisualEffect[] {
  if (!cachedCatalog) {
    cachedCatalog = JSON.parse(fs.readFileSync('data/visual_effects.json'))
  }
  return cachedCatalog
}
```

### HTTP Caching Headers

**For static assets** (production):
```typescript
app.use('/assets', express.static('dist/assets', {
  maxAge: '1y',
  immutable: true,
}))
```

---

## Monitoring & Profiling

### Request Timing

**Log slow requests**:
```typescript
app.use((req, res, next) => {
  const start = Date.now()

  res.on('finish', () => {
    const duration = Date.now() - start
    if (duration > 5000) {
      console.warn(`Slow request: ${req.method} ${req.path} took ${duration}ms`)
    }
  })

  next()
})
```

### Memory Profiling

**Node.js heap usage**:
```bash
node --inspect server/dist/index.js
# Open chrome://inspect and take heap snapshots
```

**Monitor in production**:
```typescript
setInterval(() => {
  const usage = process.memoryUsage()
  console.log(`Memory: ${Math.round(usage.heapUsed / 1024 / 1024)}MB`)
}, 60000)
```

### API Metrics

**Track API call performance**:
```typescript
let totalCalls = 0
let totalDuration = 0

async function callOpenRouter(...args) {
  const start = Date.now()
  totalCalls++

  try {
    return await actualCall(...args)
  } finally {
    totalDuration += Date.now() - start
    console.log(`Avg API time: ${totalDuration / totalCalls}ms`)
  }
}
```

---

## Production Tuning

### Node.js Options

**Increase memory limit**:
```bash
NODE_OPTIONS="--max-old-space-size=4096" node server/dist/index.js
```

**Enable clustering**:
```typescript
import cluster from 'cluster'
import os from 'os'

if (cluster.isPrimary) {
  const cpus = os.cpus().length
  for (let i = 0; i < cpus; i++) {
    cluster.fork()
  }
} else {
  // Start server
}
```

### Database (Future)

**If migrating from filesystem**:
- Use PostgreSQL for project metadata
- Use S3/object storage for images
- Keep map cache on local SSD

### CDN for Assets

**Serve static files** from CDN:
```nginx
location /assets/ {
  proxy_pass https://cdn.your-domain.com/assets/;
}
```

### Load Balancing

**Multiple backend instances**:
```nginx
upstream psyvis_backends {
  server 127.0.0.1:5174;
  server 127.0.0.1:5175;
  server 127.0.0.1:5176;
}

server {
  location /api/ {
    proxy_pass http://psyvis_backends;
  }
}
```

---

## Benchmarks

### Typical Performance (1024px image)

| Operation | Time | Factors |
|-----------|------|---------|
| Upload + resize | 0.5s | Client browser speed |
| POST /api/analyze | 30-60s | OpenRouter API latency, image complexity |
| Map generation | 15-30s | Python, enabled maps, image size |
| POST /api/generate | 60-120s | OpenRouter API, prompt complexity |
| Total workflow | ~2-4 min | Network + API + processing |

### Optimization Impact

| Optimization | Time Saved | Effort |
|--------------|------------|--------|
| Resize to 1024px | 30-60s | Low |
| Disable unused maps | 10-20s | Low |
| Use minimal prompt | 5-10s | Low |
| Enable response compression | N/A (smaller payload) | Low |
| Implement clustering | N/A (higher throughput) | Medium |

---

## Additional Resources

- [Deployment Guide](./DEPLOYMENT.md) - Production setup
- [Architecture](./ARCHITECTURE.md) - System design
- [Troubleshooting](./TROUBLESHOOTING.md) - Common issues

---

**Questions?** Open an issue on [GitHub](https://github.com/your-repo/issues)
