// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import { loadModelSettings, saveModelSettings } from './modelSettingsStorage'

function resetLocalStorage() {
  localStorage.clear()
}

describe('modelSettingsStorage', () => {
  beforeEach(() => {
    resetLocalStorage()
  })

  it('returns empty object when unset', () => {
    expect(loadModelSettings()).toEqual({})
  })

  it('persists and normalizes ids', () => {
    saveModelSettings({
      analysisModelId: '  openai/gpt-5.2  ',
      generationModelId: 'black-forest-labs/flux.2-pro',
      mapsModelId: '   ',
      ragDraftModelId: '  x-ai/grok-fast  ',
      ragFinalModelId: '  openai/gpt-5.2  ',
    })

    expect(loadModelSettings()).toEqual({
      analysisModelId: 'openai/gpt-5.2',
      generationModelId: 'black-forest-labs/flux.2-pro',
      mapsModelId: undefined,
      ragDraftModelId: 'x-ai/grok-fast',
      ragFinalModelId: 'openai/gpt-5.2',
    })
  })

  it('handles invalid JSON gracefully', () => {
    localStorage.setItem('psyvis_model_settings', '{not-json')
    expect(loadModelSettings()).toEqual({})
  })
})
