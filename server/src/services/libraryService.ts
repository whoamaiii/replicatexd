import fs from 'node:fs'
import path from 'node:path'
import archiver from 'archiver'
import {
  createOrLoadProject,
  generateGenerationId,
  getProject,
  getProjectPath,
  touchProjectActivity,
  upsertProject,
  removeProject,
} from './libraryIndex'
import type { ImageAnalysisResult } from '../../../shared/types/analysis'
import type { LibraryGeneration, LibraryProject } from '../../../shared/types/library'

function parseDataUrl(dataUrl: string): { mimeType: string; base64: string } | null {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/)
  if (!match) {
    return null
  }
  return {
    mimeType: match[1],
    base64: match[2],
  }
}

function getExtensionFromMimeType(mimeType: string): string {
  const map: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/webp': 'webp',
    'image/gif': 'gif',
  }
  return map[mimeType] || 'png'
}

function ensureDir(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }
}

export type SaveGeneratedAssetParams = {
  imageDataUrl: string
  mimeType: string
  usedPrompt: string
  model: string
  projectId?: string
  originalAnalysis: ImageAnalysisResult
  workingAnalysis: ImageAnalysisResult
  inputImageDataUrl?: string
}

export type SaveGeneratedAssetResult = {
  project: LibraryProject
  generation: LibraryGeneration
  downloadUrl: string
  bundleUrl: string
}

export async function saveGeneratedAsset(
  params: SaveGeneratedAssetParams
): Promise<SaveGeneratedAssetResult> {
  const {
    imageDataUrl,
    mimeType,
    usedPrompt,
    model,
    projectId,
    originalAnalysis,
    workingAnalysis,
    inputImageDataUrl,
  } = params

  const project = createOrLoadProject(projectId)
  const projectPath = getProjectPath(project.projectId)
  ensureDir(projectPath)

  if (inputImageDataUrl && !project.inputImagePath) {
    const inputParsed = parseDataUrl(inputImageDataUrl)
    if (inputParsed) {
      const inputExt = getExtensionFromMimeType(inputParsed.mimeType)
      const inputFilename = `input.${inputExt}`
      const inputPath = path.join(projectPath, inputFilename)
      const inputBuffer = Buffer.from(inputParsed.base64, 'base64')
      fs.writeFileSync(inputPath, inputBuffer)
      project.inputImagePath = inputFilename
    }
  }

  const generationId = generateGenerationId()
  const ext = getExtensionFromMimeType(mimeType)

  const imageParsed = parseDataUrl(imageDataUrl)
  if (!imageParsed) {
    throw new Error('Invalid image data URL')
  }

  const imageFilename = `${generationId}.${ext}`
  const imagePath = path.join(projectPath, imageFilename)
  const imageBuffer = Buffer.from(imageParsed.base64, 'base64')
  fs.writeFileSync(imagePath, imageBuffer)

  const promptFilename = `${generationId}_prompt.txt`
  const promptPath = path.join(projectPath, promptFilename)
  fs.writeFileSync(promptPath, usedPrompt, 'utf8')

  const originalAnalysisFilename = `${generationId}_analysis_original.json`
  const originalAnalysisPath = path.join(projectPath, originalAnalysisFilename)
  fs.writeFileSync(originalAnalysisPath, JSON.stringify(originalAnalysis, null, 2), 'utf8')

  const workingAnalysisFilename = `${generationId}_analysis_working.json`
  const workingAnalysisPath = path.join(projectPath, workingAnalysisFilename)
  fs.writeFileSync(workingAnalysisPath, JSON.stringify(workingAnalysis, null, 2), 'utf8')

  const generation: LibraryGeneration = {
    generationId,
    createdAt: new Date().toISOString(),
    substanceId: workingAnalysis.substanceId,
    dose: workingAnalysis.dose,
    model,
    imagePath: imageFilename,
    mimeType,
    usedPrompt,
    originalAnalysis,
    workingAnalysis,
  }

  project.generations.push(generation)
  upsertProject(project)

  touchProjectActivity(project.projectId)

  const updatedProject = getProject(project.projectId) || project

  const downloadUrl = `/api/library/file/${project.projectId}/${generationId}`
  const bundleUrl = `/api/library/bundle/${project.projectId}/${generationId}`

  return {
    project: updatedProject,
    generation,
    downloadUrl,
    bundleUrl,
  }
}

