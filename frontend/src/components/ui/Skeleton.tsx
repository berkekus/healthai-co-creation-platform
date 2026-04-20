/**
 * Skeleton loading primitives (Faz 9)
 * -----------------------------------------------------------------------------
 * Exports a small toolbox of reusable skeleton shapes matched to the hai-* UI:
 *   - <Skeleton/>         low-level rounded rectangle
 *   - <SkeletonLine/>     single text line
 *   - <SkeletonPill/>     pill / badge placeholder
 *   - <SkeletonCircle/>   avatar / disc placeholder
 *   - <PostCardSkeleton/> mimic of the live PostCard layout
 *   - <SkeletonGrid/>     responsive grid of PostCardSkeletons
 *
 * All visual motion is driven by the `skeleton-shimmer` utility defined in
 * `src/styles/globals.css`, which respects `prefers-reduced-motion`.
 */
import type { CSSProperties, ReactNode } from 'react'

interface SkeletonProps {
  width?: number | string
  height?: number | string
  rounded?: 'sm' | 'md' | 'lg' | 'full' | number
  className?: string
  style?: CSSProperties
}

const roundedMap: Record<'sm' | 'md' | 'lg' | 'full', string> = {
  sm:   '8px',
  md:   '12px',
  lg:   '20px',
  full: '9999px',
}

export function Skeleton({
  width = '100%',
  height = 14,
  rounded = 'md',
  className = '',
  style,
}: SkeletonProps) {
  const borderRadius = typeof rounded === 'number' ? rounded : roundedMap[rounded]
  return (
    <span
      aria-hidden
      className={`skeleton-shimmer inline-block align-middle ${className}`}
      style={{ width, height, borderRadius, ...style }}
    />
  )
}

export const SkeletonLine = (p: SkeletonProps) => <Skeleton height={12} rounded="full" {...p} />
export const SkeletonPill = (p: SkeletonProps) => <Skeleton rounded="full" {...p} />
export const SkeletonCircle = ({ size = 36, className = '', ...rest }: { size?: number } & Omit<SkeletonProps, 'width' | 'height' | 'rounded'>) => (
  <Skeleton width={size} height={size} rounded="full" className={className} {...rest} />
)

/**
 * PostCardSkeleton — mirrors the public `PostCard` component so the swap in/out
 * is visually stable (no layout shift when real data arrives).
 */
export function PostCardSkeleton() {
  return (
    <article
      aria-busy
      aria-label="Loading post"
      className="bg-white rounded-[1.5rem] border border-neutral-200 p-6 flex flex-col gap-4 font-body"
    >
      <div className="flex items-center justify-between gap-3">
        <SkeletonPill width={96} height={22} />
        <SkeletonPill width={64} height={22} />
      </div>

      <div className="flex flex-col gap-2">
        <SkeletonLine height={18} width="94%" />
        <SkeletonLine height={18} width="72%" />
      </div>

      <div className="flex flex-col gap-1.5">
        <SkeletonLine width="100%" />
        <SkeletonLine width="95%" />
        <SkeletonLine width="60%" />
      </div>

      <div className="flex flex-wrap gap-1.5 mt-1">
        <SkeletonPill width={78} height={20} />
        <SkeletonPill width={104} height={20} />
        <SkeletonPill width={62} height={20} />
      </div>

      <div className="mt-auto pt-4 border-t border-neutral-100 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <SkeletonCircle size={32} />
          <div className="flex flex-col gap-1">
            <SkeletonLine width={110} height={11} />
            <SkeletonLine width={70} height={10} />
          </div>
        </div>
        <SkeletonPill width={72} height={18} />
      </div>
    </article>
  )
}

export function SkeletonGrid({ count = 6, children }: { count?: number; children?: ReactNode }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-5" aria-live="polite">
      {children ?? Array.from({ length: count }).map((_, i) => <PostCardSkeleton key={i} />)}
    </div>
  )
}

export default Skeleton
