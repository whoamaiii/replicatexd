import { useState } from 'react'
import { saveProject } from '../../lib/apiClient'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'

function formatTimeRemaining(expiresAt: string | null | undefined): string {
  if (!expiresAt) return ''

  const now = new Date()
  const expires = new Date(expiresAt)
  const diffMs = expires.getTime() - now.getTime()

  if (diffMs <= 0) return 'Expiring soon'

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHours / 24)
  const remainingHours = diffHours % 24

  if (diffDays > 0) {
    return `${diffDays}d ${remainingHours}h remaining`
  }
  return `${diffHours}h remaining`
}

export function ProjectStatusPanel(props: {
  projectId: string
  isSaved: boolean
  expiresAt: string | null | undefined
  onSaveChange: (isSaved: boolean, expiresAt: string | null) => void
}) {
  const { projectId, isSaved, expiresAt, onSaveChange } = props
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')

  async function handleToggleSave() {
    setIsLoading(true)
    setError('')
    try {
      const newSaveState = !isSaved
      const result = await saveProject(projectId, newSaveState)
      onSaveChange(result.isSaved, result.expiresAt)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update project')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div
            className={`h-2 w-2 rounded-full ${
              isSaved ? 'bg-emerald-400' : 'bg-amber-400'
            }`}
          />
          <span className="text-sm font-medium text-white/90">
            {isSaved ? 'Saved' : 'Temporary'}
          </span>
          {!isSaved && expiresAt && (
            <span className="text-xs text-white/50">
              ({formatTimeRemaining(expiresAt)})
            </span>
          )}
        </div>

        <Button
          variant="secondary"
          onClick={handleToggleSave}
          disabled={isLoading}
          className="h-8 px-3 text-xs"
        >
          {isLoading ? 'Saving...' : isSaved ? 'Make Temporary' : 'Save Project'}
        </Button>
      </div>

      {error && (
        <div className="mt-2 text-xs text-red-400">{error}</div>
      )}

      <div className="mt-2 text-xs text-white/40 truncate">
        Project: {projectId.slice(0, 8)}...
      </div>
    </Card>
  )
}
