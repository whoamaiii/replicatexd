import fs from 'node:fs'
import path from 'node:path'
import { getEnv } from '../config/env'
import {
  loadIndex,
  saveIndex,
  getProjectPath,
  getTrashPath,
  markProjectTrashed,
  removeProject,
} from './libraryIndex'

export type CleanupResult = {
  deleted: number
  trashed: number
  errors: string[]
}

function ensureTrashDir(): void {
  const trashPath = getTrashPath()
  if (!fs.existsSync(trashPath)) {
    fs.mkdirSync(trashPath, { recursive: true })
  }
}

function moveToTrash(projectId: string): boolean {
  const projectPath = getProjectPath(projectId)
  const trashPath = getTrashPath()

  if (!fs.existsSync(projectPath)) {
    return false
  }

  ensureTrashDir()

  const trashDestination = path.join(trashPath, projectId)

  try {
    fs.renameSync(projectPath, trashDestination)
    return true
  } catch {
    try {
      fs.cpSync(projectPath, trashDestination, { recursive: true })
      fs.rmSync(projectPath, { recursive: true, force: true })
      return true
    } catch {
      return false
    }
  }
}

function permanentlyDelete(projectId: string): boolean {
  const trashPath = path.join(getTrashPath(), projectId)

  if (fs.existsSync(trashPath)) {
    try {
      fs.rmSync(trashPath, { recursive: true, force: true })
    } catch {
      return false
    }
  }

  const projectPath = getProjectPath(projectId)
  if (fs.existsSync(projectPath)) {
    try {
      fs.rmSync(projectPath, { recursive: true, force: true })
    } catch {
      return false
    }
  }

  return true
}

export function cleanupExpiredProjects(): CleanupResult {
  const { libraryTrashEnabled, libraryTrashGraceHours } = getEnv()
  const now = new Date()
  const projects = loadIndex()
  const result: CleanupResult = { deleted: 0, trashed: 0, errors: [] }

  for (const project of projects) {
    if (project.isSaved) {
      continue
    }

    if (project.trashedAt) {
      const trashedAt = new Date(project.trashedAt)
      const graceExpiry = new Date(trashedAt.getTime() + libraryTrashGraceHours * 60 * 60 * 1000)

      if (now >= graceExpiry) {
        const deleted = permanentlyDelete(project.projectId)
        if (deleted) {
          removeProject(project.projectId)
          result.deleted++
        } else {
          result.errors.push(`Failed to permanently delete project ${project.projectId}`)
        }
      }
      continue
    }

    if (!project.expiresAt) {
      continue
    }

    const expiresAt = new Date(project.expiresAt)
    if (now < expiresAt) {
      continue
    }

    if (libraryTrashEnabled) {
      const moved = moveToTrash(project.projectId)
      if (moved) {
        markProjectTrashed(project.projectId)
        result.trashed++
      } else {
        result.errors.push(`Failed to move project ${project.projectId} to trash`)
      }
    } else {
      const deleted = permanentlyDelete(project.projectId)
      if (deleted) {
        removeProject(project.projectId)
        result.deleted++
      } else {
        result.errors.push(`Failed to delete project ${project.projectId}`)
      }
    }
  }

  return result
}

export function emptyTrash(): CleanupResult {
  const projects = loadIndex()
  const result: CleanupResult = { deleted: 0, trashed: 0, errors: [] }

  for (const project of projects) {
    if (!project.trashedAt) {
      continue
    }

    const deleted = permanentlyDelete(project.projectId)
    if (deleted) {
      removeProject(project.projectId)
      result.deleted++
    } else {
      result.errors.push(`Failed to permanently delete trashed project ${project.projectId}`)
    }
  }

  return result
}

export function restoreFromTrash(projectId: string): boolean {
  const projects = loadIndex()
  const project = projects.find((p) => p.projectId === projectId && p.trashedAt)

  if (!project) {
    return false
  }

  const trashPath = path.join(getTrashPath(), projectId)
  const projectPath = getProjectPath(projectId)

  if (!fs.existsSync(trashPath)) {
    return false
  }

  try {
    fs.renameSync(trashPath, projectPath)
  } catch {
    try {
      fs.cpSync(trashPath, projectPath, { recursive: true })
      fs.rmSync(trashPath, { recursive: true, force: true })
    } catch {
      return false
    }
  }

  project.trashedAt = undefined
  const { libraryRetentionDays } = getEnv()
  const newExpiry = new Date()
  newExpiry.setDate(newExpiry.getDate() + libraryRetentionDays)
  project.expiresAt = newExpiry.toISOString()
  project.lastActivityAt = new Date().toISOString()

  saveIndex(projects)
  return true
}

let cleanupInterval: ReturnType<typeof setInterval> | null = null

export function startCleanupScheduler(): void {
  console.log('[Library] Running initial cleanup...')
  const initialResult = cleanupExpiredProjects()
  console.log(
    `[Library] Initial cleanup complete: ${initialResult.trashed} trashed, ${initialResult.deleted} deleted`
  )

  if (initialResult.errors.length > 0) {
    console.warn('[Library] Cleanup errors:', initialResult.errors)
  }

  const sixHoursMs = 6 * 60 * 60 * 1000
  cleanupInterval = setInterval(() => {
    console.log('[Library] Running scheduled cleanup...')
    const result = cleanupExpiredProjects()
    console.log(
      `[Library] Scheduled cleanup complete: ${result.trashed} trashed, ${result.deleted} deleted`
    )
    if (result.errors.length > 0) {
      console.warn('[Library] Cleanup errors:', result.errors)
    }
  }, sixHoursMs)

  console.log('[Library] Cleanup scheduler started (runs every 6 hours)')
}

export function stopCleanupScheduler(): void {
  if (cleanupInterval) {
    clearInterval(cleanupInterval)
    cleanupInterval = null
    console.log('[Library] Cleanup scheduler stopped')
  }
}
