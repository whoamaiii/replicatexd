import type { OutputSettings, AutoDownloadMode } from '../../types/settings'
import { Card } from '../ui/Card'

export function OutputSettingsPanel(props: {
  settings: OutputSettings
  onChange: (settings: OutputSettings) => void
}) {
  const { settings, onChange } = props

  return (
    <Card className="p-4">
      <div className="text-sm font-semibold text-white/90">Output Settings</div>

      <div className="mt-4 grid gap-4">
        <div className="grid gap-2">
          <label className="text-xs text-white/70" htmlFor="autoDownloadMode">
            Auto download after generation
          </label>
          <select
            id="autoDownloadMode"
            value={settings.autoDownloadMode}
            onChange={(e) =>
              onChange({
                ...settings,
                autoDownloadMode: e.target.value as AutoDownloadMode,
              })
            }
            className="h-9 rounded-lg border border-glass-border bg-glass-panel/50 px-3 text-sm text-white/90 outline-none focus:border-white/30"
          >
            <option value="off">Off</option>
            <option value="image">Image only</option>
            <option value="bundle">Full bundle (image + metadata)</option>
          </select>
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.autoSaveToLibrary}
            onChange={(e) =>
              onChange({
                ...settings,
                autoSaveToLibrary: e.target.checked,
              })
            }
            className="h-4 w-4 rounded border-glass-border bg-glass-panel/50 text-violet-500 focus:ring-violet-500/50"
          />
          <span className="text-xs text-white/70">Save to server library</span>
        </label>
      </div>
    </Card>
  )
}
