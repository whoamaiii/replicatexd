import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { getEnv } from '../config/env'
import type { LibraryProject, LibraryProjectSummary } from '../../../shared/types/library'

let cachedIndex: LibraryProject[] | null = null

function getIndexPath(): string {
  const { libraryOutputDir } = getEnv()
  return path.resolve(libraryOutputDir, 'library_index.json')
}

function ensureLibraryDir(): void {
  const { libraryOutputDir } = getEnv()
  const fullPath = path.resolve(libraryOutputDir)
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true })
  }
  const projectsPath = path.join(fullPath, 'projects')
  if (!fs.existsSync(projectsPath)) {
    fs.mkdirSync(projectsPath, { recursive: true })
  }
}

export function loadIndex(): LibraryProject[] {
  if (cachedIndex) {
    return cachedIndex
  }

  ensureLibraryDir()
  const indexPath = getIndexPath()

  if (!fs.existsSync(indexPath)) {
    cachedIndex = []
    return cachedIndex
  }

  try {
    const raw = fs.readFileSync(indexPath, 'utf8')
    cachedIndex = JSON.parse(raw) as LibraryProject[]
    return cachedIndex
  } catch {
    cachedIndex = []
    return cachedIndex
  }
}

export function saveIndex(projects: LibraryProject[]): void {
  ensureLibraryDir()
  const indexPath = getIndexPath()
  fs.writeFileSync(indexPath, JSON.stringify(projects, null, 2), 'utf8')
  cachedIndex = projects
}

export function generateProjectId(): string {
  return crypto.randomUUID()
}

export function generateGenerationId(): string {
  return crypto.randomUUID()
}

function computeExpiresAt(): string {
  const { libraryRetentionDays } = getEnv()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + libraryRetentionDays)
  return expiresAt.toISOString()
}

export function createOrLoadProject(projectId?: string): LibraryProject {
  const projects = loadIndex()

  if (projectId) {
    const existing = projects.find((p) => p.projectId === projectId)
    if (existing) {
      return existing
    }
  }

  const now = new Date().toISOString()
  const newProject: LibraryProject = {
    projectId: projectId || generateProjectId(),
    createdAt: now,
    lastActivityAt: now,
    isSaved: false,
    expiresAt: computeExpiresAt(),
    generations: [],
  }

  projects.push(newProject)
  saveIndex(projects)

  return newProject
}

export function upsertProject(project: LibraryProject): void {
  const projects = loadIndex()
  const idx = projects.findIndex((p) => p.projectId === project.projectId)

  if (idx >= 0) {
    projects[idx] = project
  } else {
    projects.push(project)
  }

  saveIndex(projects)
}

export function listProjects(): LibraryProjectSummary[] {
  const projects = loadIndex()

  const summaries: LibraryProjectSummary[] = projects
    .filter((p) => !p.trashedAt)
    .map((p) => {
      const latest = p.generations[p.generations.length - 1]
      return {
        projectId: p.projectId,
        createdAt: p.createdAt,
        lastActivityAt: p.lastActivityAt,
        isSaved: p.isSaved,
        expiresAt: p.expiresAt,
        generationCount: p.generations.length,
        latestSubstanceId: latest?.substanceId,
        latestDose: latest?.dose,
      }
    })
    .sort((a, b) => new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime())

  return summaries
}

export function getProject(projectId: string): LibraryProject | null {
  const projects = loadIndex()
  return projects.find((p) => p.projectId === projectId && !p.trashedAt) || null
}

export function markProjectSaved(projectId: string, isSaved: boolean): LibraryProject | null {
  const projects = loadIndex()
  const project = projects.find((p) => p.projectId === projectId)

  if (!project) {
    return null
  }

  project.isSaved = isSaved

  if (isSaved) {
    project.expiresAt = null
  } else {
    project.expiresAt = computeExpiresAt()
  }

  saveIndex(projects)
  return project
}

export function touchProjectActivity(projectId: string): LibraryProject | null {
  const projects = loadIndex()
  const project = projects.find((p) => p.projectId === projectId)

  if (!project) {
    return null
  }

  project.lastActivityAt = new Date().toISOString()

  if (!project.isSaved) {
    project.expiresAt = computeExpiresAt()
  }

  saveIndex(projects)
  return project
}

export function removeProject(projectId: string): boolean {
  const projects = loadIndex()
  const idx = projects.findIndex((p) => p.projectId === projectId)

  if (idx < 0) {
    return false
  }

  projects.splice(idx, 1)
  saveIndex(projects)
  return true
}

export function markProjectTrashed(projectId: string): boolean {
  const projects = loadIndex()
  const project = projects.find((p) => p.projectId === projectId)

  if (!project) {
    return false
  }

  project.trashedAt = new Date().toISOString()
  saveIndex(projects)
  return true
}

export function getTrashPath(): string {
  const { libraryOutputDir } = getEnv()
  return path.resolve(libraryOutputDir, '_trash')
}

export function getProjectsPath(): string {
  const { libraryOutputDir } = getEnv()
  return path.resolve(libraryOutputDir, 'projects')
}

export function getProjectPath(projectId: string): string {
  return path.join(getProjectsPath(), projectId)
}

export function clearIndexCache(): void {
  cachedIndex = null
}
