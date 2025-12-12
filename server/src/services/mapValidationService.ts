import { PNG } from 'pngjs'
import jpeg from 'jpeg-js'
import type { MapKind } from '../../../shared/types/maps'

function parseDataUrl(dataUrl: string): { mimeType: string; buffer: Buffer } | null {
  const match = dataUrl.match(/^data:([^;]+);base64,([\s\S]+)$/)
  if (!match) return null
  const mimeType = match[1]!.trim()
  const b64 = match[2]!.trim()
  if (!mimeType || !b64) return null
  return { mimeType, buffer: Buffer.from(b64, 'base64') }
}

function redactDataUrls(input: string) {
  return input.replace(
    /data:image\/[a-zA-Z0-9.+-]+;base64,[a-zA-Z0-9+/=]+/g,
    'data:image/...;base64,<redacted>',
  )
}

type DecodedImage = {
  width: number
  height: number
  channels: 3 | 4
  data: Uint8Array
}

function decodeImage(buffer: Buffer, mimeType: string): DecodedImage {
  if (mimeType === 'image/png') {
    const decoded = PNG.sync.read(buffer)
    return {
      width: decoded.width,
      height: decoded.height,
      channels: 4,
      data: decoded.data,
    }
  }

  if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
    const decoded = jpeg.decode(buffer, { useTArray: true })
    return {
      width: decoded.width,
      height: decoded.height,
      channels: 4,
      data: decoded.data,
    }
  }

  throw new Error(`Unsupported image mime type for validation: ${mimeType}`)
}

function toGray(r: number, g: number, b: number) {
  return Math.round(r * 0.299 + g * 0.587 + b * 0.114)
}

function sampleGrayscaleStats(image: DecodedImage) {
  const { data } = image
  const totalPixels = image.width * image.height
  if (totalPixels <= 0) {
    return { totalPixels: 0, low: 0, high: 0, mid: 0, mean: 0, variance: 0 }
  }

  const targetSamples = 20_000
  const step = Math.max(1, Math.floor(totalPixels / targetSamples))

  let count = 0
  let sum = 0
  let sumSq = 0
  let low = 0
  let high = 0
  let mid = 0

  for (let i = 0; i < totalPixels; i += step) {
    const idx = i * 4
    const r = data[idx] ?? 0
    const g = data[idx + 1] ?? 0
    const b = data[idx + 2] ?? 0
    const gray = toGray(r, g, b)

    count += 1
    sum += gray
    sumSq += gray * gray

    if (gray <= 32) low += 1
    else if (gray >= 223) high += 1
    else mid += 1
  }

  const mean = sum / Math.max(1, count)
  const variance = sumSq / Math.max(1, count) - mean * mean

  return { totalPixels: count, low, high, mid, mean, variance }
}

function sampleRgbChannelStats(image: DecodedImage) {
  const { data } = image
  const totalPixels = image.width * image.height
  const targetSamples = 20_000
  const step = Math.max(1, Math.floor(totalPixels / targetSamples))

  let count = 0
  let sumR = 0
  let sumG = 0
  let sumB = 0
  let sumSqR = 0
  let sumSqG = 0
  let sumSqB = 0

  for (let i = 0; i < totalPixels; i += step) {
    const idx = i * 4
    const r = data[idx] ?? 0
    const g = data[idx + 1] ?? 0
    const b = data[idx + 2] ?? 0
    count += 1
    sumR += r
    sumG += g
    sumB += b
    sumSqR += r * r
    sumSqG += g * g
    sumSqB += b * b
  }

  const safeCount = Math.max(1, count)
  const meanR = sumR / safeCount
  const meanG = sumG / safeCount
  const meanB = sumB / safeCount
  const varR = sumSqR / safeCount - meanR * meanR
  const varG = sumSqG / safeCount - meanG * meanG
  const varB = sumSqB / safeCount - meanB * meanB

  return { meanR, meanG, meanB, varR, varG, varB }
}

