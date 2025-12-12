import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  Plus,
  Search,
  Lock,
  Unlock,
  Trash2,
  RotateCcw,
  X,
  Sparkles,
} from 'lucide-react'
import type { ImageAnalysisResult, PsychedelicEffect } from '../../../shared/types/analysis'
import type { DoseResponseAnchor, EffectFamily, VisualEffect } from '../../../shared/types/effects'
import { EffectFamilies } from '../../../shared/types/effects'
import { applyPresetToEffects, selectUsedEffects } from '../../../shared/lib/effectsStudio'
import { getAllVisualEffects } from '../../lib/effectsClient'
import { loadEffectsStudioFamilyTab, saveEffectsStudioFamilyTab } from '../../lib/effectsStudioStorage'
import { filterEffectsCatalog } from './catalogFilter'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Chip } from '../ui/Chip'
import { Slider } from '../ui/Slider'

type FamilyTab = 'all' | EffectFamily

function clamp01(value: number) {
  if (Number.isNaN(value)) return 0
  return Math.min(1, Math.max(0, value))
}

function format01(value: number) {
  return clamp01(value).toFixed(2)
}

function familyLabel(family: EffectFamily) {
  if (family === 'amplification') return 'Amplify'
  if (family === 'suppression') return 'Suppress'
  if (family === 'distortion') return 'Distort'
  if (family === 'geometry') return 'Geometry'
  return 'Cognitive'
}

function baseFamilyForGroup(group: PsychedelicEffect['group']): EffectFamily {
  if (group === 'enhancements') return 'amplification'
  if (group === 'distortions') return 'distortion'
  if (group === 'geometry') return 'geometry'
  return 'cognitive'
}

function getPresetDose(preset: DoseResponseAnchor) {
  if (preset === 'micro') return 0.2
  if (preset === 'common') return 0.5
  return 0.85
}

function IntensityRangeBar(props: { min: number; max: number }) {
  const min = clamp01(props.min)
  const max = clamp01(props.max)
  const left = Math.round(min * 100)
  const width = Math.max(1, Math.round((max - min) * 100))

  return (
    <div className="mt-2">
      <div className="flex items-center justify-between text-[10px] text-white/55">
        <span>Typical</span>
        <span className="tabular-nums">
          {min.toFixed(2)}–{max.toFixed(2)}
        </span>
      </div>
      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-white/10">
        <div className="h-2 bg-white/20" style={{ marginLeft: `${left}%`, width: `${width}%` }} />
      </div>
    </div>
  )
}

function EffectTooltipPortal(props: { effect: VisualEffect | null; anchor: DOMRect | null }) {
  const { effect, anchor } = props
  if (!effect || !anchor) return null

  const width = 360
  const margin = 12

  const preferredLeft = anchor.right + margin
  const preferredTop = anchor.top

  const maxLeft = window.innerWidth - width - margin
  const left = Math.max(margin, Math.min(maxLeft, preferredLeft))
  const top = Math.max(margin, Math.min(window.innerHeight - margin, preferredTop))

  return createPortal(
    <div
      className="pointer-events-none fixed z-50"
      style={{ left, top, width }}
    >
      <div className="rounded-xl2 border border-glass-border bg-black/70 p-4 backdrop-blur-xl shadow-glowMagenta">
        <div className="text-sm font-semibold text-white/90">{effect.displayName}</div>
        <div className="mt-1 text-xs text-white/70">{effect.shortDescription}</div>

        <div className="mt-3 text-xs font-semibold text-white/80">Simulation hints</div>
        <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-white/70">
          {effect.simulationHints.map((hint) => (
            <li key={hint}>{hint}</li>
          ))}
        </ul>

        <IntensityRangeBar
          min={effect.typicalIntensityRange.min}
          max={effect.typicalIntensityRange.max}
        />
      </div>
    </div>,
    document.body,
  )
}

export type EffectsStudioSettings = {
  threshold: number
  maxEffects: number
}

export type EffectLocksById = Record<string, boolean>

