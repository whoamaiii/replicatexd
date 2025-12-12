/**
 * Frontend map types for PsyVis Lab
 *
 * Re-exports shared types and adds frontend-specific state types.
 */

// Re-export all shared types
export type {
  MapKind,
  MapAsset,
  MapPack,
  MapSettings,
  MapProvider,
  MapProviderConfig,
  MapGenerationMeta,
  EnsureMapsRequest,
  EnsureMapsResponse,
  GetMapsResponse,
  UpdateMapSettingsRequest,
  GenerationMode,
} from '../../shared/types/maps'

export { MapKinds, DEFAULT_MAP_SETTINGS, DEFAULT_MAP_PROVIDER_CONFIG } from '../../shared/types/maps'

/**
 * Frontend state for the Map Lab panel
 */
export type MapLabState = {
  sourceHash: string | null
  mapPack: MapPack | null
  settings: MapSettings | null
  isLoading: boolean
  error: string | null
}

// Import the types we need for MapLabState
import type { MapPack, MapSettings } from '../../shared/types/maps'
