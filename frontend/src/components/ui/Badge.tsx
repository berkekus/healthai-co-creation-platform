import type { HTMLAttributes, ReactNode } from 'react'
import { cx } from './cx'

type BadgeVariant = 'primary' | 'soft' | 'neutral' | 'outline' | 'success' | 'warning' | 'danger' | 'ai'
type BadgeSize = 'sm' | 'md'

const variants: Record<BadgeVariant, string> = {
  primary: 'bg-hai-plum text-white',
  soft: 'bg-hai-mint/55 text-hai-plum',
  neutral: 'bg-[#EEF0F3] text-[#6F6878]',
  outline: 'border border-[#E3E7EC] bg-white text-[#6F6878]',
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-700',
  danger: 'bg-red-50 text-red-700',
  ai: 'bg-hai-plum text-white shadow-[0_12px_28px_-20px_rgba(45,24,56,0.8)]',
}

const sizes: Record<BadgeSize, string> = {
  sm: 'min-h-[22px] px-3 text-xs',
  md: 'min-h-[32px] px-4 text-xs',
}

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  size?: BadgeSize
  icon?: ReactNode
}

export function Badge({
  variant = 'neutral',
  size = 'sm',
  icon,
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cx(
        'inline-flex items-center justify-center gap-1.5 rounded-full font-headline font-black uppercase tracking-[0.12em]',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </span>
  )
}
