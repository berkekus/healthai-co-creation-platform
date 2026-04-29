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
const ROLE_LABELS: Record<string, string> = {
  engineer: 'Engineer',
  healthcare_professional: 'Healthcare Professional',
}
const ROLE_ICONS: Record<string, string> = {
  engineer: 'memory',
  healthcare_professional: 'stethoscope',
}

type MetaTile = { label: string; value: string; icon: string }

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
        <div className="bg-white rounded-[2rem] border border-neutral-100 p-16 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-hai-mint/40 mb-4">
            <span className="material-symbols-outlined text-hai-plum text-[32px]">search_off</span>
          </div>
          <h1 className="font-headline font-bold text-2xl text-hai-plum mb-2">Post not found</h1>
          <p className="text-[14.5px] text-neutral-600 mb-6 max-w-sm mx-auto leading-relaxed">
            This listing may have been removed or the link is broken.
          </p>
          <button
            onClick={() => navigate(ROUTES.POSTS)}
            className="inline-flex items-center gap-2 bg-hai-plum text-white px-5 py-3 rounded-full font-bold text-sm hover:bg-black transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Back to directory
          </button>
        </div>
      </PageWrapper>
    )
  }

  const isOwner = user?.id === post.authorId
  const canPublish = isOwner && post.status === 'draft'
  const canMarkFound = isOwner && (post.status === 'active' || post.status === 'meeting_scheduled')
  const canEdit = isOwner && (post.status === 'draft' || post.status === 'active')

  const userMeetings = getByPost(post.id)
  const alreadyRequested = user
    ? userMeetings.some(m => m.requesterId === user.id && m.status !== 'cancelled' && m.status !== 'declined')
    : false
  const canExpressInterest = !isOwner && post.status === 'active' && !alreadyRequested

  const authorInitials = post.authorName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  const daysLeft = Math.ceil((new Date(post.expiryDate).getTime() - Date.now()) / 86400000)

  const metaTiles: MetaTile[] = [
    { label: 'Location',        value: `${post.city}, ${post.country}`,                icon: 'location_on' },
    { label: 'Project stage',   value: STAGE_LABELS[post.projectStage],                icon: 'progress_activity' },
    { label: 'Collaboration',   value: COLLAB_LABELS[post.collaborationType],          icon: 'handshake' },
    { label: 'Confidentiality', value: CONF_LABELS[post.confidentiality],              icon: post.confidentiality === 'meeting_only' ? 'lock' : 'visibility' },
    { label: 'Expiry',          value: new Date(post.expiryDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }), icon: 'event' },
    { label: 'Interest',        value: `${post.interestCount} member${post.interestCount !== 1 ? 's' : ''}`, icon: 'bolt' },
  ]

  return (
    <PageWrapper maxWidth={880}>
      {/* Back link */}
      <button
        onClick={() => navigate(ROUTES.POSTS)}
        className="inline-flex items-center gap-2 mb-6 text-[11px] font-mono tracking-[0.14em] uppercase font-bold text-neutral-500 hover:text-hai-plum transition-colors"
      >
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        Directory
      </button>

      {/* Hero card */}
      <div className="bg-white rounded-[2rem] border border-neutral-100 shadow-[0_30px_80px_-30px_rgba(54,33,62,0.15)] p-6 md:p-10 mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 pointer-events-none opacity-50" style={{ background: 'radial-gradient(circle, #B8F3FF 0%, transparent 70%)' }} />
        <div className="relative">
          {/* Top row: breadcrumb + status */}
          <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
            <div className="inline-flex items-center gap-2 bg-hai-offwhite border border-hai-teal/30 rounded-full px-4 py-1.5 text-[11px] font-mono tracking-[0.18em] uppercase text-hai-plum font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-hai-teal" />
              <span className="text-hai-plum/70">06</span>
              <span>Post detail</span>
            </div>
            <PostStatusBadge status={post.status} size="lg" />
          </div>

          {/* Domain pill */}
          <div className="inline-flex items-center gap-1.5 bg-hai-mint text-hai-plum px-3 py-1 rounded-full text-[11px] font-mono tracking-[0.14em] uppercase font-bold mb-4">
            <span className="w-1 h-1 rounded-full bg-hai-teal" />
            {post.domain}
          </div>

          {/* Title */}
          <h1 className="font-headline font-bold text-[32px] md:text-[48px] leading-[1.02] tracking-[-0.03em] text-hai-plum mb-6 break-words overflow-hidden">
            {post.title}
          </h1>

          {/* Author row */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="w-11 h-11 rounded-full bg-hai-mint border border-hai-teal/40 flex items-center justify-center font-mono font-bold text-[12px] text-hai-plum shrink-0">
              {authorInitials}
            </div>
            <div>
              <div className="font-body font-bold text-[15px] text-hai-plum">{post.authorName}</div>
              <div className="text-[11px] font-mono tracking-[0.14em] uppercase text-neutral-500 font-bold flex items-center gap-1.5 mt-0.5">
                <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: '"FILL" 1' }}>
                  {ROLE_ICONS[post.authorRole] ?? 'person'}
                </span>
                {ROLE_LABELS[post.authorRole] ?? post.authorRole}
              </div>
            </div>

            {daysLeft > 0 && post.status === 'active' && (
              <span className={`ml-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono tracking-[0.12em] uppercase font-bold ${
                daysLeft < 14 ? 'bg-amber-100 text-amber-800' : 'bg-hai-offwhite text-hai-plum'
              }`}>
                <span className="material-symbols-outlined text-[13px]">schedule</span>
                {daysLeft} day{daysLeft !== 1 ? 's' : ''} left
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Already requested notice */}
      {alreadyRequested && !isOwner && (
        <div className="mb-6 p-4 md:p-5 bg-gradient-to-br from-hai-mint/60 to-white border border-hai-teal rounded-2xl flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-hai-plum text-hai-mint flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: '"FILL" 1' }}>check_circle</span>
          </div>
          <div className="flex-1">
            <div className="font-body font-bold text-[15px] text-hai-plum mb-0.5">You've already expressed interest</div>
            <div className="text-[13px] text-neutral-700 leading-relaxed">
              Check your{' '}
              <button
                onClick={() => navigate(ROUTES.MEETINGS)}
                className="underline decoration-hai-teal decoration-2 underline-offset-2 font-bold text-hai-plum hover:text-hai-teal transition-colors"
              >
                meetings
              </button>
              {' '}for status updates and time proposals.
            </div>
          </div>
        </div>
      )}

      {/* Meta tile grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        {metaTiles.map(({ label, value, icon }) => (
          <div key={label} className="bg-white rounded-2xl border border-neutral-100 p-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-hai-offwhite flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-hai-plum text-[18px]" style={{ fontVariationSettings: '"FILL" 1' }}>{icon}</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-mono tracking-[0.16em] uppercase text-neutral-500 font-bold">{label}</div>
              <div className="font-body font-semibold text-[13.5px] text-hai-plum mt-0.5 truncate">{value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Expertise required */}
      <div className="bg-white rounded-[1.75rem] border border-neutral-100 p-6 md:p-8 mb-6">
        <div className="text-[10px] font-mono tracking-[0.18em] uppercase text-hai-teal font-bold mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: '"FILL" 1' }}>auto_awesome</span>
          Expertise required
        </div>
        <div className="font-body font-semibold text-[17px] text-hai-plum leading-relaxed">
          {post.expertiseRequired}
        </div>
      </div>

      {/* Description — or lock card */}
      {post.confidentiality === 'public_pitch' ? (
        <div className="bg-white rounded-[1.75rem] border border-neutral-100 p-6 md:p-8 mb-8">
          <div className="text-[10px] font-mono tracking-[0.18em] uppercase text-neutral-500 font-bold mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-[14px]">description</span>
            Description
          </div>
          <p className="font-body text-[15.5px] text-neutral-800 leading-[1.7] whitespace-pre-wrap break-words overflow-hidden">
            {post.description}
          </p>
        </div>
      ) : (
        <div className="mb-8 p-8 rounded-[1.75rem] border-2 border-dashed border-hai-plum/20 bg-gradient-to-br from-hai-cream/40 to-white text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-hai-plum text-hai-mint mb-4">
            <span className="material-symbols-outlined text-[26px]" style={{ fontVariationSettings: '"FILL" 1' }}>lock</span>
          </div>
          <div className="text-[10px] font-mono tracking-[0.18em] uppercase text-hai-plum font-bold mb-2">Confidential</div>
          <h3 className="font-headline font-bold text-xl text-hai-plum mb-2">Details shared under NDA</h3>
          <p className="text-[14px] text-neutral-600 leading-relaxed max-w-md mx-auto">
            Full details are shared in a meeting under a non-disclosure agreement. Express interest to proceed.
          </p>
        </div>
      )}

      {/* Action row — sticky */}
      {(canPublish || canMarkFound || canEdit || canExpressInterest) && (
        <div className="sticky bottom-4 bg-white rounded-[2rem] border border-neutral-100 shadow-[0_30px_80px_-30px_rgba(54,33,62,0.2)] p-5 md:p-6 flex flex-wrap gap-3 items-center">
          <div className="hidden md:flex items-center gap-2 mr-auto text-[10px] font-mono tracking-[0.18em] uppercase text-neutral-500 font-bold">
            <span className="material-symbols-outlined text-[14px]">bolt</span>
            Actions
          </div>

          {canPublish && (
            <button
              onClick={() => { publish(post.id); navigate(ROUTES.POSTS) }}
              className="inline-flex items-center gap-2 bg-hai-plum text-white px-6 py-3 rounded-full font-bold text-sm hover:bg-black transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">publish</span>
              Publish post
            </button>
          )}

          {canMarkFound && (
            <button
              onClick={() => { markPartnerFound(post.id); navigate(ROUTES.POSTS) }}
              className="inline-flex items-center gap-2 bg-hai-lime text-hai-plum px-6 py-3 rounded-full font-bold text-sm hover:bg-hai-mint transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              Mark partner found
            </button>
          )}

          {canEdit && (
            <button
              onClick={() => navigate(postEdit(post.id))}
              className="inline-flex items-center gap-2 bg-white border border-neutral-300 text-neutral-800 px-6 py-3 rounded-full font-bold text-sm hover:bg-neutral-50 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">edit</span>
              Edit post
            </button>
          )}

          {canExpressInterest && (
            <button
              onClick={() => setShowInterest(true)}
              className="inline-flex items-center gap-2 bg-hai-plum text-white px-6 py-3 rounded-full font-bold text-sm hover:bg-black transition-colors shadow-[0_10px_30px_-10px_rgba(54,33,62,0.5)] ml-auto"
            >
              Express interest
              <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
            </button>
          )}
        </div>
      )}

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
