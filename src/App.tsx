import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, Copy, FlaskConical, SlidersHorizontal, Map as MapIcon, Library as LibraryIcon, Layers } from 'lucide-react'
import type { ImageAnalysisResult } from '../shared/types/analysis'
import type { RagResult } from '../shared/types/api'
import type { SubstanceId } from '../shared/types/substances'
import { SubstanceOptions } from '../shared/types/substances'
import type { OutputSettings } from './types/settings'
import type { MapPack, MapSettings } from './types/maps'
import type { RouterSettings } from './types/router'
import { analyzeImage, generateImage } from './lib/apiClient'
import { loadOutputSettings, saveOutputSettings } from './lib/settings'
import { loadRouterSettings, saveRouterSettings } from './lib/routerSettings'
import { updateMapSettings } from './lib/mapsClient'
import { downloadDataUrl, downloadFromUrl, buildFilename } from './lib/download'
import { AppShell } from './components/layout/AppShell'
import { Card } from './components/ui/Card'
import { Panel } from './components/ui/Panel'
import { Button } from './components/ui/Button'
import { Slider } from './components/ui/Slider'
import { Select } from './components/ui/Select'
import { Badge } from './components/ui/Badge'
import { CodeBlock } from './components/ui/CodeBlock'
import { Chip } from './components/ui/Chip'
import { ImageDropzone } from './components/upload/ImageDropzone'
import { EffectsPanel } from './components/analysis/EffectsPanel'
import { PromptLabPanel } from './components/prompts/PromptLabPanel'
import { ImagePreviewCard } from './components/upload/ImagePreviewCard'
import { OutputSettingsPanel } from './components/settings/OutputSettingsPanel'
import { ProjectStatusPanel } from './components/project/ProjectStatusPanel'
import { LibraryPanel } from './components/history/LibraryPanel'
import { MapLabPanel } from './components/maps/MapLabPanel'
import { MapControlsPanel } from './components/maps/MapControlsPanel'
import { EffectRouterPanel } from './components/router/EffectRouterPanel'
import { EffectsStudioView } from './components/effectsStudio/EffectsStudioView'
import type { EffectsStudioSettings, EffectLocksById } from './components/effectsStudio/EffectsStudioView'
import { loadEffectsStudioPersisted, saveEffectsStudioPersisted } from './lib/effectsStudioStorage'
import { ModelMenuView } from './components/models/ModelMenuView'
import { loadModelSettings, saveModelSettings, type ModelSettings } from './lib/modelSettingsStorage'

function clamp01(value: number) {
  if (Number.isNaN(value)) return 0
  return Math.min(1, Math.max(0, value))
}

function format01(value: number) {
  const clamped = clamp01(value)
  return `${Math.round(clamped * 100)}%`
}

function getDoseLabel(value: number) {
  const clamped = clamp01(value)
  if (clamped < 0.3) return 'threshold'
  if (clamped < 0.7) return 'common'
  return 'strong'
}

function deepCopyAnalysis(analysis: ImageAnalysisResult): ImageAnalysisResult {
  return {
    ...analysis,
    effects: analysis.effects.map((effect) => ({
      ...effect,
      scales: effect.scales ? [...effect.scales] : undefined,
    })),
    prompts: { ...analysis.prompts },
  }
}

