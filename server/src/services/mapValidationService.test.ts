import { describe, it, expect } from 'vitest'
import { PNG } from 'pngjs'
import { validateGeneratedMap } from './mapValidationService'

function makePngDataUrl(width: number, height: number, fill: (idx: number) => [number, number, number, number]) {
  const png = new PNG({ width, height })
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (width * y + x) << 2
      const [r, g, b, a] = fill(width * y + x)
      png.data[i] = r
      png.data[i + 1] = g
      png.data[i + 2] = b
      png.data[i + 3] = a
    }
  }
  const buffer = PNG.sync.write(png)
  return `data:image/png;base64,${buffer.toString('base64')}`
}

describe('mapValidationService', () => {
  it('rejects wrong dimensions', () => {
    const dataUrl = makePngDataUrl(2, 2, () => [0, 0, 0, 255])
    const res = validateGeneratedMap({
      kind: 'depth',
      mapDataUrl: dataUrl,
      expectedWidth: 3,
      expectedHeight: 3,
    })
    expect(res.ok).toBe(false)
    expect(res.reason).toMatch(/Dimension mismatch/)
  })

  it('rejects non-binary masks', () => {
    const dataUrl = makePngDataUrl(8, 8, (idx) => {
      const v = (idx * 17) % 256
      return [v, v, v, 255]
    })
    const res = validateGeneratedMap({
      kind: 'segmentation',
      mapDataUrl: dataUrl,
      expectedWidth: 8,
      expectedHeight: 8,
    })
    expect(res.ok).toBe(false)
  })
})

