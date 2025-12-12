import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.stubEnv('OPENROUTER_API_KEY', 'test-api-key')
vi.stubEnv('OPENROUTER_BASE_URL', 'https://openrouter.ai/api/v1')
vi.stubEnv('LIBRARY_OUTPUT_DIR', 'test_output_nano')

describe('nanoBananaClient', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  it('extracts image data url, cost, and request id', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'x-request-id': 'req_123' }),
      text: async () =>
        JSON.stringify({
          id: 'resp_abc',
          choices: [
            {
              message: {
                images: [
                  {
                    image_url: {
                      url: 'data:image/png;base64,AAAA',
                    },
                  },
                ],
              },
            },
          ],
          usage: { total_cost: 0.0123 },
        }),
    })

    vi.stubGlobal('fetch', fetchMock)

    const { callNanoBananaMap } = await import('./nanoBananaClient')

    const res = await callNanoBananaMap({
      modelId: 'google/gemini-3-pro-image-preview',
      promptText: 'test',
      inputImageDataUrl: 'data:image/png;base64,BBBB',
      timeoutMs: 10_000,
    })

    expect(res.outputImageDataUrl).toBe('data:image/png;base64,AAAA')
    expect(res.cost).toBe(0.0123)
    expect(res.requestId).toBe('req_123')
    expect(res.responseId).toBe('resp_abc')
  })
})

