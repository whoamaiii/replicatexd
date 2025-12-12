/**
 * Effect Router Panel
 *
 * Controls where psychedelic effects are applied based on image structure.
 * Uses MapPack data (depth, edges, face/hands masks) for routing decisions.
 */

import { useState, useMemo } from 'react'
import type { RouterSettings, RouterRegion, DepthBand, EffectRoutingRule } from '../../types/router'
import type { MapPack } from '../../types/maps'
import type { ImageAnalysisResult } from '../../../shared/types/analysis'
import { VisualEffectGroups, type VisualEffectGroup } from '../../../shared/types/effects'
import {
  RouterRegions,
  DepthBands,
  getRegionLabel,
  getDepthBandLabel,
} from '../../types/router'
import { Card } from '../ui/Card'
import { Slider } from '../ui/Slider'

type Props = {
  settings: RouterSettings
  onChange: (settings: RouterSettings) => void
  mapPack: MapPack | null
  analysis: ImageAnalysisResult | null
}

const GroupMeta: Record<VisualEffectGroup, { label: string; dotClass: string }> = {
  enhancements: { label: 'Enhancements', dotClass: 'bg-accent-teal' },
  distortions: { label: 'Distortions', dotClass: 'bg-accent-magenta' },
  geometry: { label: 'Geometry', dotClass: 'bg-accent-amber' },
  hallucinations: { label: 'Hallucinations', dotClass: 'bg-purple-400' },
  perceptual: { label: 'Perceptual', dotClass: 'bg-sky-400' },
}