type Props = {
  analysis: ImageAnalysisResult | null
  originalAnalysis: ImageAnalysisResult | null
  settings: EffectsStudioSettings
  locksById: EffectLocksById
  onChangeSettings: (next: EffectsStudioSettings) => void
  onChangeLocks: (next: EffectLocksById) => void
  onChangeAnalysis: (next: ImageAnalysisResult) => void
  onResetToOriginal: () => void
  isGenerating?: boolean
  onGenerate?: () => void
}

export function EffectsStudioView(props: Props) {
  const {
    analysis,
    originalAnalysis,
    settings,
    locksById,
    onChangeSettings,
    onChangeLocks,
    onChangeAnalysis,
    onResetToOriginal,
    isGenerating,
    onGenerate,
  } = props

  const catalog = useMemo(() => getAllVisualEffects(), [])
  const catalogById = useMemo(() => new Map<string, VisualEffect>(catalog.map((e) => [e.id, e])), [catalog])
  const presetMetaById = useMemo(() => {
    return new Map<string, Pick<VisualEffect, 'id' | 'typicalIntensityRange' | 'doseResponse'>>(
      catalog.map((e) => [
        e.id,
        { id: e.id, typicalIntensityRange: e.typicalIntensityRange, doseResponse: e.doseResponse },
      ]),
    )
  }, [catalog])

  const originalIntensityById = useMemo(() => {
    const map = new Map<string, number>()
    if (!originalAnalysis) return map
    for (const effect of originalAnalysis.effects) {
      map.set(effect.effectId, effect.intensity)
    }
    return map
  }, [originalAnalysis])

  const [familyTab, setFamilyTab] = useState<FamilyTab>(() => {
    const saved = loadEffectsStudioFamilyTab()
    if (saved === 'all') return 'all'
    if (typeof saved === 'string' && (EffectFamilies as readonly string[]).includes(saved)) {
      return saved as EffectFamily
    }
    return 'all'
  })
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [hovered, setHovered] = useState<{ effect: VisualEffect; rect: DOMRect } | null>(null)

  useEffect(() => {
    saveEffectsStudioFamilyTab(familyTab)
  }, [familyTab])

  const activeEffects = useMemo(() => analysis?.effects ?? [], [analysis])
  const activeEffectIds = useMemo(() => new Set(activeEffects.map((e) => e.effectId)), [activeEffects])

  const usedEffects = useMemo(() => {
    if (!analysis) return []
    return selectUsedEffects({
      effects: analysis.effects,
      threshold: settings.threshold,
      maxEffects: settings.maxEffects,
    })
  }, [analysis, settings.maxEffects, settings.threshold])

  const filteredCatalog = useMemo(() => {
    return filterEffectsCatalog({ catalog, familyTab, query })
  }, [catalog, familyTab, query])

  function updateEffectIntensity(effectId: string, nextIntensity: number) {
    if (!analysis) return
    onChangeAnalysis({
      ...analysis,
      effects: analysis.effects.map((e) =>
        e.effectId === effectId ? { ...e, intensity: clamp01(nextIntensity) } : e,
      ),
    })
  }

  function addEffect(effectId: string) {
    if (!analysis) return
    if (activeEffectIds.has(effectId)) return

    const meta = catalogById.get(effectId)
    if (!meta) return

    const intensity = clamp01(meta.typicalIntensityRange.min)

    onChangeAnalysis({
      ...analysis,
      effects: [
        ...analysis.effects,
        {
          effectId,
          group: meta.group,
          intensity,
        },
      ],
    })
  }

  function removeEffect(effectId: string) {
    if (!analysis) return
    onChangeAnalysis({
      ...analysis,
      effects: analysis.effects.filter((e) => e.effectId !== effectId),
    })
  }

  function toggleLock(effectId: string) {
    onChangeLocks({
      ...locksById,
      [effectId]: !locksById[effectId],
    })
  }

  function applyPreset(preset: DoseResponseAnchor) {
    if (!analysis) return

    const nextEffects = applyPresetToEffects({
      effects: analysis.effects,
      preset,
      locksById,
      metaById: presetMetaById,
    })

    onChangeAnalysis({
      ...analysis,
      dose: getPresetDose(preset),
      effects: nextEffects,
    })
  }

  const activeByFamily = useMemo(() => {
    const grouped: Record<EffectFamily, Array<{ effect: PsychedelicEffect; meta: VisualEffect | null }>> = {
      amplification: [],
      suppression: [],
      distortion: [],
      geometry: [],
      cognitive: [],
    }

    for (const effect of activeEffects) {
      const meta = catalogById.get(effect.effectId) ?? null
      const family = meta?.family ?? baseFamilyForGroup(effect.group)
      grouped[family].push({ effect, meta })
    }

    for (const family of Object.keys(grouped) as EffectFamily[]) {
      grouped[family].sort((a, b) => b.effect.intensity - a.effect.intensity)
    }

    return grouped
  }, [activeEffects, catalogById])

  if (!analysis) {
    return (
      <Card className="p-6">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-lg bg-white/10 p-2">
            <Sparkles size={18} className="text-white/80" />
          </div>
          <div>
            <div className="text-sm font-semibold">Effects Studio</div>
            <div className="mt-1 text-sm text-white/70">
              Run an analysis first, then come back here to build and lock a custom effect mix.
            </div>
          </div>
        </div>
      </Card>
    )
  }

  const selected = filteredCatalog[Math.min(selectedIndex, Math.max(0, filteredCatalog.length - 1))]

  return (
    <div className="grid gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-lg font-semibold tracking-tight">Effects Studio</div>
          <div className="mt-1 text-sm text-white/70">
            Browse the full catalog, tune intensities, lock favorites, and control prompt selection.
          </div>
        </div>
        {onGenerate ? (
          <Button
            type="button"
            variant="primary"
            className="h-10 px-4 py-2 text-sm"
            onClick={onGenerate}
            disabled={!!isGenerating}
          >
            <Sparkles size={16} />
            {isGenerating ? 'Generating' : 'Generate'}
          </Button>
        ) : null}
      </div>

      <div className="grid grid-cols-[420px_minmax(0,1fr)] gap-6">
        {/* Left: Catalog */}
        <Card className="p-5">
          <div className="flex items-center gap-2">
            <Search size={16} className="text-white/60" />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setSelectedIndex(0)
              }}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') {
                  e.preventDefault()
                  setSelectedIndex((v) => Math.min(filteredCatalog.length - 1, v + 1))
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault()
                  setSelectedIndex((v) => Math.max(0, v - 1))
                } else if (e.key === 'Enter') {
                  if (!selected) return
                  e.preventDefault()
                  addEffect(selected.id)
                }
              }}
              placeholder="Search effects (fuzzy)…"
              className="h-9 w-full rounded-xl2 border border-glass-border bg-black/20 px-3 text-sm text-white/90 outline-none focus:ring-2 focus:ring-accent-teal/40"
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {([
              { id: 'all', label: 'All' },
              { id: 'amplification', label: 'Amplify' },
              { id: 'suppression', label: 'Suppress' },
              { id: 'distortion', label: 'Distort' },
              { id: 'geometry', label: 'Geometry' },
              { id: 'cognitive', label: 'Cognitive' },
            ] as Array<{ id: FamilyTab; label: string }>).map((tab) => (
              <Button
                key={tab.id}
                type="button"
                variant={familyTab === tab.id ? 'secondary' : 'ghost'}
                className="h-9 px-3 py-2 text-xs"
                onClick={() => {
                  setFamilyTab(tab.id)
                  setSelectedIndex(0)
                }}
              >
                {tab.label}
              </Button>
            ))}
          </div>

          <div className="mt-4 max-h-[560px] overflow-y-auto pr-1">
            {!filteredCatalog.length ? (
              <div className="rounded-xl2 border border-glass-border bg-white/5 p-4 text-sm text-white/70">
                No effects match your search.
              </div>
            ) : (
              <div className="grid gap-3">
                {filteredCatalog.map((effect, idx) => {
                  const isActive = activeEffectIds.has(effect.id)
                  const isSelected = idx === selectedIndex
                  const isUsed = usedEffects.some((e) => e.effectId === effect.id)

                  return (
                    <div
                      key={effect.id}
                      onMouseEnter={(e) => {
                        setSelectedIndex(idx)
                        setHovered({ effect, rect: (e.currentTarget as HTMLElement).getBoundingClientRect() })
                      }}
                      onMouseLeave={() => setHovered(null)}
                      onFocus={(e) => setHovered({ effect, rect: (e.currentTarget as HTMLElement).getBoundingClientRect() })}
                      onBlur={() => setHovered(null)}
                      tabIndex={0}
                      className={[
                        'rounded-xl2 border bg-white/5 p-3 outline-none transition',
                        'hover:-translate-y-[1px] hover:bg-white/7',
                        isSelected ? 'border-white/25 ring-2 ring-accent-teal/30' : 'border-glass-border',
                      ].join(' ')}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="text-sm font-semibold text-white/90">{effect.displayName}</div>
                            {isUsed ? (
                              <Chip className="px-1.5 py-0.5 text-[10px] text-accent-amber">
                                used
                              </Chip>
                            ) : null}
                          </div>
                          <div className="mt-1 truncate text-xs text-white/65">
                            {effect.shortDescription}
                          </div>
                        </div>

                        <Button
                          type="button"
                          variant={isActive ? 'secondary' : 'primary'}
                          className="h-8 px-3 py-1 text-xs"
                          onClick={() => addEffect(effect.id)}
                          disabled={isActive}
                        >
                          <Plus size={14} />
                          {isActive ? 'Added' : 'Add'}
                        </Button>
                      </div>

                      <div className="mt-2 flex items-center justify-between text-[10px] text-white/55">
                        <span>{familyLabel(effect.family)}</span>
                        <span className="tabular-nums">{effect.id}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <EffectTooltipPortal effect={hovered?.effect ?? null} anchor={hovered?.rect ?? null} />
        </Card>

        {/* Right: Active Mix */}
        <Card className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-sm font-semibold">Active Mix</div>
              <div className="mt-1 text-xs text-white/70">
                Tune intensities locally. Locks prevent preset changes.
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                className="h-8 px-3 py-1 text-xs"
                onClick={onResetToOriginal}
                disabled={!originalAnalysis}
              >
                <RotateCcw size={14} />
                Reset all
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="h-8 px-3 py-1 text-xs"
                onClick={() => onChangeAnalysis({ ...analysis, effects: [] })}
                disabled={!analysis.effects.length}
              >
                <Trash2 size={14} />
                Clear all
              </Button>
            </div>
          </div>

          <div className="mt-4 grid gap-4">
            <div className="rounded-xl2 border border-glass-border bg-white/5 p-4">
              <div className="text-xs font-semibold text-white/85">Presets</div>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="h-9 px-3 py-2 text-xs"
                  onClick={() => applyPreset('micro')}
                >
                  Microdose
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="h-9 px-3 py-2 text-xs"
                  onClick={() => applyPreset('common')}
                >
                  Common
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="h-9 px-3 py-2 text-xs"
                  onClick={() => applyPreset('heroic')}
                >
                  Heroic
                </Button>
              </div>
              <div className="mt-2 text-[10px] text-white/55">
                Applies to unlocked effects using typical ranges and dose response.
              </div>
            </div>

            <div className="grid gap-3 rounded-xl2 border border-glass-border bg-white/5 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs font-semibold text-white/85">Prompt selection</div>
                <div className="text-[10px] text-white/55">
                  {usedEffects.length} used
                </div>
              </div>
              <Slider
                label={`Threshold · ${format01(settings.threshold)}`}
                value={settings.threshold}
                onChange={(threshold) => onChangeSettings({ ...settings, threshold })}
                min={0}
                max={1}
                step={0.02}
              />

              <label className="grid gap-2">
                <div className="flex items-center justify-between text-sm text-white/80">
                  <span>Max effects</span>
                  <span className="text-xs tabular-nums text-white/70">
                    {Math.max(0, Math.floor(settings.maxEffects))}
                  </span>
                </div>
                <input
                  type="range"
                  className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/12 accent-accent-teal"
                  min={1}
                  max={20}
                  step={1}
                  value={settings.maxEffects}
                  onChange={(e) =>
                    onChangeSettings({ ...settings, maxEffects: Number(e.target.value) })
                  }
                />
              </label>

              <details className="group rounded-xl2 border border-glass-border bg-black/20 p-3">
                <summary className="cursor-pointer select-none text-xs font-semibold text-white/80">
                  Used Effects ({usedEffects.length})
                </summary>
                <div className="mt-3 grid gap-2">
                  {!usedEffects.length ? (
                    <div className="text-xs text-white/60">
                      Increase intensities or lower the threshold to include effects.
                    </div>
                  ) : (
                    usedEffects.map((e) => {
                      const meta = catalogById.get(e.effectId)
                      return (
                        <div
                          key={e.effectId}
                          className="flex items-center justify-between gap-3 rounded-lg bg-white/5 px-3 py-2"
                        >
                          <div className="min-w-0">
                            <div className="truncate text-xs text-white/85">
                              {meta?.displayName ?? e.effectId}
                            </div>
                            <div className="text-[10px] text-white/50">{e.effectId}</div>
                          </div>
                          <div className="text-xs tabular-nums text-white/70">{format01(e.intensity)}</div>
                        </div>
                      )
                    })
                  )}
                </div>
              </details>
            </div>

            {!analysis.effects.length ? (
              <div className="rounded-xl2 border border-glass-border bg-white/5 p-4 text-sm text-white/70">
                Your mix is empty. Add effects from the catalog to start building.
              </div>
            ) : (
              <div className="grid gap-4">
                {(Object.keys(activeByFamily) as EffectFamily[]).map((family) => {
                  const items = activeByFamily[family]
                  if (!items.length) return null

                  return (
                    <details
                      key={family}
                      className="rounded-xl2 border border-glass-border bg-white/5 p-4"
                      open
                    >
                      <summary className="cursor-pointer select-none">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-semibold">{familyLabel(family)}</div>
                            <div className="text-xs text-white/60">({items.length})</div>
                          </div>
                          <div className="text-xs text-white/60">collapse</div>
                        </div>
                      </summary>

                      <div className="mt-3 grid gap-3">
                        {items.map(({ effect, meta }) => {
                          const original = originalIntensityById.get(effect.effectId)
                          const modified =
                            original === undefined ? 'added' : Math.abs(original - effect.intensity) > 0.001 ? 'modified' : ''

                          return (
                            <div
                              key={effect.effectId}
                              className="rounded-xl2 border border-glass-border bg-black/20 p-3"
                              title={meta?.shortDescription ?? ''}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <div className="truncate text-sm text-white/90">
                                      {meta?.displayName ?? effect.effectId}
                                    </div>
                                    {modified ? (
                                      <Chip className="px-1.5 py-0.5 text-[10px] text-accent-amber">
                                        {modified}
                                      </Chip>
                                    ) : null}
                                  </div>
                                  <div className="mt-0.5 text-xs text-white/55">{effect.effectId}</div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => toggleLock(effect.effectId)}
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-glass-border bg-white/5 text-white/80 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-accent-teal/40"
                                    title={locksById[effect.effectId] ? 'Unlock' : 'Lock'}
                                  >
                                    {locksById[effect.effectId] ? <Lock size={14} /> : <Unlock size={14} />}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => removeEffect(effect.effectId)}
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-glass-border bg-white/5 text-white/80 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-accent-teal/40"
                                    title="Remove"
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                              </div>

                              <div className="mt-3">
                                <Slider
                                  value={effect.intensity}
                                  onChange={(value) => updateEffectIntensity(effect.effectId, value)}
                                  min={0}
                                  max={1}
                                  step={0.02}
                                />
                              </div>

                              <div className="mt-2 flex items-center justify-between text-[10px] text-white/55">
                                <span className="tabular-nums">Intensity {format01(effect.intensity)}</span>
                                {meta ? (
                                  <span className="tabular-nums">
                                    Typical {meta.typicalIntensityRange.min.toFixed(2)}–
                                    {meta.typicalIntensityRange.max.toFixed(2)}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </details>
                  )
                })}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
