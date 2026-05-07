import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Bookmark,
  CalendarDays,
  FileText,
  Flag,
  Link as LinkIcon,
  Lock,
  MapPin,
  ShieldCheck,
  Star,
  Users,
  Wrench,
} from 'lucide-react'
import { usePostStore } from '../../store/postStore'
import { useAuthStore } from '../../store/authStore'
import { useMeetingStore } from '../../store/meetingStore'
import ExpressInterestModal from '../../components/meetings/ExpressInterestModal'
import { postEdit, ROUTES } from '../../constants/routes'
import api from '../../lib/api'
import type { Post } from '../../types/post.types'

const STAGE_LABELS: Record<string, string> = {
  idea: 'Idea',
  concept_validation: 'Concept Validation',
  prototype: 'Prototype',
  pilot: 'Pilot',
  pre_deployment: 'Pre-Deployment',
}

const COLLAB_LABELS: Record<string, string> = {
  advisor: 'Advisor',
  co_founder: 'Co-Founder',
  research_partner: 'Research Partner',
  contract: 'Contract Work',
}

const CONF_LABELS: Record<string, string> = {
  public_pitch: 'Public Pitch',
  meeting_only: 'Details in Meeting Only',
}

const ROLE_LABELS: Record<string, string> = {
  engineer: 'Engineer',
  healthcare_professional: 'Healthcare Professional',
}

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { posts, getById, fetchPosts, publish, markPartnerFound } = usePostStore()
  const { getByPost, fetchByUser } = useMeetingStore()
  const [showInterest, setShowInterest] = useState(false)
  const [saved, setSaved] = useState(false)
  const [fetchedPost, setFetchedPost] = useState<Post | undefined>(undefined)
  const [isFetching, setIsFetching] = useState(false)
  const [fetchError, setFetchError] = useState(false)

  const storePost = getById(id ?? '')
  const post = storePost ?? fetchedPost

  useEffect(() => {
    if (!posts.length) fetchPosts({ limit: 100, filters: {} })
  }, [fetchPosts, posts.length])

  useEffect(() => {
    if (user) fetchByUser()
  }, [fetchByUser, user])

  useEffect(() => {
    if (storePost || !id) return
    setIsFetching(true)
    setFetchError(false)
    api.get<{ success: boolean; data: Post & { _id?: string } }>(`/posts/${id}`)
      .then(({ data }) => {
        const raw = data.data
        setFetchedPost({ ...raw, id: raw._id ?? raw.id })
      })
      .catch(() => setFetchError(true))
      .finally(() => setIsFetching(false))
  }, [id, storePost])

  const userMeetings = post ? getByPost(post.id) : []
  const isOwner = !!post && user?.id === post.authorId
  const alreadyRequested = !!user && userMeetings.some(m =>
    m.requesterId === user.id && m.status !== 'cancelled' && m.status !== 'declined',
  )
  const canExpressInterest = !!post && !isOwner && post.status === 'active' && !alreadyRequested
  const canPublish = !!post && isOwner && post.status === 'draft'
  const canMarkFound = !!post && isOwner && (post.status === 'active' || post.status === 'meeting_scheduled')
  const canEdit = !!post && isOwner && (post.status === 'draft' || post.status === 'active')

  const meta = useMemo(() => {
    if (!post) return []
    return [
      { label: 'Location', value: `${post.city}, ${post.country}`, icon: <MapPin size={21} /> },
      { label: 'Project Stage', value: STAGE_LABELS[post.projectStage], icon: <Flag size={21} /> },
      { label: 'Collaboration Type', value: COLLAB_LABELS[post.collaborationType], icon: <Users size={21} /> },
      { label: 'Confidentiality', value: CONF_LABELS[post.confidentiality], icon: <Lock size={21} /> },
      {
        label: 'Expires On',
        value: new Date(post.expiryDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        icon: <CalendarDays size={21} />,
      },
      { label: 'Interest', value: `${post.interestCount} members`, icon: <Star size={21} /> },
    ]
  }, [post])

  if (isFetching && !post) {
    return (
      <main className="min-h-screen bg-[#f6f7f9] px-8 py-20 text-[#36213E]">
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#36213E]/20 border-t-[#36213E]" />
        </div>
      </main>
    )
  }

  if (!post || fetchError) {
    return (
      <main className="min-h-screen bg-[#f6f7f9] px-8 py-20 text-[#36213E]">
        <div className="mx-auto max-w-[760px] rounded-[18px] bg-white p-12 text-center shadow-[0_24px_80px_-68px_rgba(45,24,56,0.75)]">
          <h1 className="text-3xl font-black">Post not found</h1>
          <p className="mt-3 text-[#6F6878]">This listing may have been removed or the link is broken.</p>
          <button onClick={() => navigate(ROUTES.POSTS)} className="mt-8 rounded-full bg-[#36213E] px-6 py-3 text-sm font-black text-white">
            Back to directory
          </button>
        </div>
      </main>
    )
  }

  const initials = post.authorName.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase()
  const daysLeft = Math.max(0, Math.ceil((new Date(post.expiryDate).getTime() - Date.now()) / 86400000))
  const active = post.status === 'active'

  return (
    <main className="min-h-screen bg-[#f6f7f9] text-[#36213E]">
      <div className="mx-auto w-full max-w-[1120px] px-5 pb-14 pt-[42px] sm:px-8 xl:px-0">
        <div className="mb-[22px] flex items-center justify-between gap-4">
          <button
            onClick={() => navigate(ROUTES.POSTS)}
            className="inline-flex items-center gap-3 text-sm font-black text-[#26162f] transition hover:text-[#55bde0]"
          >
            <ArrowLeft size={17} />
            Back to directory
          </button>

          <div className="flex items-center gap-4">
            <button
              onClick={() => navigator.clipboard?.writeText(window.location.href).catch(() => {})}
              className="inline-flex h-[44px] items-center gap-3 rounded-[12px] border border-[#D5DAE0] bg-white px-6 text-sm font-black shadow-[0_16px_45px_-40px_rgba(45,24,56,0.7)] transition hover:border-[#8bddea]"
            >
              <LinkIcon size={18} />
              Share
            </button>
            <button
              onClick={() => setSaved(value => !value)}
              className="inline-flex h-[44px] items-center gap-3 rounded-[12px] border border-[#D5DAE0] bg-white px-6 text-sm font-black shadow-[0_16px_45px_-40px_rgba(45,24,56,0.7)] transition hover:border-[#8bddea]"
            >
              <Bookmark size={18} fill={saved ? '#36213E' : 'none'} />
              {saved ? 'Saved' : 'Save'}
            </button>
          </div>
        </div>

        <section className="rounded-[28px] bg-white px-6 py-8 shadow-[0_34px_100px_-86px_rgba(45,24,56,0.72)] sm:px-9 sm:py-10">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-start">
            <div>
              <div className="flex flex-wrap gap-4">
                <Pill tone="blue">{post.domain}</Pill>
                <Pill tone={active ? 'green' : 'gray'}>{statusLabel(post.status)}</Pill>
              </div>

              <h1 className="mt-7 max-w-[780px] break-words font-headline text-4xl font-black leading-tight text-[#36213E] sm:text-5xl">
                {post.title}
              </h1>

              <div className="mt-7 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-5">
                <div className="flex h-[58px] w-[58px] shrink-0 items-center justify-center rounded-full bg-[#dceeff] text-base font-black text-[#36213E]">
                  {initials}
                </div>
                  <div className="min-w-0">
                  <div className="text-lg font-black">{post.authorName}</div>
                  <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-[#6F6878]">
                    {ROLE_LABELS[post.authorRole] ?? post.authorRole}
                    <ShieldCheck size={14} className="text-[#50627a]" />
                  </div>
                </div>
              </div>

                <div className="flex flex-wrap gap-3">
                  {alreadyRequested && !isOwner ? (
                    <button onClick={() => navigate(ROUTES.MEETINGS)} className="h-[46px] rounded-full bg-[#36213E] px-7 text-sm font-black text-white transition hover:bg-[#4b3055]">
                      Manage interest
                    </button>
                  ) : canExpressInterest ? (
                    <button onClick={() => setShowInterest(true)} className="h-[46px] rounded-full bg-[#36213E] px-7 text-sm font-black text-white transition hover:bg-[#4b3055]">
                      Express interest
                    </button>
                  ) : isOwner ? (
                    <>
                      {canPublish && <button onClick={() => publish(post.id)} className="h-[46px] rounded-full bg-[#36213E] px-7 text-sm font-black text-white">Publish</button>}
                      {canMarkFound && <button onClick={() => markPartnerFound(post.id)} className="h-[46px] rounded-full bg-[#D8EFF2] px-7 text-sm font-black text-[#36213E]">Mark partner found</button>}
                      {canEdit && <button onClick={() => navigate(postEdit(post.id))} className="h-[46px] rounded-full border border-[#D5DAE0] bg-white px-7 text-sm font-black">Edit post</button>}
                    </>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="rounded-[22px] bg-[#E8F4F7] px-6 py-6">
              <div className="flex items-center gap-4">
                <CalendarDays className="text-[#36213E]" size={25} />
                <div>
                  <div className="text-3xl font-black leading-none">{daysLeft}</div>
                  <div className="mt-2 text-xs font-black uppercase tracking-[0.12em] text-[#6F6878]">Days left</div>
                </div>
              </div>
              <div className="mt-5 h-[6px] overflow-hidden rounded-full bg-white/70">
                <div className="h-full rounded-full bg-[#8AC6D0]" style={{ width: `${Math.min(100, Math.max(8, 100 - daysLeft / 4))}%` }} />
              </div>
              <p className="mt-5 text-sm font-semibold leading-6 text-[#6F6878]">
                {alreadyRequested && !isOwner
                  ? "You've already expressed interest. We'll keep you updated."
                  : canExpressInterest
                    ? 'Send a short note to start the collaboration conversation.'
                    : isOwner
                      ? 'Manage this opportunity from the actions beside your profile.'
                      : 'This opportunity is not currently accepting interest.'}
              </p>
            </div>
          </div>

          <div className="mt-8 border-t border-[#E3E7EC] pt-7">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-6">
              {meta.map(item => (
                <div key={item.label} className="flex items-start gap-4">
                  <span className="mt-1 shrink-0 text-[#6FB8C4]">{item.icon}</span>
                  <span>
                    <span className="block text-xs font-black uppercase tracking-[0.12em] text-[#6F6878]">{item.label}</span>
                    <span className="mt-2 block break-words text-sm font-black leading-5 text-[#36213E]">{item.value}</span>
                    </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,690px)_1fr]">
          <div className="rounded-[28px] bg-white px-6 py-8 shadow-[0_30px_90px_-84px_rgba(45,24,56,0.7)] sm:px-9">
            <DetailSection title="Project description">
              {post.confidentiality === 'public_pitch' ? (
                <p className="whitespace-pre-wrap break-words text-base font-semibold leading-8 text-[#4f4a58]">{post.description}</p>
              ) : (
                <p className="text-base font-semibold leading-8 text-[#4f4a58]">Full details are shared in a meeting under NDA.</p>
              )}
            </DetailSection>

            <DetailSection title="Expertise required">
              <div className="flex flex-wrap gap-3">
                <span className="inline-flex max-w-full break-words rounded-full bg-[#E8F4F7] px-5 py-3 text-sm font-black text-[#36213E]">{post.expertiseRequired}</span>
              </div>
            </DetailSection>

            <DetailSection title="About the author" isLast>
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-5">
                  <div className="flex h-[58px] w-[58px] shrink-0 items-center justify-center rounded-full bg-[#dfefff] text-base font-black">{initials}</div>
                  <div>
                    <div className="text-lg font-black">{post.authorName}</div>
                    <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-[#6F6878]">
                      {ROLE_LABELS[post.authorRole] ?? post.authorRole}
                      <ShieldCheck size={14} className="text-[#50627a]" />
                    </div>
                    <div className="mt-2 text-sm font-semibold text-[#6F6878]">
                      Member since {new Date(post.createdAt).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
                    </div>
                  </div>
                </div>
                <button className="h-[48px] rounded-full border border-[#D5DAE0] bg-white px-8 text-sm font-black transition hover:border-[#8AC6D0]">View profile</button>
              </div>
            </DetailSection>
          </div>

          <aside className="lg:pt-2">
            <div className="sticky top-6 rounded-[28px] bg-white px-6 py-7 shadow-[0_30px_90px_-84px_rgba(45,24,56,0.7)]">
              <h2 className="text-xl font-black leading-tight text-[#36213E]">Opportunity details</h2>
              <div className="mt-6 space-y-[18px]">
                {[
                  ['Domain', post.domain, <Wrench size={18} />],
                  ['Posted', new Date(post.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }), <FileText size={18} />],
                  ['Project Stage', STAGE_LABELS[post.projectStage], <Flag size={18} />],
                  ['Collaboration Type', COLLAB_LABELS[post.collaborationType], <Users size={18} />],
                  ['Confidentiality', CONF_LABELS[post.confidentiality], <Lock size={18} />],
                  ['Listing Expiry', new Date(post.expiryDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }), <CalendarDays size={18} />],
                ].map(([label, value, icon]) => (
                  <div key={String(label)} className="flex gap-4">
                    <span className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full bg-[#EEF0F3] text-[#6FB8C4]">
                      {icon}
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-[#6F6878]">{label}</span>
                      <span className="mt-1 block break-words text-sm font-black text-[#36213E]">{value}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {showInterest && (
        <ExpressInterestModal
          post={post}
          onClose={() => setShowInterest(false)}
          onSuccess={() => { setShowInterest(false); navigate(ROUTES.MEETINGS) }}
        />
      )}
    </main>
  )
}

function Pill({ children, tone }: { children: string; tone: 'blue' | 'green' | 'gray' }) {
  const cls = tone === 'green' ? 'bg-[#E8F4F7] text-[#6FB8C4]' : tone === 'blue' ? 'bg-[#E8F4F7] text-[#6FB8C4]' : 'bg-[#EEF0F3] text-[#6F6878]'
  return <span className={`rounded-full px-5 py-2 text-xs font-black uppercase tracking-normal ${cls}`}>{children}</span>
}

function DetailSection({ title, children, isLast = false }: { title: string; children: React.ReactNode; isLast?: boolean }) {
  return (
    <section className={`${isLast ? '' : 'border-b border-[#E3E7EC] pb-8'} ${isLast ? 'pt-8' : 'py-8'} first:pt-0`}>
      <h2 className="text-xl font-black leading-tight text-[#36213E]">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  )
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    draft: 'Draft',
    active: 'Active',
    meeting_scheduled: 'Meeting Scheduled',
    partner_found: 'Partner Found',
    expired: 'Expired',
  }
  return map[status] ?? status
}
