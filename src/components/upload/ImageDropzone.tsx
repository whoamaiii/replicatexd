import { useState } from 'react'

export function ImageDropzone(props: {
  imageName: string
  imageDataUrl: string
  onPickFile: (file: File) => void
}) {
  const [isDragOver, setIsDragOver] = useState(false)

  return (
    <div className="grid gap-2">
      <div className="text-sm text-white/80">Input image</div>
      <label
        className={[
          'group relative block cursor-pointer rounded-xl2 border border-dashed p-4 transition',
          'hover:bg-white/7',
          isDragOver ? 'border-accent-teal/70 bg-white/8' : 'border-glass-border bg-white/5',
        ].join(' ')}
        onDragEnter={(e) => {
          e.preventDefault()
          setIsDragOver(true)
        }}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragOver(true)
        }}
        onDragLeave={(e) => {
          e.preventDefault()
          setIsDragOver(false)
        }}
        onDrop={(e) => {
          e.preventDefault()
          setIsDragOver(false)
          const file = e.dataTransfer.files?.[0]
          if (file) props.onPickFile(file)
        }}
      >
        <input
          className="hidden"
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) props.onPickFile(file)
          }}
        />
        <div className="grid gap-2">
          <div className="text-sm text-white/90">Drop an image here or click to browse</div>
          <div className="text-xs text-white/60">PNG and JPG work well. Keep it reasonably sized.</div>
          {props.imageName ? (
            <div className="pt-2 text-xs text-white/75">{props.imageName}</div>
          ) : null}
        </div>
      </label>

      {props.imageDataUrl ? (
        <img
          src={props.imageDataUrl}
          alt="Selected input"
          className="mt-2 max-h-[220px] w-full rounded-xl2 border border-glass-border object-cover"
        />
      ) : null}
    </div>
  )
}


