import type { HTMLAttributes } from 'react'
import { cx } from './cx'

type CardPadding = 'none' | 'sm' | 'md' | 'lg'

const padding: Record<CardPadding, string> = {
  none: '',
  sm: 'p-5',
  md: 'p-6',
  lg: 'p-7',
}

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: CardPadding
  interactive?: boolean
}

export function Card({
  padding: pad = 'md',
  interactive,
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cx(
        'rounded-[24px] border border-[#E3E7EC] bg-white shadow-[0_20px_60px_-44px_rgba(45,24,56,0.35)]',
        interactive && 'transition hover:border-hai-teal hover:shadow-[0_16px_48px_-28px_rgba(45,24,56,0.35)]',
        padding[pad],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function SectionCard({ className, ...props }: CardProps) {
  return <Card padding="none" className={cx('overflow-hidden rounded-[28px]', className)} {...props} />
}
