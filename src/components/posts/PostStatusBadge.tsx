import type { PostStatus } from '../../types/post.types'

const CONFIG: Record<PostStatus, { label: string; bg: string; color: string; dot: string }> = {
  draft:             { label: 'Draft',            bg: 'oklch(0.93 0.005 240)',   color: 'oklch(0.44 0.02 250)', dot: 'oklch(0.65 0.01 240)' },
  active:            { label: 'Active',           bg: 'oklch(0.93 0.06 145)',    color: 'oklch(0.32 0.10 145)', dot: 'oklch(0.52 0.14 145)' },
  meeting_scheduled: { label: 'Meeting Scheduled', bg: 'oklch(0.94 0.07 75)',    color: 'oklch(0.40 0.10 60)',  dot: 'oklch(0.65 0.14 75)'  },
  partner_found:     { label: 'Partner Found',    bg: 'oklch(0.92 0.05 220)',    color: 'oklch(0.28 0.08 220)', dot: 'oklch(0.45 0.12 220)' },
  expired:           { label: 'Expired',          bg: 'oklch(0.93 0.04 25)',     color: 'oklch(0.44 0.08 25)',  dot: 'oklch(0.60 0.10 25)'  },
}

interface Props {
  status: PostStatus
  size?: 'sm' | 'md'
}

export default function PostStatusBadge({ status, size = 'md' }: Props) {
  const c = CONFIG[status]
  const fs = size === 'sm' ? 10 : 11
  const px = size === 'sm' ? 7 : 9
  const py = size === 'sm' ? 2 : 3
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: c.bg, color: c.color,
      fontFamily: 'var(--ff-mono)', fontSize: fs, letterSpacing: '.12em',
      textTransform: 'uppercase', fontWeight: 500,
      padding: `${py}px ${px}px`, borderRadius: 2,
      whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: c.dot, flexShrink: 0 }} />
      {c.label}
    </span>
  )
}
