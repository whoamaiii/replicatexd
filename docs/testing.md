# Testing Guide

## Running Tests

```bash
# Run all tests
npm run test

# Run server and shared tests only
npm run test:server

# Run web tests only
npm run test:web
```

## Test Infrastructure

PsyVis Lab uses [Vitest](https://vitest.dev/) as the test runner with the following configuration:

- **Server tests** (`server/**/*.test.ts`) run in Node environment
- **Shared type tests** (`shared/**/*.test.ts`) run in Node environment
- **Web tests** (`src/**/*.test.ts`, `src/**/*.test.tsx`) run in jsdom environment

## Test Structure

```
psyvis_lab/
├── server/src/
│   ├── routes/
│   │   └── generate.test.ts      # Integration tests for /api/generate
│   └── services/
│       └── routerService.test.ts # Unit tests for router service
├── shared/types/
│   └── router.test.ts            # Validation tests for router settings
└── src/
    └── (web component tests here)
```

## Mocking OpenRouter Calls

The integration tests mock the OpenRouter API to avoid network calls during testing. This is done using Vitest's `vi.mock()`:

```typescript
// server/src/routes/generate.test.ts
vi.mock('../openai/client', () => ({
  callImageGeneration: vi.fn().mockResolvedValue({
    imageBase64: 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
    mimeType: 'image/gif',
  }),
}))
```

The mock returns a minimal valid image (1x1 transparent GIF) which is sufficient for testing the request/response flow without making real API calls.

Environment variables for tests are set using `vi.stubEnv()`:

```typescript
vi.stubEnv('OPENROUTER_API_KEY', 'test-api-key')
vi.stubEnv('LIBRARY_OUTPUT_DIR', 'test_output')
```

## Test Fixtures

### Sample Analysis Result

Tests use a fixed `ImageAnalysisResult` object with valid effectIds from `data/visual_effects.json`:

```typescript
const sampleAnalysis: ImageAnalysisResult = {
  substanceId: 'lsd',
  dose: 0.5,
  baseSceneDescription: 'A forest path with dappled sunlight.',
  effects: [
    { effectId: 'color_enhancement', group: 'enhancements', intensity: 0.6 },
    { effectId: 'breathing_surfaces', group: 'distortions', intensity: 0.5 },
  ],
  prompts: {
    openAIImagePrompt: 'A psychedelic forest scene...',
    shortCinematicDescription: 'A mystical forest awakening',
  },
}
```

### Sample Router Settings

```typescript
const sampleRouterSettings: RouterSettings = {
  enabled: true,
  defaultRegions: ['subject', 'background'],
  defaultDepthBands: ['near', 'mid', 'far'],
  protectFace: true,
  protectHands: true,
  protectEdges: true,
  surfaceLockStrength: 0.6,
  groupMultipliers: {
    enhancements: 1.0,
    distortions: 1.0,
    geometry: 1.0,
    hallucinations: 1.0,
    perceptual: 1.0,
  },
  rules: [],
}
```

### Sample MapPack

```typescript
const fullMapPack: MapPack = {
  sourceHash: 'test-hash',
  sourceWidth: 1920,
  sourceHeight: 1080,
  createdAt: '2025-01-01T00:00:00Z',
  inputFilename: 'test.png',
  maps: [
    { kind: 'depth', filename: 'depth.png', ... },
    { kind: 'edges', filename: 'edges.png', ... },
    { kind: 'faceMask', filename: 'face.png', ... },
    { kind: 'handsMask', filename: 'hands.png', ... },
    { kind: 'segmentation', filename: 'seg.png', ... },
  ],
}
```

## What's Tested

### routerService Unit Tests

- **Determinism**: `buildPlacementPlan` produces identical output given the same inputs
- **Group multipliers**: Multipliers below 0.3 produce "Minimize" instructions; above 1.5 produce "Emphasize"
- **Protection flags**: `protectFace` and `protectHands` produce expected instruction lines with or without masks

### Router Settings Validation Tests

- Valid settings pass validation
- Invalid values (out-of-range numbers, invalid enum values) fail with clear errors
- Partial settings are accepted (all fields are optional)

### Integration Tests

- Invalid router settings return 400
- Valid router settings return 200 with generated image
- Router placement instructions appear in the used prompt when router is enabled
- Router instructions are excluded when router is disabled

## Adding New Tests

1. Create a `.test.ts` file next to the module being tested
2. Import from `vitest`: `import { describe, it, expect } from 'vitest'`
3. For server tests, mock external dependencies using `vi.mock()`
4. Use `vi.stubEnv()` for environment variables needed during tests
