import { useMemo, useRef, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import type { ImageAnalysisResult } from '../shared/types/analysis'
import type { SubstanceId } from '../shared/types/substances'
import { SubstanceOptions } from '../shared/types/substances'
import { analyzeImage, generateImage } from './lib/apiClient'
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

export default function App() {
  const [imageDataUrl, setImageDataUrl] = useState<string>('')
  const [imageName, setImageName] = useState<string>('')
  const [substanceId, setSubstanceId] = useState<SubstanceId>('lsd')
  const [dose, setDose] = useState<number>(0.45)
  const [analysis, setAnalysis] = useState<ImageAnalysisResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [generatedImageDataUrl, setGeneratedImageDataUrl] = useState<string>('')
  const [usedPrompt, setUsedPrompt] = useState<string>('')
  const [copiedKey, setCopiedKey] = useState<string>('')
  const copyTimeoutRef = useRef<ReturnType<typeof window.setTimeout> | null>(null)

  const canAnalyze = imageDataUrl.trim().length > 0 && !isAnalyzing
  const canReset =
    !isAnalyzing &&
    !isGenerating &&
    (imageDataUrl.trim().length > 0 || analysis !== null || generatedImageDataUrl.trim().length > 0)

  const substanceMeta = useMemo(
    () => SubstanceOptions.find((s) => s.id === substanceId),
    [substanceId],
  )

  function resetSession() {
    if (copyTimeoutRef.current) window.clearTimeout(copyTimeoutRef.current)
    setErrorMessage('')
    setImageDataUrl('')
    setImageName('')
    setAnalysis(null)
    setGeneratedImageDataUrl('')
    setUsedPrompt('')
    setCopiedKey('')
  }

  async function onPickFile(file: File) {
    setErrorMessage('')
    setAnalysis(null)
    setGeneratedImageDataUrl('')
    setUsedPrompt('')
    setImageName(file.name)

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

    try {
      const result = await analyzeImage({
        imageDataUrl,
        substanceId,
        dose: clamp01(dose),
      })

      setAnalysis(result)

      if (alsoGenerate) {
        await runGeneration(result)
      }
    } catch (err) {
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
      })

      setGeneratedImageDataUrl(result.imageDataUrl)
      setUsedPrompt(result.usedPrompt)
    } catch (err) {
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
            <div className="flex items-center gap-2">
              <Badge>Lab</Badge>
              <Button
                type="button"
                variant="ghost"
                className="h-8 px-3 py-1 text-xs"
                onClick={resetSession}
                disabled={!canReset}
              >
                Reset session
              </Button>
            </div>
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
          </div>
        </Panel>
      }
      right={
        <div className="grid gap-6">
          {!analysis ? (
            <>
              <Panel className="p-6">
                <div className="text-sm text-white/70">
                  Run an analysis to see structured findings, effect mapping, and ready prompts.
                </div>
              </Panel>
              <PromptLabPanel analysis={analysis} />
            </>
          ) : (
            <div className="grid gap-6">
              <div className="flex flex-wrap items-center gap-2">
                <Badge>{analysis.substanceId}</Badge>
                <Chip className="text-white/85">{getDoseLabel(analysis.dose)} dose</Chip>
                <Chip className="text-white/70">{format01(analysis.dose)}</Chip>
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

                <div className="mt-3 text-sm text-white/85">{analysis.baseSceneDescription}</div>
                <div className="mt-3 rounded-xl2 border border-glass-border bg-white/5 p-3 text-sm text-white/80">
                  {analysis.prompts.shortCinematicDescription}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {analysis.geometrySummary ? <Chip>{analysis.geometrySummary}</Chip> : null}
                  {analysis.distortionSummary ? <Chip>{analysis.distortionSummary}</Chip> : null}
                  {analysis.hallucinationSummary ? <Chip>{analysis.hallucinationSummary}</Chip> : null}
                </div>
              </Card>

              <EffectsPanel analysis={analysis} />

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
                              void copyText('openai', analysis.prompts.openAIImagePrompt)
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
                          value={analysis.prompts.openAIImagePrompt}
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
                                analysis.prompts.shortCinematicDescription,
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
                          value={analysis.prompts.shortCinematicDescription}
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
                        </div>
                      ) : null}
                    </div>
                  </Card>

                  <PromptLabPanel analysis={analysis} />
                </div>

                <Card className="p-5">
                  <details className="group">
                    <summary className="cursor-pointer select-none text-sm font-semibold">
                      Debug view
                    </summary>
                    <div className="mt-3">
                      <CodeBlock>{JSON.stringify(analysis, null, 2)}</CodeBlock>
                    </div>
                  </details>
                </Card>
              </div>

              {generatedImageDataUrl ? (
                <Card className="p-5">
                  <div className="text-sm font-semibold">Generated output</div>
                  <div className="mt-4 grid grid-cols-2 gap-6">
                    <div>
                      <div className="text-xs text-white/70">Original</div>
                      <img
                        src={imageDataUrl}
                        alt="Original"
                        className="mt-2 w-full rounded-xl2 border border-glass-border object-cover"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-white/70">Generated</div>
                        <a
                          className="text-xs text-accent-teal hover:underline"
                          href={generatedImageDataUrl}
                          download="psychedelic_output.png"
                        >
                          Download
                        </a>
                      </div>
                      <img
                        src={generatedImageDataUrl}
                        alt="Generated"
                        className="mt-2 w-full rounded-xl2 border border-glass-border object-cover shadow-glowMagenta"
                      />
                    </div>
                  </div>
                </Card>
              ) : null}
            </div>
          )}
        </div>
      }
    />
  )
}

