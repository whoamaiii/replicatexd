import { Card } from '../ui/Card'

export function ImagePreviewCard(props: {
  originalImageDataUrl: string
  generatedImageDataUrl?: string
}) {
  const hasGenerated = Boolean(props.generatedImageDataUrl)

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-sm font-semibold">Image preview</div>
          <div className="mt-1 text-xs text-white/70">
            Compare original and generated images
          </div>
        </div>
        {props.generatedImageDataUrl ? (
          <a
            className="text-xs text-accent-teal hover:underline"
            href={props.generatedImageDataUrl}
            download="psychedelic_output.png"
          >
            Download
          </a>
        ) : null}
      </div>

      <div className={hasGenerated ? 'mt-4 grid grid-cols-2 gap-6' : 'mt-4'}>
        <div>
          <div className="text-xs text-white/70">Original</div>
          <img
            src={props.originalImageDataUrl}
            alt="Original"
            className="mt-2 w-full rounded-xl2 border border-glass-border object-cover"
          />
        </div>

        {props.generatedImageDataUrl ? (
          <div>
            <div className="text-xs text-white/70">Generated</div>
            <img
              src={props.generatedImageDataUrl}
              alt="Generated"
              className="mt-2 w-full rounded-xl2 border border-glass-border object-cover shadow-glowMagenta"
            />
          </div>
        ) : null}
      </div>
    </Card>
  )
}
