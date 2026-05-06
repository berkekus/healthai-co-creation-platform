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
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { usePostStore } from '../../store/postStore'
import { useAuthStore } from '../../store/authStore'
import { useMeetingStore } from '../../store/meetingStore'
import { usePostStore } from '../../store/postStore'
import ExpressInterestModal from '../../components/meetings/ExpressInterestModal'
import { postEdit, ROUTES } from '../../constants/routes'
import PageWrapper from '../../components/layout/PageWrapper'
import { ROUTES, postEdit } from '../../constants/routes'
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

  useEffect(() => {
    if (!posts.length) fetchPosts({ limit: 100, filters: {} })
  }, [fetchPosts, posts.length])

  useEffect(() => {
    if (user) fetchByUser(user.id)
  }, [fetchByUser, user])

  const storePost = getById(id ?? '')
  const [fetchedPost, setFetchedPost] = useState<Post | undefined>(undefined)
  const [isFetching, setIsFetching] = useState(!storePost)
  const [fetchError, setFetchError] = useState(false)

  const userMeetings = post ? getByPost(post.id) : []
  const isOwner = !!post && user?.id === post.authorId
  const alreadyRequested = !!user && userMeetings.some(m => m.requesterId === user.id && m.status !== 'cancelled' && m.status !== 'declined')
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

  if (!post) {
  useEffect(() => {
    if (storePost || !id) return
    setIsFetching(true)
    api.get<{ success: boolean; data: Post & { _id?: string } }>(`/posts/${id}`)
      .then(({ data }) => {
        const raw = data.data
        setFetchedPost({ ...raw, id: raw._id ?? raw.id })
      })
      .catch(() => setFetchError(true))
      .finally(() => setIsFetching(false))
  }, [id, storePost])

  const post = storePost ?? fetchedPost

  if (isFetching) {
    return (
      <PageWrapper maxWidth={720}>
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="w-8 h-8 border-4 border-hai-plum/20 border-t-hai-plum rounded-full animate-spin" />
        </div>
      </PageWrapper>
    )
  }

  if (!post || fetchError) {
    return (
      <main className="min-h-screen bg-[#f6f7f9] px-8 py-20 text-[#2d1838]">
        <div className="mx-auto max-w-[760px] rounded-[18px] bg-white p-12 text-center shadow-[0_24px_80px_-68px_rgba(45,24,56,0.75)]">
          <h1 className="text-3xl font-black">Post not found</h1>
          <p className="mt-3 text-[#6f6a76]">This listing may have been removed or the link is broken.</p>
          <button onClick={() => navigate(ROUTES.POSTS)} className="mt-8 rounded-full bg-[#2d1838] px-6 py-3 text-sm font-black text-white">
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
    <main className="bg-[#f6f7f9] text-[#2d1838]">
      <div className="mx-auto w-full max-w-[1120px] px-5 pb-10 pt-[46px] sm:px-8 xl:px-0">
        <div className="mb-[22px] flex items-center justify-between gap-4">
          <button
            onClick={() => navigate(ROUTES.POSTS)}
            className="inline-flex items-center gap-3 text-[14px] font-black text-[#26162f] transition hover:text-[#55bde0]"
          >
            <ArrowLeft size={17} />
            Back to directory
          </button>

          <div className="flex items-center gap-4">
            <button
              onClick={() => navigator.clipboard?.writeText(window.location.href).catch(() => {})}
              className="inline-flex h-[44px] items-center gap-3 rounded-[12px] border border-[#dfe2e8] bg-white px-6 text-[14px] font-black shadow-[0_16px_45px_-40px_rgba(45,24,56,0.7)] transition hover:border-[#8bddea]"
            >
              <LinkIcon size={18} />
              Share
            </button>
            <button
              onClick={() => setSaved(value => !value)}
              className="inline-flex h-[44px] items-center gap-3 rounded-[12px] border border-[#dfe2e8] bg-white px-6 text-[14px] font-black shadow-[0_16px_45px_-40px_rgba(45,24,56,0.7)] transition hover:border-[#8bddea]"
            >
              <Bookmark size={18} fill={saved ? '#2d1838' : 'none'} />
              {saved ? 'Saved' : 'Save'}
            </button>
          </div>
        </div>

        <section className="overflow-hidden rounded-[20px] border border-[#eceef2] bg-white px-[32px] pb-[30px] pt-[30px] shadow-[0_34px_95px_-78px_rgba(45,24,56,0.8)] sm:px-[34px]">
          <div className="grid grid-cols-1 gap-9 lg:grid-cols-[minmax(0,1fr)_154px]">
            <div>
              <div className="flex flex-wrap gap-4">
                <Pill tone="blue">{post.domain}</Pill>
                <Pill tone={active ? 'green' : 'gray'}>{statusLabel(post.status)}</Pill>
              </div>

              <h1 className="mt-[30px] max-w-[760px] break-words font-headline text-[34px] font-black leading-[1.08] text-[#2d1838] sm:text-[38px]">
                {post.title}
              </h1>

              <div className="mt-[28px] flex items-center gap-5">
                <div className="flex h-[58px] w-[58px] shrink-0 items-center justify-center rounded-full bg-[#dceeff] text-[15px] font-black text-[#2d1838]">
                  {initials}
                </div>
                <div>
                  <div className="text-[18px] font-black">{post.authorName}</div>
                  <div className="mt-2 flex items-center gap-2 text-[13px] font-semibold text-[#6f6a76]">
                    {ROLE_LABELS[post.authorRole] ?? post.authorRole}
                    <ShieldCheck size={14} className="text-[#50627a]" />
                  </div>
                </div>
              </div>
            </div>

            <div className="self-start rounded-[9px] border border-[#dfe3ea] bg-white px-6 py-6 text-center">
              <CalendarDays className="mx-auto text-[#2d1838]" size={25} />
              <div className="mt-5 text-[31px] font-black leading-none">{daysLeft}</div>
              <div className="mt-2 text-[11px] font-black uppercase tracking-[0.14em] text-[#6f6a76]">Days left</div>
              <div className="mt-5 h-[6px] overflow-hidden rounded-full bg-[#e8eef4]">
                <div className="h-full rounded-full bg-[#66c8e7]" style={{ width: `${Math.min(100, Math.max(8, 100 - daysLeft / 4))}%` }} />
              </div>
            </div>
          </div>

          <div className="mt-[34px] border-t border-[#e1e4e9] pt-[27px]">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-6 lg:gap-0">
              {meta.map(item => (
                <div key={item.label} className="lg:min-h-[58px] lg:border-r lg:border-[#e1e4e9] lg:px-[22px] lg:first:pl-0 lg:last:border-r-0">
                  <div className="flex items-start gap-4">
                    <span className="mt-1 shrink-0 text-[#2d1838]">{item.icon}</span>
                    <span>
                      <span className="block text-[11px] font-black uppercase tracking-[0.12em] text-[#6f6a76]">{item.label}</span>
                      <span className="mt-2 block break-words text-[13px] font-black leading-5 text-[#2d1838]">{item.value}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {alreadyRequested && !isOwner && (
          <section className="mt-[28px] flex items-center justify-between gap-6 rounded-[16px] border border-[#bfeafa] bg-[#eefaff] px-6 py-6">
            <div className="flex items-center gap-5">
              <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full bg-[#2d1838] text-white">
                <Users size={24} />
              </div>
              <div>
                <div className="text-[16px] font-black">You've already expressed interest</div>
                <div className="mt-2 text-[13px] font-semibold text-[#6f6a76]">We'll notify you about any updates or changes to this opportunity.</div>
              </div>
            </div>
            <button onClick={() => navigate(ROUTES.MEETINGS)} className="h-[46px] rounded-[13px] border border-[#dfe2e8] bg-white px-8 text-[14px] font-black">
              Manage interest
            </button>
          </section>
        )}

        <div className="mt-[28px] grid grid-cols-1 gap-7 lg:grid-cols-[620px_1fr]">
          <div className="space-y-6">
            <InfoCard title="Expertise required" className="min-h-[142px]">
              <div className="flex items-end justify-between gap-6">
                <span className="inline-flex max-w-[340px] break-words rounded-full bg-[#e8f9fc] px-5 py-3 text-[14px] font-black">{post.expertiseRequired}</span>
                <StairIllustration />
              </div>
            </InfoCard>

            <InfoCard title="Project description" className="min-h-[240px]">
              {post.confidentiality === 'public_pitch' ? (
                <p className="whitespace-pre-wrap break-words text-[14px] font-semibold leading-7 text-[#4f4a58]">{post.description}</p>
              ) : (
                <p className="text-[14px] font-semibold leading-7 text-[#4f4a58]">Full details are shared in a meeting under NDA.</p>
              )}
            </InfoCard>

            <InfoCard title="About the author" className="min-h-[198px]">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-5">
                  <div className="flex h-[58px] w-[58px] shrink-0 items-center justify-center rounded-full bg-[#dfefff] text-[15px] font-black">{initials}</div>
                  <div>
                    <div className="text-[17px] font-black">{post.authorName}</div>
                    <div className="mt-2 flex items-center gap-2 text-[13px] font-semibold text-[#6f6a76]">
                      {ROLE_LABELS[post.authorRole] ?? post.authorRole}
                      <ShieldCheck size={14} className="text-[#50627a]" />
                    </div>
                    <div className="mt-2 text-[13px] font-semibold text-[#6f6a76]">
                      Member since {new Date(post.createdAt).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
                    </div>
                  </div>
                </div>
                <button className="h-[48px] rounded-[13px] border border-[#dfe2e8] bg-white px-8 text-[14px] font-black">View profile</button>
              </div>
            </InfoCard>
          </div>

          <aside className="space-y-6">
            <InfoCard title="About this opportunity" className="min-h-[408px]">
              <div className="space-y-[18px]">
                {[
                  ['Domain', post.domain, <Wrench size={18} />],
                  ['Posted', new Date(post.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }), <FileText size={18} />],
                  ['Project Stage', STAGE_LABELS[post.projectStage], <Flag size={18} />],
                  ['Collaboration Type', COLLAB_LABELS[post.collaborationType], <Users size={18} />],
                  ['Confidentiality', CONF_LABELS[post.confidentiality], <Lock size={18} />],
                  ['Listing Expiry', new Date(post.expiryDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }), <CalendarDays size={18} />],
                ].map(([label, value, icon]) => (
                  <div key={String(label)} className="flex gap-4">
                    <span className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full bg-[#f0f4f8] text-[#245b8f]">
                      {icon}
                    </span>
                    <span>
                      <span className="block text-[13px] font-semibold text-[#6f6a76]">{label}</span>
                      <span className="mt-1 block break-words text-[13px] font-black text-[#2d1838]">{value}</span>
                    </span>
                  </div>
                ))}
              </div>
            </InfoCard>

            <InfoCard title="Interested in this opportunity?" className="min-h-[198px]">
              {alreadyRequested ? (
                <>
                  <p className="text-[14px] font-semibold leading-7 text-[#6f6a76]">You've already expressed interest. We'll keep you updated.</p>
                  <button onClick={() => navigate(ROUTES.MEETINGS)} className="mt-6 h-[46px] rounded-[12px] bg-[#2d1838] px-7 text-[14px] font-black text-white">
                    Manage interest
                  </button>
                </>
              ) : canExpressInterest ? (
                <>
                  <p className="text-[14px] font-semibold leading-7 text-[#6f6a76]">Send a short message, accept the NDA, and propose meeting times.</p>
                  <button onClick={() => setShowInterest(true)} className="mt-6 h-[46px] rounded-[12px] bg-[#2d1838] px-7 text-[14px] font-black text-white">
                    Express interest
                  </button>
                </>
              ) : isOwner ? (
                <div className="flex flex-wrap gap-3">
                  {canPublish && <button onClick={() => publish(post.id)} className="h-12 rounded-[14px] bg-[#2d1838] px-6 text-sm font-black text-white">Publish</button>}
                  {canMarkFound && <button onClick={() => markPartnerFound(post.id)} className="h-12 rounded-[14px] bg-[#d8ff8f] px-6 text-sm font-black text-[#2d1838]">Mark partner found</button>}
                  {canEdit && <button onClick={() => navigate(postEdit(post.id))} className="h-12 rounded-[14px] border border-[#dfe2e8] bg-white px-6 text-sm font-black">Edit post</button>}
                </div>
              ) : (
                <p className="text-[15px] font-semibold leading-7 text-[#6f6a76]">This opportunity is not currently accepting interest.</p>
              )}
            </InfoCard>
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
  const cls = tone === 'green' ? 'bg-[#d8f6d8] text-[#228a37]' : tone === 'blue' ? 'bg-[#e8f5ff] text-[#1f5798]' : 'bg-[#f0f1f4] text-[#6f6a76]'
  return <span className={`rounded-full px-5 py-2 text-[12px] font-black uppercase tracking-[0.02em] ${cls}`}>{children}</span>
}

function InfoCard({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-[16px] border border-[#eceef2] bg-white px-7 py-7 shadow-[0_32px_90px_-78px_rgba(45,24,56,0.8)] ${className}`}>
      <h2 className="border-l-[3px] border-[#66c8e7] pl-5 text-[20px] font-black leading-tight text-[#2d1838]">{title}</h2>
      <div className="mt-7">{children}</div>
    </section>
  )
}

function StairIllustration() {
  return (
    <div className="relative hidden h-[78px] w-[150px] shrink-0 sm:block" aria-hidden="true">
      <div className="absolute bottom-[10px] left-[18px] h-[32px] w-[74px] border-b border-l border-[#b8c5d8]" />
      <div className="absolute bottom-[22px] left-[42px] h-[28px] w-[74px] border-b border-l border-[#b8c5d8]" />
      <div className="absolute bottom-[34px] left-[66px] h-[24px] w-[62px] border-b border-l border-[#b8c5d8]" />
      <div className="absolute bottom-[18px] left-[24px] h-5 w-5 rounded-full bg-[#25172f]" />
      <div className="absolute bottom-[30px] left-[67px] h-5 w-5 rounded-full bg-[#4f74b8]" />
      <div className="absolute bottom-[50px] left-[108px] h-5 w-5 rounded-full bg-[#7ba4e0]" />
      <div className="absolute bottom-[14px] left-[28px] h-[26px] w-[2px] rotate-[-24deg] bg-[#25172f]" />
      <div className="absolute bottom-[28px] left-[72px] h-[30px] w-[2px] rotate-[-18deg] bg-[#4f74b8]" />
      <div className="absolute bottom-[48px] left-[112px] h-[31px] w-[2px] rotate-[-16deg] bg-[#7ba4e0]" />
      <div className="absolute right-0 top-3 h-2 w-6 rounded-full bg-[#dfeeff]" />
    </div>
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
