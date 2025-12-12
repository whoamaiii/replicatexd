import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import type { ImageAnalysisResult } from '../../../shared/types/analysis'
import type { PromptBundle } from '../../../shared/types/prompts'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { CodeBlock } from '../ui/CodeBlock'

type PromptsResponse = {
  prompts: PromptBundle[]
}

type ApiError = {
  message: string
}

export function PromptLabPanel(props: { analysis: ImageAnalysisResult | null }) {
  const [bundles, setBundles] = useState<PromptBundle[]>([])
  const [selectedId, setSelectedId] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [copied, setCopied] = useState(false)
  const copyTimeoutRef = useRef<ReturnType<typeof window.setTimeout> | null>(null)

  const selected = useMemo(() => {
    if (!bundles.length) return null
    const found = bundles.find((b) => b.id === selectedId)
    return found ?? bundles[0]!
  }, [bundles, selectedId])

  useEffect(() => {
    if (!props.analysis) {
      setBundles([])
      setSelectedId('')
      setErrorMessage('')
      setIsLoading(false)
      return
    }

    const controller = new AbortController()
    setIsLoading(true)
    setErrorMessage('')

    void (async () => {
      try {
        const res = await fetch('/api/prompts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ analysis: props.analysis }),
          signal: controller.signal,
        })

        if (!res.ok) {
          let message = 'Request failed'
          try {
            const data = (await res.json()) as Partial<ApiError>
            if (typeof data.message === 'string' && data.message.trim().length > 0) {
              message = data.message
            }
          } catch {
            // ignore
          }
          throw new Error(message)
        }

        const data = (await res.json()) as PromptsResponse
        const next = Array.isArray(data.prompts) ? data.prompts : []
        setBundles(next)
        setSelectedId(next[0]?.id ?? '')
      } catch (err) {
        if (controller.signal.aborted) return
        const message = err instanceof Error ? err.message : 'Unexpected error'
        setErrorMessage(message)
        setBundles([])
        setSelectedId('')
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    })()

    return () => controller.abort()
  }, [props.analysis])

  async function copyPrompt(text: string) {
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

      setCopied(true)
      copyTimeoutRef.current = window.setTimeout(() => setCopied(false), 900)
    } catch {
      setErrorMessage('Copy failed')
    }
  }

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold">Prompt Lab</div>
          <div className="mt-1 text-xs text-white/70">
            Deterministic prompt variants derived from the latest analysis.
          </div>
        </div>
      </div>

      {!props.analysis ? (
        <div className="mt-4 text-sm text-white/70">Run an analysis to unlock prompt variants.</div>
      ) : isLoading ? (
        <div className="mt-4 text-sm text-white/70">Building prompt variants.</div>
      ) : errorMessage ? (
        <div className="mt-4 rounded-xl2 border border-glass-border bg-white/5 p-3 text-sm text-white/80">
          {errorMessage}
        </div>
      ) : !selected ? (
        <div className="mt-4 text-sm text-white/70">No prompt variants available.</div>
      ) : (
        <div className="mt-4 grid gap-3">
          <div className="flex flex-wrap gap-2">
            {bundles.map((b) => (
              <Button
                key={b.id}
                type="button"
                variant={b.id === selected.id ? 'secondary' : 'ghost'}
                className="h-9 px-3 py-2 text-xs"
                onClick={() => setSelectedId(b.id)}
              >
                {b.title}
              </Button>
            ))}
          </div>

          <div className="text-xs text-white/70">{selected.description}</div>

          <div className="flex items-center justify-between gap-3">
            <div className="text-xs text-white/60">Prompt</div>
            <Button
              type="button"
              variant="ghost"
              className="h-8 px-2 py-1 text-xs"
              onClick={() => void copyPrompt(selected.prompt)}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>

          <CodeBlock className="max-h-[260px]">{selected.prompt}</CodeBlock>

          {selected.notes ? (
            <div className="rounded-xl2 border border-glass-border bg-white/5 p-3 text-xs text-white/75">
              {selected.notes}
            </div>
          ) : null}
        </div>
      )}
    </Card>
  )
}


