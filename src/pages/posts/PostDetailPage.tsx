import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { usePostStore } from '../../store/postStore'
import { useAuthStore } from '../../store/authStore'
import { useMeetingStore } from '../../store/meetingStore'
import PostStatusBadge from '../../components/posts/PostStatusBadge'
import ExpressInterestModal from '../../components/meetings/ExpressInterestModal'
import PageWrapper from '../../components/layout/PageWrapper'
import { ROUTES, postEdit } from '../../constants/routes'

const STAGE_LABELS: Record<string, string> = {
  idea: 'Idea', concept_validation: 'Concept Validation',
  prototype: 'Prototype Developed', pilot: 'Pilot Testing', pre_deployment: 'Pre-Deployment',
}
const COLLAB_LABELS: Record<string, string> = {
  advisor: 'Advisor', co_founder: 'Co-Founder',
  research_partner: 'Research Partner', contract: 'Contract Work',
}
const CONF_LABELS: Record<string, string> = {
  public_pitch: 'Public Pitch', meeting_only: 'Details in Meeting Only',
}

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { getById, publish, markPartnerFound } = usePostStore()
  const { user } = useAuthStore()
  const { getByPost } = useMeetingStore()
  const navigate = useNavigate()
  const [showInterest, setShowInterest] = useState(false)

  const post = getById(id ?? '')

  if (!post) {
    return (
      <PageWrapper maxWidth={720}>
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <p style={{ fontFamily: 'var(--ff-display)', fontSize: 24, color: 'var(--ink)' }}>Post not found.</p>
          <button onClick={() => navigate(ROUTES.POSTS)} style={ghostBtn}>← Back to Directory</button>
        </div>
      </PageWrapper>
    )
  }

  const isOwner = user?.id === post.authorId
  const canPublish = isOwner && post.status === 'draft'
  const canMarkFound = isOwner && (post.status === 'active' || post.status === 'meeting_scheduled')
  const canEdit = isOwner && (post.status === 'draft' || post.status === 'active')

  const userMeetings = getByPost(post.id)
  const alreadyRequested = user ? userMeetings.some(m => m.requesterId === user.id && m.status !== 'cancelled' && m.status !== 'declined') : false
  const canExpressInterest = !isOwner && post.status === 'active' && !alreadyRequested

  const mono: React.CSSProperties = {
    fontFamily: 'var(--ff-mono)', fontSize: 11, letterSpacing: '.16em',
    textTransform: 'uppercase', color: 'var(--ink-muted)',
  }

  return (
    <PageWrapper maxWidth={800}>
      <button onClick={() => navigate(ROUTES.POSTS)} style={{ ...mono, background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 32, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 16, lineHeight: 1 }}>←</span> Directory
      </button>

      <div style={{ ...mono, paddingBottom: 14, borderBottom: '1px solid var(--rule)', marginBottom: 36, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ color: 'var(--primary)' }}>06</span>
        <span>Post Detail</span>
        <span style={{ marginLeft: 'auto' }}>
          <PostStatusBadge status={post.status} />
        </span>
      </div>

      <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--accent)', fontWeight: 600, marginBottom: 12 }}>
        {post.domain}
      </div>

      <h1 style={{ fontFamily: 'var(--ff-display)', fontWeight: 400, fontSize: 'clamp(24px,3.5vw,40px)', letterSpacing: '-0.025em', margin: '0 0 28px', color: 'var(--ink)', lineHeight: 1.25 }}>
        {post.title}
      </h1>

      {/* Meta grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 0, border: '1px solid var(--rule)', marginBottom: 36 }}>
        {[
          { label: 'Posted by',       value: post.authorName },
          { label: 'Role',            value: post.authorRole === 'engineer' ? 'Engineer' : 'Healthcare Professional' },
          { label: 'Location',        value: `${post.city}, ${post.country}` },
          { label: 'Project stage',   value: STAGE_LABELS[post.projectStage] },
          { label: 'Collaboration',   value: COLLAB_LABELS[post.collaborationType] },
          { label: 'Confidentiality', value: CONF_LABELS[post.confidentiality] },
          { label: 'Expiry',          value: new Date(post.expiryDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) },
          { label: 'Interest',        value: `${post.interestCount} member${post.interestCount !== 1 ? 's' : ''}` },
        ].map(({ label, value }) => (
          <div key={label} style={{ padding: '14px 18px', borderBottom: '1px solid var(--rule)', borderRight: '1px solid var(--rule)' }}>
            <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 9.5, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--ink-muted)', marginBottom: 5 }}>{label}</div>
            <div style={{ fontFamily: 'var(--ff-sans)', fontSize: 14, color: 'var(--ink)', fontWeight: 500 }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Expertise required */}
      <div style={{ marginBottom: 28, padding: '16px 20px', background: 'var(--paper-2)', border: '1px solid var(--rule)' }}>
        <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 9.5, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--ink-muted)', marginBottom: 8 }}>Expertise required</div>
        <div style={{ fontFamily: 'var(--ff-sans)', fontSize: 15, color: 'var(--ink)', fontWeight: 500 }}>{post.expertiseRequired}</div>
      </div>

      {/* Description */}
      {post.confidentiality === 'public_pitch' ? (
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 9.5, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--ink-muted)', marginBottom: 12 }}>Description</div>
          <p style={{ fontFamily: 'var(--ff-sans)', fontSize: 15.5, color: 'var(--ink)', lineHeight: 1.7, margin: 0 }}>{post.description}</p>
        </div>
      ) : (
        <div style={{ marginBottom: 40, padding: '20px 24px', border: '1px dashed var(--rule)', textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--ink-muted)', marginBottom: 8 }}>Confidential</div>
          <p style={{ fontFamily: 'var(--ff-sans)', fontSize: 14, color: 'var(--ink-muted)', margin: 0 }}>
            Full details are shared in a meeting under NDA. Express interest to proceed.
          </p>
        </div>
      )}

      {/* Already requested notice */}
      {alreadyRequested && !isOwner && (
        <div style={{ marginBottom: 24, padding: '12px 16px', background: 'oklch(0.93 0.06 145)', border: '1px solid oklch(0.52 0.14 145)', fontFamily: 'var(--ff-sans)', fontSize: 13.5, color: 'oklch(0.32 0.10 145)' }}>
          You have already expressed interest in this post. Check your <button onClick={() => navigate(ROUTES.MEETINGS)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'inherit', fontWeight: 600, textDecoration: 'underline', fontSize: 'inherit', fontFamily: 'inherit' }}>meetings</button> for status updates.
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', paddingTop: 24, borderTop: '1px solid var(--rule)' }}>
        {canPublish && (
          <button onClick={() => { publish(post.id); navigate(ROUTES.POSTS) }} style={primaryBtn}>
            Publish Post →
          </button>
        )}
        {canMarkFound && (
          <button onClick={() => { markPartnerFound(post.id); navigate(ROUTES.POSTS) }} style={primaryBtn}>
            Mark as Partner Found ✓
          </button>
        )}
        {canEdit && (
          <button onClick={() => navigate(postEdit(post.id))} style={ghostBtn}>
            Edit Post
          </button>
        )}
        {canExpressInterest && (
          <button onClick={() => setShowInterest(true)} style={primaryBtn}>
            Express Interest →
          </button>
        )}
      </div>

      {showInterest && (
        <ExpressInterestModal
          post={post}
          onClose={() => setShowInterest(false)}
          onSuccess={() => { setShowInterest(false); navigate(ROUTES.MEETINGS) }}
        />
      )}
    </PageWrapper>
  )
}

const primaryBtn: React.CSSProperties = {
  padding: '12px 28px', background: 'var(--ink)', color: 'var(--paper)',
  border: '1.5px solid var(--ink)', fontFamily: 'var(--ff-sans)',
  fontSize: 14.5, fontWeight: 500, cursor: 'pointer',
}

const ghostBtn: React.CSSProperties = {
  padding: '12px 28px', background: 'transparent', color: 'var(--ink)',
  border: '1.5px solid var(--rule)', fontFamily: 'var(--ff-mono)',
  fontSize: 11, fontWeight: 500, cursor: 'pointer',
  letterSpacing: '.1em', textTransform: 'uppercase',
}
