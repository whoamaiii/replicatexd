/**
 * Map Controls Panel
 *
 * Allows users to adjust how structural maps influence image generation.
 * Includes toggles and weight sliders for each map type and protection settings.
 */

import type { MapSettings, MapPack } from '../../types/maps'
import { Card } from '../ui/Card'
import { Slider } from '../ui/Slider'

type Props = {
  mapPack: MapPack | null
  settings: MapSettings | null
  onChange: (settings: Partial<Omit<MapSettings, 'sourceHash' | 'updatedAt'>>) => void
}

function ControlSection({
  label,
  enabled,
  weight,
  onToggle,
  onWeightChange,
}: {
  label: string
  enabled: boolean
  weight: number
  onToggle: (enabled: boolean) => void
  onWeightChange: (weight: number) => void
}) {
  return (
    <div className="rounded-lg border border-glass-border bg-white/5 p-3">
      <div className="flex items-center justify-between">
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => onToggle(e.target.checked)}
            className="h-4 w-4 rounded border-glass-border accent-accent-teal"
          />
          <span className="text-sm text-white/90">{label}</span>
        </label>
        {enabled && (
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/70">
            {Math.round(weight * 100)}%
          </span>
        )}
      </div>
      {enabled && (
        <div className="mt-3">
          <Slider value={weight} onChange={onWeightChange} min={0} max={1} step={0.05} />
        </div>
      )}
    </div>
  )
}

export function MapControlsPanel({ mapPack, settings, onChange }: Props) {
  if (!mapPack || !settings) {
    return null
  }

  const hasDepth = mapPack.maps.some((m) => m.kind === 'depth')
  const hasNormals = mapPack.maps.some((m) => m.kind === 'normals')
  const hasEdges = mapPack.maps.some((m) => m.kind === 'edges')
  const hasFaceMask = mapPack.maps.some((m) => m.kind === 'faceMask')
  const hasHandsMask = mapPack.maps.some((m) => m.kind === 'handsMask')

  return (
    <Card className="p-5">
      <div className="text-sm font-semibold">Map Controls</div>
      <div className="mt-1 text-xs text-white/60">
        Adjust how maps influence generation.
      </div>

      <div className="mt-4 grid gap-3">
        {/* Surface Lock - Always available when maps exist */}
        <ControlSection
          label="Surface Lock"
          enabled={settings.surfaceLockEnabled}
          weight={settings.surfaceLockStrength}
          onToggle={(enabled) => onChange({ surfaceLockEnabled: enabled })}
          onWeightChange={(weight) => onChange({ surfaceLockStrength: weight })}
        />

        {/* Depth Guidance */}
        {hasDepth && (
          <ControlSection
            label="Depth Guidance"
            enabled={settings.depthEnabled}
            weight={settings.depthWeight}
            onToggle={(enabled) => onChange({ depthEnabled: enabled })}
            onWeightChange={(weight) => onChange({ depthWeight: weight })}
          />
        )}

        {/* Normals Guidance */}
        {hasNormals && (
          <ControlSection
            label="Surface Normals"
            enabled={settings.normalsEnabled}
            weight={settings.normalsWeight}
            onToggle={(enabled) => onChange({ normalsEnabled: enabled })}
            onWeightChange={(weight) => onChange({ normalsWeight: weight })}
          />
        )}

        {/* Edge Preservation */}
        {hasEdges && (
          <ControlSection
            label="Edge Preservation"
            enabled={settings.edgesEnabled}
            weight={settings.edgesWeight}
            onToggle={(enabled) => onChange({ edgesEnabled: enabled })}
            onWeightChange={(weight) => onChange({ edgesWeight: weight })}
          />
        )}

        {/* Face Protection */}
        {hasFaceMask && (
          <ControlSection
            label="Face Protection"
            enabled={settings.faceProtectionEnabled}
            weight={settings.faceProtectionStrength}
            onToggle={(enabled) => onChange({ faceProtectionEnabled: enabled })}
            onWeightChange={(weight) => onChange({ faceProtectionStrength: weight })}
          />
        )}

        {/* Hands Protection */}
        {hasHandsMask && (
          <ControlSection
            label="Hands Protection"
            enabled={settings.handsProtectionEnabled}
            weight={settings.handsProtectionStrength}
            onToggle={(enabled) => onChange({ handsProtectionEnabled: enabled })}
            onWeightChange={(weight) => onChange({ handsProtectionStrength: weight })}
          />
        )}
      </div>

      <div className="mt-4 text-[10px] text-white/40">
        Controls influence generation through prompt guidance. Higher values = stronger effect.
      </div>
    </Card>
  )
}
