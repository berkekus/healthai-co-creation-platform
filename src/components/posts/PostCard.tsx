import { useNavigate } from 'react-router-dom'
import type { Post } from '../../types/post.types'
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

interface Props { post: Post }

export default function PostCard({ post }: Props) {
  const navigate = useNavigate()

  const daysLeft = Math.ceil((new Date(post.expiryDate).getTime() - Date.now()) / 86400000)

  return (
    <article
      onClick={() => navigate(postDetail(post.id))}
      style={{
        background: 'var(--paper)', border: '1px solid var(--rule)',
        padding: '24px 28px', cursor: 'pointer',
        transition: 'border-color .18s, box-shadow .18s',
        display: 'flex', flexDirection: 'column', gap: 14,
        position: 'relative',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.borderColor = 'var(--primary)'
        ;(e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px oklch(0 0 0 / .06)'
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.borderColor = 'var(--rule)'
        ;(e.currentTarget as HTMLElement).style.boxShadow = 'none'
      }}
    >
      {/* Top row: domain tag + status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' }}>
        <span style={{
          fontFamily: 'var(--ff-mono)', fontSize: 10, letterSpacing: '.14em',
          textTransform: 'uppercase', color: 'var(--accent)', fontWeight: 600,
        }}>
          {post.domain}
        </span>
        <PostStatusBadge status={post.status} size="sm" />
      </div>

      {/* Title */}
      <h3 style={{
        fontFamily: 'var(--ff-display)', fontWeight: 400,
        fontSize: 'clamp(16px,1.4vw,19px)', letterSpacing: '-0.02em',
        color: 'var(--ink)', margin: 0, lineHeight: 1.35,
      }}>
        {post.title}
      </h3>

      {/* Description excerpt */}
      <p style={{
        fontFamily: 'var(--ff-sans)', fontSize: 13.5, color: 'var(--ink-muted)',
        margin: 0, lineHeight: 1.55,
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      }}>
        {post.description}
      </p>

      {/* Tags row */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {[STAGE_LABELS[post.projectStage], COLLAB_LABELS[post.collaborationType]].map(tag => (
          <span key={tag} style={{
            fontFamily: 'var(--ff-mono)', fontSize: 10, letterSpacing: '.1em',
            textTransform: 'uppercase', color: 'var(--ink-muted)',
            border: '1px solid var(--rule)', padding: '2px 7px',
          }}>{tag}</span>
        ))}
      </div>

      {/* Bottom meta */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderTop: '1px solid var(--rule-soft)', paddingTop: 12, flexWrap: 'wrap', gap: 6,
      }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 10.5, color: 'var(--ink-muted)', letterSpacing: '.06em' }}>
            {post.city}, {post.country}
          </span>
          <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--rule)', display: 'inline-block' }} />
          <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 10.5, color: 'var(--ink-muted)', letterSpacing: '.06em' }}>
            {post.authorName}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {post.interestCount > 0 && (
            <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 10.5, color: 'var(--ink-muted)' }}>
              {post.interestCount} interested
            </span>
          )}
          {daysLeft > 0 && post.status === 'active' && (
            <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 10.5, color: daysLeft < 14 ? '#d97706' : 'var(--ink-muted)' }}>
              {daysLeft}d left
            </span>
          )}
        </div>
      </div>
    </article>
  )
}