export function EffectRouterPanel({ settings, onChange, mapPack, analysis }: Props) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null)

  // Determine which maps are available
  const availableMaps = useMemo(() => {
    if (!mapPack) return new Set<string>()
    return new Set(mapPack.maps.map((m) => m.kind))
  }, [mapPack])

  const hasFaceMask = availableMaps.has('faceMask')
  const hasHandsMask = availableMaps.has('handsMask')
  const hasDepth = availableMaps.has('depth')
  const hasEdges = availableMaps.has('edges')
  const hasSegmentation = availableMaps.has('segmentation')

  // Get top effects for per-effect overrides
  const topEffects = useMemo(() => {
    if (!analysis) return []
    return [...analysis.effects].sort((a, b) => b.intensity - a.intensity).slice(0, 6)
  }, [analysis])

  function toggleRegion(region: RouterRegion) {
    const current = settings.defaultRegions
    const newRegions = current.includes(region)
      ? current.filter((r) => r !== region)
      : [...current, region]
    onChange({ ...settings, defaultRegions: newRegions })
  }

  function toggleDepthBand(band: DepthBand) {
    const current = settings.defaultDepthBands
    const newBands = current.includes(band)
      ? current.filter((b) => b !== band)
      : [...current, band]
    onChange({ ...settings, defaultDepthBands: newBands })
  }

  function setGroupMultiplier(group: VisualEffectGroup, value: number) {
    onChange({
      ...settings,
      groupMultipliers: {
        ...settings.groupMultipliers,
        [group]: value,
      },
    })
  }

  function updateEffectRule(effectId: string, updates: Partial<EffectRoutingRule>) {
    const existingIdx = settings.rules.findIndex((r) => r.effectId === effectId)
    const newRules = [...settings.rules]

    if (existingIdx >= 0) {
      newRules[existingIdx] = { ...newRules[existingIdx], ...updates }
    } else {
      newRules.push({
        effectId,
        regions: settings.defaultRegions,
        depthBands: settings.defaultDepthBands,
        strength: 1.0,
        protectEdges: settings.protectEdges,
        ...updates,
      })
    }

    onChange({ ...settings, rules: newRules })
  }

  function buildRoutingSummary(): string {
    const parts: string[] = []

    if (settings.protectFace) parts.push('Face protected')
    if (settings.protectHands) parts.push('Hands protected')
    if (settings.protectEdges) parts.push('Edges preserved')

    if (settings.defaultRegions.length > 0) {
      parts.push(`Targeting: ${settings.defaultRegions.join(', ')}`)
    }

    if (settings.defaultDepthBands.length > 0 && settings.defaultDepthBands.length < 3) {
      parts.push(`Depth: ${settings.defaultDepthBands.join(', ')}`)
    }

    const mapsUsed = Array.from(availableMaps).filter(
      (m) =>
        m === 'depth' ||
        m === 'edges' ||
        m === 'faceMask' ||
        m === 'handsMask' ||
        m === 'segmentation',
    )
    if (mapsUsed.length > 0) {
      parts.push(`Using: ${mapsUsed.join(', ')} maps`)
    }

    return parts.join(' | ') || 'Default routing active'
  }

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold">Effect Router</div>
          <div className="mt-1 text-xs text-white/60">
            Control where effects appear based on image structure
          </div>
        </div>
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={settings.enabled}
            onChange={(e) => onChange({ ...settings, enabled: e.target.checked })}
            className="h-4 w-4 rounded border-glass-border accent-accent-teal"
          />
          <span className="text-xs text-white/70">Enabled</span>
        </label>
      </div>

      {settings.enabled && (
        <div className="mt-4 grid gap-4">
          {/* Protection Toggles */}
          <section className="rounded-lg border border-glass-border bg-white/5 p-3">
            <div className="text-xs font-medium text-white/80">Protection</div>
            <div className="mt-2 flex flex-wrap gap-3">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.protectFace}
                  onChange={(e) => onChange({ ...settings, protectFace: e.target.checked })}
                  className="h-3.5 w-3.5 rounded border-glass-border accent-accent-teal"
                />
                <span className="text-xs text-white/70">
                  Face
                  {hasFaceMask && (
                    <span className="ml-1 rounded bg-white/10 px-1 py-0.5 text-[9px] text-white/50">
                      mask
                    </span>
                  )}
                </span>
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.protectHands}
                  onChange={(e) => onChange({ ...settings, protectHands: e.target.checked })}
                  className="h-3.5 w-3.5 rounded border-glass-border accent-accent-teal"
                />
                <span className="text-xs text-white/70">
                  Hands
                  {hasHandsMask && (
                    <span className="ml-1 rounded bg-white/10 px-1 py-0.5 text-[9px] text-white/50">
                      mask
                    </span>
                  )}
                </span>
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.protectEdges}
                  onChange={(e) => onChange({ ...settings, protectEdges: e.target.checked })}
                  className="h-3.5 w-3.5 rounded border-glass-border accent-accent-teal"
                />
                <span className="text-xs text-white/70">
                  Edges
                  {hasEdges && (
                    <span className="ml-1 rounded bg-white/10 px-1 py-0.5 text-[9px] text-white/50">
                      map
                    </span>
                  )}
                </span>
              </label>
            </div>
          </section>

          {/* Surface Lock Strength */}
          <section className="rounded-lg border border-glass-border bg-white/5 p-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium text-white/80">Surface Lock</div>
              <span className="text-[10px] text-white/50">
                {Math.round(settings.surfaceLockStrength * 100)}%
              </span>
            </div>
            <div className="mt-2">
              <Slider
                value={settings.surfaceLockStrength}
                onChange={(v) => onChange({ ...settings, surfaceLockStrength: v })}
                min={0}
                max={1}
                step={0.05}
              />
            </div>
            <div className="mt-1 text-[10px] text-white/40">
              Higher = effects embed more strictly in surfaces
            </div>
          </section>

          {/* Region Selection */}
          <section className="rounded-lg border border-glass-border bg-white/5 p-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium text-white/80">Target Regions</div>
              {!hasSegmentation && (
                <span className="text-[10px] text-white/40">text guidance only</span>
              )}
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {RouterRegions.filter((r) => r !== 'face' && r !== 'hands').map((region) => (
                <button
                  key={region}
                  type="button"
                  onClick={() => toggleRegion(region)}
                  className={`rounded px-2 py-1 text-xs transition-colors ${
                    settings.defaultRegions.includes(region)
                      ? 'bg-accent-teal/30 text-white'
                      : 'bg-white/10 text-white/50 hover:bg-white/15'
                  }`}
                >
                  {getRegionLabel(region)}
                </button>
              ))}
            </div>
          </section>

          {/* Depth Band Selection */}
          <section className="rounded-lg border border-glass-border bg-white/5 p-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium text-white/80">Depth Bands</div>
              {!hasDepth && <span className="text-[10px] text-white/40">text guidance only</span>}
            </div>
            <div className="mt-2 flex gap-2">
              {DepthBands.map((band) => (
                <button
                  key={band}
                  type="button"
                  onClick={() => toggleDepthBand(band)}
                  className={`flex-1 rounded px-2 py-1 text-xs transition-colors ${
                    settings.defaultDepthBands.includes(band)
                      ? 'bg-accent-magenta/30 text-white'
                      : 'bg-white/10 text-white/50 hover:bg-white/15'
                  }`}
                >
                  {getDepthBandLabel(band)}
                </button>
              ))}
            </div>
          </section>

          {/* Group Multipliers */}
          <section className="rounded-lg border border-glass-border bg-white/5 p-3">
            <div className="text-xs font-medium text-white/80">Group Intensity</div>
            <div className="mt-3 grid gap-3">
              {VisualEffectGroups.map((group) => (
                <div key={group} className="grid gap-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${GroupMeta[group].dotClass}`} />
                      <span className="text-xs text-white/70">{GroupMeta[group].label}</span>
                    </div>
                    <span className="text-[10px] tabular-nums text-white/50">
                      {settings.groupMultipliers[group].toFixed(1)}x
                    </span>
                  </div>
                  <Slider
                    value={settings.groupMultipliers[group]}
                    onChange={(v) => setGroupMultiplier(group, v)}
                    min={0}
                    max={2}
                    step={0.1}
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Per-Effect Overrides (Collapsible) */}
          {topEffects.length > 0 && (
            <section className="rounded-lg border border-glass-border bg-white/5 p-3">
              <button
                type="button"
                onClick={() =>
                  setExpandedSection(expandedSection === 'effects' ? null : 'effects')
                }
                className="flex w-full items-center justify-between text-xs font-medium text-white/80"
              >
                <span>Per-Effect Overrides</span>
                <span className="text-white/40">{expandedSection === 'effects' ? '-' : '+'}</span>
              </button>

              {expandedSection === 'effects' && (
                <div className="mt-3 grid gap-2">
                  {topEffects.map((effect) => {
                    const rule = settings.rules.find((r) => r.effectId === effect.effectId)
                    const effectStrength = rule?.strength ?? 1.0

                    return (
                      <div key={effect.effectId} className="rounded bg-white/5 p-2">
                        <div className="flex items-center justify-between">
                          <span className="truncate text-xs text-white/70">{effect.effectId}</span>
                          <span className="ml-2 text-[10px] tabular-nums text-white/50">
                            {effectStrength.toFixed(1)}x
                          </span>
                        </div>
                        <div className="mt-1">
                          <Slider
                            value={effectStrength}
                            onChange={(v) => updateEffectRule(effect.effectId, { strength: v })}
                            min={0}
                            max={2}
                            step={0.1}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>
          )}

          {/* Routing Summary */}
          <section className="rounded-lg border border-glass-border bg-white/5 p-3">
            <div className="text-xs font-medium text-white/80">Routing Summary</div>
            <div className="mt-2 text-[10px] text-white/50">{buildRoutingSummary()}</div>
          </section>
        </div>
      )}
    </Card>
  )
}