export type MapValidationResult = {
  ok: boolean
  code?: 'invalid_data_url' | 'decode_failed' | 'dimension_mismatch' | 'heuristic_failed'
  reason?: string
  width?: number
  height?: number
}

export function getImageDimensionsFromDataUrl(dataUrl: string): {
  width: number
  height: number
  mimeType: string
} {
  const parsed = parseDataUrl(dataUrl)
  if (!parsed) {
    throw new Error('Invalid image data URL')
  }
  try {
    const decoded = decodeImage(parsed.buffer, parsed.mimeType)
    return { width: decoded.width, height: decoded.height, mimeType: parsed.mimeType }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    throw new Error(redactDataUrls(message))
  }
}

export function validateGeneratedMap(input: {
  kind: MapKind
  mapDataUrl: string
  expectedWidth: number
  expectedHeight: number
}): MapValidationResult {
  const parsed = parseDataUrl(input.mapDataUrl)
  if (!parsed) {
    return { ok: false, code: 'invalid_data_url', reason: 'Missing or invalid data URL' }
  }

  let decoded: DecodedImage
  try {
    decoded = decodeImage(parsed.buffer, parsed.mimeType)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { ok: false, code: 'decode_failed', reason: redactDataUrls(message) }
  }

  if (decoded.width !== input.expectedWidth || decoded.height !== input.expectedHeight) {
    return {
      ok: false,
      code: 'dimension_mismatch',
      reason: `Dimension mismatch (${decoded.width}x${decoded.height} != ${input.expectedWidth}x${input.expectedHeight})`,
      width: decoded.width,
      height: decoded.height,
    }
  }

  const gray = sampleGrayscaleStats(decoded)

  // Heuristics per kind (intentionally tolerant; we only want to reject obvious failures).
  if (input.kind === 'segmentation' || input.kind === 'faceMask' || input.kind === 'handsMask') {
    const twoToneRatio = (gray.low + gray.high) / Math.max(1, gray.totalPixels)
    if (twoToneRatio < 0.92) {
      return {
        ok: false,
        code: 'heuristic_failed',
        reason: `Mask not binary enough (twoToneRatio=${twoToneRatio.toFixed(2)})`,
      }
    }
  }

  if (input.kind === 'edges') {
    const twoToneRatio = (gray.low + gray.high) / Math.max(1, gray.totalPixels)
    const whiteRatio = gray.high / Math.max(1, gray.totalPixels)
    const blackRatio = gray.low / Math.max(1, gray.totalPixels)
    if (twoToneRatio < 0.9) {
      return {
        ok: false,
        code: 'heuristic_failed',
        reason: `Edges not high-contrast enough (twoToneRatio=${twoToneRatio.toFixed(2)})`,
      }
    }
    if (blackRatio < 0.35) {
      return {
        ok: false,
        code: 'heuristic_failed',
        reason: `Edges background not dark enough (blackRatio=${blackRatio.toFixed(2)})`,
      }
    }
    if (whiteRatio > 0.5) {
      return {
        ok: false,
        code: 'heuristic_failed',
        reason: `Edges too dense (whiteRatio=${whiteRatio.toFixed(2)})`,
      }
    }
  }

  if (input.kind === 'depth') {
    const midRatio = gray.mid / Math.max(1, gray.totalPixels)
    const std = Math.sqrt(Math.max(0, gray.variance))
    if (midRatio < 0.2) {
      return {
        ok: false,
        code: 'heuristic_failed',
        reason: `Depth lacks gradient (midRatio=${midRatio.toFixed(2)})`,
      }
    }
    if (std < 18) {
      return {
        ok: false,
        code: 'heuristic_failed',
        reason: `Depth variance too low (std=${std.toFixed(1)})`,
      }
    }
  }

  if (input.kind === 'normals') {
    const rgb = sampleRgbChannelStats(decoded)
    const stdR = Math.sqrt(Math.max(0, rgb.varR))
    const stdG = Math.sqrt(Math.max(0, rgb.varG))
    const stdB = Math.sqrt(Math.max(0, rgb.varB))
    const anyVar = stdR > 8 || stdG > 8 || stdB > 8
    if (!anyVar) {
      return { ok: false, code: 'heuristic_failed', reason: 'Normals map appears near-constant' }
    }
  }

  return { ok: true, width: decoded.width, height: decoded.height }
}

