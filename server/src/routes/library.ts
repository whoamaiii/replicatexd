import { Router } from 'express'
import { z } from 'zod'
import {
  listProjects,
  getProject,
  markProjectSaved,
} from '../services/libraryIndex'
import {
  getGenerationImagePath,
  getGenerationMimeType,
  createGenerationBundle,
  deleteProject,
} from '../services/libraryService'
import type { LibraryListResponse, SaveProjectRequest } from '../../../shared/types/library'
import { validateId, sanitizeFilename } from '../utils/validation'

export const libraryRouter = Router()

const SaveProjectRequestSchema = z.object({
  isSaved: z.boolean(),
})

libraryRouter.get('/projects', async (_req, res) => {
  try {
    const projects = listProjects()
    const response: LibraryListResponse = {
      projects,
      total: projects.length,
    }
    res.json(response)
  } catch (error) {
    console.error('[Library] Error listing projects:', error)
    res.status(500).json({ message: 'Failed to list projects' })
  }
})

libraryRouter.get('/projects/:projectId', async (req, res) => {
  try {
    const projectId = validateId(req.params.projectId, 'projectId')
    const project = getProject(projectId)

    if (!project) {
      res.status(404).json({ message: 'Project not found' })
      return
    }

    res.json(project)
  } catch (error) {
    if (error instanceof Error && error.message.includes('Invalid')) {
      res.status(400).json({ message: error.message })
      return
    }
    console.error('[Library] Error getting project:', error)
    res.status(500).json({ message: 'Failed to get project' })
  }
})

libraryRouter.post('/projects/:projectId/save', async (req, res) => {
  try {
    const projectId = validateId(req.params.projectId, 'projectId')
    const parsed = SaveProjectRequestSchema.safeParse(req.body)

    if (!parsed.success) {
      res.status(400).json({
        message: 'Invalid request body',
        errors: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
      })
      return
    }

    const { isSaved } = parsed.data as SaveProjectRequest
    const project = markProjectSaved(projectId, isSaved)

    if (!project) {
      res.status(404).json({ message: 'Project not found' })
      return
    }

    res.json(project)
  } catch (error) {
    if (error instanceof Error && error.message.includes('Invalid')) {
      res.status(400).json({ message: error.message })
      return
    }
    console.error('[Library] Error saving project:', error)
    res.status(500).json({ message: 'Failed to save project' })
  }
})

libraryRouter.delete('/projects/:projectId', async (req, res) => {
  try {
    const projectId = validateId(req.params.projectId, 'projectId')
    const deleted = deleteProject(projectId)

    if (!deleted) {
      res.status(404).json({ message: 'Project not found' })
      return
    }

    res.json({ deleted: true })
  } catch (error) {
    if (error instanceof Error && error.message.includes('Invalid')) {
      res.status(400).json({ message: error.message })
      return
    }
    console.error('[Library] Error deleting project:', error)
    res.status(500).json({ message: 'Failed to delete project' })
  }
})

libraryRouter.get('/file/:projectId/:generationId', async (req, res) => {
  try {
    const projectId = validateId(req.params.projectId, 'projectId')
    const generationId = validateId(req.params.generationId, 'generationId')
    const imagePath = getGenerationImagePath(projectId, generationId)

    if (!imagePath) {
      res.status(404).json({ message: 'File not found' })
      return
    }

    const mimeType = getGenerationMimeType(projectId, generationId) || 'image/png'
    const fileExt = mimeType.split('/')[1] || 'png'
    const filename = sanitizeFilename(`psyvis_${generationId}.${fileExt}`)

    res.setHeader('Content-Type', mimeType)
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.sendFile(imagePath)
  } catch (error) {
    if (error instanceof Error && error.message.includes('Invalid')) {
      res.status(400).json({ message: error.message })
      return
    }
    console.error('[Library] Error serving file:', error)
    res.status(500).json({ message: 'Failed to serve file' })
  }
})

libraryRouter.get('/bundle/:projectId/:generationId', async (req, res) => {
  try {
    const projectId = validateId(req.params.projectId, 'projectId')
    const generationId = validateId(req.params.generationId, 'generationId')
    const bundle = await createGenerationBundle(projectId, generationId)

    if (!bundle) {
      res.status(404).json({ message: 'Generation not found' })
      return
    }

    const filename = sanitizeFilename(`psyvis_${generationId}.zip`)
    res.setHeader('Content-Type', 'application/zip')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.send(bundle)
  } catch (error) {
    if (error instanceof Error && error.message.includes('Invalid')) {
      res.status(400).json({ message: error.message })
      return
    }
    console.error('[Library] Error creating bundle:', error)
    res.status(500).json({ message: 'Failed to create bundle' })
  }
})
