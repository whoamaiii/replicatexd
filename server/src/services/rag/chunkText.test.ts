import { describe, expect, it } from 'vitest'
import { chunkText } from './chunkText'

describe('chunkText', () => {
  it('returns empty for blank input', () => {
    expect(chunkText('   ', { maxChars: 400, overlapChars: 40 })).toEqual([])
  })

  it('returns a single chunk when below max', () => {
    const out = chunkText('hello world', { maxChars: 400, overlapChars: 40 })
    expect(out).toEqual(['hello world'])
  })

  it('chunks with overlap', () => {
    const text = 'a'.repeat(1000)
    const chunks = chunkText(text, { maxChars: 300, overlapChars: 50 })
    expect(chunks.length).toBeGreaterThan(1)
    // Overlap means the second chunk should share prefix with tail of first.
    expect(chunks[0]!.slice(-50)).toBe(chunks[1]!.slice(0, 50))
  })
})

