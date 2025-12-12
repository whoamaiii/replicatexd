# Models (OpenRouter)

PsyVis Lab supports dynamic model selection for:

- **Analysis** (image in → text out)
- **Generation** (text/image in → image out)
- **Maps (optional)** (used only when the Maps provider is Nano Banana)

The app fetches the live model catalog from OpenRouter at runtime, so you can switch models without restarting the dev server.

## How It Works

### Catalog fetch + caching

- The backend fetches models from OpenRouter’s **Models API** and caches the result in memory for a TTL.
- Endpoint: `GET /api/models`
- Response shape: `{ recommended, all, fetchedAt }`

Files:

- `server/src/services/modelCatalogService.ts` (fetching, caching, filtering, tag heuristics)
- `server/src/routes/models.ts` (`GET /api/models`)

### Default model selection (by name, not id)

The server resolves defaults by **case-insensitive substring match on display name**:

- `DEFAULT_ANALYSIS_MODEL_NAME` (example: `GPT 5.2`)
- `DEFAULT_GENERATION_MODEL_NAME` (example: `GPT 5 Image`)

If you set a model in the Models view, the client sends the model id explicitly and the server uses it.

Legacy overrides (model IDs) remain supported:

- `OPENAI_MODEL` (analysis model id)
- `OPENROUTER_IMAGE_MODEL` (generation model id)

Configuration is documented in `env.example`.

## The Models View

Navigate to **Models** in the left sidebar.

You can select models separately for:

- Analysis model
- Generation model
- Maps model (optional)

Selections are persisted in `localStorage`, and the chosen model ids are sent along with API requests.

### Search + filters

Each selector includes:

- A **search box** (matches name, provider, id, and description)
- A **Filters** dropdown with:
  - Capabilities: `image in`, `image out`, `multi image`, `edit mode`
  - Best for: `photoreal`, `typography`, `precise edits`, `fast drafts`

### Tooltips and details

- Hover over a model row to see a quick tooltip summary (description + tags + pricing when available).
- The right panel shows a fuller “Model details” view for the currently focused/selected model.

## Capability and “Best For” Tags

Tags are derived from OpenRouter’s model fields when available (e.g. modalities) and fall back to conservative heuristics based on the model description.

### Capability tags

- `image in`: model likely accepts image input
- `image out`: model likely produces images (OpenRouter image generation)
- `multi image`: model likely supports multiple images in a single request
- `edit mode`: model likely supports image editing concepts (inpainting/outpainting/masks)

### “Best for” tags

These are heuristics meant to help you choose quickly:

- `photoreal replication`
- `typography`
- `precise localized edits`
- `fast drafts`

Because OpenRouter providers can change behavior over time, treat these tags as guidance and verify with a small test run.

## Recommended Models

The `recommended` list returned by `/api/models` is a curated subset built by name match. Currently it includes models whose display name contains any of:

- `GPT 5 Image`
- `GPT 5 Image Mini`
- `Nano Banana Pro`
- `Flux 2 Flex`
- `Flux 2 Pro`

This list is intentionally small and meant to reduce choice overload.

## Usage Examples (Practical Guidance)

### Analysis (image → structured JSON)

Best practices:

- Prefer models with **image in** + strong text reasoning (vision/multimodal).
- If you get incomplete JSON, try switching to a more capable analysis model.

### Generation (psychedelic edit / img2img)

Best practices:

- For faithful “replication” edits: prefer `edit mode` + `photoreal replication`.
- For speed: prefer `fast drafts` and iterate, then switch to a higher-quality model.
- If typography matters: use `typography` tagged models and keep text instructions explicit.

## Quick Comparison Table (Heuristic)

| Task | What to look for in Models view | Notes |
|---|---|---|
| Best for color enhancement | `photoreal replication` + (optionally) `fast drafts` | Start fast, finish photoreal |
| Best for geometric patterns | `precise localized edits` + `edit mode` | Helps keep geometry surface-embedded |
| Best for high-resolution image generation | `image out` + `photoreal replication` | Also check pricing line |

## Library Metadata

When you save a generation, the library records:

- `analysisModelId` / `analysisModelName` (if provided at generation time)
- `generationModelId` / `generationModelName`

Legacy projects are still supported via the original `model` field.

## End-to-End Manual Test Checklist

1. Start dev: `npm run dev`
2. Open **Models**, pick an analysis model and generation model.
3. Go to **Lab**, upload an image.
4. Run **Analyze**.
5. Run **Generate**.
6. Save to **Library** and confirm the generation shows model info.
7. Switch models in **Models** and repeat steps 4–6 (no server restart).

