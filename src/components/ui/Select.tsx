import type { SelectHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

export function Select({ className, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'w-full rounded-xl2 border border-glass-border bg-black/20 px-3 py-2 text-sm text-white/90',
        'outline-none focus:ring-2 focus:ring-accent-teal/40',
        className,
      )}
      {...rest}
    />
  )
}

