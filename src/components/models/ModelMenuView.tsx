import { useEffect, useMemo, useState } from 'react'
import type { ModelInfo, ModelMenuResponse, ModelTag } from '../../../shared/types/models'
import type { ModelSettings } from '../../lib/modelSettingsStorage'
import { fetchModelMenu } from '../../lib/modelsClient'
import { Panel } from '../ui/Panel'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Chip } from '../ui/Chip'
import { Tooltip } from '../ui/Tooltip'

type ListMode = 'recommended' | 'all'
type Slot = 'analysis' | 'generation' | 'maps' | 'ragDraft' | 'ragFinal'

type FilterKey =
  | 'cap-image-in'
  | 'cap-image-out'
  | 'cap-multi-image'
  | 'cap-edit-mode'
  | 'best-photoreal'
  | 'best-typography'
  | 'best-precise-edits'
  | 'best-fast'

type SlotFilters = Record<FilterKey, boolean>

const DEFAULT_FILTERS: SlotFilters = {
  'cap-image-in': false,
  'cap-image-out': false,
  'cap-multi-image': false,
  'cap-edit-mode': false,
  'best-photoreal': false,
  'best-typography': false,
  'best-precise-edits': false,
  'best-fast': false,
}

function tagLabel(tag: ModelTag) {
  switch (tag) {
    case 'image-in':
      return 'image in'
    case 'image-out':
      return 'image out'
    case 'multi-image':
      return 'multi image'
    case 'edit-mode':
      return 'edit mode'
    case 'best-photoreal-replication':
      return 'photoreal replication'
    case 'best-typography':
      return 'typography'
    case 'best-precise-local-edits':
      return 'precise localized edits'
    case 'best-fast-drafts':
      return 'fast drafts'
  }
}

function matchesFilters(model: ModelInfo, filters: SlotFilters) {
  if (filters['cap-image-in'] && !model.caps.imageIn) return false
  if (filters['cap-image-out'] && !model.caps.imageOut) return false
  if (filters['cap-multi-image'] && !model.caps.multiImage) return false
  if (filters['cap-edit-mode'] && !model.caps.editMode) return false

  if (filters['best-photoreal'] && !model.tags.includes('best-photoreal-replication')) return false
  if (filters['best-typography'] && !model.tags.includes('best-typography')) return false
  if (filters['best-precise-edits'] && !model.tags.includes('best-precise-local-edits')) return false
  if (filters['best-fast'] && !model.tags.includes('best-fast-drafts')) return false

  return true
}

function formatPricingLine(model: ModelInfo) {
  const p = model.pricing
  if (!p) return null
  const parts: string[] = []
  if (p.prompt) parts.push(`prompt ${p.prompt}`)
  if (p.completion) parts.push(`completion ${p.completion}`)
  if (p.image) parts.push(`image ${p.image}`)
  if (p.request) parts.push(`request ${p.request}`)
  if (!parts.length) return null
  return parts.join(' · ')
}

function shortDescription(text: string, maxLen = 160) {
  const compact = text.replace(/\s+/g, ' ').trim()
  if (compact.length <= maxLen) return compact
  return compact.slice(0, maxLen).trim() + '…'
}

