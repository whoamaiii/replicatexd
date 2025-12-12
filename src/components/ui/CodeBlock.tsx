import type { HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

export function CodeBlock({ className, ...rest }: HTMLAttributes<HTMLPreElement>) {
  return (
    <pre
      className={cn(
        'max-h-[420px] overflow-auto rounded-xl2 border border-glass-border bg-black/30 p-4 text-xs leading-relaxed',
        className,
      )}
      {...rest}
    />
  )
}