export function getGenerationImagePath(
  projectId: string,
  generationId: string
): string | null {
  const project = getProject(projectId)
  if (!project) {
    return null
  }

  const generation = project.generations.find((g) => g.generationId === generationId)
  if (!generation) {
    return null
  }

  const projectPath = getProjectPath(projectId)
  const imagePath = path.join(projectPath, generation.imagePath)

  if (!fs.existsSync(imagePath)) {
    return null
  }

  return imagePath
}

export function getGenerationMimeType(
  projectId: string,
  generationId: string
): string | null {
  const project = getProject(projectId)
  if (!project) {
    return null
  }

  const generation = project.generations.find((g) => g.generationId === generationId)
  return generation?.mimeType || null
}

export async function createGenerationBundle(
  projectId: string,
  generationId: string
): Promise<Buffer | null> {
  const project = getProject(projectId)
  if (!project) {
    return null
  }

  const generation = project.generations.find((g) => g.generationId === generationId)
  if (!generation) {
    return null
  }

  const projectPath = getProjectPath(projectId)

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    const archive = archiver('zip', { zlib: { level: 9 } })

    archive.on('data', (chunk: Buffer) => chunks.push(chunk))
    archive.on('end', () => resolve(Buffer.concat(chunks)))
    archive.on('error', reject)

    const imagePath = path.join(projectPath, generation.imagePath)
    if (fs.existsSync(imagePath)) {
      archive.file(imagePath, { name: generation.imagePath })
    }

    const promptPath = path.join(projectPath, `${generationId}_prompt.txt`)
    if (fs.existsSync(promptPath)) {
      archive.file(promptPath, { name: `${generationId}_prompt.txt` })
    }

    const originalAnalysisPath = path.join(projectPath, `${generationId}_analysis_original.json`)
    if (fs.existsSync(originalAnalysisPath)) {
      archive.file(originalAnalysisPath, { name: `${generationId}_analysis_original.json` })
    }

    const workingAnalysisPath = path.join(projectPath, `${generationId}_analysis_working.json`)
    if (fs.existsSync(workingAnalysisPath)) {
      archive.file(workingAnalysisPath, { name: `${generationId}_analysis_working.json` })
    }

    if (project.inputImagePath) {
      const inputPath = path.join(projectPath, project.inputImagePath)
      if (fs.existsSync(inputPath)) {
        archive.file(inputPath, { name: project.inputImagePath })
      }
    }

    const metadata = {
      projectId,
      generationId,
      createdAt: generation.createdAt,
      substanceId: generation.substanceId,
      dose: generation.dose,
      model: generation.model,
    }
    archive.append(JSON.stringify(metadata, null, 2), { name: 'metadata.json' })

    archive.finalize()
  })
}

export function deleteProject(projectId: string): boolean {
  const project = getProject(projectId)
  if (!project) {
    return false
  }

  const projectPath = getProjectPath(projectId)

  if (fs.existsSync(projectPath)) {
    fs.rmSync(projectPath, { recursive: true, force: true })
  }

  return removeProject(projectId)
}

export function projectExists(projectId: string): boolean {
  return getProject(projectId) !== null
}

export function getProjectFolderSize(projectId: string): number {
  const projectPath = getProjectPath(projectId)

  if (!fs.existsSync(projectPath)) {
    return 0
  }

  let totalSize = 0
  const files = fs.readdirSync(projectPath)

  for (const file of files) {
    const filePath = path.join(projectPath, file)
    const stats = fs.statSync(filePath)
    if (stats.isFile()) {
      totalSize += stats.size
    }
  }

  return totalSize
}
