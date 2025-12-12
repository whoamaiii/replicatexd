# RAG System (Retrieval-Augmented Generation)

PsyVis Lab includes an optional Retrieval-Augmented Generation (RAG) pipeline that can augment the **image generation prompt** with additional, context-aware effect guidance.

This is designed for:

- Consistent, high-signal prompt addendums
- Knowledge-grounded effect language (taxonomy + docs)
- A two-stage LLM flow: fast draft → high-quality refinement

## High-level Flow

1. **Retrieve context** from a local knowledge base index:
   - `data/visual_effects.json` (effect taxonomy + simulation hints)
   - `docs/*.md` (prompt engineering + workflow notes + guides)
2. **Draft** a prompt addendum with a fast/cheap text model (e.g. Grok Fast).
3. **Refine** the draft with a higher-quality text model (e.g. GPT‑5.2).
4. **Append** the final addendum to the prompt used for image generation.

## Local Vector Store

The knowledge base is embedded and stored locally in a JSONL-based vector index:

- Manifest: `data/rag/manifest.json`
- Documents (with embeddings): `data/rag/docs.jsonl`

Retrieval uses cosine similarity over normalized embeddings.

## Embeddings

By default, PsyVis Lab uses a local embedding model via `@xenova/transformers`:

- Default: `Xenova/e5-small-v2`

Documents are embedded with the E5 `passage:` prefix and queries use the `query:` prefix.

## Building the Index

1. Ensure your environment variables are set (at least `OPENROUTER_API_KEY`).
2. Build the local index:

`npm run rag:ingest`

This reads `data/visual_effects.json` and `docs/*.md`, chunks documents, embeds them, and writes the index into `data/rag`.

## Enabling RAG

1. Set server env:

`RAG_ENABLED=true`

2. In the UI:

- Open **Output Settings**
- Enable **RAG augmentation**
- (Optional) enter a RAG query
- Pick models in **Models**:
  - **RAG draft model**: fast text model
  - **RAG final model**: quality text model

If the RAG query is left blank, PsyVis Lab derives a query from the current analysis (scene description + strongest effects).

## Model Interaction

RAG uses two separate text calls:

- **Draft pass**: produces a structured "RAG Addendum" + "Constraints"
- **Refine pass**: rewrites the draft into a tighter, higher-signal version

Both calls run through OpenRouter’s `chat/completions` endpoint.

### Retrieval-only mode

For analysis (and optionally other stages), `rag.mode` can be set to:

- `draft_and_refine` (default): retrieval + draft + refine
- `retrieve_only`: retrieval only (no extra text model calls)

In `retrieve_only`, PsyVis Lab still:

- retrieves similar documents
- injects retrieved context into the analysis prompt to bias effect selection
- produces a small deterministic addendum from retrieved snippets (so downstream generation can reuse it)

## Where RAG Integrates

RAG is currently integrated into the image generation flow:

- The RAG output is appended to the `usedPrompt` before calling the image generation model.
- The server response includes an optional `rag` object with:
  - query, selected models, retrieved doc info, and the final addendum text

RAG can also be enabled for the analysis phase:

- The analysis request can include `rag` settings (enabled + query + draft/final model IDs).
- When enabled, retrieved context + the refined addendum are injected into the **vision analysis prompt** to bias effect selection.
- The analysis response may include:
  - `prompts.ragAddendum` (reusable, human-readable addendum)
  - `rag` (retrieval + model metadata + final addendum)

If generation RAG is enabled and the analysis already produced a `ragAddendum`, the generation step reuses it to avoid redundant RAG calls.

## Notes / Safety

The RAG prompt templates are moderation-conscious:

- They avoid substance-use language and instead use "surreal/dreamlike" phrasing.
- They emphasize embedding patterns into surfaces/materials and avoiding floating overlays.
