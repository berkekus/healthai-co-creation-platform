import type { PostStatus } from '../../types/post.types'

type Tone = {
  label: string
  /** Tailwind bg class */
  bg: string
  /** Tailwind text color class */
  text: string
  /** Dot color (Tailwind bg-*) */
  dot: string
}

const CONFIG: Record<PostStatus, Tone> = {
  draft:             { label: 'Draft',             bg: 'bg-neutral-100',        text: 'text-neutral-600',  dot: 'bg-neutral-400' },
  active:            { label: 'Active',            bg: 'bg-hai-mint',           text: 'text-hai-plum',     dot: 'bg-hai-teal' },
  meeting_scheduled: { label: 'Meeting Scheduled', bg: 'bg-hai-lime',           text: 'text-hai-plum',     dot: 'bg-hai-plum' },
  partner_found:     { label: 'Partner Found',     bg: 'bg-hai-plum',           text: 'text-hai-mint',     dot: 'bg-hai-mint' },
  expired:           { label: 'Expired',           bg: 'bg-hai-cream/60',       text: 'text-neutral-500',  dot: 'bg-neutral-400' },
}

interface Props {
  status: PostStatus
  size?: 'sm' | 'md' | 'lg'
}

export default function PostStatusBadge({ status, size = 'md' }: Props) {
  const c = CONFIG[status]
  const sizeCls =
    size === 'sm' ? 'text-[9.5px] px-2 py-0.5 gap-1.5' :
    size === 'lg' ? 'text-[11.5px] px-3 py-1 gap-2' :
                    'text-[10.5px] px-2.5 py-1 gap-1.5'
  const dotSize = size === 'lg' ? 'w-1.5 h-1.5' : 'w-1 h-1'
  return (
    <span
      className={`inline-flex items-center rounded-full font-mono font-bold tracking-[0.14em] uppercase whitespace-nowrap ${c.bg} ${c.text} ${sizeCls}`}
    >
      <span className={`rounded-full ${c.dot} ${dotSize} shrink-0`} />
      {c.label}
    </span>
  )
}