export default function App() {
  const [imageDataUrl, setImageDataUrl] = useState<string>('')
  const [imageName, setImageName] = useState<string>('')
  const [substanceId, setSubstanceId] = useState<SubstanceId>('lsd')
  const [dose, setDose] = useState<number>(0.45)
  const [originalAnalysis, setOriginalAnalysis] = useState<ImageAnalysisResult | null>(null)
  const [workingAnalysis, setWorkingAnalysis] = useState<ImageAnalysisResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [generatedImageDataUrl, setGeneratedImageDataUrl] = useState<string>('')
  const [usedPrompt, setUsedPrompt] = useState<string>('')
  const [ragInfo, setRagInfo] = useState<RagResult | null>(null)
  const [copiedKey, setCopiedKey] = useState<string>('')
  const copyTimeoutRef = useRef<ReturnType<typeof window.setTimeout> | null>(null)

  const [activeView, setActiveView] = useState<'lab' | 'effects' | 'maps' | 'models' | 'library'>('lab')
  const [outputSettings, setOutputSettings] = useState<OutputSettings>(() => loadOutputSettings())
  const [projectId, setProjectId] = useState<string | null>(null)
  const [projectIsSaved, setProjectIsSaved] = useState(false)
  const [projectExpiresAt, setProjectExpiresAt] = useState<string | null>(null)

  const [modelSettings, setModelSettings] = useState<ModelSettings>(() => loadModelSettings())

  // Map state
  const [mapPack, setMapPack] = useState<MapPack | null>(null)
  const [mapSettings, setMapSettings] = useState<MapSettings | null>(null)
  const [sourceHash, setSourceHash] = useState<string | null>(null)

  // Router state
  const [routerSettings, setRouterSettings] = useState<RouterSettings>(() => loadRouterSettings())

  // Effects Studio state (persisted later)
  const persistedEffectsStudio = useMemo(() => loadEffectsStudioPersisted(), [])
  const [effectsStudioSettings, setEffectsStudioSettings] = useState<EffectsStudioSettings>(() => ({
    threshold:
      typeof persistedEffectsStudio.threshold === 'number' ? persistedEffectsStudio.threshold : 0.25,
    maxEffects:
      typeof persistedEffectsStudio.maxEffects === 'number' ? persistedEffectsStudio.maxEffects : 10,
  }))
  const [effectLocksById, setEffectLocksById] = useState<EffectLocksById>(() => persistedEffectsStudio.locksById ?? {})

  useEffect(() => {
    saveOutputSettings(outputSettings)
  }, [outputSettings])

  useEffect(() => {
    saveRouterSettings(routerSettings)
  }, [routerSettings])

  useEffect(() => {
    saveModelSettings(modelSettings)
  }, [modelSettings])

  useEffect(() => {
    saveEffectsStudioPersisted({
      threshold: effectsStudioSettings.threshold,
      maxEffects: effectsStudioSettings.maxEffects,
      locksById: effectLocksById,
    })
  }, [effectLocksById, effectsStudioSettings.maxEffects, effectsStudioSettings.threshold])

  const canAnalyze = imageDataUrl.trim().length > 0 && !isAnalyzing
  const canReset =
    !isAnalyzing &&
    !isGenerating &&
    (imageDataUrl.trim().length > 0 || workingAnalysis !== null || generatedImageDataUrl.trim().length > 0)

  const substanceMeta = useMemo(
    () => SubstanceOptions.find((s) => s.id === substanceId),
    [substanceId],
  )

  function resetSession() {
    if (copyTimeoutRef.current) window.clearTimeout(copyTimeoutRef.current)
    setErrorMessage('')
    setImageDataUrl('')
    setImageName('')
    setOriginalAnalysis(null)
    setWorkingAnalysis(null)
    setGeneratedImageDataUrl('')
    setUsedPrompt('')
    setRagInfo(null)
    setCopiedKey('')
    setProjectId(null)
    setProjectIsSaved(false)
    setProjectExpiresAt(null)
    // Reset map state
    setMapPack(null)
    setMapSettings(null)
    setSourceHash(null)
  }

  async function onPickFile(file: File) {
    setErrorMessage('')
    setOriginalAnalysis(null)
    setWorkingAnalysis(null)
    setGeneratedImageDataUrl('')
    setUsedPrompt('')
    setRagInfo(null)
    setImageName(file.name)
    // Reset map state for new image
    setMapPack(null)
    setMapSettings(null)
    setSourceHash(null)

    const reader = new FileReader()
    const dataUrl = await new Promise<string>((resolve, reject) => {
      reader.onerror = () => reject(new Error('Failed to read the image'))
      reader.onload = () => resolve(String(reader.result))
      reader.readAsDataURL(file)
    })

    setImageDataUrl(dataUrl)
  }

  async function runAnalysis(alsoGenerate: boolean) {
    if (!canAnalyze) return

    setErrorMessage('')
    setIsAnalyzing(true)
    setIsGenerating(false)
    setGeneratedImageDataUrl('')
    setUsedPrompt('')
    setRagInfo(null)

    try {
      const result = await analyzeImage({
        imageDataUrl,
        substanceId,
        dose: clamp01(dose),
        analysisModelId: modelSettings.analysisModelId,
        rag: outputSettings.ragAnalysisEnabled
          ? {
              enabled: true,
              query: outputSettings.ragAnalysisQuery,
              draftModelId: modelSettings.ragDraftModelId,
              finalModelId: modelSettings.ragFinalModelId,
              mode: outputSettings.ragAnalysisMode,
            }
          : undefined,
      })

      setOriginalAnalysis(result)
      setWorkingAnalysis(deepCopyAnalysis(result))

      if (alsoGenerate) {
        await runGeneration(result)
      }
    } catch (err) {
      console.error('[analyze]', err)
      const message = err instanceof Error ? err.message : 'Unexpected error'
      setErrorMessage(message)
    } finally {
      setIsAnalyzing(false)
    }
  }

  async function runGeneration(analysisResult: ImageAnalysisResult) {
    setIsGenerating(true)
    try {
      const result = await generateImage({
        imageDataUrl,
        analysis: analysisResult,
        projectId: projectId || undefined,
        originalAnalysis: originalAnalysis || undefined,
        saveToLibrary: outputSettings.autoSaveToLibrary,
        analysisModelId: modelSettings.analysisModelId,
        generationModelId: modelSettings.generationModelId,
        rag: outputSettings.ragEnabled
          ? {
              enabled: true,
              query:
                outputSettings.ragQuery.trim().length > 0
                  ? outputSettings.ragQuery
                  : outputSettings.ragAnalysisQuery.trim().length > 0
                    ? outputSettings.ragAnalysisQuery
                    : analysisResult.rag?.query,
              draftModelId: modelSettings.ragDraftModelId,
              finalModelId: modelSettings.ragFinalModelId,
            }
          : undefined,
        // Pass map support fields
        generationMode: outputSettings.generationMode,
        mapSourceHash: sourceHash || undefined,
        // Pass router settings for effect placement control
        routerSettings,
        // Effects Studio selection controls (threshold + cap)
        effectsStudioSettings: effectsStudioSettings,
      })

      setGeneratedImageDataUrl(result.imageDataUrl)
      setUsedPrompt(result.usedPrompt)
      setRagInfo(result.rag ?? null)

      if (result.projectId) {
        setProjectId(result.projectId)
        setProjectIsSaved(result.isSaved ?? false)
        setProjectExpiresAt(result.expiresAt ?? null)
      }

      if (outputSettings.autoDownloadMode === 'image') {
        const ext = result.mimeType.split('/')[1] || 'png'
        const filename = buildFilename(analysisResult.substanceId, analysisResult.dose, ext)
        downloadDataUrl(result.imageDataUrl, filename)
      } else if (outputSettings.autoDownloadMode === 'bundle' && result.bundleUrl) {
        const filename = buildFilename(analysisResult.substanceId, analysisResult.dose, 'zip')
        await downloadFromUrl(result.bundleUrl, filename)
      }
    } catch (err) {
      console.error('[generate]', err)
      const message = err instanceof Error ? err.message : 'Unexpected error'
      setErrorMessage(message)
    } finally {
      setIsGenerating(false)
    }
  }

  async function copyText(key: string, text: string) {
    try {
      if (copyTimeoutRef.current) window.clearTimeout(copyTimeoutRef.current)

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text)
      } else {
        const el = document.createElement('textarea')
        el.value = text
        el.style.position = 'fixed'
        el.style.left = '0'
        el.style.top = '0'
        el.style.opacity = '0'
        document.body.appendChild(el)
        el.focus()
        el.select()
        document.execCommand('copy')
        document.body.removeChild(el)
      }

      setCopiedKey(key)
      copyTimeoutRef.current = window.setTimeout(() => setCopiedKey(''), 900)
    } catch {
      setErrorMessage('Copy failed')
    }
  }

  function handleResetEffects() {
    if (!originalAnalysis) return
    setWorkingAnalysis(deepCopyAnalysis(originalAnalysis))
  }

  function handleMapPackReady(pack: MapPack, settings: MapSettings, hash: string) {
    setMapPack(pack)
    setMapSettings(settings)
    setSourceHash(hash)
  }

  async function handleMapSettingsChange(
    changes: Partial<Omit<MapSettings, 'sourceHash' | 'updatedAt'>>
  ) {
    if (!sourceHash || !mapSettings) return

    // Optimistic update
    const updated = { ...mapSettings, ...changes }
    setMapSettings(updated)

    // Persist to server
    try {
      await updateMapSettings(sourceHash, changes)
    } catch (err) {
      console.error('[maps] Failed to save settings:', err)
    }
  }

  return (
    <AppShell
      left={
        <Panel className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-lg font-semibold tracking-tight">
                Psychedelic Visual Replicasion Lab
              </div>
              <div className="mt-1 text-sm text-white/70">
                Upload an image, map it to trip visuals, then generate a new variant.
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              className="h-8 px-3 py-1 text-xs"
              onClick={resetSession}
              disabled={!canReset}
            >
              Reset
            </Button>
          </div>

          <div className="mt-4 grid gap-2">
            <Button
              type="button"
              variant={activeView === 'lab' ? 'secondary' : 'ghost'}
              className="h-10 justify-start px-3 py-2 text-sm"
              onClick={() => setActiveView('lab')}
            >
              <FlaskConical size={16} />
              Lab
            </Button>
            <Button
              type="button"
              variant={activeView === 'models' ? 'secondary' : 'ghost'}
              className="h-10 justify-start px-3 py-2 text-sm"
              onClick={() => setActiveView('models')}
            >
              <Layers size={16} />
              Models
            </Button>
            <Button
              type="button"
              variant={activeView === 'effects' ? 'secondary' : 'ghost'}
              className="h-10 justify-start px-3 py-2 text-sm"
              onClick={() => setActiveView('effects')}
            >
              <SlidersHorizontal size={16} />
              Effects Studio
            </Button>
            <Button
              type="button"
              variant={activeView === 'maps' ? 'secondary' : 'ghost'}
              className="h-10 justify-start px-3 py-2 text-sm"
              onClick={() => setActiveView('maps')}
            >
              <MapIcon size={16} />
              Maps
            </Button>
            <Button
              type="button"
              variant={activeView === 'library' ? 'secondary' : 'ghost'}
              className="h-10 justify-start px-3 py-2 text-sm"
              onClick={() => setActiveView('library')}
            >
              <LibraryIcon size={16} />
              Library
            </Button>
          </div>

          <div className="mt-5 grid gap-4">
            <ImageDropzone
              imageName={imageName}
              imageDataUrl={imageDataUrl}
              onPickFile={(file) => void onPickFile(file)}
            />

            <div className="grid gap-2">
              <div className="text-sm text-white/80">Substance</div>
              <Select
                value={substanceId}
                onChange={(e) => setSubstanceId(e.target.value as SubstanceId)}
              >
                {SubstanceOptions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </Select>
              {substanceMeta ? (
                <div className="text-xs text-white/60">{substanceMeta.description}</div>
              ) : null}
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <div className="text-sm text-white/80">Dose intensity</div>
                <div className="text-xs text-white/70">
                  {getDoseLabel(dose)} · {format01(dose)}
                </div>
              </div>
              <Slider value={dose} onChange={setDose} min={0} max={1} step={0.01} />
            </div>

            <div className="grid gap-3 pt-2">
              <Button
                onClick={() => void runAnalysis(false)}
                disabled={!canAnalyze}
              >
                {isAnalyzing ? 'Analyzing' : 'Analyze image'}
              </Button>
              <Button
                variant="secondary"
                onClick={() => void runAnalysis(true)}
                disabled={!canAnalyze || isGenerating}
              >
                {isGenerating ? 'Generating' : 'Analyze and generate'}
              </Button>
              {errorMessage ? (
                <div className="rounded-xl2 border border-glass-border bg-white/5 p-3 text-sm text-white/80">
                  {errorMessage}
                </div>
              ) : null}
            </div>

            {projectId && (
              <ProjectStatusPanel
                projectId={projectId}
                isSaved={projectIsSaved}
                expiresAt={projectExpiresAt}
                onSaveChange={(isSaved, expiresAt) => {
                  setProjectIsSaved(isSaved)
                  setProjectExpiresAt(expiresAt)
                }}
              />
            )}

            <OutputSettingsPanel
              settings={outputSettings}
              onChange={setOutputSettings}
            />
          </div>
        </Panel>
      }
      right={
        activeView === 'library' ? (
          <LibraryPanel />
        ) : activeView === 'models' ? (
          <ModelMenuView
            settings={modelSettings}
            onChangeSettings={setModelSettings}
          />
        ) : activeView === 'effects' ? (
          <EffectsStudioView
            analysis={workingAnalysis}
            originalAnalysis={originalAnalysis}
            settings={effectsStudioSettings}
            locksById={effectLocksById}
            onChangeSettings={setEffectsStudioSettings}
            onChangeLocks={setEffectLocksById}
            onChangeAnalysis={(next) => setWorkingAnalysis(next)}
            onResetToOriginal={handleResetEffects}
            isGenerating={isGenerating}
            onGenerate={() => {
              if (!workingAnalysis) return
              void runGeneration(workingAnalysis)
            }}
          />
        ) : activeView === 'maps' ? (
          <div className="grid gap-6">
            {imageDataUrl ? (
              <ImagePreviewCard
                originalImageDataUrl={imageDataUrl}
                generatedImageDataUrl={generatedImageDataUrl || undefined}
              />
            ) : null}

            {imageDataUrl ? (
              <MapLabPanel
                imageDataUrl={imageDataUrl}
                onMapPackReady={handleMapPackReady}
                mapsModelId={modelSettings.mapsModelId}
              />
            ) : (
              <Panel className="p-6">
                <div className="text-sm text-white/70">
                  Upload an image to generate depth, edge, and protection maps.
                </div>
              </Panel>
            )}

            {mapPack && mapSettings && (
              <MapControlsPanel
                mapPack={mapPack}
                settings={mapSettings}
                onChange={handleMapSettingsChange}
              />
            )}

            {imageDataUrl && (
              <EffectRouterPanel
                settings={routerSettings}
                onChange={setRouterSettings}
                mapPack={mapPack}
                analysis={workingAnalysis}
              />
            )}
          </div>
        ) : (
          <div className="grid gap-6">
            {imageDataUrl ? (
              <ImagePreviewCard
                originalImageDataUrl={imageDataUrl}
                generatedImageDataUrl={generatedImageDataUrl || undefined}
              />
            ) : null}

            {!workingAnalysis ? (
              <>
                <Panel className="p-6">
                  <div className="text-sm text-white/70">
                    Run an analysis to see structured findings, effect mapping, and ready prompts.
                  </div>
                </Panel>
                <PromptLabPanel analysis={workingAnalysis} generationModelId={modelSettings.generationModelId} />
              </>
            ) : (
              <div className="grid gap-6">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>{workingAnalysis.substanceId}</Badge>
                  <Chip className="text-white/85">{getDoseLabel(workingAnalysis.dose)} dose</Chip>
                  <Chip className="text-white/70">{format01(workingAnalysis.dose)}</Chip>
                </div>

                <Card className="p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold">Base scene</div>
                      <div className="mt-1 text-xs text-white/70">
                        Sober description plus a short cinematic line
                      </div>
                    </div>
                    <Badge>Analysis</Badge>
                  </div>

                  <div className="mt-3 text-sm text-white/85">{workingAnalysis.baseSceneDescription}</div>
                  <div className="mt-3 rounded-xl2 border border-glass-border bg-white/5 p-3 text-sm text-white/80">
                    {workingAnalysis.prompts.shortCinematicDescription}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {workingAnalysis.geometrySummary ? <Chip>{workingAnalysis.geometrySummary}</Chip> : null}
                    {workingAnalysis.distortionSummary ? <Chip>{workingAnalysis.distortionSummary}</Chip> : null}
                    {workingAnalysis.hallucinationSummary ? <Chip>{workingAnalysis.hallucinationSummary}</Chip> : null}
                  </div>
                </Card>

                <EffectsPanel analysis={workingAnalysis} />

                <Card className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold">Fine-tune effects</div>
                      <div className="mt-1 text-xs text-white/70">
                        Open Effects Studio to lock, preset, and edit the full mix.
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      className="h-9 px-3 py-2 text-xs"
                      onClick={() => setActiveView('effects')}
                    >
                      Open Studio
                    </Button>
                  </div>
                </Card>

                <div className="grid grid-cols-2 gap-6">
                  <div className="grid gap-6">
                    <Card className="p-5">
                      <div className="text-sm font-semibold">Ready to paste prompts</div>
                      <div className="mt-3 grid gap-3">
                        <div>
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-xs text-white/70">OpenAI image prompt</div>
                            <Button
                              type="button"
                              variant="ghost"
                              className="h-8 px-2 py-1 text-xs"
                              onClick={() =>
                                void copyText('openai', workingAnalysis.prompts.openAIImagePrompt)
                              }
                            >
                              {copiedKey === 'openai' ? (
                                <Check size={14} />
                              ) : (
                                <Copy size={14} />
                              )}
                              {copiedKey === 'openai' ? 'Copied' : 'Copy'}
                            </Button>
                          </div>
                          <textarea
                            className="mt-1 min-h-[120px] w-full resize-y rounded-xl2 border border-glass-border bg-black/20 px-3 py-2 text-xs text-white/90 outline-none focus:ring-2 focus:ring-accent-teal/40"
                            value={workingAnalysis.prompts.openAIImagePrompt}
                            readOnly
                          />
                        </div>
                        <div>
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-xs text-white/70">Short cinematic description</div>
                            <Button
                              type="button"
                              variant="ghost"
                              className="h-8 px-2 py-1 text-xs"
                              onClick={() =>
                                void copyText(
                                  'cinematic',
                                  workingAnalysis.prompts.shortCinematicDescription,
                                )
                              }
                            >
                              {copiedKey === 'cinematic' ? (
                                <Check size={14} />
                              ) : (
                                <Copy size={14} />
                              )}
                              {copiedKey === 'cinematic' ? 'Copied' : 'Copy'}
                            </Button>
                          </div>
                          <textarea
                            className="mt-1 min-h-[140px] w-full resize-y rounded-xl2 border border-glass-border bg-black/20 px-3 py-2 text-xs text-white/90 outline-none focus:ring-2 focus:ring-accent-teal/40"
                            value={workingAnalysis.prompts.shortCinematicDescription}
                            readOnly
                          />
                        </div>

                        {usedPrompt ? (
                          <div className="border-t border-glass-border pt-3">
                            <div className="flex items-center justify-between gap-3">
                              <div className="text-xs text-white/70">Used prompt</div>
                              <Button
                                type="button"
                                variant="ghost"
                                className="h-8 px-2 py-1 text-xs"
                                onClick={() => void copyText('usedPrompt', usedPrompt)}
                              >
                                {copiedKey === 'usedPrompt' ? (
                                  <Check size={14} />
                                ) : (
                                  <Copy size={14} />
                                )}
                                {copiedKey === 'usedPrompt' ? 'Copied' : 'Copy'}
                              </Button>
                            </div>
                            <div className="mt-2">
                              <CodeBlock className="max-h-[260px]">{usedPrompt}</CodeBlock>
                            </div>

                            {outputSettings.ragEnabled ? (
                              ragInfo?.enabled && ragInfo.finalText ? (
                                <div className="mt-3 rounded-xl2 border border-glass-border bg-white/5 p-3">
                                  <div className="text-[11px] font-medium text-white/80">
                                    RAG augmentation (final)
                                  </div>
                                  <div className="mt-2">
                                    <CodeBlock className="max-h-[220px]">{ragInfo.finalText}</CodeBlock>
                                  </div>
                                </div>
                              ) : (
                                <div className="mt-3 text-[11px] text-white/50">
                                  RAG is enabled locally, but the server did not return augmentation output. Ensure
                                  `RAG_ENABLED=true` and you have run `npm run rag:ingest`.
                                </div>
                              )
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    </Card>

                    <PromptLabPanel
                      analysis={workingAnalysis}
                      effectsStudioSettings={effectsStudioSettings}
                      generationModelId={modelSettings.generationModelId}
                    />
                  </div>

                  <Card className="p-5">
                    <details className="group">
                      <summary className="cursor-pointer select-none text-sm font-semibold">
                        Debug view
                      </summary>
                      <div className="mt-3">
                        <CodeBlock>{JSON.stringify(workingAnalysis, null, 2)}</CodeBlock>
                      </div>
                    </details>
                  </Card>
                </div>
              </div>
            )}
          </div>
        )
      }
    />
  )
}
