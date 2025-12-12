import path from 'node:path'
import fs from 'node:fs'

export function resolveProjectPath(...segments: string[]) {
  return path.resolve(process.cwd(), ...segments)
}

export function ensureDirExists(dirPath: string) {
  fs.mkdirSync(dirPath, { recursive: true })
}

export function resolveRagIndexDir(envValue?: string) {
  const dir = typeof envValue === 'string' && envValue.trim().length > 0 ? envValue.trim() : 'data/rag'
  return resolveProjectPath(dir)
}

