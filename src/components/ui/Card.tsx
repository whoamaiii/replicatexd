import type { HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-xl2 border border-glass-border bg-glass-panel/70 backdrop-blur-xl',
        'shadow-glowMagenta',
        className,
      )}
      {...rest}
    />
  )
}


