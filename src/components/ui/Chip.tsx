import type { HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

export function Chip({ className, ...rest }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border border-glass-border bg-white/5 px-2.5 py-1 text-xs text-white/90',
        className,
      )}
      {...rest}
    />
  )
}


