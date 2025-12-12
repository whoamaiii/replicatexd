import type { HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

export function Panel({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-xl2 border border-glass-border bg-glass-panel backdrop-blur-xl',
        'shadow-glowTeal',
        className,
      )}
      {...rest}
    />
  )
}

