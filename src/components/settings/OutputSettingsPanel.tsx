import type { OutputSettings, AutoDownloadMode, GenerationMode } from '../../types/settings'
import { Card } from '../ui/Card'

export function OutputSettingsPanel(props: {
  settings: OutputSettings
  onChange: (settings: OutputSettings) => void
}) {
  const { settings, onChange } = props

  return (
    <Card className="p-4">
      <div className="text-sm font-semibold text-white/90">Output Settings</div>

      <div className="mt-4 grid gap-4">
        <div className="grid gap-2">
          <label className="text-xs text-white/70" htmlFor="generationMode">
            Generation mode
          </label>
          <select
            id="generationMode"
            value={settings.generationMode}
            onChange={(e) =>
              onChange({
                ...settings,
                generationMode: e.target.value as GenerationMode,
              })
            }
            className="h-9 rounded-lg border border-glass-border bg-glass-panel/50 px-3 text-sm text-white/90 outline-none focus:border-white/30"
          >
            <option value="base_image_edit">Base image edit (preserves structure)</option>
            <option value="prompt_only">Prompt only (maximum creativity)</option>
          </select>
          <div className="text-[10px] text-white/50">
            {settings.generationMode === 'base_image_edit'
              ? 'Input image guides generation for structural consistency'
              : 'Pure text-to-image generation without structural constraints'}
          </div>
        </div>

        <div className="grid gap-2">
          <label className="text-xs text-white/70" htmlFor="autoDownloadMode">
            Auto download after generation
          </label>
          <select
            id="autoDownloadMode"
            value={settings.autoDownloadMode}
            onChange={(e) =>
              onChange({
                ...settings,
                autoDownloadMode: e.target.value as AutoDownloadMode,
              })
            }
            className="h-9 rounded-lg border border-glass-border bg-glass-panel/50 px-3 text-sm text-white/90 outline-none focus:border-white/30"
          >
            <option value="off">Off</option>
            <option value="image">Image only</option>
            <option value="bundle">Full bundle (image + metadata)</option>
          </select>
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.autoSaveToLibrary}
            onChange={(e) =>
              onChange({
                ...settings,
                autoSaveToLibrary: e.target.checked,
              })
            }
            className="h-4 w-4 rounded border-glass-border bg-glass-panel/50 text-violet-500 focus:ring-violet-500/50"
          />
          <span className="text-xs text-white/70">Save to server library</span>
        </label>

        <div className="border-t border-glass-border/70 pt-4">
          <div className="text-xs font-medium text-white/80">RAG Assist (optional)</div>
          <div className="mt-1 text-[10px] text-white/55">
            Uses a local knowledge base + two text models to add extra guidance. Requires `npm run rag:ingest` and
            `RAG_ENABLED=true` on the server.
          </div>

          <div className="mt-4 grid gap-4">
            <div>
              <div className="text-[11px] font-medium text-white/75">Analysis stage</div>
              <div className="mt-1 text-[10px] text-white/50">
                Biases effect selection + may attach a reusable addendum to the analysis prompts.
              </div>

              <label className="mt-2 flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.ragAnalysisEnabled}
                  onChange={(e) =>
                    onChange({
                      ...settings,
                      ragAnalysisEnabled: e.target.checked,
                    })
                  }
                  className="h-4 w-4 rounded border-glass-border bg-glass-panel/50 text-violet-500 focus:ring-violet-500/50"
                />
                <span className="text-xs text-white/70">Enable RAG influence on analysis</span>
              </label>

              <label className="mt-3 grid gap-1.5">
                <span className="text-xs text-white/70">Analysis RAG mode</span>
                <select
                  value={settings.ragAnalysisMode}
                  onChange={(e) =>
                    onChange({
                      ...settings,
                      ragAnalysisMode: e.target.value as 'draft_and_refine' | 'retrieve_only',
                    })
                  }
                  className="h-9 rounded-lg border border-glass-border bg-glass-panel/50 px-3 text-sm text-white/90 outline-none focus:border-white/30"
                  disabled={!settings.ragAnalysisEnabled}
                >
                  <option value="draft_and_refine">Draft + refine (uses text models)</option>
                  <option value="retrieve_only">Retrieve only (no extra model calls)</option>
                </select>
                <div className="text-[10px] text-white/50">
                  Retrieval-only mode still injects retrieved context into the analysis prompt, but skips the draft/refine text model stages.
                </div>
              </label>

              <label className="mt-3 grid gap-1.5">
                <span className="text-xs text-white/70">Analysis RAG query (optional)</span>
                <input
                  value={settings.ragAnalysisQuery}
                  onChange={(e) =>
                    onChange({
                      ...settings,
                      ragAnalysisQuery: e.target.value,
                    })
                  }
                  placeholder="e.g. ‘prioritize distortions, breathing textures, and stable geometry’"
                  className="h-9 w-full rounded-lg border border-glass-border bg-glass-panel/50 px-3 text-sm text-white/90 outline-none focus:border-white/30 placeholder:text-white/35"
                  disabled={!settings.ragAnalysisEnabled}
                />
              </label>
            </div>

            <div>
              <div className="text-[11px] font-medium text-white/75">Generation stage</div>
              <div className="mt-1 text-[10px] text-white/50">
                Appends a RAG addendum to the generation prompt used for image synthesis.
              </div>

              <label className="mt-2 flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.ragEnabled}
                  onChange={(e) =>
                    onChange({
                      ...settings,
                      ragEnabled: e.target.checked,
                    })
                  }
                  className="h-4 w-4 rounded border-glass-border bg-glass-panel/50 text-violet-500 focus:ring-violet-500/50"
                />
                <span className="text-xs text-white/70">Enable RAG augmentation on generation</span>
              </label>

              <label className="mt-3 grid gap-1.5">
                <span className="text-xs text-white/70">Generation RAG query (optional)</span>
                <input
                  value={settings.ragQuery}
                  onChange={(e) =>
                    onChange({
                      ...settings,
                      ragQuery: e.target.value,
                    })
                  }
                  placeholder="e.g. ‘more breathing surfaces, neon color enhancement, mandala textures’"
                  className="h-9 w-full rounded-lg border border-glass-border bg-glass-panel/50 px-3 text-sm text-white/90 outline-none focus:border-white/30 placeholder:text-white/35"
                  disabled={!settings.ragEnabled}
                />
                <div className="text-[10px] text-white/50">
                  Leave blank to reuse the analysis RAG query (if available), otherwise auto-derive from the analysis.
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
