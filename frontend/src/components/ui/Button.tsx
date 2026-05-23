import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router-dom'
import { cx } from './cx'

type ButtonVariant = 'primary' | 'secondary' | 'soft' | 'outline' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

const base =
  'inline-flex shrink-0 items-center justify-center gap-2 rounded-full font-headline font-black transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hai-teal/45 disabled:pointer-events-none disabled:opacity-45'

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-hai-plum text-white shadow-[0_18px_42px_-28px_rgba(45,24,56,0.9)] hover:bg-[#24162B]',
  secondary: 'border border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-100',
  soft: 'border border-hai-teal/35 bg-hai-mint/45 text-hai-plum hover:bg-hai-mint/70',
  outline: 'border border-neutral-200 bg-white text-hai-plum hover:border-hai-teal hover:bg-hai-mint/35',
  ghost: 'bg-transparent text-neutral-700 hover:bg-black/5 hover:text-neutral-900',
  danger: 'bg-red-600 text-white hover:bg-red-700',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'h-9 px-4 text-xs',
  md: 'h-11 px-5 text-sm',
  lg: 'h-[58px] px-7 text-sm',
}

interface SharedButtonProps {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  icon?: ReactNode
  iconPosition?: 'left' | 'right'
}

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & SharedButtonProps

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth,
  icon,
  iconPosition = 'left',
  className,
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cx(base, variants[variant], sizes[size], fullWidth && 'w-full', className)}
      {...props}
    >
      {icon && iconPosition === 'left' && <span className="inline-flex">{icon}</span>}
      {children}
      {icon && iconPosition === 'right' && <span className="inline-flex">{icon}</span>}
    </button>
  )
}

export type ButtonLinkProps = LinkProps & SharedButtonProps

export function ButtonLink({
  variant = 'primary',
  size = 'md',
  fullWidth,
  icon,
  iconPosition = 'left',
  className,
  children,
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      className={cx(base, variants[variant], sizes[size], fullWidth && 'w-full', className)}
      {...props}
    >
      {icon && iconPosition === 'left' && <span className="inline-flex">{icon}</span>}
      {children}
      {icon && iconPosition === 'right' && <span className="inline-flex">{icon}</span>}
    </Link>
  )
}
