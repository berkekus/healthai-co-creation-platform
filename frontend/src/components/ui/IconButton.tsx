import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router-dom'
import { cx } from './cx'

type IconButtonVariant = 'default' | 'soft' | 'outline' | 'ghost' | 'primary' | 'danger'
type IconButtonSize = 'sm' | 'md' | 'lg'

const base =
  'relative inline-flex shrink-0 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hai-teal/45 disabled:pointer-events-none disabled:opacity-45'

const variants: Record<IconButtonVariant, string> = {
  default: 'border border-[#E3E7EC] bg-white text-neutral-700 hover:border-hai-teal hover:bg-hai-mint/40',
  soft: 'border border-hai-teal/30 bg-hai-mint/45 text-hai-plum hover:bg-hai-mint/70',
  outline: 'border border-[#E3E7EC] bg-white text-hai-plum hover:border-hai-teal hover:bg-hai-mint/35',
  ghost: 'bg-transparent text-neutral-700 hover:bg-black/5 hover:text-neutral-900',
  primary: 'bg-hai-plum text-white hover:bg-[#24162B]',
  danger: 'bg-red-50 text-red-600 hover:bg-red-100',
}

const sizes: Record<IconButtonSize, string> = {
  sm: 'h-9 w-9',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
}

interface SharedIconButtonProps {
  label: string
  icon: ReactNode
  variant?: IconButtonVariant
  size?: IconButtonSize
}

export type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label'> & SharedIconButtonProps

export function IconButton({
  label,
  icon,
  variant = 'default',
  size = 'md',
  className,
  title,
  ...props
}: IconButtonProps) {
  return (
    <button
      aria-label={label}
      title={title ?? label}
      className={cx(base, variants[variant], sizes[size], className)}
      {...props}
    >
      {icon}
    </button>
  )
}

export type IconLinkProps = Omit<LinkProps, 'aria-label'> & SharedIconButtonProps

export function IconLink({
  label,
  icon,
  variant = 'default',
  size = 'md',
  className,
  title,
  ...props
}: IconLinkProps) {
  return (
    <Link
      aria-label={label}
      title={title ?? label}
      className={cx(base, variants[variant], sizes[size], className)}
      {...props}
    >
      {icon}
    </Link>
  )
}
