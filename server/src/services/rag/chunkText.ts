export type ChunkOptions = {
  maxChars: number
  overlapChars: number
}

function clampInt(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Math.floor(n)))
}

/**
 * Chunks by character count with overlap. This is intentionally simple and deterministic;
 * the RAG system benefits more from predictable boundaries than perfect token accounting.
 */
export function chunkText(text: string, options: ChunkOptions): string[] {
  const input = text.replace(/\r\n/g, '\n').trim()
  if (!input) return []

  const maxChars = clampInt(options.maxChars, 200, 20_000)
  const overlapChars = clampInt(options.overlapChars, 0, Math.max(0, maxChars - 1))
  if (input.length <= maxChars) return [input]

  const chunks: string[] = []
  let start = 0
  while (start < input.length) {
    const end = Math.min(input.length, start + maxChars)
    const chunk = input.slice(start, end).trim()
    if (chunk.length > 0) chunks.push(chunk)
    if (end >= input.length) break
    start = Math.max(0, end - overlapChars)
  }

  return chunks
}