function normalizeForSearch(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function matchesSearch(model: ModelInfo, q: string) {
  const query = normalizeForSearch(q)
  if (!query) return true

  const base = [
    model.displayName,
    model.provider,
    model.id,
    model.description,
    model.tags.join(' '),
  ].join(' ')

  // Helpful aliases so users can find OpenAI image models via common phrasing:
  // - "chatgpt" often maps to ids containing "gpt"
  // - "imagine" is a common misspelling/synonym for "image"
  const aliases = [
    base,
    base.replace(/gpt/gi, 'chatgpt'),
    base.replace(/image/gi, 'imagine'),
  ]

  return aliases.some((s) => normalizeForSearch(s).includes(query))
}

function isCandidateForSlot(model: ModelInfo, slot: Slot) {
  if (slot === 'analysis') return model.caps.imageIn && model.caps.textOut
  if (slot === 'generation') return model.caps.imageOut
  if (slot === 'maps') return model.caps.imageIn && model.caps.imageOut
  // RAG draft/final are text-only chat models.
  return model.caps.textIn && model.caps.textOut
}

function setSelectedModelId(settings: ModelSettings, slot: Slot, modelId: string): ModelSettings {
  if (slot === 'analysis') return { ...settings, analysisModelId: modelId }
  if (slot === 'generation') return { ...settings, generationModelId: modelId }
  if (slot === 'maps') return { ...settings, mapsModelId: modelId }
  if (slot === 'ragDraft') return { ...settings, ragDraftModelId: modelId }
  return { ...settings, ragFinalModelId: modelId }
}

function clearSelectedModelId(settings: ModelSettings, slot: Slot): ModelSettings {
  if (slot === 'analysis') return { ...settings, analysisModelId: undefined }
  if (slot === 'generation') return { ...settings, generationModelId: undefined }
  if (slot === 'maps') return { ...settings, mapsModelId: undefined }
  if (slot === 'ragDraft') return { ...settings, ragDraftModelId: undefined }
  return { ...settings, ragFinalModelId: undefined }
}

function ToggleChip(props: {
  active: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      className={[
        'inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] transition',
        props.active
          ? 'border-accent-teal bg-accent-teal/15 text-accent-teal'
          : 'border-glass-border bg-white/5 text-white/70 hover:bg-white/8',
      ].join(' ')}
    >
      {props.label}
    </button>
  )
}

function SlotPanel(props: {
  title: string
  subtitle: string
  slot: Slot
  models: ModelInfo[]
  selectedModel?: ModelInfo | null
  hasMissingSelection: boolean
  search: string
  onChangeSearch: (v: string) => void
  filters: SlotFilters
  onToggleFilter: (key: FilterKey) => void
  onPick: (modelId: string) => void
  onFocus: (modelId: string) => void
  onClearSelection: () => void
}) {
  const selectedModelId = props.selectedModel?.id

  return (
    <Panel className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-white/90">{props.title}</div>
          <div className="mt-0.5 text-xs text-white/60">{props.subtitle}</div>
          {props.hasMissingSelection ? (
            <div className="mt-1 text-[11px] text-amber-300/80">
              Selected model is missing from the current catalog.
            </div>
          ) : props.selectedModel ? (
            <div className="mt-1 text-[11px] text-white/55 truncate">
              Selected: {props.selectedModel.displayName}
            </div>
          ) : null}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {selectedModelId ? (
            <Chip className="text-white/70">selected</Chip>
          ) : (
            <Chip className="text-white/50">unset</Chip>
          )}
          {selectedModelId || props.hasMissingSelection ? (
            <button
              type="button"
              onClick={props.onClearSelection}
              className="text-[11px] text-white/45 hover:text-white/70"
            >
              Clear
            </button>
          ) : null}
        </div>
      </div>

      <input
        value={props.search}
        onChange={(e) => props.onChangeSearch(e.target.value)}
        placeholder="Search models…"
        className="mt-3 w-full rounded-lg border border-glass-border bg-white/5 px-3 py-2 text-sm text-white/90 placeholder:text-white/35"
      />

      <details className="mt-2">
        <summary className="cursor-pointer select-none text-xs text-white/55 hover:text-white/75">
          Filters
        </summary>
        <div className="mt-2 grid gap-2">
          <div className="text-[11px] text-white/45">Capabilities</div>
          <div className="flex flex-wrap gap-2">
            <ToggleChip
              active={props.filters['cap-image-in']}
              label="image in"
              onClick={() => props.onToggleFilter('cap-image-in')}
            />
            <ToggleChip
              active={props.filters['cap-image-out']}
              label="image out"
              onClick={() => props.onToggleFilter('cap-image-out')}
            />
            <ToggleChip
              active={props.filters['cap-multi-image']}
              label="multi image"
              onClick={() => props.onToggleFilter('cap-multi-image')}
            />
            <ToggleChip
              active={props.filters['cap-edit-mode']}
              label="edit mode"
              onClick={() => props.onToggleFilter('cap-edit-mode')}
            />
          </div>

          <div className="mt-2 text-[11px] text-white/45">Best for</div>
          <div className="flex flex-wrap gap-2">
            <ToggleChip
              active={props.filters['best-photoreal']}
              label="photoreal"
              onClick={() => props.onToggleFilter('best-photoreal')}
            />
            <ToggleChip
              active={props.filters['best-typography']}
              label="typography"
              onClick={() => props.onToggleFilter('best-typography')}
            />
            <ToggleChip
              active={props.filters['best-precise-edits']}
              label="precise edits"
              onClick={() => props.onToggleFilter('best-precise-edits')}
            />
            <ToggleChip
              active={props.filters['best-fast']}
              label="fast drafts"
              onClick={() => props.onToggleFilter('best-fast')}
            />
          </div>
        </div>
      </details>

      <div className="mt-3 grid gap-2 max-h-[240px] sm:max-h-[280px] overflow-y-auto pr-1">
        {props.models.length === 0 ? (
          <div className="text-xs text-white/50">No models match this filter.</div>
        ) : (
          props.models.map((m) => {
            const selected = selectedModelId === m.id
            const pricingLine = formatPricingLine(m)
            const bestTags = m.tags.filter((t) => t.startsWith('best-')).slice(0, 3)
            return (
              <Tooltip
                key={m.id}
                side="right"
                content={
                  <div className="grid gap-2">
                    <div className="text-[12px] font-medium text-white/90">{m.displayName}</div>
                    <div className="text-[11px] text-white/70">{shortDescription(m.description, 140)}</div>
                    {pricingLine ? (
                      <div className="text-[10px] text-white/55">Pricing: {pricingLine}</div>
                    ) : null}
                    <div className="flex flex-wrap gap-1.5">
                      {m.tags.slice(0, 8).map((t) => (
                        <span
                          key={t}
                          className="inline-flex items-center rounded-full border border-glass-border bg-white/5 px-2 py-0.5 text-[10px] text-white/70"
                        >
                          {tagLabel(t)}
                        </span>
                      ))}
                    </div>
                    {bestTags.length > 0 ? (
                      <div className="text-[10px] text-white/55">
                        Best for: {bestTags.map(tagLabel).join(', ')}
                      </div>
                    ) : null}
                  </div>
                }
              >
                <button
                  type="button"
                  onMouseEnter={() => props.onFocus(m.id)}
                  onFocus={() => props.onFocus(m.id)}
                  onClick={() => props.onPick(m.id)}
                  className={[
                    'w-full text-left rounded-lg border p-2.5 transition-all',
                    selected
                      ? 'border-accent-teal bg-accent-teal/10'
                      : 'border-glass-border bg-white/5 hover:bg-white/8',
                  ].join(' ')}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-white/90 truncate">
                        {m.displayName}
                      </div>
                      <div className="mt-0.5 text-[10px] text-white/45 truncate">
                        {m.provider} · {m.id}
                      </div>
                    </div>
                    {selected ? (
                      <span className="text-[10px] text-accent-teal">✓</span>
                    ) : null}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {m.tags
                      .filter((t) => t === 'image-in' || t === 'image-out' || t === 'multi-image' || t === 'edit-mode')
                      .slice(0, 4)
                      .map((t) => (
                        <Chip key={t} className="text-white/65">
                          {tagLabel(t)}
                        </Chip>
                      ))}
                  </div>
                </button>
              </Tooltip>
            )
          })
        )}
      </div>
    </Panel>
  )
}

export function ModelMenuView(props: {
  settings: ModelSettings
  onChangeSettings: (next: ModelSettings) => void
}) {
  const [menu, setMenu] = useState<ModelMenuResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [listMode, setListMode] = useState<ListMode>('recommended')

  const [analysisSearch, setAnalysisSearch] = useState('')
  const [generationSearch, setGenerationSearch] = useState('')
  const [mapsSearch, setMapsSearch] = useState('')
  const [ragDraftSearch, setRagDraftSearch] = useState('')
  const [ragFinalSearch, setRagFinalSearch] = useState('')

  const [analysisFilters, setAnalysisFilters] = useState<SlotFilters>({ ...DEFAULT_FILTERS })
  const [generationFilters, setGenerationFilters] = useState<SlotFilters>({ ...DEFAULT_FILTERS })
  const [mapsFilters, setMapsFilters] = useState<SlotFilters>({ ...DEFAULT_FILTERS })
  const [ragDraftFilters, setRagDraftFilters] = useState<SlotFilters>({ ...DEFAULT_FILTERS })
  const [ragFinalFilters, setRagFinalFilters] = useState<SlotFilters>({ ...DEFAULT_FILTERS })

  const [focusedModelId, setFocusedModelId] = useState<string>('')

  useEffect(() => {
    const controller = new AbortController()
    setIsLoading(true)
    setError('')

    void (async () => {
      try {
        const data = await fetchModelMenu({ signal: controller.signal })
        if (controller.signal.aborted) return
        setMenu(data)
      } catch (e) {
        if (controller.signal.aborted) return
        const msg = e instanceof Error ? e.message : 'Failed to load models'
        setError(msg)
        setMenu(null)
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    })()

    return () => controller.abort()
  }, [])

  const sourceModels = useMemo(() => {
    if (!menu) return []
    return listMode === 'recommended' ? menu.recommended : menu.all
  }, [menu, listMode])

  const analysisModels = useMemo(
    () =>
      sourceModels
        .filter((m) => isCandidateForSlot(m, 'analysis'))
        .filter((m) => matchesSearch(m, analysisSearch)),
    [analysisSearch, sourceModels],
  )
  const generationModels = useMemo(
    () =>
      sourceModels
        .filter((m) => isCandidateForSlot(m, 'generation'))
        .filter((m) => matchesSearch(m, generationSearch)),
    [generationSearch, sourceModels],
  )
  const mapsModels = useMemo(
    () =>
      sourceModels
        .filter((m) => isCandidateForSlot(m, 'maps'))
        .filter((m) => matchesSearch(m, mapsSearch)),
    [mapsSearch, sourceModels],
  )
  const ragDraftModels = useMemo(
    () =>
      sourceModels
        .filter((m) => isCandidateForSlot(m, 'ragDraft'))
        .filter((m) => matchesSearch(m, ragDraftSearch)),
    [ragDraftSearch, sourceModels],
  )
  const ragFinalModels = useMemo(
    () =>
      sourceModels
        .filter((m) => isCandidateForSlot(m, 'ragFinal'))
        .filter((m) => matchesSearch(m, ragFinalSearch)),
    [ragFinalSearch, sourceModels],
  )

  const filteredAnalysisModels = useMemo(
    () => analysisModels.filter((m) => matchesFilters(m, analysisFilters)),
    [analysisFilters, analysisModels],
  )
  const filteredGenerationModels = useMemo(
    () => generationModels.filter((m) => matchesFilters(m, generationFilters)),
    [generationFilters, generationModels],
  )
  const filteredMapsModels = useMemo(
    () => mapsModels.filter((m) => matchesFilters(m, mapsFilters)),
    [mapsFilters, mapsModels],
  )
  const filteredRagDraftModels = useMemo(
    () => ragDraftModels.filter((m) => matchesFilters(m, ragDraftFilters)),
    [ragDraftFilters, ragDraftModels],
  )
  const filteredRagFinalModels = useMemo(
    () => ragFinalModels.filter((m) => matchesFilters(m, ragFinalFilters)),
    [ragFinalFilters, ragFinalModels],
  )

  const selectedAnalysisModel = useMemo(() => {
    if (!menu || !props.settings.analysisModelId) return null
    return menu.all.find((m) => m.id === props.settings.analysisModelId) ?? null
  }, [menu, props.settings.analysisModelId])
  const selectedGenerationModel = useMemo(() => {
    if (!menu || !props.settings.generationModelId) return null
    return menu.all.find((m) => m.id === props.settings.generationModelId) ?? null
  }, [menu, props.settings.generationModelId])
  const selectedMapsModel = useMemo(() => {
    if (!menu || !props.settings.mapsModelId) return null
    return menu.all.find((m) => m.id === props.settings.mapsModelId) ?? null
  }, [menu, props.settings.mapsModelId])
  const selectedRagDraftModel = useMemo(() => {
    if (!menu || !props.settings.ragDraftModelId) return null
    return menu.all.find((m) => m.id === props.settings.ragDraftModelId) ?? null
  }, [menu, props.settings.ragDraftModelId])
  const selectedRagFinalModel = useMemo(() => {
    if (!menu || !props.settings.ragFinalModelId) return null
    return menu.all.find((m) => m.id === props.settings.ragFinalModelId) ?? null
  }, [menu, props.settings.ragFinalModelId])

  const hasMissingAnalysisSelection = !!props.settings.analysisModelId && !selectedAnalysisModel && !!menu
  const hasMissingGenerationSelection = !!props.settings.generationModelId && !selectedGenerationModel && !!menu
  const hasMissingMapsSelection = !!props.settings.mapsModelId && !selectedMapsModel && !!menu
  const hasMissingRagDraftSelection = !!props.settings.ragDraftModelId && !selectedRagDraftModel && !!menu
  const hasMissingRagFinalSelection = !!props.settings.ragFinalModelId && !selectedRagFinalModel && !!menu

  const focused = useMemo(() => {
    if (!menu) return null
    const id =
      focusedModelId ||
      props.settings.generationModelId ||
      props.settings.analysisModelId ||
      props.settings.mapsModelId ||
      props.settings.ragFinalModelId ||
      props.settings.ragDraftModelId ||
      ''
    if (!id) return null
    return menu.all.find((m) => m.id === id) ?? null
  }, [
    focusedModelId,
    menu,
    props.settings.analysisModelId,
    props.settings.generationModelId,
    props.settings.mapsModelId,
    props.settings.ragDraftModelId,
    props.settings.ragFinalModelId,
  ])

  function pick(slot: Slot, modelId: string) {
    props.onChangeSettings(setSelectedModelId(props.settings, slot, modelId))
    setFocusedModelId(modelId)
  }

  return (
    <div className="grid gap-6">
      <Panel className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-lg font-semibold tracking-tight text-white/95">Models</div>
            <div className="mt-1 text-sm text-white/65">
              Pick separate models for analysis, generation, RAG (draft/final), and optional maps. The server fetches OpenRouter models dynamically.
            </div>
            {menu ? (
              <div className="mt-2 text-xs text-white/45">
                Catalog fetched at {new Date(menu.fetchedAt).toLocaleString()}
              </div>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant={listMode === 'recommended' ? 'secondary' : 'ghost'}
              className="h-9 px-3 py-2 text-xs"
              onClick={() => setListMode('recommended')}
              disabled={isLoading}
            >
              Recommended
            </Button>
            <Button
              type="button"
              variant={listMode === 'all' ? 'secondary' : 'ghost'}
              className="h-9 px-3 py-2 text-xs"
              onClick={() => setListMode('all')}
              disabled={isLoading}
            >
              Full list
            </Button>
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-xl2 border border-glass-border bg-white/5 p-3 text-sm text-white/80">
            {error}
          </div>
        ) : isLoading ? (
          <div className="mt-4 text-sm text-white/70">Loading models…</div>
        ) : null}
      </Panel>

      <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-6">
        <div className="grid gap-4">
          <SlotPanel
            title="Analysis model"
            subtitle="Must support image input and text output."
            slot="analysis"
            models={filteredAnalysisModels}
            selectedModel={selectedAnalysisModel}
            hasMissingSelection={hasMissingAnalysisSelection}
            search={analysisSearch}
            onChangeSearch={setAnalysisSearch}
            filters={analysisFilters}
            onToggleFilter={(key) =>
              setAnalysisFilters((prev) => ({ ...prev, [key]: !prev[key] }))
            }
            onPick={(id) => pick('analysis', id)}
            onFocus={setFocusedModelId}
            onClearSelection={() => props.onChangeSettings(clearSelectedModelId(props.settings, 'analysis'))}
          />

          <SlotPanel
            title="Generation model"
            subtitle="Must support image output."
            slot="generation"
            models={filteredGenerationModels}
            selectedModel={selectedGenerationModel}
            hasMissingSelection={hasMissingGenerationSelection}
            search={generationSearch}
            onChangeSearch={setGenerationSearch}
            filters={generationFilters}
            onToggleFilter={(key) =>
              setGenerationFilters((prev) => ({ ...prev, [key]: !prev[key] }))
            }
            onPick={(id) => pick('generation', id)}
            onFocus={setFocusedModelId}
            onClearSelection={() => props.onChangeSettings(clearSelectedModelId(props.settings, 'generation'))}
          />

          <SlotPanel
            title="Maps model (optional)"
            subtitle="Used only when Maps provider is Nano Banana."
            slot="maps"
            models={filteredMapsModels}
            selectedModel={selectedMapsModel}
            hasMissingSelection={hasMissingMapsSelection}
            search={mapsSearch}
            onChangeSearch={setMapsSearch}
            filters={mapsFilters}
            onToggleFilter={(key) =>
              setMapsFilters((prev) => ({ ...prev, [key]: !prev[key] }))
            }
            onPick={(id) => pick('maps', id)}
            onFocus={setFocusedModelId}
            onClearSelection={() => props.onChangeSettings(clearSelectedModelId(props.settings, 'maps'))}
          />

          <SlotPanel
            title="RAG draft model"
            subtitle="Text model used for fast first-pass prompt drafting."
            slot="ragDraft"
            models={filteredRagDraftModels}
            selectedModel={selectedRagDraftModel}
            hasMissingSelection={hasMissingRagDraftSelection}
            search={ragDraftSearch}
            onChangeSearch={setRagDraftSearch}
            filters={ragDraftFilters}
            onToggleFilter={(key) =>
              setRagDraftFilters((prev) => ({ ...prev, [key]: !prev[key] }))
            }
            onPick={(id) => pick('ragDraft', id)}
            onFocus={setFocusedModelId}
            onClearSelection={() => props.onChangeSettings(clearSelectedModelId(props.settings, 'ragDraft'))}
          />

          <SlotPanel
            title="RAG final model"
            subtitle="Text model used to refine the RAG output for high-quality synthesis."
            slot="ragFinal"
            models={filteredRagFinalModels}
            selectedModel={selectedRagFinalModel}
            hasMissingSelection={hasMissingRagFinalSelection}
            search={ragFinalSearch}
            onChangeSearch={setRagFinalSearch}
            filters={ragFinalFilters}
            onToggleFilter={(key) =>
              setRagFinalFilters((prev) => ({ ...prev, [key]: !prev[key] }))
            }
            onPick={(id) => pick('ragFinal', id)}
            onFocus={setFocusedModelId}
            onClearSelection={() => props.onChangeSettings(clearSelectedModelId(props.settings, 'ragFinal'))}
          />
        </div>

        <div className="min-w-0">
          <Panel className="p-5">
            <div className="text-sm font-semibold text-white/90">Model details</div>
            {!focused ? (
              <div className="mt-3 text-sm text-white/65">
                Select a model on the left to view details.
              </div>
            ) : (
              <Card className="mt-3 p-4 transition-all duration-200">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-white/95">{focused.displayName}</div>
                    <div className="mt-0.5 text-xs text-white/55">
                      {focused.provider} · {focused.id}
                    </div>
                  </div>
                  <div className="flex flex-wrap justify-end gap-1.5">
                    {focused.tags.slice(0, 8).map((t) => (
                      <Chip key={t} className="text-white/70">
                        {tagLabel(t)}
                      </Chip>
                    ))}
                  </div>
                </div>

                {focused.description ? (
                  <div className="mt-3 text-sm text-white/70">
                    {shortDescription(focused.description, 260)}
                  </div>
                ) : (
                  <div className="mt-3 text-sm text-white/55">No description provided.</div>
                )}

                {formatPricingLine(focused) ? (
                  <div className="mt-3 text-xs text-white/55">
                    Pricing: {formatPricingLine(focused)}
                  </div>
                ) : (
                  <div className="mt-3 text-xs text-white/45">Pricing: not provided</div>
                )}

                <div className="mt-4 grid gap-2">
                  <div className="text-xs font-medium text-white/70">Best for</div>
                  <div className="flex flex-wrap gap-2">
                    {focused.tags
                      .filter((t) => t.startsWith('best-'))
                      .slice(0, 6)
                      .map((t) => (
                        <Chip key={t} className="text-white/80">
                          {tagLabel(t)}
                        </Chip>
                      ))}
                    {!focused.tags.some((t) => t.startsWith('best-')) ? (
                      <div className="text-xs text-white/45">No best-for tags detected.</div>
                    ) : null}
                  </div>
                </div>
              </Card>
            )}
          </Panel>
        </div>
      </div>
    </div>
  )
}
