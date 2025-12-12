import type { EffectFamily, VisualEffect } from '../../../shared/types/effects'

type FamilyTab = 'all' | EffectFamily

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .replaceAll('_', ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function fuzzyScore(queryRaw: string, textRaw: string) {
  const query = normalizeText(queryRaw)
  const text = normalizeText(textRaw)
  if (!query) return 1
  if (!text) return 0

  const directIndex = text.indexOf(query)
  if (directIndex !== -1) {
    return 1000 - directIndex - Math.max(0, text.length - query.length)
  }

  const tokens = query.split(' ').filter(Boolean)
  if (tokens.length > 0 && tokens.every((t) => text.includes(t))) {
    return 600 - tokens.length
  }

  // Subsequence-ish: all chars in order
  let i = 0
  for (const ch of query) {
    if (ch === ' ') continue
    i = text.indexOf(ch, i)
    if (i === -1) return 0
    i += 1
  }
  return 250 - Math.max(0, text.length - query.length)
}

export function filterEffectsCatalog(params: {
  catalog: VisualEffect[]
  familyTab: FamilyTab
  query: string
}): VisualEffect[] {
  const list =
    params.familyTab === 'all'
      ? params.catalog
      : params.catalog.filter((e) => e.family === params.familyTab)

  const q = params.query.trim()
  if (!q) {
    return [...list].sort((a, b) => a.displayName.localeCompare(b.displayName))
  }

  return list
    .map((e) => {
      const score = Math.max(fuzzyScore(q, e.displayName), fuzzyScore(q, e.id))
      return { effect: e, score }
    })
    .filter((row) => row.score > 0)
    .sort((a, b) => {
      const diff = b.score - a.score
      if (diff !== 0) return diff
      return a.effect.displayName.localeCompare(b.effect.displayName)
    })
    .map((row) => row.effect)
}

