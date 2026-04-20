import { useNavigate } from 'react-router-dom'
import type { Post } from '../../types/post.types'
import type { MatchReason, MatchTone } from '../../utils/matchPosts'
import PostStatusBadge from './PostStatusBadge'
import { postDetail } from '../../constants/routes'

const STAGE_LABELS: Record<string, string> = {
  idea: 'Idea', concept_validation: 'Concept Validation',
  prototype: 'Prototype', pilot: 'Pilot', pre_deployment: 'Pre-Deployment',
}
const COLLAB_LABELS: Record<string, string> = {
  advisor: 'Advisor', co_founder: 'Co-Founder',
  research_partner: 'Research Partner', contract: 'Contract',
}
const ROLE_ICON: Record<string, string> = {
  engineer: 'memory',
  healthcare_professional: 'stethoscope',
}

const MATCH_TONE_STYLE: Record<MatchTone, string> = {
  city:      'bg-hai-lime text-hai-plum',
  country:   'bg-hai-mint text-hai-plum',
  role:      'bg-hai-plum text-hai-mint',
  expertise: 'bg-hai-cream text-hai-plum border border-hai-plum/15',
  domain:    'bg-hai-offwhite text-hai-plum border border-hai-teal/40',
}

interface Props {
  post: Post
  /** Optional match reasons chips rendered above the header row */
  matchReasons?: MatchReason[]
  /** Boost visual weight (used in "Best matches for you" featured row) */
  featured?: boolean
}

export default function PostCard({ post, matchReasons, featured = false }: Props) {
  const navigate = useNavigate()

  const daysLeft = Math.ceil((new Date(post.expiryDate).getTime() - Date.now()) / 86400000)
  const authorInitials = post.authorName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <article
      onClick={() => navigate(postDetail(post.id))}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(postDetail(post.id)) } }}
      tabIndex={0}
      role="link"
      aria-label={`Open post: ${post.title}`}
      className={`group bg-white rounded-[1.5rem] p-6 cursor-pointer flex flex-col gap-4 transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hai-teal focus-visible:ring-offset-2 font-body ${
        featured
          ? 'border-2 border-hai-plum shadow-[0_20px_60px_-25px_rgba(54,33,62,0.35)] hover:shadow-[0_30px_80px_-25px_rgba(54,33,62,0.45)]'
          : 'border border-neutral-200 hover:border-hai-plum hover:shadow-[0_20px_50px_-20px_rgba(54,33,62,0.2)]'
      }`}
    >
      {/* Match reason chips */}
      {matchReasons && matchReasons.length > 0 && (
        <div className="flex flex-wrap gap-1.5 -mb-1">
          {matchReasons.map(r => (
            <span
              key={`${r.tone}-${r.label}`}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono tracking-[0.1em] uppercase font-bold ${MATCH_TONE_STYLE[r.tone]}`}
            >
              <span className="material-symbols-outlined text-[11px]" style={{ fontVariationSettings: '"FILL" 1' }}>
                {r.icon}
              </span>
              {r.label}
            </span>
          ))}
        </div>
      )}

      {/* Top: domain pill + status */}
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 bg-hai-mint/70 text-hai-plum px-2.5 py-1 rounded-full text-[10px] font-mono tracking-[0.14em] uppercase font-bold">
          <span className="w-1 h-1 rounded-full bg-hai-teal" />
          {post.domain}
        </span>
        <PostStatusBadge status={post.status} size="sm" />
      </div>

      {/* Title */}
      <h3 className="font-headline font-bold text-[19px] leading-[1.2] tracking-[-0.02em] text-hai-plum line-clamp-2 group-hover:text-hai-plum transition-colors">
        {post.title}
      </h3>

      {/* Description */}
      <p className="text-[13.5px] text-neutral-600 leading-[1.55] line-clamp-2 flex-1">
        {post.description}
      </p>

      {/* Tags */}
      <div className="flex gap-2 flex-wrap">
        <span className="inline-flex items-center gap-1 text-[10px] font-mono tracking-[0.12em] uppercase text-neutral-500 border border-neutral-200 px-2 py-0.5 rounded-full font-bold">
          {STAGE_LABELS[post.projectStage]}
        </span>
        <span className="inline-flex items-center gap-1 text-[10px] font-mono tracking-[0.12em] uppercase text-neutral-500 border border-neutral-200 px-2 py-0.5 rounded-full font-bold">
          {COLLAB_LABELS[post.collaborationType]}
        </span>
      </div>

      {/* Bottom: author + meta */}
      <div className="flex items-center justify-between gap-3 pt-4 border-t border-neutral-100">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="w-7 h-7 rounded-full bg-hai-mint border border-hai-teal/40 flex items-center justify-center text-[10px] font-mono font-bold text-hai-plum shrink-0">
            {authorInitials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[12px] font-bold text-hai-plum truncate leading-tight">
              {post.authorName}
            </div>
            <div className="flex items-center gap-1 text-[10px] font-mono tracking-[0.08em] uppercase text-neutral-500 mt-0.5">
              <span className="material-symbols-outlined text-[10px]" style={{ fontVariationSettings: '"FILL" 1' }}>
                {ROLE_ICON[post.authorRole] ?? 'person'}
              </span>
              <span className="truncate">{post.city}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-0.5 shrink-0">
          {post.interestCount > 0 && (
            <span className="inline-flex items-center gap-1 text-[10px] font-mono tracking-[0.08em] uppercase text-hai-plum font-bold">
              <span className="material-symbols-outlined text-[11px]" style={{ fontVariationSettings: '"FILL" 1' }}>bolt</span>
              {post.interestCount} interested
            </span>
          )}
          {daysLeft > 0 && post.status === 'active' && (
            <span className={`text-[10px] font-mono tracking-[0.08em] uppercase font-bold ${daysLeft < 14 ? 'text-amber-600' : 'text-neutral-500'}`}>
              {daysLeft}d left
            </span>
          )}
        </div>
      </div>
    </article>
  )
}
