import type { ImageAnalysisResult } from '../../../shared/types/analysis'
import type { VisualEffectGroup } from '../../../shared/types/effects'
import { VisualEffectGroups } from '../../../shared/types/effects'
import { groupByGroup } from '../../lib/effectsClient'
import { Card } from '../ui/Card'
import { Chip } from '../ui/Chip'
import { Button } from '../ui/Button'
import { Slider } from '../ui/Slider'

function clamp01(value: number) {
  if (Number.isNaN(value)) return 0
  return Math.min(1, Math.max(0, value))
}

function formatIntensity(value: number) {
  return clamp01(value).toFixed(2)
}

const GroupMeta: Record<
  VisualEffectGroup,
  {
    label: string
    dotClass: string
  }
> = {
  enhancements: {
    label: 'Enhancements',
    dotClass: 'bg-accent-teal',
  },
  distortions: {
    label: 'Distortions',
    dotClass: 'bg-accent-magenta',
  },
  geometry: {
    label: 'Geometry',
    dotClass: 'bg-accent-amber',
  },
  hallucinations: {
    label: 'Hallucinations',
    dotClass: 'bg-purple-400',
  },
  perceptual: {
    label: 'Perceptual',
    dotClass: 'bg-sky-400',
  },
}

type Props = {
  analysis: ImageAnalysisResult
  originalAnalysis?: ImageAnalysisResult
  onEffectChange: (effectId: string, intensity: number) => void
  onReset: () => void
}

export function EffectsOverridePanel(props: Props) {
  const { analysis, originalAnalysis, onEffectChange, onReset } = props
  const grouped = groupByGroup(analysis.effects)

  const originalIntensities = new Map<string, number>()
  if (originalAnalysis) {
    for (const effect of originalAnalysis.effects) {
      originalIntensities.set(effect.effectId, effect.intensity)
    }
  }

  const hasChanges = originalAnalysis
    ? analysis.effects.some((effect) => {
        const original = originalIntensities.get(effect.effectId)
        return original !== undefined && Math.abs(effect.intensity - original) > 0.001
      })
    : false

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold">Effect Overrides</div>
          <div className="mt-1 text-xs text-white/70">
            Adjust individual effect intensities before generating.
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          className="h-8 px-3 py-1 text-xs"
          onClick={onReset}
          disabled={!hasChanges}
        >
          Reset to original
        </Button>
      </div>

      <div className="mt-4 grid gap-5">
        {VisualEffectGroups.map((group) => {
          const items = grouped[group]
          if (!items.length) return null

          return (
            <section key={group} className="grid gap-3">
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${GroupMeta[group].dotClass}`} />
                <div className="text-sm font-semibold">{GroupMeta[group].label}</div>
                <div className="text-xs text-white/60">({items.length})</div>
              </div>

              <div className="grid gap-3">
                {items.map(({ effect, meta }) => {
                  const label = meta?.displayName ?? effect.effectId
                  const originalValue = originalIntensities.get(effect.effectId)
                  const isModified =
                    originalValue !== undefined &&
                    Math.abs(effect.intensity - originalValue) > 0.001

                  return (
                    <div
                      key={effect.effectId}
                      className="rounded-xl2 border border-glass-border bg-white/5 p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-white/90">{label}</span>
                            {isModified && (
                              <Chip className="px-1.5 py-0.5 text-[10px] text-accent-amber">
                                modified
                              </Chip>
                            )}
                          </div>
                          <div className="mt-0.5 text-xs text-white/55">{effect.effectId}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs tabular-nums text-white/90">
                            {formatIntensity(effect.intensity)}
                          </div>
                          {originalValue !== undefined && isModified && (
                            <div className="text-[10px] tabular-nums text-white/50">
                              was {formatIntensity(originalValue)}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-3">
                        <Slider
                          value={effect.intensity}
                          onChange={(value) => onEffectChange(effect.effectId, value)}
                          min={0}
                          max={1}
                          step={0.05}
                        />
                      </div>

                      {meta?.typicalIntensityRange && (
                        <div className="mt-1 text-[10px] text-white/45">
                          Typical range: {meta.typicalIntensityRange.min.toFixed(2)} -{' '}
                          {meta.typicalIntensityRange.max.toFixed(2)}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>
    </Card>
  )
}
