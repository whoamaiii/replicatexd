import type { HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

export function Badge({ className, ...rest }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full bg-white/8 px-2.5 py-1 text-[11px] uppercase tracking-wide text-white/70',
        className,
      )}
      {...rest}
    />
  )
}

