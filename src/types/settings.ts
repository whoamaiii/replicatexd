export type AutoDownloadMode = 'off' | 'image' | 'bundle'

export type GenerationMode = 'prompt_only' | 'base_image_edit'

export type OutputSettings = {
  autoDownloadMode: AutoDownloadMode
  autoSaveToLibrary: boolean
  generationMode: GenerationMode
  // RAG for generation stage (adds to generation usedPrompt)
  ragEnabled: boolean
  ragQuery: string
  // RAG for analysis stage (biases effect selection + writes ragAddendum)
  ragAnalysisEnabled: boolean
  ragAnalysisQuery: string
  ragAnalysisMode: 'draft_and_refine' | 'retrieve_only'
}

export const DEFAULT_OUTPUT_SETTINGS: OutputSettings = {
  autoDownloadMode: 'off',
  autoSaveToLibrary: true,
  generationMode: 'base_image_edit',
  ragEnabled: false,
  ragQuery: '',
  ragAnalysisEnabled: false,
  ragAnalysisQuery: '',
  ragAnalysisMode: 'draft_and_refine',
}
