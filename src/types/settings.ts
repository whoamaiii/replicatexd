export type AutoDownloadMode = 'off' | 'image' | 'bundle'

export type OutputSettings = {
  autoDownloadMode: AutoDownloadMode
  autoSaveToLibrary: boolean
}

export const DEFAULT_OUTPUT_SETTINGS: OutputSettings = {
  autoDownloadMode: 'off',
  autoSaveToLibrary: true,
}
