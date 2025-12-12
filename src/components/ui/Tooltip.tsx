import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

export function Tooltip(props: {
  content: ReactNode
  children: ReactNode
  className?: string
  side?: 'top' | 'bottom' | 'left' | 'right'
}) {
  const side = props.side ?? 'top'

  const position =
    side === 'top'
      ? 'bottom-full left-1/2 -translate-x-1/2 mb-2'
      : side === 'bottom'
        ? 'top-full left-1/2 -translate-x-1/2 mt-2'
        : side === 'left'
          ? 'right-full top-1/2 -translate-y-1/2 mr-2'
          : 'left-full top-1/2 -translate-y-1/2 ml-2'

  return (
    <span className={cn('relative inline-flex group', props.className)}>
      {props.children}
      <span
        className={cn(
          'pointer-events-none absolute z-50 hidden w-[280px] rounded-lg border border-glass-border bg-black/80 p-2.5 text-[11px] text-white/80 shadow-lg backdrop-blur-sm',
          'group-hover:block group-focus-within:block',
          position,
        )}
      >
        {props.content}
      </span>
    </span>
  )
}

