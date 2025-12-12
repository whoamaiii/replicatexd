import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import type { RagDocument } from './types'
import { chunkText } from './chunkText'
import type { VisualEffect } from '../../../../shared/types/effects'
import { resolveProjectPath } from './paths'

function sha256(input: string | Buffer) {
  return crypto.createHash('sha256').update(input).digest('hex')
}

function safeReadUtf8(filePath: string) {
  return fs.readFileSync(filePath, 'utf8')
}

function buildVisualEffectDoc(effect: VisualEffect): RagDocument {
  const lines: string[] = []
  lines.push(`Effect: ${effect.displayName} (${effect.id})`)
  lines.push(`Group: ${effect.group}`)
  lines.push(`Family: ${effect.family}`)
  lines.push(`Description: ${effect.shortDescription}`)
  if (Array.isArray(effect.simulationHints) && effect.simulationHints.length > 0) {
    lines.push('Simulation hints:')
    for (const hint of effect.simulationHints) lines.push(`- ${hint}`)
  }
  if (effect.typicalIntensityRange) {
    lines.push(
      `Typical intensity range: ${effect.typicalIntensityRange.min} to ${effect.typicalIntensityRange.max}`,
    )
  }
  return {
    id: `visual_effect:${effect.id}`,
    title: `Visual effect: ${effect.displayName}`,
    text: lines.join('\n'),
    source: { type: 'visual_effect', effectId: effect.id },
    metadata: {
      effectId: effect.id,
      group: effect.group,
      family: effect.family,
    },
  }
}

function loadVisualEffectsDocs(): { docs: RagDocument[]; hash: string } {
  const filePath = resolveProjectPath('data', 'visual_effects.json')
  const raw = safeReadUtf8(filePath)
  const hash = sha256(raw)

  const parsed = JSON.parse(raw) as unknown
  const effects: VisualEffect[] = Array.isArray(parsed) ? (parsed as VisualEffect[]) : []
  const docs: RagDocument[] = effects
    .filter((e) => e && typeof e === 'object' && typeof (e as VisualEffect).id === 'string')
    .map((e) => buildVisualEffectDoc(e))

  return { docs, hash }
}

function isMarkdownFile(filename: string) {
  const lower = filename.toLowerCase()
  return lower.endsWith('.md') || lower.endsWith('.mdx')
}

function listMarkdownFiles(dirPath: string) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true })
  const files: string[] = []
  for (const e of entries) {
    if (!e.isFile()) continue
    if (!isMarkdownFile(e.name)) continue
    files.push(path.join(dirPath, e.name))
  }
  files.sort((a, b) => a.localeCompare(b))
  return files
}

function stripFrontMatter(md: string) {
  // Very small YAML-frontmatter stripper (--- ... ---)
  if (!md.startsWith('---')) return md
  const idx = md.indexOf('\n---', 3)
  if (idx === -1) return md
  const after = md.indexOf('\n', idx + 4)
  if (after === -1) return md.slice(idx + 4)
  return md.slice(after + 1)
}

function buildMarkdownDocs(options?: { maxChars?: number; overlapChars?: number }) {
  const docsDir = resolveProjectPath('docs')
  if (!fs.existsSync(docsDir)) return { docs: [] as RagDocument[], hash: sha256('') }

  const files = listMarkdownFiles(docsDir)
  const hashes: string[] = []
  const docs: RagDocument[] = []

  const maxChars = typeof options?.maxChars === 'number' ? options.maxChars : 1600
  const overlapChars = typeof options?.overlapChars === 'number' ? options.overlapChars : 180

  for (const filePath of files) {
    const raw = safeReadUtf8(filePath)
    hashes.push(sha256(raw))

    const rel = path.relative(resolveProjectPath(), filePath)
    const cleaned = stripFrontMatter(raw).trim()
    if (!cleaned) continue

    const chunks = chunkText(cleaned, { maxChars, overlapChars })
    for (let i = 0; i < chunks.length; i++) {
      docs.push({
        id: `doc_md:${rel}#${i + 1}`,
        title: `Docs: ${path.basename(filePath)} (chunk ${i + 1}/${chunks.length})`,
        text: chunks[i]!,
        source: { type: 'doc_md', path: rel },
        metadata: { chunk: i + 1, chunkCount: chunks.length },
      })
    }
  }

  const hash = sha256(hashes.join('\n'))
  return { docs, hash }
}

export function loadKnowledgeBaseDocuments() {
  const effects = loadVisualEffectsDocs()
  const markdown = buildMarkdownDocs()
  return {
    docs: [...effects.docs, ...markdown.docs],
    sourceHashes: {
      'data/visual_effects.json': effects.hash,
      'docs/*.md': markdown.hash,
    },
  }
}

