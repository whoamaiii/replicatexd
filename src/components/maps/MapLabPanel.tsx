/**
 * Map Lab Panel
 *
 * Allows users to generate and preview structural maps for their input image.
 * Maps include depth, edges, normals, and face/hands masks.
 */

import { useState } from 'react'
import type { MapPack, MapSettings, MapKind, MapProviderConfig } from '../../types/maps'
import { ensureMaps, getMaps, getMapFileUrlForProvider } from '../../lib/mapsClient'
import { Panel } from '../ui/Panel'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { loadMapProviderConfig, saveMapProviderConfig } from '../../lib/mapProviderSettings'

const MapLabels: Record<MapKind, string> = {
  depth: 'Depth',
  normals: 'Normals',
  edges: 'Edges',
  segmentation: 'Segmentation',
  faceMask: 'Face Mask',
  handsMask: 'Hands Mask',
}

const MapDescriptions: Record<MapKind, string> = {
  depth: 'Distance from camera',
  normals: 'Surface orientation',
  edges: 'Structural lines',
  segmentation: 'Object boundaries',
  faceMask: 'Face regions',
  handsMask: 'Hand regions',
}

type Props = {
  imageDataUrl: string | null
  onMapPackReady?: (mapPack: MapPack, settings: MapSettings, sourceHash: string) => void
  mapsModelId?: string
}

