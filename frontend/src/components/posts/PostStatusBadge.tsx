import { useTranslation } from 'react-i18next'
import type { PostStatus } from '../../types/post.types'

type Tone = {
  /** Tailwind bg class */
  bg: string
  /** Tailwind text color class */
  text: string
  /** Dot color (Tailwind bg-*) */
  dot: string
}

// Same palette as meeting statuses. Expired used to be pale grey on cream and Partner
// Found was easy to miss among the tags; both now stand out from open posts.
const CONFIG: Record<PostStatus, Tone> = {
  draft:             { bg: 'bg-tone-gray-soft',  text: 'text-tone-gray',  dot: 'bg-tone-gray' },
  active:            { bg: 'bg-tone-green-soft', text: 'text-tone-green', dot: 'bg-tone-green' },
  meeting_scheduled: { bg: 'bg-tone-blue-soft',  text: 'text-tone-blue',  dot: 'bg-tone-blue' },
  partner_found:     { bg: 'bg-hai-plum',        text: 'text-white',      dot: 'bg-hai-mint' },
  expired:           { bg: 'bg-tone-amber-soft', text: 'text-tone-amber', dot: 'bg-tone-amber' },
}

interface Props {
  status: PostStatus
  size?: 'sm' | 'md' | 'lg'
}

export default function PostStatusBadge({ status, size = 'md' }: Props) {
  const { t } = useTranslation()
  const c = CONFIG[status]
  const sizeCls =
    size === 'sm' ? 'text-xs px-2 py-0.5 gap-1.5' :
    size === 'lg' ? 'text-xs px-3 py-1 gap-2' :
                    'text-xs px-2.5 py-1 gap-1.5'
  const dotSize = size === 'lg' ? 'w-1.5 h-1.5' : 'w-1 h-1'
  return (
    <span
      className={`inline-flex items-center rounded-full font-mono font-bold tracking-[0.12em] uppercase whitespace-nowrap ${c.bg} ${c.text} ${sizeCls}`}
    >
      <span className={`rounded-full ${c.dot} ${dotSize} shrink-0`} />
      {t(`posts.status.${status}`)}
    </span>
  )
}
