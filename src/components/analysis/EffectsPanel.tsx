import type { ImageAnalysisResult } from '../../../shared/types/analysis'
import type { VisualEffectGroup } from '../../../shared/types/effects'
import { VisualEffectGroups } from '../../../shared/types/effects'
import { groupByGroup } from '../../lib/effectsClient'
import { Card } from '../ui/Card'
import { Chip } from '../ui/Chip'

function clamp01(value: number) {
  if (Number.isNaN(value)) return 0
  return Math.min(1, Math.max(0, value))
}

function formatIntensity(value: number) {
  return clamp01(value).toFixed(1)
}

const GroupMeta: Record<
  VisualEffectGroup,
  {
    label: string
    dotClass: string
    barClass: string
  }
> = {
  enhancements: {
    label: 'Enhancements',
    dotClass: 'bg-accent-teal',
    barClass: 'bg-accent-teal',
  },
  distortions: {
    label: 'Distortions',
    dotClass: 'bg-accent-magenta',
    barClass: 'bg-accent-magenta',
  },
  geometry: {
    label: 'Geometry',
    dotClass: 'bg-accent-amber',
    barClass: 'bg-accent-amber',
  },
  hallucinations: {
    label: 'Hallucinations',
    dotClass: 'bg-purple-400',
    barClass: 'bg-purple-400',
  },
  perceptual: {
    label: 'Perceptual',
    dotClass: 'bg-sky-400',
    barClass: 'bg-sky-400',
  },
}

export function EffectsPanel(props: { analysis: ImageAnalysisResult }) {
  const grouped = groupByGroup(props.analysis.effects)

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold">Effects</div>
          <div className="mt-1 text-xs text-white/70">
            Substance {props.analysis.substanceId} · dose {formatIntensity(props.analysis.dose)}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-xl2 border border-glass-border bg-white/5 p-3">
        <div className="text-xs font-semibold text-white/80">Legend</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {VisualEffectGroups.map((group) => (
            <Chip key={group} className="gap-2 text-white/80">
              <span className={`h-2 w-2 rounded-full ${GroupMeta[group].dotClass}`} />
              {GroupMeta[group].label}
            </Chip>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-5">
        {VisualEffectGroups.map((group) => {
          const items = grouped[group]
          if (!items.length) return null

          return (
            <section key={group} className="grid gap-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${GroupMeta[group].dotClass}`} />
                  <div className="text-sm font-semibold">{GroupMeta[group].label}</div>
                </div>
                <div className="text-xs text-white/60">{items.length} effects</div>
              </div>

              <div className="grid gap-2">
                {items.map(({ effect, meta }) => {
                  const label = meta?.displayName ?? effect.effectId
                  const hover = meta?.shortDescription ?? ''
                  return (
                    <div
                      key={effect.effectId}
                      className="rounded-xl2 border border-glass-border bg-white/5 p-3"
                      title={hover}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm text-white/90">{label}</div>
                          <div className="mt-1 text-xs text-white/65">{effect.effectId}</div>
                        </div>
                        <div className="text-xs tabular-nums text-white/80">
                          {formatIntensity(effect.intensity)}
                        </div>
                      </div>

                      <div className="mt-2 h-2 w-full rounded-full bg-white/10">
                        <div
                          className={`h-2 rounded-full ${GroupMeta[group].barClass}`}
                          style={{ width: `${Math.round(clamp01(effect.intensity) * 100)}%` }}
                        />
                      </div>
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

