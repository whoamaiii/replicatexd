import type { MapKind } from '../../../shared/types/maps'

function commonConstraints() {
  return [
    'Output exactly ONE image.',
    'Preserve the exact framing, perspective, and geometry of the input image.',
    'Match the input image resolution and aspect ratio exactly.',
    'Do not add any text, labels, watermarks, symbols, borders, or extra markings.',
    'No stylization, no artistic rendering, no enhancements, no changes to scene content.',
    'Return only the map image (no variations).',
  ].join('\n')
}

export function buildNanoBananaMapPrompt(
  kind: MapKind,
  options?: { targetWidth?: number; targetHeight?: number },
): string {
  const sizeLine =
    typeof options?.targetWidth === 'number' &&
    typeof options?.targetHeight === 'number' &&
    Number.isFinite(options.targetWidth) &&
    Number.isFinite(options.targetHeight)
      ? `Target output size: ${Math.round(options.targetWidth)}x${Math.round(options.targetHeight)} pixels.`
      : ''
  const base = [sizeLine, commonConstraints()].filter((s) => s.trim().length > 0).join('\n')

  if (kind === 'depth') {
    return [
      'Create a grayscale DEPTH MAP for the input image.',
      'Depth encoding: WHITE = near to camera, BLACK = far from camera.',
      'Use a smooth continuous gradient (not binary).',
      base,
    ].join('\n')
  }

  if (kind === 'edges') {
    return [
      'Create a high-contrast EDGE MAP for the input image.',
      'Style: BLACK background, WHITE edges only.',
      'Edges should be thin and sparse (no filled regions).',
      base,
    ].join('\n')
  }

  if (kind === 'segmentation') {
    return [
      'Create a BINARY SUBJECT MASK for the input image.',
      'WHITE = the main subject/foreground, BLACK = background.',
      'No grayscale; use strictly black and white.',
      base,
    ].join('\n')
  }

  if (kind === 'faceMask') {
    return [
      'Create a BINARY FACE REGION MASK for the input image.',
      'WHITE = face regions only (including facial skin area); BLACK = everything else.',
      'No grayscale; use strictly black and white.',
      base,
    ].join('\n')
  }

  if (kind === 'handsMask') {
    return [
      'Create a BINARY HANDS MASK for the input image.',
      'WHITE = hands only; BLACK = everything else.',
      'No grayscale; use strictly black and white.',
      base,
    ].join('\n')
  }

  if (kind === 'normals') {
    return [
      'Create an RGB NORMAL MAP for the input image (tangent-space style).',
      'Use standard normal-map coloring (RGB encodes surface normals).',
      'No stylization; preserve geometry.',
      base,
    ].join('\n')
  }

  // Exhaustive check
  return [
    `Create a structural map for kind: ${kind}.`,
    base,
  ].join('\n')
}
