import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

type ButtonVariant = 'primary' | 'secondary' | 'ghost'

export function Button(
  props: ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant
  },
) {
  const { className, variant = 'primary', ...rest } = props

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl2 px-4 py-3 text-sm font-medium',
        'transition will-change-transform',
        'disabled:cursor-not-allowed disabled:opacity-50',
        variant === 'primary' &&
          'bg-accent-teal text-black shadow-glowTeal hover:translate-y-[1px] active:translate-y-[2px]',
        variant === 'secondary' &&
          'bg-white/10 text-white hover:bg-white/14 hover:translate-y-[1px] active:translate-y-[2px] border border-glass-border',
        variant === 'ghost' && 'bg-transparent text-white hover:bg-white/8',
        className,
      )}
      {...rest}
    />
  )
}