export function dataUrlToBuffer(dataUrl: string): { mimeType: string; buffer: Buffer } {
  const parsed = parseDataUrl(dataUrl)
  if (!parsed) {
    throw new Error('Invalid image data URL')
  }
  return parsed
}

function clampByte(n: number) {
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.min(255, Math.round(n)))
}

function resizeRgbaNearest(src: Uint8Array, srcW: number, srcH: number, dstW: number, dstH: number) {
  const dst = new Uint8Array(dstW * dstH * 4)
  for (let y = 0; y < dstH; y += 1) {
    const sy = Math.min(srcH - 1, Math.floor((y * srcH) / dstH))
    for (let x = 0; x < dstW; x += 1) {
      const sx = Math.min(srcW - 1, Math.floor((x * srcW) / dstW))
      const sIdx = (sy * srcW + sx) * 4
      const dIdx = (y * dstW + x) * 4
      dst[dIdx] = src[sIdx] ?? 0
      dst[dIdx + 1] = src[sIdx + 1] ?? 0
      dst[dIdx + 2] = src[sIdx + 2] ?? 0
      dst[dIdx + 3] = src[sIdx + 3] ?? 255
    }
  }
  return dst
}

function resizeRgbaBilinear(src: Uint8Array, srcW: number, srcH: number, dstW: number, dstH: number) {
  const dst = new Uint8Array(dstW * dstH * 4)
  for (let y = 0; y < dstH; y += 1) {
    const fy = ((y + 0.5) * srcH) / dstH - 0.5
    const y0 = Math.max(0, Math.min(srcH - 1, Math.floor(fy)))
    const y1 = Math.max(0, Math.min(srcH - 1, y0 + 1))
    const wy = fy - y0

    for (let x = 0; x < dstW; x += 1) {
      const fx = ((x + 0.5) * srcW) / dstW - 0.5
      const x0 = Math.max(0, Math.min(srcW - 1, Math.floor(fx)))
      const x1 = Math.max(0, Math.min(srcW - 1, x0 + 1))
      const wx = fx - x0

      const i00 = (y0 * srcW + x0) * 4
      const i10 = (y0 * srcW + x1) * 4
      const i01 = (y1 * srcW + x0) * 4
      const i11 = (y1 * srcW + x1) * 4

      for (let c = 0; c < 4; c += 1) {
        const v00 = src[i00 + c] ?? 0
        const v10 = src[i10 + c] ?? 0
        const v01 = src[i01 + c] ?? 0
        const v11 = src[i11 + c] ?? 0

        const v0 = v00 * (1 - wx) + v10 * wx
        const v1 = v01 * (1 - wx) + v11 * wx
        const v = v0 * (1 - wy) + v1 * wy

        dst[(y * dstW + x) * 4 + c] = clampByte(v)
      }
    }
  }
  return dst
}

export function resizeMapDataUrlToMatch(input: {
  mapDataUrl: string
  targetWidth: number
  targetHeight: number
  mode: 'nearest' | 'bilinear'
}): string {
  const parsed = parseDataUrl(input.mapDataUrl)
  if (!parsed) {
    throw new Error('Invalid image data URL')
  }
  const decoded = decodeImage(parsed.buffer, parsed.mimeType)
  const resized =
    input.mode === 'nearest'
      ? resizeRgbaNearest(decoded.data, decoded.width, decoded.height, input.targetWidth, input.targetHeight)
      : resizeRgbaBilinear(decoded.data, decoded.width, decoded.height, input.targetWidth, input.targetHeight)

  const png = new PNG({ width: input.targetWidth, height: input.targetHeight })
  png.data = Buffer.from(resized)
  const buffer = PNG.sync.write(png)
  return `data:image/png;base64,${buffer.toString('base64')}`
}