export function MapLabPanel({ imageDataUrl, onMapPackReady, mapsModelId }: Props) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mapPack, setMapPack] = useState<MapPack | null>(null)
  const [sourceHash, setSourceHash] = useState<string | null>(null)
  const [selectedPreview, setSelectedPreview] = useState<MapKind | null>(null)
  const [providerConfig, setProviderConfig] = useState<MapProviderConfig>(() =>
    loadMapProviderConfig(),
  )

  function updateProviderConfig(next: MapProviderConfig) {
    setProviderConfig(next)
    saveMapProviderConfig(next)
  }

  async function handleEnsureMaps() {
    if (!imageDataUrl) return

    setIsLoading(true)
    setError(null)

    try {
      const modelIdOverride = typeof mapsModelId === 'string' ? mapsModelId.trim() : ''
      const effectiveModelId = modelIdOverride || providerConfig.modelId.trim()
      if (providerConfig.provider === 'nanoBanana' && !effectiveModelId) {
        setError('Select a Maps model in the Models view before using Nano Banana.')
        return
      }

      const result = await ensureMaps(imageDataUrl, {
        ...providerConfig,
        modelId: effectiveModelId,
      })
      setSourceHash(result.sourceHash)

      if (result.status === 'error') {
        setError(result.error || 'Failed to generate maps')
        return
      }

      if (result.mapPack) {
        setMapPack(result.mapPack)

        // Fetch settings
        const mapsData = await getMaps(result.sourceHash)

        onMapPackReady?.(result.mapPack, mapsData.settings, result.sourceHash)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate maps')
    } finally {
      setIsLoading(false)
    }
  }

  if (!imageDataUrl) {
    return (
      <Panel className="p-5">
        <div className="text-sm font-semibold">Map Lab</div>
        <div className="mt-2 text-xs text-white/60">
          Upload an image to generate structural control maps.
        </div>
      </Panel>
    )
  }

  return (
    <Panel className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold">Map Lab</div>
          <div className="mt-1 text-xs text-white/60">
            Generate depth, edge, and protection maps for structural control.
          </div>
        </div>
        <Badge className={mapPack ? 'bg-accent-teal/20 text-accent-teal' : ''}>
          {mapPack ? (mapPack.provider ? `Ready (${mapPack.provider})` : 'Ready') : 'Not generated'}
        </Badge>
      </div>

      <div className="mt-4 grid gap-3">
        <div>
          <div className="text-xs font-medium text-white/70">Map Provider</div>
          <select
            value={providerConfig.provider}
            onChange={(e) =>
              updateProviderConfig({
                ...providerConfig,
                provider: e.target.value === 'nanoBanana' ? 'nanoBanana' : 'local',
              })
            }
            className="mt-1 w-full rounded-lg border border-glass-border bg-white/5 px-3 py-2 text-sm text-white/90"
            disabled={isLoading}
          >
            <option value="local">Local Accurate (Depth Anything + MediaPipe)</option>
            <option value="nanoBanana">Nano Banana Pro API (OpenRouter)</option>
          </select>
          {providerConfig.provider === 'nanoBanana' && (
            <div className="mt-2 text-[11px] text-white/50">
              Generative maps may be inaccurate on reflections, hair, and hands.
            </div>
          )}
        </div>

        {providerConfig.provider === 'nanoBanana' && (
          <div className="grid gap-2">
            <div className="text-[11px] text-white/55">
              Maps model comes from the Models view.
              {typeof mapsModelId === 'string' && mapsModelId.trim().length > 0 ? (
                <div className="mt-1 text-[10px] text-white/45">Selected: {mapsModelId.trim()}</div>
              ) : providerConfig.modelId.trim().length > 0 ? (
                <div className="mt-1 text-[10px] text-white/45">
                  Selected (legacy): {providerConfig.modelId.trim()}
                </div>
              ) : (
                <div className="mt-1 text-[10px] text-white/45">
                  No maps model selected yet.
                </div>
              )}
            </div>

            <label className="flex items-center justify-between gap-3 text-xs text-white/70">
              <span>Allow fallback to local</span>
              <input
                type="checkbox"
                checked={providerConfig.allowFallback}
                onChange={(e) =>
                  updateProviderConfig({ ...providerConfig, allowFallback: e.target.checked })
                }
                disabled={isLoading}
              />
            </label>

            <label className="flex items-center justify-between gap-3 text-xs text-white/70">
              <span>Max retries</span>
              <input
                type="number"
                min={0}
                max={5}
                value={providerConfig.maxRetries}
                onChange={(e) =>
                  updateProviderConfig({
                    ...providerConfig,
                    maxRetries: Math.max(0, Math.min(5, Number(e.target.value) || 0)),
                  })
                }
                className="w-20 rounded border border-glass-border bg-white/5 px-2 py-1 text-xs text-white/90"
                disabled={isLoading}
              />
            </label>
          </div>
        )}
      </div>

      <div className="mt-4">
        <Button
          onClick={handleEnsureMaps}
          disabled={
            isLoading ||
            !imageDataUrl ||
            (providerConfig.provider === 'nanoBanana' &&
              !(
                (typeof mapsModelId === 'string' && mapsModelId.trim().length > 0) ||
                providerConfig.modelId.trim().length > 0
              ))
          }
        >
          {isLoading ? 'Generating maps...' : mapPack ? 'Regenerate maps' : 'Generate maps'}
        </Button>
      </div>

      {error && (
        <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
          <div>{error}</div>
          {providerConfig.provider === 'nanoBanana' &&
            !providerConfig.allowFallback &&
            error.toLowerCase().includes('dimension mismatch') && (
              <div className="mt-2 text-xs text-red-200/80">
                Tip: enable “Allow fallback to local” to avoid failures when the model returns a
                different output size.
              </div>
            )}
        </div>
      )}

      {mapPack && mapPack.maps.length > 0 && sourceHash && (
        <div className="mt-4 grid gap-3">
          <div className="text-xs text-white/50">
            Generated {mapPack.maps.length} maps ({mapPack.sourceWidth}x{mapPack.sourceHeight})
            {typeof mapPack.generationMeta?.cost === 'number' && (
              <span className="ml-2 text-white/40">
                Cost: ${mapPack.generationMeta.cost.toFixed(4)}
              </span>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2">
            {mapPack.maps.map((map) => (
              <button
                key={map.kind}
                onClick={() =>
                  setSelectedPreview(selectedPreview === map.kind ? null : map.kind)
                }
                className={`
                  rounded-lg border p-2.5 text-left transition-all
                  ${
                    selectedPreview === map.kind
                      ? 'border-accent-teal bg-accent-teal/10'
                      : 'border-glass-border bg-white/5 hover:bg-white/8'
                  }
                `}
              >
                <div className="text-xs font-medium text-white/90">{MapLabels[map.kind]}</div>
                <div className="mt-0.5 text-[10px] text-white/45">
                  {MapDescriptions[map.kind]}
                </div>
              </button>
            ))}
          </div>

          {selectedPreview && (
            <Card className="mt-2 overflow-hidden p-0">
              <div className="border-b border-glass-border bg-white/5 px-3 py-2">
                <div className="text-xs font-medium text-white/80">
                  {MapLabels[selectedPreview]}
                </div>
              </div>
              <img
                src={getMapFileUrlForProvider(
                  sourceHash,
                  mapPack.provider || providerConfig.provider,
                  selectedPreview,
                )}
                alt={MapLabels[selectedPreview]}
                className="w-full"
              />
            </Card>
          )}
        </div>
      )}
    </Panel>
  )
}
