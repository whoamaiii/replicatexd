import { cn } from '../../lib/cn'

export function Slider(props: {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  label?: string
}) {
  const { value, onChange, min = 0, max = 1, step = 0.01, label } = props

  return (
    <label className="grid gap-2">
      {label ? <div className="text-sm text-white/80">{label}</div> : null}
      <input
        className={cn(
          'h-2 w-full cursor-pointer appearance-none rounded-full bg-white/12',
          'accent-accent-teal',
        )}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  )
}


