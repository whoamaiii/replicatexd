import { useState, useEffect } from 'react'
import type { LibraryProjectSummary, LibraryProject } from '../../../shared/types/library'
import {
  fetchLibraryProjects,
  fetchLibraryProject,
  saveProject,
  getLibraryFileUrl,
  getLibraryBundleUrl,
} from '../../lib/apiClient'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Panel } from '../ui/Panel'

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleString()
}

function formatDose(dose: number): string {
  return `${Math.round(dose * 100)}%`
}

function formatTimeRemaining(expiresAt: string | null): string {
  if (!expiresAt) return ''

  const now = new Date()
  const expires = new Date(expiresAt)
  const diffMs = expires.getTime() - now.getTime()

  if (diffMs <= 0) return 'Expiring soon'

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHours / 24)

  if (diffDays > 0) {
    return `${diffDays}d remaining`
  }
  return `${diffHours}h remaining`
}

export function LibraryPanel() {
  const [projects, setProjects] = useState<LibraryProjectSummary[]>([])
  const [selectedProject, setSelectedProject] = useState<LibraryProject | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    loadProjects()
  }, [])

  async function loadProjects() {
    setIsLoading(true)
    setError('')
    try {
      const result = await fetchLibraryProjects()
      setProjects(result.projects)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load library')
    } finally {
      setIsLoading(false)
    }
  }

  async function viewProject(projectId: string) {
    setIsLoading(true)
    setError('')
    try {
      const project = await fetchLibraryProject(projectId)
      setSelectedProject(project)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load project')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleToggleSave(projectId: string, currentlySaved: boolean) {
    try {
      const result = await saveProject(projectId, !currentlySaved)
      setProjects((prev) =>
        prev.map((p) =>
          p.projectId === projectId
            ? { ...p, isSaved: result.isSaved, expiresAt: result.expiresAt }
            : p
        )
      )
      if (selectedProject?.projectId === projectId) {
        setSelectedProject(result)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update project')
    }
  }

  if (selectedProject) {
    return (
      <Panel className="p-5">
        <div className="flex items-center justify-between gap-4">
          <Button variant="ghost" onClick={() => setSelectedProject(null)}>
            Back to list
          </Button>
          <div className="flex items-center gap-2">
            <div
              className={`h-2 w-2 rounded-full ${
                selectedProject.isSaved ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
            />
            <span className="text-xs text-white/70">
              {selectedProject.isSaved ? 'Saved' : 'Temporary'}
            </span>
          </div>
        </div>

        <div className="mt-4 text-xs text-white/60">
          Created: {formatDate(selectedProject.createdAt)}
        </div>
        <div className="text-xs text-white/60">
          Last activity: {formatDate(selectedProject.lastActivityAt)}
        </div>

        <div className="mt-4 text-sm font-semibold text-white/90">
          Generations ({selectedProject.generations.length})
        </div>

        <div className="mt-3 grid gap-3 max-h-[500px] overflow-y-auto">
          {selectedProject.generations.map((gen) => (
            <Card key={gen.generationId} className="p-4">
              <div className="flex items-start gap-4">
                <img
                  src={getLibraryFileUrl(selectedProject.projectId, gen.generationId)}
                  alt="Generated"
                  className="w-24 h-24 object-cover rounded-lg border border-glass-border"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-violet-500/20 text-violet-300">
                      {gen.substanceId}
                    </span>
                    <span className="text-xs text-white/60">
                      {formatDose(gen.dose)}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-white/50">
                    {formatDate(gen.createdAt)}
                  </div>
                  <div className="mt-2 text-xs text-white/40 truncate">
                    {gen.generationModelName || gen.generationModelId || gen.model}
                  </div>
                  {gen.analysisModelName || gen.analysisModelId ? (
                    <div className="mt-1 text-[10px] text-white/35 truncate">
                      Analysis: {gen.analysisModelName || gen.analysisModelId}
                    </div>
                  ) : null}
                  <div className="mt-3 flex items-center gap-2">
                    <a
                      href={getLibraryFileUrl(selectedProject.projectId, gen.generationId)}
                      download
                      className="inline-flex h-7 px-2 items-center gap-1 rounded-md bg-white/10 hover:bg-white/20 text-xs text-white/80"
                    >
                      Image
                    </a>
                    <a
                      href={getLibraryBundleUrl(selectedProject.projectId, gen.generationId)}
                      download
                      className="inline-flex h-7 px-2 items-center gap-1 rounded-md bg-white/10 hover:bg-white/20 text-xs text-white/80"
                    >
                      Bundle
                    </a>
                  </div>
                </div>
              </div>

              <details className="mt-3">
                <summary className="text-xs text-white/50 cursor-pointer hover:text-white/70">
                  View prompt
                </summary>
                <pre className="mt-2 p-3 rounded-lg bg-black/30 text-xs text-white/70 whitespace-pre-wrap overflow-auto max-h-[200px]">
                  {gen.usedPrompt}
                </pre>
              </details>
            </Card>
          ))}
        </div>
      </Panel>
    )
  }

  return (
    <Panel className="p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-lg font-semibold text-white/90">Library</div>
          <div className="mt-1 text-sm text-white/60">
            {projects.length} project{projects.length !== 1 ? 's' : ''}
          </div>
        </div>
        <Button variant="ghost" onClick={loadProjects} disabled={isLoading}>
          {isLoading ? 'Loading...' : 'Refresh'}
        </Button>
      </div>

      {error && <div className="mt-4 text-sm text-red-400">{error}</div>}

      {projects.length === 0 && !isLoading && !error && (
        <div className="mt-8 text-center text-sm text-white/50">
          No projects yet. Generate an image to create your first project.
        </div>
      )}

      <div className="mt-4 grid gap-3 max-h-[600px] overflow-y-auto">
        {projects.map((project) => (
          <Card key={project.projectId} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div
                    className={`h-2 w-2 rounded-full ${
                      project.isSaved ? 'bg-emerald-400' : 'bg-amber-400'
                    }`}
                  />
                  {project.latestSubstanceId && (
                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-violet-500/20 text-violet-300">
                      {project.latestSubstanceId}
                    </span>
                  )}
                  {project.latestDose !== undefined && (
                    <span className="text-xs text-white/60">
                      {formatDose(project.latestDose)}
                    </span>
                  )}
                </div>

                <div className="mt-2 text-xs text-white/50">
                  {project.generationCount} generation
                  {project.generationCount !== 1 ? 's' : ''}
                </div>

                <div className="mt-1 text-xs text-white/40">
                  Last activity: {formatDate(project.lastActivityAt)}
                </div>

                {!project.isSaved && project.expiresAt && (
                  <div className="mt-1 text-xs text-amber-400/80">
                    {formatTimeRemaining(project.expiresAt)}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  variant="ghost"
                  className="h-8 px-3 text-xs"
                  onClick={() => viewProject(project.projectId)}
                >
                  View
                </Button>
                <Button
                  variant="ghost"
                  className="h-8 px-3 text-xs"
                  onClick={() => handleToggleSave(project.projectId, project.isSaved)}
                >
                  {project.isSaved ? 'Unsave' : 'Save'}
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </Panel>
  )
}
